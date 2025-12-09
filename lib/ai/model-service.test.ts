import { normalizeTier, MODELS, SubscriptionTier } from './model-service'

describe('AI Model Service', () => {
  describe('normalizeTier', () => {
    it('should normalize lowercase tier values', () => {
      expect(normalizeTier('free')).toBe('FREE')
      expect(normalizeTier('pro')).toBe('PRO')
      expect(normalizeTier('professional')).toBe('PROFESSIONAL')
      expect(normalizeTier('enterprise')).toBe('ENTERPRISE')
    })

    it('should pass through uppercase tier values', () => {
      expect(normalizeTier('FREE')).toBe('FREE')
      expect(normalizeTier('PRO')).toBe('PRO')
      expect(normalizeTier('PROFESSIONAL')).toBe('PROFESSIONAL')
      expect(normalizeTier('ENTERPRISE')).toBe('ENTERPRISE')
    })

    it('should handle mixed case', () => {
      expect(normalizeTier('FrEe')).toBe('FREE')
      expect(normalizeTier('PrO')).toBe('PRO')
      expect(normalizeTier('ProFessional')).toBe('PROFESSIONAL')
    })

    it('should return FREE for null', () => {
      expect(normalizeTier(null)).toBe('FREE')
    })

    it('should return FREE for undefined', () => {
      expect(normalizeTier(undefined)).toBe('FREE')
    })

    it('should return FREE for empty string', () => {
      expect(normalizeTier('')).toBe('FREE')
    })

    it('should return FREE for invalid tier and log warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = normalizeTier('INVALID_TIER')
      
      expect(result).toBe('FREE')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown subscription tier: INVALID_TIER')
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle database-style tier values', () => {
      // Common database values
      expect(normalizeTier('free')).toBe('FREE')
      expect(normalizeTier('pro')).toBe('PRO')
      expect(normalizeTier('professional')).toBe('PROFESSIONAL')
      expect(normalizeTier('enterprise')).toBe('ENTERPRISE')
    })
  })

  describe('MODELS configuration', () => {
    it('should have all required tiers', () => {
      expect(MODELS.FREE).toBeDefined()
      expect(MODELS.PRO).toBeDefined()
      expect(MODELS.PROFESSIONAL).toBeDefined()
      expect(MODELS.ENTERPRISE).toBeDefined()
    })

    it('should have FREE tier with Google provider', () => {
      expect(MODELS.FREE.provider).toBe('google')
      expect(MODELS.FREE.model).toBe('gemini-1.5-flash')
      expect(MODELS.FREE.costPer1kTokens).toBe(0)
    })

    it('should have PRO tier with Anthropic provider', () => {
      expect(MODELS.PRO.provider).toBe('anthropic')
      expect(MODELS.PRO.model).toContain('claude')
      expect(MODELS.PRO.costPer1kTokens).toBeGreaterThan(0)
    })

    it('should have PROFESSIONAL tier with same model as PRO', () => {
      expect(MODELS.PROFESSIONAL.provider).toBe('anthropic')
      expect(MODELS.PROFESSIONAL.model).toBe(MODELS.PRO.model)
      expect(MODELS.PROFESSIONAL.costPer1kTokens).toBe(MODELS.PRO.costPer1kTokens)
    })

    it('should have ENTERPRISE tier with Anthropic Opus', () => {
      expect(MODELS.ENTERPRISE.provider).toBe('anthropic')
      expect(MODELS.ENTERPRISE.model).toContain('opus')
      expect(MODELS.ENTERPRISE.costPer1kTokens).toBeGreaterThan(MODELS.PRO.costPer1kTokens)
    })

    it('should have valid token limits', () => {
      const tiers: SubscriptionTier[] = ['FREE', 'PRO', 'PROFESSIONAL', 'ENTERPRISE']
      
      tiers.forEach(tier => {
        expect(MODELS[tier].maxTokens).toBeGreaterThan(0)
        expect(Number.isFinite(MODELS[tier].maxTokens)).toBe(true)
      })
    })

    it('should have increasing cost structure', () => {
      expect(MODELS.FREE.costPer1kTokens).toBe(0)
      expect(MODELS.PRO.costPer1kTokens).toBeGreaterThan(MODELS.FREE.costPer1kTokens)
      expect(MODELS.ENTERPRISE.costPer1kTokens).toBeGreaterThan(MODELS.PRO.costPer1kTokens)
    })
  })
})
