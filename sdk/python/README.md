# Frith AI Python SDK

Official Python SDK for the Frith AI Legal Tools API.

## Installation

```bash
pip install frithai
```

## Quick Start

```python
from frithai import FrithClient

client = FrithClient(api_key="your-api-key")

# List available tools
tools = client.list_tools()
print(tools["data"])

# Run a tool
result = client.run_tool(
    tool_id="contract-analyzer",
    input_data={
        "document": "Your contract text here...",
        "analysisType": "risk-assessment",
    },
)
print(result["output"])
```

## Streaming Responses

```python
for chunk in client.run_tool_stream(
    tool_id="legal-research",
    input_data={"query": "contract breach remedies"},
):
    print(chunk, end="", flush=True)
```

## Context Manager

```python
with FrithClient(api_key="your-api-key") as client:
    result = client.run_tool("summarizer", {"text": "..."})
```

## Error Handling

```python
from frithai import FrithAPIError, FrithTimeoutError

try:
    result = client.run_tool("invalid", {})
except FrithAPIError as e:
    print(f"API Error {e.status_code}: {e.message}")
except FrithTimeoutError:
    print("Request timed out")
```

## License

MIT
