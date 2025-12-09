import { buildPrompt } from '@/lib/ai/prompt-builder'

describe('Prompt Builder', () => {
  it('should build email drafter prompt', () => {
    const context = {
      recipient: 'John Doe',
      subject: 'Contract Review',
      tone: 'professional',
      keyPoints: 'Please review the attached contract',
    }

    const result = buildPrompt('EMAIL_DRAFTER', context)

    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
    expect(result.system).toContain('legal email')
    expect(result.user).toContain('John Doe')
    expect(result.user).toContain('Contract Review')
  })

  it('should build contract analyzer prompt', () => {
    const context = {
      contractText: 'This is a contract...',
      analysisType: 'risk-assessment',
    }

    const result = buildPrompt('CONTRACT_RISK_ANALYZER', context)

    expect(result.system).toContain('contract')
    expect(result.user).toContain('This is a contract')
  })

  it('should build case summarizer prompt', () => {
    const context = {
      caseText: 'Case details here...',
      focusAreas: 'key findings',
    }

    const result = buildPrompt('CASE_SUMMARIZER', context)

    expect(result.system).toContain('case')
    expect(result.user).toContain('Case details')
  })

  it('should handle missing context fields gracefully', () => {
    const context = {}

    const result = buildPrompt('EMAIL_DRAFTER', context)

    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
    // Should still generate prompt even with empty context
  })

  it('should include context values in user prompt', () => {
    const context = {
      customField: 'custom value',
      anotherField: 123,
    }

    const result = buildPrompt('LEGAL_MEMO_WRITER', context)

    // User prompt should contain stringified context
    expect(result.user).toContain('custom')
  })
})
