# Frith AI JavaScript SDK

Official JavaScript/TypeScript SDK for the Frith AI Legal Tools API.

## Installation

```bash
npm install @frithai/sdk
# or
yarn add @frithai/sdk
# or
pnpm add @frithai/sdk
```

## Quick Start

```typescript
import FrithClient from '@frithai/sdk'

const client = new FrithClient({
  apiKey: 'your-api-key',
})

// List available tools
const tools = await client.listTools()
console.log(tools.data)

// Run a tool
const result = await client.runTool({
  toolId: 'contract-analyzer',
  input: {
    document: 'Your contract text here...',
    analysisType: 'risk-assessment',
  },
})
console.log(result.output)
```

## Streaming Responses

```typescript
for await (const chunk of client.runToolStream({
  toolId: 'legal-research',
  input: { query: 'contract breach remedies' },
})) {
  process.stdout.write(chunk)
}
```

## API Reference

### `FrithClient`

#### Constructor

```typescript
new FrithClient({
  apiKey: string,      // Required: Your API key
  baseUrl?: string,    // Optional: API base URL (default: https://api.frithai.com/v1)
  timeout?: number,    // Optional: Request timeout in ms (default: 30000)
})
```

#### Methods

| Method | Description |
|--------|-------------|
| `listTools(options?)` | List available tools with pagination |
| `getTool(toolId)` | Get details of a specific tool |
| `runTool(request)` | Run a tool and get the result |
| `runToolStream(request)` | Run a tool with streaming response |
| `getRunHistory(options?)` | Get your tool run history |
| `getRun(runId)` | Get details of a specific run |
| `getUsage(period?)` | Get your API usage statistics |

## Error Handling

```typescript
import { FrithError } from '@frithai/sdk'

try {
  await client.runTool({ toolId: 'invalid', input: {} })
} catch (error) {
  if (error instanceof FrithError) {
    console.error(`Error ${error.status}: ${error.message}`)
    console.error(`Code: ${error.code}`)
  }
}
```

## TypeScript Support

This SDK is written in TypeScript and includes full type definitions.

```typescript
import type { Tool, ToolRunRequest, ToolRunResponse } from '@frithai/sdk'
```

## License

MIT
