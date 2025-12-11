"""Frith AI Python Client"""
from typing import Any, Dict, Generator, Optional
import httpx
from .exceptions import FrithAPIError, FrithTimeoutError
from .types import Tool, ToolRunResponse, PaginatedResponse

class FrithClient:
    def __init__(self, api_key: str, base_url: str = "https://api.frithai.com/v1", timeout: float = 30.0):
        if not api_key:
            raise ValueError("API key is required")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            timeout=timeout,
        )

    def _request(self, method: str, path: str, json: Optional[Dict] = None) -> Dict:
        try:
            resp = self._client.request(method, path, json=json)
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException as e:
            raise FrithTimeoutError(str(e))
        except httpx.HTTPStatusError as e:
            raise FrithAPIError(e.response.status_code, e.response.text)

    def list_tools(self, page: int = 1, page_size: int = 20) -> PaginatedResponse:
        return self._request("GET", f"/tools?page={page}&pageSize={page_size}")

    def get_tool(self, tool_id: str) -> Tool:
        return self._request("GET", f"/tools/{tool_id}")

    def run_tool(self, tool_id: str, input_data: Dict[str, Any], model: str = "sonnet") -> ToolRunResponse:
        return self._request("POST", "/tools/run", {"toolId": tool_id, "input": input_data, "model": model})

    def run_tool_stream(self, tool_id: str, input_data: Dict[str, Any]) -> Generator[str, None, None]:
        with self._client.stream("POST", "/tools/run", json={"toolId": tool_id, "input": input_data, "stream": True}) as resp:
            for chunk in resp.iter_text():
                yield chunk

    def get_usage(self, period: str = "month") -> Dict:
        return self._request("GET", f"/usage?period={period}")

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
