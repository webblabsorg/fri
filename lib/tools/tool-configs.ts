import { ToolConfig } from './types'

export const toolConfigs: Record<string, ToolConfig> = {
  'legal-email-drafter': {
    id: 'legal-email-drafter',
    name: 'Legal Email Drafter',
    slug: 'legal-email-drafter',
    category: 'Document Drafting',
    description: 'Draft professional legal emails with appropriate tone and precision',
    longDescription: 'Generate professional legal communications for clients, opposing counsel, or colleagues. Choose from various tones and automatically format your email with proper legal language.',
    inputFields: [
      {
        name: 'recipient',
        label: 'Recipient',
        type: 'text',
        placeholder: 'e.g., Client, Opposing Counsel, Judge',
        required: true,
        maxLength: 200,
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'e.g., Case Status Update, Discovery Response',
        required: true,
        maxLength: 200,
      },
      {
        name: 'context',
        label: 'Context & Key Points',
        type: 'textarea',
        placeholder: 'Describe what you want to communicate...',
        required: true,
        maxLength: 2000,
        helpText: 'Include important details, dates, and any specific points to address',
      },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        required: true,
        options: ['Professional', 'Formal', 'Friendly', 'Firm', 'Persuasive'],
      },
    ],
    outputFormat: 'text',
    complexity: 'simple',
    estimatedTime: '5-10 seconds',
    requiredTier: 'free',
    aiModel: {
      free: 'Gemini 1.5 Flash',
      starter: 'Claude Haiku',
      pro: 'Claude Haiku',
      advanced: 'Claude Haiku',
    },
    samplePrompts: [
      'Draft an email to a client updating them on case progress',
      'Write to opposing counsel requesting extension for discovery',
      'Send a formal notice to a third party regarding document production',
    ],
    relatedTools: ['client-status-update', 'demand-letter-generator'],
    useCases: [
      'Client communication',
      'Opposing counsel correspondence',
      'Court communications',
      'Internal team updates',
    ],
    icon: '✉️',
  },
  
  'case-law-summarizer': {
    id: 'case-law-summarizer',
    name: 'Case Law Summarizer',
    slug: 'case-law-summarizer',
    category: 'Legal Research',
    description: 'Instant summaries of judicial opinions with key holdings',
    longDescription: 'Get concise 2-3 paragraph summaries of complex court decisions, including facts, issues, holdings, and reasoning. Perfect for quick case analysis.',
    inputFields: [
      {
        name: 'caseText',
        label: 'Case Text or Citation',
        type: 'textarea',
        placeholder: 'Paste case text or provide citation...',
        required: true,
        maxLength: 20000,
        helpText: 'You can paste the full case text or provide a citation',
      },
      {
        name: 'focusArea',
        label: 'Focus Area (Optional)',
        type: 'text',
        placeholder: 'e.g., damages, jurisdiction, specific issue',
        required: false,
        maxLength: 200,
      },
    ],
    outputFormat: 'markdown',
    complexity: 'medium',
    estimatedTime: '10-20 seconds',
    requiredTier: 'starter',
    aiModel: {
      free: 'Not available',
      starter: 'Claude Haiku',
      pro: 'Claude Sonnet',
      advanced: 'Claude Sonnet',
    },
    samplePrompts: [
      'Summarize Smith v. Jones, 123 F.3d 456 (9th Cir. 2020)',
      'Extract key holdings from this appellate decision',
      'Focus on damages discussion in this case',
    ],
    relatedTools: ['legal-research-assistant', 'legal-issue-spotter'],
    useCases: [
      'Case research',
      'Brief writing',
      'Client advisories',
      'Case law database',
    ],
    icon: '📋',
  },

  'contract-risk-analyzer': {
    id: 'contract-risk-analyzer',
    name: 'Contract Risk Analyzer',
    slug: 'contract-risk-analyzer',
    category: 'Contract Review',
    description: 'AI-powered contract analysis with risk scoring and recommendations',
    longDescription: 'Upload or paste a contract to receive comprehensive risk analysis, including unfavorable terms, missing clauses, and recommended changes. Get a risk score and actionable insights.',
    inputFields: [
      {
        name: 'contractText',
        label: 'Contract Text',
        type: 'textarea',
        placeholder: 'Paste your contract here...',
        required: true,
        maxLength: 50000,
        helpText: 'Full contract text - we support agreements up to 50,000 characters',
      },
      {
        name: 'contractType',
        label: 'Contract Type',
        type: 'select',
        required: true,
        options: [
          'Vendor Agreement',
          'Employment Contract',
          'NDA',
          'Lease Agreement',
          'Service Agreement',
          'Other',
        ],
      },
      {
        name: 'perspective',
        label: 'Review From Perspective Of',
        type: 'select',
        required: true,
        options: ['Buyer', 'Seller', 'Landlord', 'Tenant', 'Employer', 'Employee', 'Neutral'],
      },
    ],
    outputFormat: 'structured',
    complexity: 'high',
    estimatedTime: '20-40 seconds',
    requiredTier: 'pro',
    aiModel: {
      free: 'Not available',
      starter: 'Not available',
      pro: 'Claude Sonnet',
      advanced: 'Claude Opus',
    },
    samplePrompts: [
      'Analyze this vendor agreement for unfavorable terms',
      'Review employment contract from employer perspective',
      'Check lease agreement for missing standard clauses',
    ],
    relatedTools: ['contract-clause-extractor', 'contract-summary-generator'],
    useCases: [
      'Due diligence',
      'Contract negotiation',
      'Risk mitigation',
      'Vendor management',
    ],
    icon: '⚖️',
  },

  'deposition-summarizer': {
    id: 'deposition-summarizer',
    name: 'Deposition Summarizer',
    slug: 'deposition-summarizer',
    category: 'Litigation Support',
    description: 'Create topical or page-line deposition summaries',
    longDescription: 'Transform lengthy deposition transcripts into concise, organized summaries. Choose between topical organization or traditional page-line format. Perfect for trial prep.',
    inputFields: [
      {
        name: 'transcript',
        label: 'Deposition Transcript',
        type: 'textarea',
        placeholder: 'Paste deposition transcript...',
        required: true,
        maxLength: 100000,
        helpText: 'We can process transcripts up to 300 pages',
      },
      {
        name: 'format',
        label: 'Summary Format',
        type: 'select',
        required: true,
        options: ['Topical', 'Page-Line', 'Executive Summary'],
      },
      {
        name: 'focusTopics',
        label: 'Focus Topics (Optional)',
        type: 'multiselect',
        required: false,
        options: [
          'Timeline of Events',
          'Damages',
          'Liability',
          'Credibility',
          'Expert Opinions',
          'Document References',
        ],
      },
    ],
    outputFormat: 'markdown',
    complexity: 'high',
    estimatedTime: '30-60 seconds',
    requiredTier: 'pro',
    aiModel: {
      free: 'Not available',
      starter: 'Not available',
      pro: 'Claude Sonnet',
      advanced: 'Claude Opus',
    },
    samplePrompts: [
      'Create topical summary focused on timeline and damages',
      'Generate page-line summary for impeachment prep',
      'Executive summary highlighting key admissions',
    ],
    relatedTools: ['discovery-request-generator', 'motion-to-dismiss-drafter'],
    useCases: [
      'Trial preparation',
      'Case assessment',
      'Impeachment strategy',
      'Settlement negotiation',
    ],
    icon: '🎯',
  },

  'legal-memo-writer': {
    id: 'legal-memo-writer',
    name: 'Legal Memo Writer',
    slug: 'legal-memo-writer',
    category: 'Document Drafting',
    description: 'Research memos with IRAC structure',
    longDescription: 'Generate comprehensive legal memoranda using the IRAC (Issue, Rule, Application, Conclusion) format. Perfect for internal analysis and client advisories.',
    inputFields: [
      {
        name: 'issue',
        label: 'Legal Issue',
        type: 'textarea',
        placeholder: 'State the legal issue...',
        required: true,
        maxLength: 1000,
      },
      {
        name: 'facts',
        label: 'Relevant Facts',
        type: 'textarea',
        placeholder: 'Provide the relevant facts...',
        required: true,
        maxLength: 5000,
      },
      {
        name: 'jurisdiction',
        label: 'Jurisdiction',
        type: 'text',
        placeholder: 'e.g., California, 9th Circuit, Federal',
        required: true,
        maxLength: 100,
      },
      {
        name: 'clientQuestion',
        label: 'Client Question',
        type: 'textarea',
        placeholder: 'What does the client want to know?',
        required: false,
        maxLength: 1000,
      },
    ],
    outputFormat: 'markdown',
    complexity: 'high',
    estimatedTime: '30-45 seconds',
    requiredTier: 'pro',
    aiModel: {
      free: 'Not available',
      starter: 'Not available',
      pro: 'Claude Sonnet',
      advanced: 'Claude Opus',
    },
    samplePrompts: [
      'Analyze liability for slip and fall in California',
      'Research employment discrimination claim viability',
      'Assess breach of contract damages',
    ],
    relatedTools: ['legal-research-assistant', 'case-law-summarizer'],
    useCases: [
      'Client advisories',
      'Internal research',
      'Case assessment',
      'Strategy planning',
    ],
    icon: '📝',
  },
}

// Helper function to get tool config
export function getToolConfig(slug: string): ToolConfig | undefined {
  return toolConfigs[slug]
}

// Get all tool configs
export function getAllToolConfigs(): ToolConfig[] {
  return Object.values(toolConfigs)
}

// Get tools by category
export function getToolsByCategory(category: string): ToolConfig[] {
  return Object.values(toolConfigs).filter(tool => tool.category === category)
}

// Get tools by tier
export function getToolsByTier(tier: 'free' | 'starter' | 'pro' | 'advanced'): ToolConfig[] {
  return Object.values(toolConfigs).filter(tool => {
    switch (tier) {
      case 'free':
        return tool.requiredTier === 'free'
      case 'starter':
        return ['free', 'starter'].includes(tool.requiredTier)
      case 'pro':
        return ['free', 'starter', 'pro'].includes(tool.requiredTier)
      case 'advanced':
        return true
      default:
        return false
    }
  })
}
