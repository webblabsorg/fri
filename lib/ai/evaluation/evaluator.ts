import {
  EvaluationResult,
  EvaluationMetrics,
  CATEGORY_THRESHOLDS,
} from './types'

export class OutputEvaluator {
  /**
   * Evaluate tool output quality
   */
  static evaluate(
    output: string,
    input: string,
    category: string,
    toolType: string
  ): EvaluationResult {
    const metrics = this.calculateMetrics(output, input, category, toolType)
    const categoryConfig =
      CATEGORY_THRESHOLDS[category] || CATEGORY_THRESHOLDS.default

    const overallScore = this.calculateOverallScore(
      metrics,
      categoryConfig.requiredMetrics
    )

    const passed = overallScore >= categoryConfig.threshold
    const feedback = this.generateFeedback(
      metrics,
      categoryConfig.requiredMetrics
    )

    return {
      score: overallScore,
      metrics,
      passed,
      threshold: categoryConfig.threshold,
      category,
      feedback,
      timestamp: new Date(),
    }
  }

  /**
   * Calculate individual quality metrics
   */
  private static calculateMetrics(
    output: string,
    input: string,
    category: string,
    toolType: string
  ): EvaluationMetrics {
    const metrics: EvaluationMetrics = {
      overallScore: 0,
    }

    // Length and completeness check
    metrics.completeness = this.evaluateCompleteness(output)

    // Clarity check (readability, structure)
    metrics.clarity = this.evaluateClarity(output)

    // Structure check (for formatted documents)
    if (this.requiresStructure(category)) {
      metrics.structure = this.evaluateStructure(output)
    }

    // Citations check (for research tools)
    if (this.requiresCitations(category)) {
      metrics.citations = this.evaluateCitations(output)
    }

    // Relevance to input
    metrics.relevance = this.evaluateRelevance(output, input)

    // Accuracy (basic checks)
    metrics.accuracy = this.evaluateAccuracy(output, category)

    // Legal soundness (basic checks)
    metrics.legalSoundness = this.evaluateLegalSoundness(output, category)

    // Tone (for communication tools)
    if (category === 'Client Communication') {
      metrics.tone = this.evaluateTone(output)
    }

    return metrics
  }

  /**
   * Evaluate completeness (is the output substantial?)
   */
  private static evaluateCompleteness(output: string): number {
    const wordCount = output.split(/\s+/).length
    const hasConclusion = /\b(conclusion|summary|therefore|accordingly)\b/i.test(
      output
    )

    let score = 0

    // Length scoring
    if (wordCount >= 500) score += 40
    else if (wordCount >= 300) score += 30
    else if (wordCount >= 150) score += 20
    else if (wordCount >= 50) score += 10

    // Structure scoring
    if (hasConclusion) score += 20

    // Multiple sections/paragraphs
    const paragraphs = output.split('\n\n').filter((p) => p.trim().length > 0)
    if (paragraphs.length >= 3) score += 20
    else if (paragraphs.length >= 2) score += 15
    else score += 10

    // Has proper formatting
    const hasHeaders = /^#+\s/m.test(output) || /^[A-Z][^a-z]+:/m.test(output)
    if (hasHeaders) score += 20

    return Math.min(100, score)
  }

  /**
   * Evaluate clarity (readability)
   */
  private static evaluateClarity(output: string): number {
    let score = 100

    // Check for overly long sentences
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgSentenceLength =
      output.split(/\s+/).length / Math.max(sentences.length, 1)
    if (avgSentenceLength > 40) score -= 20
    else if (avgSentenceLength > 30) score -= 10

    // Check for proper punctuation
    if (!/[.!?]$/.test(output.trim())) score -= 10

    // Check for excessive repetition
    const words = output.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    const repetitionRatio = uniqueWords.size / words.length
    if (repetitionRatio < 0.3) score -= 20
    else if (repetitionRatio < 0.5) score -= 10

    // Check for proper capitalization
    const hasProperCaps = /^[A-Z]/.test(output)
    if (!hasProperCaps) score -= 10

    return Math.max(0, score)
  }

  /**
   * Evaluate structure (formatting, organization)
   */
  private static evaluateStructure(output: string): number {
    let score = 0

    // Has headings/sections
    const hasHeaders =
      /^#+\s/m.test(output) ||
      /^[A-Z][^a-z]+:/m.test(output) ||
      /^\d+\.\s/m.test(output)
    if (hasHeaders) score += 30

    // Has bullet points or numbered lists
    const hasLists = /^[\s]*[-*•]\s/m.test(output) || /^\d+\.\s/m.test(output)
    if (hasLists) score += 20

    // Multiple paragraphs
    const paragraphs = output.split('\n\n').filter((p) => p.trim().length > 0)
    if (paragraphs.length >= 4) score += 25
    else if (paragraphs.length >= 2) score += 15

    // Logical flow indicators
    const hasFlowWords = /(first|second|next|finally|however|therefore)/i.test(
      output
    )
    if (hasFlowWords) score += 15

    // Has introduction and conclusion
    const hasIntro = /^(introduction|overview|background)/im.test(output)
    const hasConclusion = /(conclusion|summary|recommendation)/i.test(output)
    if (hasIntro && hasConclusion) score += 10

    return Math.min(100, score)
  }

  /**
   * Evaluate citations (for research tools)
   */
  private static evaluateCitations(output: string): number {
    let score = 0

    // Check for case citations
    const hasCaseCitations = /\d+\s+[A-Z][a-z]+\.?\s*\d+/.test(output)
    if (hasCaseCitations) score += 40

    // Check for statute citations
    const hasStatuteCitations = /\d+\s+U\.S\.C\.|§\s*\d+/.test(output)
    if (hasStatuteCitations) score += 20

    // Check for general citations
    const hasCitations = /\([^)]+\d{4}\)/.test(output) || /\[\d+\]/.test(output)
    if (hasCitations) score += 20

    // Check for proper citation format
    const citationCount = (output.match(/v\.|vs\./gi) || []).length
    if (citationCount >= 3) score += 20
    else if (citationCount >= 1) score += 10

    return Math.min(100, score)
  }

  /**
   * Evaluate relevance to input
   */
  private static evaluateRelevance(output: string, input: string): number {
    const inputWords = new Set(
      input
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
    )
    const outputWords = new Set(
      output
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
    )

    let matchCount = 0
    inputWords.forEach((word) => {
      if (outputWords.has(word)) matchCount++
    })

    const relevanceRatio = matchCount / Math.max(inputWords.size, 1)

    if (relevanceRatio >= 0.5) return 100
    if (relevanceRatio >= 0.3) return 80
    if (relevanceRatio >= 0.2) return 60
    if (relevanceRatio >= 0.1) return 40
    return 20
  }

  /**
   * Evaluate accuracy (basic checks)
   */
  private static evaluateAccuracy(output: string, category: string): number {
    let score = 100

    // Check for common errors
    const hasPlaceholders = /\[.*?\]|TODO|PLACEHOLDER|XXX/i.test(output)
    if (hasPlaceholders) score -= 30

    // Check for inconsistencies
    const hasIncomplete = /\.\.\.|--$|incomplete|pending/i.test(output)
    if (hasIncomplete) score -= 20

    // Check for legal disclaimer (should be present)
    if (category !== 'Client Communication') {
      const hasDisclaimer = /disclaimer|not legal advice|consult.*attorney/i.test(
        output
      )
      if (!hasDisclaimer) score -= 10
    }

    return Math.max(0, score)
  }

  /**
   * Evaluate legal soundness
   */
  private static evaluateLegalSoundness(
    output: string,
    category: string
  ): number {
    let score = 100

    // Check for overly casual language
    const hasCasualLanguage = /\b(gonna|wanna|yeah|nope|cool|awesome)\b/i.test(
      output
    )
    if (hasCasualLanguage) score -= 20

    // Check for proper legal terminology
    const hasLegalTerms = /(pursuant|herein|whereas|thereof|party|agreement|contract)/i.test(
      output
    )
    if (hasLegalTerms) score += 0 // neutral, expected
    else score -= 15

    // Check for inappropriate guarantees
    const hasGuarantees = /\b(guarantee|promise|definitely will|100%)\b/i.test(
      output
    )
    if (hasGuarantees) score -= 25

    return Math.max(0, score)
  }

  /**
   * Evaluate tone (for communication tools)
   */
  private static evaluateTone(output: string): number {
    let score = 80

    // Check for professional tone
    const isProfessional = /dear|sincerely|regards|thank you/i.test(output)
    if (isProfessional) score += 20

    // Check for politeness
    const isPolite = /please|kindly|appreciate|thank/i.test(output)
    if (isPolite) score += 10

    // Check for clarity
    const isClear = /\n\n/.test(output) // has paragraph breaks
    if (isClear) score += 10

    // Penalize aggressive language
    const isAggressive = /must|demand|require immediately|unacceptable/i.test(
      output
    )
    if (isAggressive) score -= 20

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculate overall score from metrics
   */
  private static calculateOverallScore(
    metrics: EvaluationMetrics,
    requiredMetrics: string[]
  ): number {
    let sum = 0
    let count = 0

    requiredMetrics.forEach((metric) => {
      const value = metrics[metric as keyof EvaluationMetrics]
      if (typeof value === 'number') {
        sum += value
        count++
      }
    })

    return count > 0 ? Math.round(sum / count) : 0
  }

  /**
   * Generate feedback based on metrics
   */
  private static generateFeedback(
    metrics: EvaluationMetrics,
    requiredMetrics: string[]
  ): string[] {
    const feedback: string[] = []

    requiredMetrics.forEach((metric) => {
      const value = metrics[metric as keyof EvaluationMetrics]
      if (typeof value === 'number' && value < 70) {
        feedback.push(
          `${metric.charAt(0).toUpperCase() + metric.slice(1)} score is low (${value}/100) - needs improvement`
        )
      }
    })

    if (metrics.completeness && metrics.completeness < 50) {
      feedback.push('Output appears incomplete or too brief')
    }

    if (metrics.clarity && metrics.clarity < 70) {
      feedback.push('Output could be clearer and more readable')
    }

    if (metrics.citations && metrics.citations < 50) {
      feedback.push('Missing proper citations or legal references')
    }

    if (feedback.length === 0) {
      feedback.push('Output meets quality standards')
    }

    return feedback
  }

  /**
   * Helper: Does this category require citations?
   */
  private static requiresCitations(category: string): boolean {
    return ['Legal Research', 'Litigation Support', 'IP'].includes(category)
  }

  /**
   * Helper: Does this category require structure?
   */
  private static requiresStructure(category: string): boolean {
    return [
      'Document Drafting',
      'Contract Review',
      'Corporate',
      'Real Estate',
    ].includes(category)
  }
}
