"""
Frith AI Python SDK
Official SDK for integrating with the Frith AI Legal Tools API
"""

from .client import FrithClient
from .exceptions import FrithError, FrithAPIError, FrithTimeoutError
from .types import Tool, ToolRunRequest, ToolRunResponse, PaginatedResponse

__version__ = "1.0.0"
__all__ = [
    "FrithClient",
    "FrithError",
    "FrithAPIError",
    "FrithTimeoutError",
    "Tool",
    "ToolRunRequest",
    "ToolRunResponse",
    "PaginatedResponse",
]
