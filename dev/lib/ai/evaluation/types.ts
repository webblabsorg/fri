export interface EvaluationMetrics {
  overallScore: number // 0-100
  accuracy?: number // 0-100
  relevance?: number // 0-100
  completeness?: number // 0-100
  clarity?: number // 0-100
  citations?: number // 0-100, for research tools
  structure?: number // 0-100, for drafting tools
  tone?: number // 0-100, for communication tools
  legalSoundness?: number // 0-100
}

export interface EvaluationResult {
  score: number // 0-100 overall
  metrics: EvaluationMetrics
  passed: boolean // whether it meets quality threshold
  threshold: number // minimum score required
  category: string // tool category
  feedback: string[] // specific feedback points
  timestamp: Date
}

export interface ToolCategoryThresholds {
  [category: string]: {
    threshold: number
    requiredMetrics: string[]
  }
}

export const CATEGORY_THRESHOLDS: ToolCategoryThresholds = {
  'Legal Research': {
    threshold: 85,
    requiredMetrics: ['accuracy', 'relevance', 'citations', 'completeness'],
  },
  'Document Drafting': {
    threshold: 80,
    requiredMetrics: ['structure', 'clarity', 'completeness', 'legalSoundness'],
  },
  'Contract Review': {
    threshold: 90,
    requiredMetrics: ['accuracy', 'completeness', 'legalSoundness'],
  },
  'Litigation Support': {
    threshold: 85,
    requiredMetrics: ['accuracy', 'relevance', 'completeness'],
  },
  'Corporate': {
    threshold: 80,
    requiredMetrics: ['accuracy', 'structure', 'legalSoundness'],
  },
  'Employment': {
    threshold: 80,
    requiredMetrics: ['accuracy', 'clarity', 'legalSoundness'],
  },
  'IP': {
    threshold: 85,
    requiredMetrics: ['accuracy', 'relevance', 'completeness'],
  },
  'Client Communication': {
    threshold: 75,
    requiredMetrics: ['clarity', 'tone', 'relevance'],
  },
  'Real Estate': {
    threshold: 80,
    requiredMetrics: ['accuracy', 'structure', 'completeness'],
  },
  default: {
    threshold: 75,
    requiredMetrics: ['accuracy', 'relevance', 'completeness'],
  },
}
