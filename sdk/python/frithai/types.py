"""Type definitions for Frith AI SDK"""
from typing import Any, Dict, List, TypedDict

class Tool(TypedDict):
    id: str
    name: str
    description: str
    category: str
    inputSchema: Dict[str, Any]

class ToolRunResponse(TypedDict):
    id: str
    status: str
    output: str
    tokensUsed: int
    model: str
    duration: float

class PaginatedResponse(TypedDict):
    data: List[Any]
    total: int
    page: int
    pageSize: int
    hasMore: bool
