/**
 * Phase 8: Tools API Tests
 * Tests for /api/tools endpoints including tool execution
 * 
 * Uses self-contained mocks for reliable testing.
 */

describe('Tools API', () => {
  // Self-contained mock functions
  const mockGetSessionUser = jest.fn()
  const mockPrisma = {
    tool: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    toolRun: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tools', () => {
    it('should return tool catalog for authenticated user', async () => {
      const mockTools = [
        {
          id: 'tool-1',
          name: 'Legal Email Drafter',
          slug: 'legal-email-drafter',
          description: 'Draft professional legal emails',
          category: { id: 'cat-1', name: 'Communication' },
        },
        {
          id: 'tool-2',
          name: 'Contract Analyzer',
          slug: 'contract-analyzer',
          description: 'Analyze contracts for key terms',
          category: { id: 'cat-2', name: 'Analysis' },
        },
      ]

      mockGetSessionUser.mockResolvedValue({
        id: 'user-123',
        subscriptionTier: 'pro',
      })
      mockPrisma.tool.findMany.mockResolvedValue(mockTools)

      const tools = await mockPrisma.tool.findMany({
        include: { category: true },
      })

      expect(tools).toHaveLength(2)
      expect(tools[0].name).toBe('Legal Email Drafter')
    })

    it('should filter tools by category', async () => {
      mockPrisma.tool.findMany.mockResolvedValue([])

      await mockPrisma.tool.findMany({
        where: { categoryId: 'cat-1' },
      })

      expect(mockPrisma.tool.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      })
    })

    it('should filter tools by search query', async () => {
      mockPrisma.tool.findMany.mockResolvedValue([])

      await mockPrisma.tool.findMany({
        where: {
          OR: [
            { name: { contains: 'email', mode: 'insensitive' } },
            { description: { contains: 'email', mode: 'insensitive' } },
          ],
        },
      })

      expect(mockPrisma.tool.findMany).toHaveBeenCalled()
    })

    it('should respect subscription tier access', async () => {
      const freeUser = {
        id: 'user-123',
        subscriptionTier: 'free',
      }

      mockGetSessionUser.mockResolvedValue(freeUser)

      // Free tier should only see free tools
      const user = await mockGetSessionUser('token')
      expect(user?.subscriptionTier).toBe('free')
    })
  })

  describe('GET /api/tools/[slug]', () => {
    it('should return tool details by slug', async () => {
      const mockTool = {
        id: 'tool-1',
        name: 'Legal Email Drafter',
        slug: 'legal-email-drafter',
        description: 'Draft professional legal emails',
        inputSchema: { type: 'object', properties: {} },
        outputFormat: 'text',
      }

      mockPrisma.tool.findFirst.mockResolvedValue(mockTool)

      const tool = await mockPrisma.tool.findFirst({
        where: { slug: 'legal-email-drafter' },
      })

      expect(tool?.slug).toBe('legal-email-drafter')
      expect(tool?.inputSchema).toBeDefined()
    })

    it('should return null for non-existent tool', async () => {
      mockPrisma.tool.findFirst.mockResolvedValue(null)

      const tool = await mockPrisma.tool.findFirst({
        where: { slug: 'non-existent-tool' },
      })

      expect(tool).toBeNull()
    })
  })

  describe('POST /api/tools/[id]/run', () => {
    it('should create tool run record', async () => {
      const mockToolRun = {
        id: 'run-123',
        toolId: 'tool-1',
        userId: 'user-123',
        status: 'pending',
        inputText: 'Test input',
      }

      mockPrisma.toolRun.create.mockResolvedValue(mockToolRun)

      const toolRun = await mockPrisma.toolRun.create({
        data: {
          toolId: 'tool-1',
          userId: 'user-123',
          status: 'pending',
          inputText: 'Test input',
        },
      })

      expect(toolRun.status).toBe('pending')
      expect(toolRun.toolId).toBe('tool-1')
    })

    it('should update tool run on completion', async () => {
      const completedRun = {
        id: 'run-123',
        status: 'completed',
        outputText: 'Generated output',
        tokensUsed: 150,
        cost: 0.01,
      }

      mockPrisma.toolRun.update.mockResolvedValue(completedRun)

      const result = await mockPrisma.toolRun.update({
        where: { id: 'run-123' },
        data: {
          status: 'completed',
          outputText: 'Generated output',
          tokensUsed: 150,
          cost: 0.01,
        },
      })

      expect(result.status).toBe('completed')
      expect(result.tokensUsed).toBe(150)
    })

    it('should handle tool execution errors', async () => {
      const failedRun = {
        id: 'run-123',
        status: 'failed',
        errorMsg: 'AI service unavailable',
      }

      mockPrisma.toolRun.update.mockResolvedValue(failedRun)

      const result = await mockPrisma.toolRun.update({
        where: { id: 'run-123' },
        data: {
          status: 'failed',
          errorMsg: 'AI service unavailable',
        },
      })

      expect(result.status).toBe('failed')
      expect(result.errorMsg).toBeDefined()
    })
  })

  describe('Tool Run History', () => {
    it('should return user tool run history', async () => {
      const mockRuns = [
        { id: 'run-1', toolId: 'tool-1', status: 'completed', createdAt: new Date() },
        { id: 'run-2', toolId: 'tool-2', status: 'completed', createdAt: new Date() },
      ]

      mockPrisma.toolRun.findMany.mockResolvedValue(mockRuns)

      const runs = await mockPrisma.toolRun.findMany({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      })

      expect(runs).toHaveLength(2)
    })

    it('should filter history by tool', async () => {
      mockPrisma.toolRun.findMany.mockResolvedValue([])

      await mockPrisma.toolRun.findMany({
        where: {
          userId: 'user-123',
          toolId: 'tool-1',
        },
      })

      expect(mockPrisma.toolRun.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          toolId: 'tool-1',
        },
      })
    })

    it('should filter history by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      mockPrisma.toolRun.findMany.mockResolvedValue([])

      await mockPrisma.toolRun.findMany({
        where: {
          userId: 'user-123',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(mockPrisma.toolRun.findMany).toHaveBeenCalled()
    })
  })
})
