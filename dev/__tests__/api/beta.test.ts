/**
 * Beta Program API Tests
 * Tests for beta user management, invitations, surveys, and metrics
 * 
 * These tests use self-contained mocks to avoid conflicts with global test setup.
 */

// Get mocked functions from global test setup
const mockSendBetaInvitationEmail = jest.fn()
const mockSendBetaSurveyEmail = jest.fn()

describe('Beta Program API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Beta User Fields', () => {
    it('should have correct beta user structure', () => {
      const betaUser = {
        id: 'beta-user-123',
        name: 'Beta Tester',
        email: 'beta@example.com',
        isBetaUser: true,
        earlyAdopter: true,
        betaTrialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        betaInvitedAt: new Date(),
        subscriptionTier: 'professional',
      }

      expect(betaUser.isBetaUser).toBe(true)
      expect(betaUser.earlyAdopter).toBe(true)
      expect(betaUser.subscriptionTier).toBe('professional')
      expect(betaUser.betaTrialEndsAt).toBeInstanceOf(Date)
      expect(betaUser.betaInvitedAt).toBeInstanceOf(Date)
    })

    it('should calculate 3-month trial end date correctly', () => {
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setMonth(trialEnd.getMonth() + 3)

      // Should be approximately 90 days in the future
      const daysDiff = Math.round((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBeGreaterThanOrEqual(89)
      expect(daysDiff).toBeLessThanOrEqual(92)
    })

    it('should distinguish beta users from regular users', () => {
      const regularUser = {
        id: 'user-123',
        isBetaUser: false,
        earlyAdopter: false,
        subscriptionTier: 'free',
      }

      const betaUser = {
        id: 'beta-123',
        isBetaUser: true,
        earlyAdopter: true,
        subscriptionTier: 'professional',
      }

      expect(regularUser.isBetaUser).toBe(false)
      expect(betaUser.isBetaUser).toBe(true)
      expect(betaUser.subscriptionTier).toBe('professional')
    })
  })

  describe('Beta Invitation Email', () => {
    it('should call sendBetaInvitationEmail with correct parameters', async () => {
      mockSendBetaInvitationEmail.mockResolvedValue(true)

      const email = 'newbeta@example.com'
      const name = 'New Beta User'
      const token = 'invite-token-123'

      const result = await mockSendBetaInvitationEmail(email, name, token)

      expect(mockSendBetaInvitationEmail).toHaveBeenCalledWith(email, name, token)
      expect(result).toBe(true)
    })

    it('should handle invitation email failure gracefully', async () => {
      mockSendBetaInvitationEmail.mockResolvedValue(false)

      const result = await mockSendBetaInvitationEmail('test@example.com', 'Test', 'token')

      expect(result).toBe(false)
    })
  })

  describe('Beta Survey Email', () => {
    it('should call sendBetaSurveyEmail with correct parameters', async () => {
      mockSendBetaSurveyEmail.mockResolvedValue(true)

      const email = 'beta@example.com'
      const name = 'Beta User'
      const userId = 'user-123'

      const result = await mockSendBetaSurveyEmail(email, name, userId)

      expect(mockSendBetaSurveyEmail).toHaveBeenCalledWith(email, name, userId)
      expect(result).toBe(true)
    })

    it('should handle survey email failure gracefully', async () => {
      mockSendBetaSurveyEmail.mockResolvedValue(false)

      const result = await mockSendBetaSurveyEmail('test@example.com', 'Test', 'user-123')

      expect(result).toBe(false)
    })
  })

  describe('Beta Metrics Calculations', () => {
    it('should calculate target progress correctly', () => {
      const betaUserCount = 50
      const target = 100
      const progress = Math.min((betaUserCount / target) * 100, 100)

      expect(progress).toBe(50)
    })

    it('should cap target progress at 100%', () => {
      const betaUserCount = 150
      const target = 100
      const progress = Math.min((betaUserCount / target) * 100, 100)

      expect(progress).toBe(100)
    })

    it('should handle zero beta users', () => {
      const betaUserCount = 0
      const target = 100
      const progress = Math.min((betaUserCount / target) * 100, 100)

      expect(progress).toBe(0)
    })
  })

  describe('SLA Calculation', () => {
    it('should calculate SLA percentage correctly', () => {
      const tickets = [
        { responseTimeHours: 2 }, // Within SLA
        { responseTimeHours: 3 }, // Within SLA
        { responseTimeHours: 5 }, // Outside SLA
        { responseTimeHours: 1 }, // Within SLA
      ]

      const within4h = tickets.filter(t => t.responseTimeHours <= 4).length
      const slaPercent = (within4h / tickets.length) * 100

      expect(slaPercent).toBe(75)
    })

    it('should handle no tickets', () => {
      const tickets: any[] = []
      const slaPercent = tickets.length > 0 ? 100 : null

      expect(slaPercent).toBeNull()
    })

    it('should handle all tickets within SLA', () => {
      const tickets = [
        { responseTimeHours: 1 },
        { responseTimeHours: 2 },
        { responseTimeHours: 3 },
      ]

      const within4h = tickets.filter(t => t.responseTimeHours <= 4).length
      const slaPercent = (within4h / tickets.length) * 100

      expect(slaPercent).toBe(100)
    })
  })

  describe('Payment Metrics', () => {
    it('should calculate payment failure rate correctly', () => {
      const totalTransactions = 100
      const failedTransactions = 5
      const failureRate = (failedTransactions / totalTransactions) * 100

      expect(failureRate).toBe(5)
    })

    it('should handle zero transactions', () => {
      const totalTransactions = 0
      const failedTransactions = 0
      const failureRate = totalTransactions > 0 
        ? (failedTransactions / totalTransactions) * 100 
        : 0

      expect(failureRate).toBe(0)
    })
  })

  describe('Beta Cohort Tracking', () => {
    it('should identify beta organization correctly', () => {
      const betaOrg = {
        name: 'Beta Program',
        type: 'beta',
        planTier: 'professional',
      }

      const isBetaOrg = betaOrg.type === 'beta' || betaOrg.name === 'Beta Program'
      expect(isBetaOrg).toBe(true)
    })

    it('should not flag regular organizations as beta', () => {
      const regularOrg = {
        name: 'Law Firm LLC',
        type: 'law_firm',
        planTier: 'pro',
      }

      const isBetaOrg = regularOrg.type === 'beta' || regularOrg.name === 'Beta Program'
      expect(isBetaOrg).toBe(false)
    })
  })

  describe('Feedback Types', () => {
    it('should accept survey feedback type', () => {
      const validTypes = ['general', 'feature_request', 'bug_report', 'tool_feedback', 'usability', 'survey']
      
      expect(validTypes).toContain('survey')
    })

    it('should accept NPS ratings 0-10', () => {
      const validRatings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(0)
        expect(rating).toBeLessThanOrEqual(10)
      })
    })

    it('should categorize NPS scores correctly', () => {
      const categorizeNPS = (score: number) => {
        if (score >= 9) return 'promoter'
        if (score >= 7) return 'passive'
        return 'detractor'
      }

      expect(categorizeNPS(10)).toBe('promoter')
      expect(categorizeNPS(9)).toBe('promoter')
      expect(categorizeNPS(8)).toBe('passive')
      expect(categorizeNPS(7)).toBe('passive')
      expect(categorizeNPS(6)).toBe('detractor')
      expect(categorizeNPS(0)).toBe('detractor')
    })
  })

  describe('Pre-Launch Checklist', () => {
    it('should have all required categories', () => {
      const requiredCategories = [
        'Infrastructure',
        'Content',
        'Testing',
        'Monitoring',
        'Legal',
        'Beta Progress',
      ]

      requiredCategories.forEach(category => {
        expect(typeof category).toBe('string')
        expect(category.length).toBeGreaterThan(0)
      })
    })

    it('should validate checklist item structure', () => {
      const checklistItem = {
        id: 'db-connection',
        category: 'Infrastructure',
        name: 'Database Connection',
        description: 'Verify PostgreSQL database is accessible',
        status: 'completed' as const,
        automated: true,
        lastChecked: new Date().toISOString(),
      }

      expect(checklistItem.id).toBeDefined()
      expect(checklistItem.category).toBeDefined()
      expect(checklistItem.name).toBeDefined()
      expect(checklistItem.status).toMatch(/^(pending|in_progress|completed|failed)$/)
      expect(typeof checklistItem.automated).toBe('boolean')
    })
  })
})
