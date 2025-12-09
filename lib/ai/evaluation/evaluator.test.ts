import { OutputEvaluator } from './evaluator'
import {
  LEGAL_RESEARCH_BENCHMARKS,
  DOCUMENT_DRAFTING_BENCHMARKS,
  CLIENT_COMMUNICATION_BENCHMARKS,
  CONTRACT_REVIEW_BENCHMARKS,
} from './benchmarks'

describe('OutputEvaluator', () => {
  describe('Legal Research Tools', () => {
    LEGAL_RESEARCH_BENCHMARKS.forEach((benchmark) => {
      it(`should score ${benchmark.toolName} above threshold (${benchmark.expectedScore})`, () => {
        const result = OutputEvaluator.evaluate(
          benchmark.expectedOutput,
          benchmark.input,
          benchmark.category,
          benchmark.toolId
        )

        expect(result.score).toBeGreaterThanOrEqual(benchmark.expectedScore)
        expect(result.category).toBe(benchmark.category)
        expect(result.passed).toBe(true)
        expect(result.threshold).toBe(85) // Legal Research threshold

        // Verify required metrics are present
        expect(result.metrics.accuracy).toBeDefined()
        expect(result.metrics.relevance).toBeDefined()
        expect(result.metrics.citations).toBeDefined()
        expect(result.metrics.completeness).toBeDefined()

        console.log(`✓ ${benchmark.toolName}: ${result.score}/100 (threshold: ${result.threshold})`)
      })
    })

    it('should detect low-quality output without citations', () => {
      const lowQualityOutput = `This is a short summary without any legal citations or proper structure.`

      const result = OutputEvaluator.evaluate(
        lowQualityOutput,
        'Summarize a legal case',
        'Legal Research',
        'case-law-summarizer'
      )

      expect(result.metrics.citations).toBeLessThan(50)
      expect(result.metrics.completeness).toBeLessThan(50)
      expect(result.score).toBeLessThan(85)
      expect(result.passed).toBe(false)

      console.log(`✓ Low quality detected: ${result.score}/100`)
    })
  })

  describe('Document Drafting Tools', () => {
    DOCUMENT_DRAFTING_BENCHMARKS.forEach((benchmark) => {
      it(`should score ${benchmark.toolName} above threshold (${benchmark.expectedScore})`, () => {
        const result = OutputEvaluator.evaluate(
          benchmark.expectedOutput,
          benchmark.input,
          benchmark.category,
          benchmark.toolId
        )

        expect(result.score).toBeGreaterThanOrEqual(benchmark.expectedScore)
        expect(result.category).toBe(benchmark.category)
        expect(result.passed).toBe(true)
        expect(result.threshold).toBe(80) // Document Drafting threshold

        // Verify required metrics
        expect(result.metrics.structure).toBeDefined()
        expect(result.metrics.clarity).toBeDefined()
        expect(result.metrics.completeness).toBeDefined()
        expect(result.metrics.legalSoundness).toBeDefined()

        console.log(`✓ ${benchmark.toolName}: ${result.score}/100 (threshold: ${result.threshold})`)
      })
    })

    it('should detect poorly structured document', () => {
      const poorOutput = `This is a memo but it has no structure headers or sections it is just one long paragraph without proper formatting or organization and would be hard to read`

      const result = OutputEvaluator.evaluate(
        poorOutput,
        'Write a legal memo',
        'Document Drafting',
        'legal-memo-writer'
      )

      expect(result.metrics.structure).toBeLessThan(50)
      expect(result.score).toBeLessThan(80)
      expect(result.passed).toBe(false)

      console.log(`✓ Poor structure detected: ${result.score}/100`)
    })
  })

  describe('Client Communication Tools', () => {
    CLIENT_COMMUNICATION_BENCHMARKS.forEach((benchmark) => {
      it(`should score ${benchmark.toolName} above threshold (${benchmark.expectedScore})`, () => {
        const result = OutputEvaluator.evaluate(
          benchmark.expectedOutput,
          benchmark.input,
          benchmark.category,
          benchmark.toolId
        )

        expect(result.score).toBeGreaterThanOrEqual(benchmark.expectedScore)
        expect(result.category).toBe(benchmark.category)
        expect(result.passed).toBe(true)
        expect(result.threshold).toBe(75) // Client Communication threshold

        // Verify required metrics
        expect(result.metrics.clarity).toBeDefined()
        expect(result.metrics.tone).toBeDefined()
        expect(result.metrics.relevance).toBeDefined()

        console.log(`✓ ${benchmark.toolName}: ${result.score}/100 (threshold: ${result.threshold})`)
      })
    })

    it('should detect unprofessional tone', () => {
      const unprofessionalOutput = `Hey, so yeah we looked at your contract and its gonna need some work. Definitely some issues but nothing too crazy. Hit me back when you wanna chat about it.`

      const result = OutputEvaluator.evaluate(
        unprofessionalOutput,
        'Draft client email',
        'Client Communication',
        'legal-email-drafter'
      )

      expect(result.metrics.tone).toBeLessThan(70)
      expect(result.metrics.legalSoundness).toBeLessThan(70)

      console.log(`✓ Unprofessional tone detected: ${result.score}/100`)
    })
  })

  describe('Contract Review Tools', () => {
    CONTRACT_REVIEW_BENCHMARKS.forEach((benchmark) => {
      it(`should score ${benchmark.toolName} above threshold (${benchmark.expectedScore})`, () => {
        const result = OutputEvaluator.evaluate(
          benchmark.expectedOutput,
          benchmark.input,
          benchmark.category,
          benchmark.toolId
        )

        expect(result.score).toBeGreaterThanOrEqual(benchmark.expectedScore)
        expect(result.category).toBe(benchmark.category)
        expect(result.passed).toBe(true)
        expect(result.threshold).toBe(90) // Contract Review threshold

        // Verify required metrics
        expect(result.metrics.accuracy).toBeDefined()
        expect(result.metrics.completeness).toBeDefined()
        expect(result.metrics.legalSoundness).toBeDefined()

        console.log(`✓ ${benchmark.toolName}: ${result.score}/100 (threshold: ${result.threshold})`)
      })
    })

    it('should detect incomplete analysis', () => {
      const incompleteOutput = `The contract looks okay. A few minor issues but nothing major. You should probably sign it.`

      const result = OutputEvaluator.evaluate(
        incompleteOutput,
        'Analyze this contract',
        'Contract Review',
        'contract-risk-analyzer'
      )

      expect(result.metrics.completeness).toBeLessThan(30)
      expect(result.score).toBeLessThan(90)
      expect(result.passed).toBe(false)
      expect(result.feedback.length).toBeGreaterThan(0)

      console.log(`✓ Incomplete analysis detected: ${result.score}/100`)
      console.log(`  Feedback: ${result.feedback.join(', ')}`)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty output', () => {
      const result = OutputEvaluator.evaluate(
        '',
        'Test input',
        'Legal Research',
        'test-tool'
      )

      expect(result.score).toBeLessThan(20)
      expect(result.passed).toBe(false)
      expect(result.feedback).toContain('Output appears incomplete or too brief')
    })

    it('should handle very short output', () => {
      const result = OutputEvaluator.evaluate(
        'Yes.',
        'Complex legal question',
        'Legal Research',
        'test-tool'
      )

      expect(result.score).toBeLessThan(30)
      expect(result.passed).toBe(false)
    })

    it('should handle output with placeholders', () => {
      const outputWithPlaceholders = `# Analysis

[INSERT CASE NAME HERE]

TODO: Add more details

The plaintiff XXX sued the defendant for...`

      const result = OutputEvaluator.evaluate(
        outputWithPlaceholders,
        'Analyze this case',
        'Legal Research',
        'test-tool'
      )

      expect(result.metrics.accuracy).toBeLessThan(80)
      expect(result.passed).toBe(false)
    })

    it('should handle output with inappropriate guarantees', () => {
      const guaranteeOutput = `I guarantee you will definitely win this case 100%. The court will absolutely rule in your favor.`

      const result = OutputEvaluator.evaluate(
        guaranteeOutput,
        'Assess case strength',
        'Litigation Support',
        'test-tool'
      )

      expect(result.metrics.legalSoundness).toBeLessThan(80)
    })
  })

  describe('Metric Calculations', () => {
    it('should calculate completeness based on length and structure', () => {
      const shortOutput = 'This is short.'
      const mediumOutput = 'This is a medium-length output. '.repeat(20)
      const longOutput = 'This is a long output with multiple sections.\n\n'.repeat(30)

      const shortResult = OutputEvaluator.evaluate(shortOutput, 'input', 'default', 'test')
      const mediumResult = OutputEvaluator.evaluate(mediumOutput, 'input', 'default', 'test')
      const longResult = OutputEvaluator.evaluate(longOutput, 'input', 'default', 'test')

      expect(mediumResult.metrics.completeness).toBeGreaterThan(shortResult.metrics.completeness || 0)
      expect(longResult.metrics.completeness).toBeGreaterThan(mediumResult.metrics.completeness || 0)
    })

    it('should calculate relevance based on keyword overlap', () => {
      const input = 'contract breach damages liability'
      const relevantOutput = 'The contract breach resulted in significant damages due to the defendant\'s liability.'
      const irrelevantOutput = 'The weather today is sunny and pleasant for outdoor activities.'

      const relevantResult = OutputEvaluator.evaluate(relevantOutput, input, 'default', 'test')
      const irrelevantResult = OutputEvaluator.evaluate(irrelevantOutput, input, 'default', 'test')

      expect(relevantResult.metrics.relevance).toBeGreaterThan(irrelevantResult.metrics.relevance || 0)
      expect(relevantResult.metrics.relevance).toBeGreaterThan(60)
    })
  })

  describe('Feedback Generation', () => {
    it('should provide specific feedback for low scores', () => {
      const poorOutput = 'Short.'

      const result = OutputEvaluator.evaluate(
        poorOutput,
        'Complex question',
        'Legal Research',
        'test-tool'
      )

      expect(result.feedback.length).toBeGreaterThan(0)
      expect(result.feedback.some(f => f.includes('incomplete'))).toBe(true)
    })

    it('should provide positive feedback for high scores', () => {
      const goodOutput = LEGAL_RESEARCH_BENCHMARKS[0].expectedOutput

      const result = OutputEvaluator.evaluate(
        goodOutput,
        LEGAL_RESEARCH_BENCHMARKS[0].input,
        'Legal Research',
        'case-law-summarizer'
      )

      expect(result.feedback).toContain('Output meets quality standards')
    })
  })
})
