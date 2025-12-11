/**
 * Frith AI JavaScript SDK
 * Official SDK for integrating with the Frith AI Legal Tools API
 */

export interface FrithConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface ToolRunRequest {
  toolId: string
  input: Record<string, any>
  model?: 'gemini' | 'haiku' | 'sonnet' | 'opus'
  stream?: boolean
}

export interface ToolRunResponse {
  id: string
  status: 'completed' | 'failed' | 'pending'
  output: string
  tokensUsed: number
  model: string
  duration: number
}

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  inputSchema: Record<string, any>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export class FrithClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: FrithConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.frithai.com/v1'
    this.timeout = config.timeout || 30000
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-SDK-Version': '1.0.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new FrithError(
          error.message || `Request failed with status ${response.status}`,
          response.status,
          error.code
        )
      }

      return response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Tools API
  async listTools(options?: { page?: number; pageSize?: number; category?: string }): Promise<PaginatedResponse<Tool>> {
    const params = new URLSearchParams()
    if (options?.page) params.set('page', String(options.page))
    if (options?.pageSize) params.set('pageSize', String(options.pageSize))
    if (options?.category) params.set('category', options.category)
    return this.request('GET', `/tools?${params}`)
  }

  async getTool(toolId: string): Promise<Tool> {
    return this.request('GET', `/tools/${toolId}`)
  }

  async runTool(request: ToolRunRequest): Promise<ToolRunResponse> {
    return this.request('POST', '/tools/run', request)
  }

  async *runToolStream(request: ToolRunRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/tools/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ ...request, stream: true }),
    })

    if (!response.ok) {
      throw new FrithError('Stream request failed', response.status)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new FrithError('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
  }

  // History API
  async getRunHistory(options?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<ToolRunResponse>> {
    const params = new URLSearchParams()
    if (options?.page) params.set('page', String(options.page))
    if (options?.pageSize) params.set('pageSize', String(options.pageSize))
    return this.request('GET', `/runs?${params}`)
  }

  async getRun(runId: string): Promise<ToolRunResponse> {
    return this.request('GET', `/runs/${runId}`)
  }

  // Usage API
  async getUsage(period?: 'day' | 'week' | 'month'): Promise<{ tokensUsed: number; runsCount: number; cost: number }> {
    const params = period ? `?period=${period}` : ''
    return this.request('GET', `/usage${params}`)
  }
}

export class FrithError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'FrithError'
    this.status = status
    this.code = code
  }
}

// Default export
export default FrithClient
