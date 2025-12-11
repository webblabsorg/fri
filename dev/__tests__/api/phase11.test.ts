/**
 * Phase 11: Scale & Enhance - API Tests
 */

import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    sSOConfig: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    iPWhitelist: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    dataRetentionPolicy: { findUnique: jest.fn(), upsert: jest.fn() },
    enhancedAuditLog: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    organizationBranding: { findUnique: jest.fn(), upsert: jest.fn() },
    customReport: { findMany: jest.fn(), create: jest.fn() },
    usageAnalytics: { findMany: jest.fn() },
    integration: { findMany: jest.fn(), create: jest.fn() },
    marketplaceTool: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    marketplaceInstall: { findMany: jest.fn(), create: jest.fn() },
    aPIKey: { findMany: jest.fn(), create: jest.fn() },
    forumCategory: { findMany: jest.fn() },
    forumTopic: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    liveChatSession: { create: jest.fn() },
    liveChatMessage: { create: jest.fn() },
    toolWave: { findMany: jest.fn(), create: jest.fn() },
    toolExpansion: { count: jest.fn() },
    tool: { count: jest.fn() },
    mobileDevice: { upsert: jest.fn() },
    pushNotification: { create: jest.fn(), update: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    organization: { findUnique: jest.fn() },
  },
}))

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

function createMockRequest(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    ...(body && { body: JSON.stringify(body) }),
  })
}

describe('Phase 11: Enterprise SSO', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const { GET } = await import('@/app/api/enterprise/sso/route')
    const response = await GET(createMockRequest('GET', '/api/enterprise/sso?organizationId=org-1'))
    expect(response.status).toBe(401)
  })

  it('should return SSO config', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'admin' } } as never)
    ;(prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue({ role: 'admin' })
    ;(prisma.sSOConfig.findUnique as jest.Mock).mockResolvedValue({ provider: 'saml', enabled: true })

    const { GET } = await import('@/app/api/enterprise/sso/route')
    const response = await GET(createMockRequest('GET', '/api/enterprise/sso?organizationId=org-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ssoConfig.provider).toBe('saml')
  })
})

describe('Phase 11: Marketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should browse marketplace tools', async () => {
    ;(prisma.marketplaceTool.findMany as jest.Mock).mockResolvedValue([{ slug: 'tool-1', name: 'Tool' }])
    ;(prisma.marketplaceTool.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.marketplaceTool.groupBy as jest.Mock).mockResolvedValue([{ category: 'legal', _count: { id: 1 } }])

    const { GET } = await import('@/app/api/marketplace/route')
    const response = await GET(createMockRequest('GET', '/api/marketplace'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tools).toHaveLength(1)
  })
})

describe('Phase 11: Forum', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list categories', async () => {
    ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([{ name: 'General', slug: 'general' }])

    const { GET } = await import('@/app/api/community/forum/route')
    const response = await GET(createMockRequest('GET', '/api/community/forum?type=categories'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.categories).toBeDefined()
  })
})

describe('Phase 11: Tool Expansion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list waves', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'admin' } } as never)
    ;(prisma.toolWave.findMany as jest.Mock).mockResolvedValue([{ waveNumber: 1, name: 'Wave 1', tools: [], _count: { tools: 0 } }])
    ;(prisma.tool.count as jest.Mock).mockResolvedValue(20)
    ;(prisma.toolExpansion.count as jest.Mock).mockResolvedValue(50)

    const { GET } = await import('@/app/api/admin/tools/expansion/route')
    const response = await GET(createMockRequest('GET', '/api/admin/tools/expansion'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.overall.totalTarget).toBe(240)
  })
})

describe('Phase 11: Mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register device', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    ;(prisma.mobileDevice.upsert as jest.Mock).mockResolvedValue({ deviceId: 'ios-123', platform: 'ios' })

    const { POST } = await import('@/app/api/mobile/devices/route')
    const response = await POST(createMockRequest('POST', '/api/mobile/devices', {
      deviceId: 'ios-123',
      platform: 'ios'
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.platform).toBe('ios')
  })
})
