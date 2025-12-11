"""Tests for Frith AI Python SDK"""

import pytest
import httpx
from unittest.mock import Mock, patch
from frithai import FrithClient, FrithAPIError, FrithTimeoutError


class TestFrithClient:
    def test_init_requires_api_key(self):
        with pytest.raises(ValueError, match="API key is required"):
            FrithClient("")

    def test_init_with_valid_key(self):
        client = FrithClient("test-key")
        assert client.api_key == "test-key"
        assert client.base_url == "https://api.frithai.com/v1"

    def test_init_with_custom_base_url(self):
        client = FrithClient("test-key", base_url="https://custom.api.com/")
        assert client.base_url == "https://custom.api.com"

    @patch('httpx.Client')
    def test_list_tools_success(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {
            "data": [
                {"id": "1", "name": "Tool 1", "description": "Desc 1", "category": "legal-research"},
                {"id": "2", "name": "Tool 2", "description": "Desc 2", "category": "contract-review"}
            ],
            "total": 2,
            "page": 1,
            "pageSize": 20,
            "hasMore": False
        }
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        result = client.list_tools()

        assert len(result["data"]) == 2
        assert result["total"] == 2
        mock_client.request.assert_called_once_with("GET", "/tools?page=1&pageSize=20", json=None)

    @patch('httpx.Client')
    def test_list_tools_with_pagination(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {"data": [], "total": 0, "page": 2, "pageSize": 5, "hasMore": False}
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        client.list_tools(page=2, page_size=5)

        mock_client.request.assert_called_once_with("GET", "/tools?page=2&pageSize=5", json=None)

    @patch('httpx.Client')
    def test_get_tool_success(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "tool-123",
            "name": "Contract Analyzer",
            "description": "Analyze contracts",
            "category": "contract-review",
            "inputSchema": {"type": "object"}
        }
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        result = client.get_tool("tool-123")

        assert result["id"] == "tool-123"
        assert result["name"] == "Contract Analyzer"
        mock_client.request.assert_called_once_with("GET", "/tools/tool-123", json=None)

    @patch('httpx.Client')
    def test_run_tool_success(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {
            "id": "run-123",
            "status": "completed",
            "output": "Analysis complete",
            "tokensUsed": 500,
            "model": "sonnet",
            "duration": 2500
        }
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        result = client.run_tool("tool-123", {"text": "Contract text"})

        assert result["status"] == "completed"
        assert result["output"] == "Analysis complete"
        mock_client.request.assert_called_once_with(
            "POST", 
            "/tools/run", 
            json={"toolId": "tool-123", "input": {"text": "Contract text"}, "model": "sonnet"}
        )

    @patch('httpx.Client')
    def test_run_tool_with_custom_model(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {"id": "run-123", "status": "completed"}
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        client.run_tool("tool-123", {"text": "Test"}, model="haiku")

        mock_client.request.assert_called_once_with(
            "POST",
            "/tools/run",
            json={"toolId": "tool-123", "input": {"text": "Test"}, "model": "haiku"}
        )

    @patch('httpx.Client')
    def test_get_usage_success(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {
            "tokensUsed": 10000,
            "runsCount": 50,
            "cost": 5.25
        }
        mock_client.request.return_value = mock_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        result = client.get_usage("week")

        assert result["tokensUsed"] == 10000
        assert result["runsCount"] == 50
        assert result["cost"] == 5.25
        mock_client.request.assert_called_once_with("GET", "/usage?period=week", json=None)

    @patch('httpx.Client')
    def test_timeout_error(self, mock_client_class):
        mock_client = Mock()
        mock_client.request.side_effect = httpx.TimeoutException("Request timed out")
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        
        with pytest.raises(FrithTimeoutError):
            client.list_tools()

    @patch('httpx.Client')
    def test_api_error(self, mock_client_class):
        mock_client = Mock()
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        error = httpx.HTTPStatusError("401 Unauthorized", request=Mock(), response=mock_response)
        mock_client.request.side_effect = error
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        
        with pytest.raises(FrithAPIError) as exc_info:
            client.list_tools()
        
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in str(exc_info.value)

    @patch('httpx.Client')
    def test_context_manager(self, mock_client_class):
        mock_client = Mock()
        mock_client_class.return_value = mock_client

        with FrithClient("test-key") as client:
            assert isinstance(client, FrithClient)
        
        mock_client.close.assert_called_once()

    @patch('httpx.Client')
    def test_run_tool_stream(self, mock_client_class):
        mock_client = Mock()
        mock_stream_response = Mock()
        mock_stream_response.iter_text.return_value = iter(["chunk1", "chunk2", "chunk3"])
        mock_client.stream.return_value.__enter__.return_value = mock_stream_response
        mock_client_class.return_value = mock_client

        client = FrithClient("test-key")
        chunks = list(client.run_tool_stream("tool-123", {"text": "Test"}))

        assert chunks == ["chunk1", "chunk2", "chunk3"]
        mock_client.stream.assert_called_once_with(
            "POST",
            "/tools/run",
            json={"toolId": "tool-123", "input": {"text": "Test"}, "stream": True}
        )


class TestExceptions:
    def test_frith_api_error(self):
        error = FrithAPIError(404, "Not found")
        assert error.status_code == 404
        assert error.message == "Not found"
        assert str(error) == "API Error 404: Not found"

    def test_frith_timeout_error(self):
        error = FrithTimeoutError("Request timed out")
        assert str(error) == "Request timed out"
