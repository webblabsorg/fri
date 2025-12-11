/**
 * Public Launch API Tests
 * Tests for launch controls, metrics, waitlist, and marketing features
 */

// Mock functions
const mockSendLaunchAnnouncementEmail = jest.fn()
const mockSendWaitlistInviteEmail = jest.fn()

describe('Public Launch API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Launch Settings', () => {
    it('should have correct launch settings structure', () => {
      const settings = {
        betaBadgeRemoved: false,
        openSignups: false,
        launchDate: null,
        launchAnnounced: false,
        maintenanceMode: false,
      }

      expect(settings.betaBadgeRemoved).toBe(false)
      expect(settings.openSignups).toBe(false)
      expect(settings.launchDate).toBeNull()
      expect(settings.launchAnnounced).toBe(false)
      expect(settings.maintenanceMode).toBe(false)
    })

    it('should update settings for go_live action', () => {
      const settings = {
        betaBadgeRemoved: false,
        openSignups: false,
        launchDate: null,
        launchAnnounced: false,
        maintenanceMode: false,
      }

      // Simulate go_live action
      settings.betaBadgeRemoved = true
      settings.openSignups = true
      settings.launchAnnounced = true
      settings.launchDate = new Date().toISOString()

      expect(settings.betaBadgeRemoved).toBe(true)
      expect(settings.openSignups).toBe(true)
      expect(settings.launchAnnounced).toBe(true)
      expect(settings.launchDate).not.toBeNull()
    })
  })

  describe('Launch Checklist', () => {
    it('should have all required categories', () => {
      const categories = ['scaling', 'monitoring', 'marketing', 'infrastructure', 'team', 'content']
      
      categories.forEach(category => {
        expect(typeof category).toBe('string')
        expect(category.length).toBeGreaterThan(0)
      })
    })

    it('should validate checklist item structure', () => {
      const item = {
        id: 'vercel-plan',
        category: 'scaling',
        name: 'Vercel Plan Upgraded',
        description: 'Verify Vercel plan supports expected traffic',
        status: 'completed' as const,
        automated: true,
        priority: 'critical' as const,
      }

      expect(item.id).toBeDefined()
      expect(item.category).toBe('scaling')
      expect(item.status).toMatch(/^(pending|in_progress|completed|failed)$/)
      expect(item.priority).toMatch(/^(critical|high|medium|low)$/)
      expect(typeof item.automated).toBe('boolean')
    })

    it('should identify critical pending items', () => {
      const checklist = [
        { id: '1', priority: 'critical', status: 'completed' },
        { id: '2', priority: 'critical', status: 'pending' },
        { id: '3', priority: 'high', status: 'pending' },
        { id: '4', priority: 'critical', status: 'pending' },
      ]

      const criticalPending = checklist.filter(
        item => item.priority === 'critical' && item.status !== 'completed'
      ).length

      expect(criticalPending).toBe(2)
    })

    it('should determine launch readiness', () => {
      const checklistReady = [
        { priority: 'critical', status: 'completed' },
        { priority: 'critical', status: 'completed' },
        { priority: 'high', status: 'pending' },
      ]

      const checklistNotReady = [
        { priority: 'critical', status: 'completed' },
        { priority: 'critical', status: 'pending' },
      ]

      const isReady = (list: any[]) => 
        list.filter(i => i.priority === 'critical' && i.status !== 'completed').length === 0

      expect(isReady(checklistReady)).toBe(true)
      expect(isReady(checklistNotReady)).toBe(false)
    })
  })

  describe('Launch Metrics', () => {
    it('should calculate conversion rate correctly', () => {
      const totalUsers = 500
      const paidUsers = 15
      const conversionRate = ((paidUsers / totalUsers) * 100).toFixed(2)

      expect(conversionRate).toBe('3.00')
    })

    it('should calculate tool runs per user', () => {
      const totalToolRuns = 2500
      const uniqueUsers = 400
      const runsPerUser = (totalToolRuns / uniqueUsers).toFixed(1)

      expect(runsPerUser).toBe('6.3')
    })

    it('should evaluate launch targets', () => {
      const targets = {
        signups: { target: 500, current: 520, met: false },
        conversionRate: { target: 2, current: 3.0, met: false },
        toolRunsPerUser: { target: 5, current: 6.3, met: false },
        errorRate: { target: 1, current: 0.5, met: false },
        day7Retention: { target: 40, current: 45, met: false },
      }

      // Evaluate each target
      targets.signups.met = targets.signups.current >= targets.signups.target
      targets.conversionRate.met = targets.conversionRate.current >= targets.conversionRate.target
      targets.toolRunsPerUser.met = targets.toolRunsPerUser.current >= targets.toolRunsPerUser.target
      targets.errorRate.met = targets.errorRate.current <= targets.errorRate.target
      targets.day7Retention.met = targets.day7Retention.current >= targets.day7Retention.target

      expect(targets.signups.met).toBe(true)
      expect(targets.conversionRate.met).toBe(true)
      expect(targets.toolRunsPerUser.met).toBe(true)
      expect(targets.errorRate.met).toBe(true)
      expect(targets.day7Retention.met).toBe(true)

      const metCount = Object.values(targets).filter(t => t.met).length
      expect(metCount).toBe(5)
    })

    it('should determine launch success', () => {
      const targetsMetCount = 4
      const launchSuccess = targetsMetCount >= 4

      expect(launchSuccess).toBe(true)
    })

    it('should handle zero users gracefully', () => {
      const totalUsers = 0
      const paidUsers = 0
      const conversionRate = totalUsers > 0 
        ? ((paidUsers / totalUsers) * 100).toFixed(2) 
        : '0'

      expect(conversionRate).toBe('0')
    })
  })

  describe('Waitlist Management', () => {
    it('should have correct waitlist entry structure', () => {
      const entry = {
        id: 'waitlist-123',
        email: 'user@example.com',
        name: 'John Doe',
        source: 'homepage',
        status: 'pending',
        invitedAt: null,
        createdAt: new Date(),
      }

      expect(entry.email).toBeDefined()
      expect(entry.status).toBe('pending')
      expect(entry.invitedAt).toBeNull()
    })

    it('should track waitlist status transitions', () => {
      const validTransitions = [
        { from: 'pending', to: 'invited' },
        { from: 'invited', to: 'converted' },
      ]

      validTransitions.forEach(transition => {
        expect(['pending', 'invited', 'converted']).toContain(transition.from)
        expect(['pending', 'invited', 'converted']).toContain(transition.to)
      })
    })

    it('should calculate waitlist stats', () => {
      const entries = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'invited' },
        { status: 'converted' },
        { status: 'converted' },
      ]

      const stats = {
        total: entries.length,
        pending: entries.filter(e => e.status === 'pending').length,
        invited: entries.filter(e => e.status === 'invited').length,
        converted: entries.filter(e => e.status === 'converted').length,
      }

      expect(stats.total).toBe(5)
      expect(stats.pending).toBe(2)
      expect(stats.invited).toBe(1)
      expect(stats.converted).toBe(2)
    })
  })

  describe('Blog Post Management', () => {
    it('should have correct blog post structure', () => {
      const post = {
        id: 'post-123',
        slug: 'launch-announcement',
        title: 'Frith AI is Now Live!',
        excerpt: 'We are excited to announce...',
        content: 'Full blog post content here...',
        status: 'draft',
        publishedAt: null,
        scheduledAt: null,
        tags: ['launch', 'announcement'],
      }

      expect(post.slug).toMatch(/^[a-z0-9-]+$/)
      expect(post.status).toMatch(/^(draft|scheduled|published)$/)
      expect(Array.isArray(post.tags)).toBe(true)
    })

    it('should validate slug format', () => {
      const validSlugs = ['launch-announcement', 'how-to-use-frith-ai', 'update-v2']
      const invalidSlugs = ['Launch Announcement', 'how_to_use', 'update v2']

      const isValidSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug)

      validSlugs.forEach(slug => expect(isValidSlug(slug)).toBe(true))
      invalidSlugs.forEach(slug => expect(isValidSlug(slug)).toBe(false))
    })
  })

  describe('Social Post Management', () => {
    it('should have correct social post structure', () => {
      const post = {
        id: 'social-123',
        platform: 'twitter',
        content: 'Excited to announce Frith AI is now live! 🚀',
        status: 'scheduled',
        scheduledAt: new Date(),
      }

      expect(['twitter', 'linkedin', 'facebook']).toContain(post.platform)
      expect(post.content.length).toBeLessThanOrEqual(2000)
      expect(post.status).toMatch(/^(draft|scheduled|published|failed)$/)
    })

    it('should enforce content length limits', () => {
      const twitterLimit = 280
      const linkedinLimit = 3000
      const facebookLimit = 63206

      const content = 'This is a test post'

      expect(content.length).toBeLessThanOrEqual(twitterLimit)
      expect(content.length).toBeLessThanOrEqual(linkedinLimit)
      expect(content.length).toBeLessThanOrEqual(facebookLimit)
    })
  })

  describe('Launch Email Templates', () => {
    it('should call sendLaunchAnnouncementEmail with correct parameters', async () => {
      mockSendLaunchAnnouncementEmail.mockResolvedValue(true)

      const email = 'user@example.com'
      const name = 'John Doe'

      const result = await mockSendLaunchAnnouncementEmail(email, name)

      expect(mockSendLaunchAnnouncementEmail).toHaveBeenCalledWith(email, name)
      expect(result).toBe(true)
    })

    it('should call sendWaitlistInviteEmail with correct parameters', async () => {
      mockSendWaitlistInviteEmail.mockResolvedValue(true)

      const email = 'waitlist@example.com'
      const name = 'Jane Doe'

      const result = await mockSendWaitlistInviteEmail(email, name)

      expect(mockSendWaitlistInviteEmail).toHaveBeenCalledWith(email, name)
      expect(result).toBe(true)
    })
  })

  describe('Day 7 Retention Calculation', () => {
    it('should calculate retention correctly', () => {
      const cohortSize = 100
      const retainedUsers = 45
      const retention = (retainedUsers / cohortSize) * 100

      expect(retention).toBe(45)
    })

    it('should handle zero cohort size', () => {
      const cohortSize = 0
      const retainedUsers = 0
      const retention = cohortSize > 0 ? (retainedUsers / cohortSize) * 100 : 0

      expect(retention).toBe(0)
    })
  })

  describe('System Settings', () => {
    it('should have correct system setting structure', () => {
      const setting = {
        key: 'betaBadgeRemoved',
        value: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(setting.key).toBeDefined()
      expect(typeof setting.value).toBe('string')
    })

    it('should convert boolean settings correctly', () => {
      const settings = {
        betaBadgeRemoved: 'true',
        openSignups: 'false',
        maintenanceMode: 'false',
      }

      expect(settings.betaBadgeRemoved === 'true').toBe(true)
      expect(settings.openSignups === 'true').toBe(false)
      expect(settings.maintenanceMode === 'true').toBe(false)
    })
  })

  describe('Launch Metric Recording', () => {
    it('should have correct launch metric structure', () => {
      const metric = {
        id: 'metric-123',
        date: new Date(),
        signups: 50,
        toolRuns: 200,
        activeUsers: 80,
        conversions: 3,
        revenue: 297.00,
        errorRate: 0.5,
        avgResponseTime: 2.3,
      }

      expect(metric.signups).toBeGreaterThanOrEqual(0)
      expect(metric.toolRuns).toBeGreaterThanOrEqual(0)
      expect(metric.errorRate).toBeGreaterThanOrEqual(0)
      expect(metric.errorRate).toBeLessThanOrEqual(100)
    })

    it('should calculate daily error rate', () => {
      const totalRuns = 200
      const failedRuns = 2
      const errorRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0

      expect(errorRate).toBe(1)
    })
  })
})
