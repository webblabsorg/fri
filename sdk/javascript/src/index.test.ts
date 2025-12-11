/**
 * Frith AI JavaScript SDK Tests
 */

import { FrithClient, FrithError } from './index'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('FrithClient', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('constructor', () => {
    it('should throw error if no API key provided', () => {
      expect(() => new FrithClient({ apiKey: '' })).toThrow('API key is required')
    })

    it('should create client with default base URL', () => {
      const client = new FrithClient({ apiKey: 'test-key' })
      expect(client).toBeInstanceOf(FrithClient)
    })

    it('should create client with custom base URL', () => {
      const client = new FrithClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      })
      expect(client).toBeInstanceOf(FrithClient)
    })
  })

  describe('listTools', () => {
    it('should fetch tools list', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Tool 1', description: 'Desc 1', category: 'legal-research' },
          { id: '2', name: 'Tool 2', description: 'Desc 2', category: 'contract-review' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        hasMore: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.listTools()

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      )
    })

    it('should pass pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 2, pageSize: 5, hasMore: false }),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      await client.listTools({ page: 2, pageSize: 5, category: 'legal-research' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=5'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=legal-research'),
        expect.any(Object)
      )
    })
  })

  describe('getTool', () => {
    it('should fetch a single tool', async () => {
      const mockTool = {
        id: 'tool-123',
        name: 'Contract Analyzer',
        description: 'Analyze contracts',
        category: 'contract-review',
        inputSchema: { type: 'object' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTool),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.getTool('tool-123')

      expect(result.id).toBe('tool-123')
      expect(result.name).toBe('Contract Analyzer')
    })
  })

  describe('runTool', () => {
    it('should run a tool and return result', async () => {
      const mockResult = {
        id: 'run-123',
        status: 'completed',
        output: 'Analysis complete',
        tokensUsed: 500,
        model: 'sonnet',
        duration: 2500,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.runTool({
        toolId: 'tool-123',
        input: { text: 'Contract text here' },
      })

      expect(result.status).toBe('completed')
      expect(result.output).toBe('Analysis complete')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/run'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('tool-123'),
        })
      )
    })

    it('should handle tool run errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid input', code: 'INVALID_INPUT' }),
      })

      const client = new FrithClient({ apiKey: 'test-key' })

      await expect(
        client.runTool({ toolId: 'tool-123', input: {} })
      ).rejects.toThrow(FrithError)
    })
  })

  describe('getRunHistory', () => {
    it('should fetch run history', async () => {
      const mockHistory = {
        data: [
          { id: 'run-1', status: 'completed', output: 'Result 1' },
          { id: 'run-2', status: 'completed', output: 'Result 2' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        hasMore: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.getRunHistory()

      expect(result.data).toHaveLength(2)
    })
  })

  describe('getRun', () => {
    it('should fetch a single run', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'completed',
        output: 'Analysis result',
        tokensUsed: 300,
        model: 'haiku',
        duration: 1500,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRun),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.getRun('run-123')

      expect(result.id).toBe('run-123')
      expect(result.status).toBe('completed')
    })
  })

  describe('getUsage', () => {
    it('should fetch usage statistics', async () => {
      const mockUsage = {
        tokensUsed: 10000,
        runsCount: 50,
        cost: 5.25,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsage),
      })

      const client = new FrithClient({ apiKey: 'test-key' })
      const result = await client.getUsage('month')

      expect(result.tokensUsed).toBe(10000)
      expect(result.runsCount).toBe(50)
      expect(result.cost).toBe(5.25)
    })
  })

  describe('error handling', () => {
    it('should throw FrithError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized', code: 'UNAUTHORIZED' }),
      })

      const client = new FrithClient({ apiKey: 'invalid-key' })

      try {
        await client.listTools()
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(FrithError)
        expect((error as FrithError).status).toBe(401)
        expect((error as FrithError).code).toBe('UNAUTHORIZED')
      }
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const client = new FrithClient({ apiKey: 'test-key' })

      await expect(client.listTools()).rejects.toThrow('Network error')
    })
  })
})

describe('FrithError', () => {
  it('should create error with message', () => {
    const error = new FrithError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('FrithError')
  })

  it('should create error with status and code', () => {
    const error = new FrithError('Test error', 404, 'NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })
})
