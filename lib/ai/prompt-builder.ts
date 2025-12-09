import { AIMessage } from './model-service'

export interface PromptTemplate {
  system: string
  userTemplate: string
  variables: readonly string[]
}

export interface PromptContext {
  [key: string]: string | number | boolean | object
}

// Build a prompt from a template and context
export function buildPrompt(
  template: PromptTemplate,
  context: PromptContext
): AIMessage[] {
  const messages: AIMessage[] = []

  // Add system message
  messages.push({
    role: 'system',
    content: replaceVariables(template.system, context),
  })

  // Add user message
  messages.push({
    role: 'user',
    content: replaceVariables(template.userTemplate, context),
  })

  return messages
}

// Replace variables in template with context values
function replaceVariables(template: string, context: PromptContext): string {
  let result = template

  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`
    const replacement = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value)
    
    result = result.replaceAll(placeholder, replacement)
  }

  return result
}

// Validate that all required variables are provided
export function validatePromptContext(
  template: PromptTemplate,
  context: PromptContext
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const variable of template.variables) {
    if (!(variable in context)) {
      missing.push(variable)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Pre-built prompt templates for common legal tasks
export const LEGAL_PROMPTS = {
  EMAIL_DRAFTER: {
    system: `You are an expert legal professional assistant specializing in drafting clear, professional legal emails.
Your emails are:
- Professional and courteous
- Legally precise and accurate
- Clear and concise
- Properly formatted
- Free of legal jargon when possible

Always include:
1. Appropriate greeting
2. Clear subject matter
3. Relevant details
4. Professional closing
5. Standard legal disclaimers when appropriate`,
    userTemplate: `Please draft a professional legal email with the following details:

Purpose: {{purpose}}
Recipient: {{recipient}}
Tone: {{tone}}
Key Points: {{keyPoints}}
Additional Context: {{context}}

Please provide a complete, ready-to-send email.`,
    variables: ['purpose', 'recipient', 'tone', 'keyPoints', 'context'],
  },

  CASE_SUMMARIZER: {
    system: `You are an expert legal analyst specializing in case summaries.
Your summaries are:
- Comprehensive yet concise
- Organized by key legal issues
- Include relevant facts, holdings, and reasoning
- Highlight important precedents
- Note practical implications

Always structure summaries with:
1. Case citation and parties
2. Key facts
3. Legal issues
4. Court's holding
5. Reasoning
6. Significance/implications`,
    userTemplate: `Please provide a comprehensive legal case summary for:

Case Name: {{caseName}}
Citation: {{citation}}
Court: {{court}}
Date: {{date}}

Case Details:
{{caseDetails}}

Focus Areas: {{focusAreas}}

Please provide a structured analysis.`,
    variables: ['caseName', 'citation', 'court', 'date', 'caseDetails', 'focusAreas'],
  },

  CONTRACT_REVIEWER: {
    system: `You are an expert contract review attorney.
Your reviews are:
- Thorough and detail-oriented
- Identify risks and ambiguities
- Suggest specific improvements
- Note missing clauses
- Highlight non-standard terms

Always review for:
1. Key terms and definitions
2. Obligations and rights
3. Liability and indemnification
4. Termination provisions
5. Dispute resolution
6. Potential risks`,
    userTemplate: `Please review this contract and provide detailed feedback:

Contract Type: {{contractType}}
Parties: {{parties}}
Context: {{context}}

Contract Text:
{{contractText}}

Specific Concerns: {{concerns}}

Please provide a comprehensive review with recommendations.`,
    variables: ['contractType', 'parties', 'context', 'contractText', 'concerns'],
  },

  LEGAL_RESEARCH: {
    system: `You are an expert legal researcher with deep knowledge of legal precedents, statutes, and legal reasoning.
Your research is:
- Thorough and well-cited
- Organized by jurisdiction
- Balanced (considering multiple viewpoints)
- Practical and actionable
- Current with recent developments

Always provide:
1. Relevant statutes and regulations
2. Key case law
3. Legal principles
4. Jurisdictional variations
5. Practical applications`,
    userTemplate: `Please conduct legal research on:

Research Question: {{question}}
Jurisdiction: {{jurisdiction}}
Practice Area: {{practiceArea}}
Context: {{context}}

Specific Focus: {{focus}}

Please provide comprehensive research with citations.`,
    variables: ['question', 'jurisdiction', 'practiceArea', 'context', 'focus'],
  },

  MOTION_DRAFTER: {
    system: `You are an expert litigation attorney specializing in drafting legal motions.
Your motions are:
- Legally sound and well-reasoned
- Properly formatted
- Persuasive and clear
- Well-cited with authority
- Professional in tone

Always include:
1. Caption and introduction
2. Statement of facts
3. Legal argument
4. Supporting authorities
5. Conclusion and prayer for relief`,
    userTemplate: `Please draft a legal motion with the following details:

Motion Type: {{motionType}}
Court: {{court}}
Case Caption: {{caseCaption}}

Facts: {{facts}}
Legal Basis: {{legalBasis}}
Relief Sought: {{reliefSought}}

Additional Instructions: {{instructions}}

Please provide a complete, court-ready motion.`,
    variables: ['motionType', 'court', 'caseCaption', 'facts', 'legalBasis', 'reliefSought', 'instructions'],
  },

  DOCUMENT_ANALYZER: {
    system: `You are an expert legal document analyst.
Your analyses are:
- Systematic and comprehensive
- Identify key provisions
- Highlight potential issues
- Note missing elements
- Provide actionable insights

Always analyze:
1. Document type and purpose
2. Key provisions
3. Rights and obligations
4. Risks and concerns
5. Recommendations`,
    userTemplate: `Please analyze this legal document:

Document Type: {{documentType}}
Purpose: {{purpose}}
Context: {{context}}

Document Content:
{{documentContent}}

Analysis Focus: {{analysisFocus}}

Please provide a detailed analysis.`,
    variables: ['documentType', 'purpose', 'context', 'documentContent', 'analysisFocus'],
  },
} as const

export type LegalPromptType = keyof typeof LEGAL_PROMPTS

// Get a prompt template by type
export function getLegalPrompt(type: LegalPromptType): PromptTemplate {
  return LEGAL_PROMPTS[type]
}

// Build a legal prompt with context
export function buildLegalPrompt(
  type: LegalPromptType,
  context: PromptContext
): AIMessage[] {
  const template = getLegalPrompt(type)
  
  // Validate context
  const validation = validatePromptContext(template, context)
  if (!validation.valid) {
    throw new Error(
      `Missing required variables: ${validation.missing.join(', ')}`
    )
  }

  return buildPrompt(template, context)
}
