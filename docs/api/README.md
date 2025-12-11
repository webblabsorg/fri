# Frith AI API Documentation

Welcome to the Frith AI API. This API allows you to integrate AI-powered legal tools into your applications.

## Base URL

```
https://api.frithai.com/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

Get your API key from the [Developer Portal](https://app.frithai.com/dashboard/developer).

## Rate Limits

| Plan | Requests/min | Requests/day |
|------|-------------|--------------|
| Free | 10 | 100 |
| Pro | 60 | 5,000 |
| Team | 120 | 20,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Your rate limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Endpoints

### Tools

#### List Tools
```
GET /tools
```

Query parameters:
- `page` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 20, max: 100)
- `category` (string): Filter by category

Response:
```json
{
  "data": [
    {
      "id": "contract-analyzer",
      "name": "Contract Analyzer",
      "description": "Analyze contracts for risks and key terms",
      "category": "Contracts",
      "inputSchema": {...}
    }
  ],
  "total": 240,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

#### Get Tool
```
GET /tools/{toolId}
```

#### Run Tool
```
POST /tools/run
```

Request body:
```json
{
  "toolId": "contract-analyzer",
  "input": {
    "document": "Contract text...",
    "analysisType": "risk-assessment"
  },
  "model": "sonnet",
  "stream": false
}
```

Models available:
- `gemini` - Fast, cost-effective
- `haiku` - Balanced speed/quality
- `sonnet` - High quality (default)
- `opus` - Highest quality

Response:
```json
{
  "id": "run_abc123",
  "status": "completed",
  "output": "Analysis results...",
  "tokensUsed": 1500,
  "model": "sonnet",
  "duration": 2.5
}
```

### Streaming

For streaming responses, set `stream: true` and use Server-Sent Events:

```
POST /tools/run
Accept: text/event-stream
```

### History

#### List Runs
```
GET /runs
```

#### Get Run
```
GET /runs/{runId}
```

### Usage

#### Get Usage Statistics
```
GET /usage?period=month
```

Response:
```json
{
  "tokensUsed": 150000,
  "runsCount": 500,
  "cost": 15.00
}
```

## Error Responses

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Missing required field: document"
  }
}
```

Error codes:
- `UNAUTHORIZED` - Invalid or missing API key
- `RATE_LIMITED` - Rate limit exceeded
- `INVALID_INPUT` - Invalid request body
- `TOOL_NOT_FOUND` - Tool does not exist
- `INTERNAL_ERROR` - Server error

## SDKs

- [JavaScript/TypeScript SDK](../sdk/javascript)
- [Python SDK](../sdk/python)

## Support

- Email: api-support@frithai.com
- Documentation: https://docs.frithai.com
