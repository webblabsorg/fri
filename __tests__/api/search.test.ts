import { NextRequest } from 'next/server'
import { GET } from '@/app/api/search/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
    },
    template: {
      findMany: jest.fn(),
    },
    toolRun: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/tools/tool-configs', () => ({
  getAllTools: jest.fn(() => [
    {
      id: 'legal-email-drafter',
      name: 'Legal Email Drafter',
      description: 'Draft professional legal emails',
      category: 'communication',
    },
    {
      id: 'contract-review',
      name: 'Contract Review',
      description: 'Review and analyze contracts',
      category: 'contract-management',
    },
  ]),
}))

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

describe('Search API', () => {
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

  it('should return 401 if not authenticated', async () => {
    ;(getSessionUser as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/search?q=test', {
      headers: {
        cookie: '',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 if query is too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=a', {
      headers: {
        cookie: 'session=valid-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('at least 2 characters')
  })

  it('should search across all sources successfully', async () => {
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'proj-1',
        name: 'Test Project',
        description: 'A test project',
        updatedAt: new Date(),
      },
    ])
    ;(prisma.template.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'tmpl-1',
        name: 'Test Template',
        description: 'A test template',
        updatedAt: new Date(),
      },
    ])
    ;(prisma.toolRun.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'run-1',
        toolId: 'legal-email-drafter',
        inputText: 'test input',
        outputText: 'test output',
        createdAt: new Date(),
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/search?q=test', {
      headers: {
        cookie: 'session=valid-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('tools')
    expect(data).toHaveProperty('projects')
    expect(data).toHaveProperty('templates')
    expect(data).toHaveProperty('history')
    
    expect(data.tools.length).toBeGreaterThan(0)
    expect(data.projects.length).toBe(1)
    expect(data.templates.length).toBe(1)
    expect(data.history.length).toBe(1)
  })

  it('should filter tools by search query', async () => {
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.template.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.toolRun.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/search?q=email', {
      headers: {
        cookie: 'session=valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()
    
    expect(data.tools.length).toBe(1)
    expect(data.tools[0].name).toBe('Legal Email Drafter')
  })

  it('should limit results to 5 per category', async () => {
    const manyProjects = Array.from({ length: 10 }, (_, i) => ({
      id: `proj-${i}`,
      name: `Test Project ${i}`,
      description: 'test',
      updatedAt: new Date(),
    }))
    
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue(manyProjects)
    ;(prisma.template.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.toolRun.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/search?q=test', {
      headers: {
        cookie: 'session=valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()
    
    expect(data.projects.length).toBe(5)
  })
})
