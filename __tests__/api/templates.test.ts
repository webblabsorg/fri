import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/templates/route'

jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    template: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

describe('Templates API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'pro',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('GET /api/templates', () => {
    it('should return 401 if not authenticated', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
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
      ;(prisma.template.findMany as jest.Mock).mockResolvedValue(mockTemplates)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockTemplates)
    })

    it('should filter templates by category', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          name: 'NDA Template',
          category: 'contract-management',
        },
      ]
      ;(prisma.template.findMany as jest.Mock).mockResolvedValue(mockTemplates)

      const request = new NextRequest('http://localhost:3000/api/templates?category=contract-management')
      const response = await GET(request)
      
      expect(prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'contract-management',
          }),
        })
      )
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
      ;(prisma.template.create as jest.Mock).mockResolvedValue(createdTemplate)

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(newTemplate),
      })
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.id).toBe('tmpl-new')
      expect(data.name).toBe('My Template')
    })

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'Template' }), // Missing required fields
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })
})
