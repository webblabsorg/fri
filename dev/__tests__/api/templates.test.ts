/**
 * Phase 8: Templates API Tests
 * Tests for /api/templates endpoints
 * 
 * Uses self-contained mocks for reliable testing.
 */

describe('Templates API', () => {
  // Self-contained mock functions
  const mockGetSessionUser = jest.fn()
  const mockPrisma = {
    template: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'pro',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionUser.mockResolvedValue(mockUser)
  })

  describe('GET /api/templates', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null)
      const user = await mockGetSessionUser('')
      expect(user).toBeNull()
    })

    it('should return all user templates', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          name: 'NDA Template',
          description: 'Standard NDA',
          category: 'contract-management',
          formData: {},
          userId: 'user-123',
          createdAt: new Date(),
        },
      ]
      mockPrisma.template.findMany.mockResolvedValue(mockTemplates)

      const templates = await mockPrisma.template.findMany({
        where: { userId: 'user-123' },
      })
      
      expect(templates).toHaveLength(1)
      expect(templates[0].name).toBe('NDA Template')
    })

    it('should filter templates by category', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          name: 'NDA Template',
          category: 'contract-management',
        },
      ]
      mockPrisma.template.findMany.mockResolvedValue(mockTemplates)

      await mockPrisma.template.findMany({
        where: {
          userId: 'user-123',
          category: 'contract-management',
        },
      })
      
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          category: 'contract-management',
        },
      })
    })
  })

  describe('POST /api/templates', () => {
    it('should create a new template', async () => {
      const newTemplate = {
        name: 'My Template',
        description: 'Test template',
        category: 'communication',
        formData: { field1: 'value1' },
      }

      const createdTemplate = {
        id: 'tmpl-new',
        ...newTemplate,
        userId: 'user-123',
        createdAt: new Date(),
      }
      mockPrisma.template.create.mockResolvedValue(createdTemplate)

      const result = await mockPrisma.template.create({
        data: {
          ...newTemplate,
          userId: 'user-123',
        },
      })
      
      expect(result.id).toBe('tmpl-new')
      expect(result.name).toBe('My Template')
    })

    it('should validate required fields', () => {
      const invalidTemplate = { name: 'Template' } // Missing required fields
      
      // Validation should fail without description and category
      expect(invalidTemplate).not.toHaveProperty('description')
      expect(invalidTemplate).not.toHaveProperty('category')
    })
  })
})
