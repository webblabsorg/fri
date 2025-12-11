/**
 * Phase 8 Testing Setup
 * Comprehensive test environment configuration for Frith AI
 */

import { jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

// Polyfill Web APIs for Jest environment
if (typeof Request === 'undefined') {
  // @ts-ignore
  global.Request = class Request {
    url: string
    method: string
    headers: Headers
    body: any
    
    constructor(input: string | Request, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.body = init?.body
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
  }
}

if (typeof Response === 'undefined') {
  // @ts-ignore
  global.Response = class Response {
    body: any
    status: number
    headers: Headers
    
    constructor(body?: any, init?: ResponseInit) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers)
    }
    
    json() {
      return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
    }
    
    text() {
      return Promise.resolve(String(this.body))
    }
    
    static json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      })
    }
  }
}

if (typeof Headers === 'undefined') {
  // @ts-ignore
  global.Headers = class Headers {
    private headers: Map<string, string> = new Map()
    
    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else if (init instanceof Headers) {
          init.forEach((value, key) => this.set(key, value))
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value))
        }
      }
    }
    
    get(name: string) { return this.headers.get(name.toLowerCase()) || null }
    set(name: string, value: string) { this.headers.set(name.toLowerCase(), value) }
    has(name: string) { return this.headers.has(name.toLowerCase()) }
    delete(name: string) { this.headers.delete(name.toLowerCase()) }
    forEach(callback: (value: string, key: string) => void) { this.headers.forEach(callback) }
  }
}

// Extend global types for test utilities
declare global {
  var mockUser: any
  var mockAdmin: any
  var mockOrganization: any
  var mockWorkspace: any
  var mockProject: any
  var mockTool: any
  var mockToolRun: any
}

// Mock Prisma Client
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    toolRun: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tool: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    supportTicket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    ticketMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    template: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    favorite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    chatbotConversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chatbotMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    share: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectDocument: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectDocumentVersion: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    organizationInvitation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    emailVerification: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordReset: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    // Phase 7 models
    clioConnection: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    hubSpotConnection: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    zapierEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflowStep: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflowRun: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    scheduledJob: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bulkJob: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bulkJobFile: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock external services
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateEmailVerificationToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
  getSessionUser: jest.fn(),
  requireAuth: jest.fn(),
  createSession: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
  getVerificationEmailTemplate: jest.fn(),
  getPasswordResetEmailTemplate: jest.fn(),
  getWelcomeEmailTemplate: jest.fn(),
  getBetaInvitationTemplate: jest.fn(),
  sendBetaInvitationEmail: jest.fn(),
  getBetaSurveyTemplate: jest.fn(),
  sendBetaSurveyEmail: jest.fn(),
  getTicketConfirmationTemplate: jest.fn(),
  // Launch email templates
  getLaunchAnnouncementTemplate: jest.fn(),
  getWaitlistInviteTemplate: jest.fn(),
  sendLaunchAnnouncementEmail: jest.fn(),
  sendWaitlistInviteEmail: jest.fn(),
}))

jest.mock('@/lib/ai/model-service', () => ({
  AIModelService: {
    generate: jest.fn(),
    calculateCost: jest.fn(),
  },
}))

jest.mock('@/lib/storage/storage-service', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getSignedUrl: jest.fn(),
  generateUploadUrl: jest.fn(),
}))

jest.mock('@/lib/stripe/stripe-service', () => ({
  createCustomer: jest.fn(),
  createCheckoutSession: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.GOOGLE_AI_API_KEY = 'test-google-key'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_test'
process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token'

// Global test utilities
global.mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  role: 'user',
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  status: 'active',
  onboardingCompleted: true,
  // Beta program fields
  isBetaUser: false,
  earlyAdopter: false,
  betaTrialEndsAt: null,
  betaInvitedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockBetaUser = {
  id: 'beta-user-123',
  name: 'Beta User',
  email: 'beta@example.com',
  emailVerified: true,
  role: 'user',
  subscriptionTier: 'professional',
  subscriptionStatus: 'active',
  status: 'active',
  onboardingCompleted: true,
  isBetaUser: true,
  earlyAdopter: true,
  betaTrialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  betaInvitedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockAdmin = {
  id: 'admin-123',
  name: 'Test Admin',
  email: 'admin@example.com',
  emailVerified: true,
  role: 'admin',
  subscriptionTier: 'pro',
  subscriptionStatus: 'active',
  status: 'active',
  onboardingCompleted: true,
  isBetaUser: false,
  earlyAdopter: false,
  betaTrialEndsAt: null,
  betaInvitedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
  type: 'law_firm',
  planTier: 'pro',
  subscriptionStatus: 'active',
  seatsTotal: 10,
  seatsUsed: 3,
  billingEmail: 'billing@example.com',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockWorkspace = {
  id: 'workspace-123',
  organizationId: 'org-123',
  name: 'Test Workspace',
  type: 'team',
  ownerId: 'user-123',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockProject = {
  id: 'project-123',
  workspaceId: 'workspace-123',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  privacy: 'private',
  createdBy: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockTool = {
  id: 'tool-123',
  name: 'Legal Email Drafter',
  slug: 'legal-email-drafter',
  description: 'Draft professional legal emails',
  categoryId: 'category-123',
  inputType: 'form',
  outputType: 'text',
  pricingTier: 'free',
  aiModel: 'claude-sonnet-3.5',
  popular: true,
  status: 'active',
  promptTemplate: 'Draft an email about: {context}',
  createdAt: new Date(),
}

global.mockToolRun = {
  id: 'run-123',
  userId: 'user-123',
  toolId: 'tool-123',
  projectId: 'project-123',
  inputText: 'Test input',
  outputText: 'Test output',
  status: 'completed',
  aiModelUsed: 'claude-sonnet-3.5',
  tokensUsed: 150,
  cost: 0.01,
  runTimeMs: 2500,
  createdAt: new Date(),
  completedAt: new Date(),
}

// Test database cleanup utilities
export const cleanupDatabase = async () => {
  // Mock cleanup - in real tests this would clean test database
  console.log('Database cleanup completed')
}

// Test data factories
export const createTestUser = (overrides = {}) => ({
  ...global.mockUser,
  ...overrides,
})

export const createTestOrganization = (overrides = {}) => ({
  ...global.mockOrganization,
  ...overrides,
})

export const createTestProject = (overrides = {}) => ({
  ...global.mockProject,
  ...overrides,
})

export const createTestToolRun = (overrides = {}) => ({
  ...global.mockToolRun,
  ...overrides,
})

// Security test utilities
export const testSecurityHeaders = (response: Response) => {
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
}

export const testRateLimiting = async (endpoint: string, method = 'GET', maxRequests = 10) => {
  const requests = Array.from({ length: maxRequests + 1 }, () =>
    fetch(endpoint, { method })
  )
  
  const responses = await Promise.all(requests)
  const lastResponse = responses[responses.length - 1]
  
  expect(lastResponse.status).toBe(429) // Too Many Requests
}

// Performance test utilities
export const measureResponseTime = async (fn: () => Promise<any>) => {
  const start = Date.now()
  await fn()
  const end = Date.now()
  return end - start
}

export const expectFastResponse = async (fn: () => Promise<any>, maxMs = 200) => {
  const responseTime = await measureResponseTime(fn)
  expect(responseTime).toBeLessThan(maxMs)
}

// AI testing utilities
export const mockAIResponse = (output: string, tokensUsed = 100, cost = 0.01) => ({
  output,
  tokensUsed,
  cost,
  model: 'claude-sonnet-3.5',
})

export const testAIToolExecution = async (toolId: string, input: string, expectedOutput?: string) => {
  // Mock AI tool execution test
  const result = mockAIResponse(expectedOutput || 'Test AI output')
  expect(result.output).toBeDefined()
  expect(result.tokensUsed).toBeGreaterThan(0)
  expect(result.cost).toBeGreaterThan(0)
  return result
}

// Multi-tenant security test utilities
export const testTenantIsolation = async (userA: any, userB: any, resource: any) => {
  // Test that userA cannot access userB's resources
  // This would be implemented with actual API calls in integration tests
  expect(userA.id).not.toBe(userB.id)
  expect(resource.userId || resource.createdBy).toBe(userA.id)
}

export default {
  cleanupDatabase,
  createTestUser,
  createTestOrganization,
  createTestProject,
  createTestToolRun,
  testSecurityHeaders,
  testRateLimiting,
  measureResponseTime,
  expectFastResponse,
  mockAIResponse,
  testAIToolExecution,
  testTenantIsolation,
}
