/**
 * Tool Definitions Index
 * Exports all 220 tools organized by wave
 */

import { WAVE1_LITIGATION_TOOLS } from './wave1-litigation'
import { WAVE1_CONTRACT_TOOLS } from './wave1-contracts'
import { WAVE1_RESEARCH_TOOLS } from './wave1-research'
import { WAVE1_DUE_DILIGENCE_TOOLS } from './wave1-due-diligence'
import { WAVE2_IP_PRIVACY_TOOLS } from './wave2-ip-privacy'
import { WAVE2_SPECIALIZED_TOOLS } from './wave2-specialized'
import { WAVE2_EMPLOYMENT_TOOLS } from './wave2-employment'
import { WAVE2_REALESTATE_TOOLS } from './wave2-realestate'
import { WAVE2_CORPORATE_TOOLS } from './wave2-corporate'
import { WAVE3_ANALYTICS_TOOLS } from './wave3-analytics'
import { WAVE3_PRACTICE_TOOLS } from './wave3-practice'
import { WAVE3_COMPLIANCE_TOOLS } from './wave3-compliance'
import { WAVE3_OPERATIONS_TOOLS } from './wave3-operations'
import { WAVE4_ADVANCED_TOOLS } from './wave4-advanced'

export interface ToolDefinition {
  name: string
  slug: string
  description: string
  category: string
  inputType: 'text' | 'document' | 'structured'
  outputType: 'text' | 'document' | 'json'
  pricingTier: 'free' | 'pro' | 'professional' | 'enterprise'
  promptTemplate: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  wave: number
}

// Wave 1: 50 tools (Core litigation, contracts, research, due diligence)
export const WAVE1_TOOLS: ToolDefinition[] = [
  ...WAVE1_LITIGATION_TOOLS,
  ...WAVE1_CONTRACT_TOOLS,
  ...WAVE1_RESEARCH_TOOLS,
  ...WAVE1_DUE_DILIGENCE_TOOLS,
] as ToolDefinition[]

// Wave 2: 70 tools (IP, privacy, specialized practice areas, employment, real estate, corporate)
export const WAVE2_TOOLS: ToolDefinition[] = [
  ...WAVE2_IP_PRIVACY_TOOLS,
  ...WAVE2_SPECIALIZED_TOOLS,
  ...WAVE2_EMPLOYMENT_TOOLS,
  ...WAVE2_REALESTATE_TOOLS,
  ...WAVE2_CORPORATE_TOOLS,
] as ToolDefinition[]

// Wave 3: 84 tools (Analytics, billing, client management, practice, compliance, operations)
export const WAVE3_TOOLS: ToolDefinition[] = [
  ...WAVE3_ANALYTICS_TOOLS,
  ...WAVE3_PRACTICE_TOOLS,
  ...WAVE3_COMPLIANCE_TOOLS,
  ...WAVE3_OPERATIONS_TOOLS,
] as ToolDefinition[]

// Wave 4: 30 tools (Advanced and emerging technology)
export const WAVE4_TOOLS: ToolDefinition[] = [
  ...WAVE4_ADVANCED_TOOLS,
] as ToolDefinition[]

// All tools combined
export const ALL_TOOLS: ToolDefinition[] = [
  ...WAVE1_TOOLS,
  ...WAVE2_TOOLS,
  ...WAVE3_TOOLS,
  ...WAVE4_TOOLS,
]

// Tool counts by wave
export const TOOL_COUNTS = {
  wave1: WAVE1_TOOLS.length,
  wave2: WAVE2_TOOLS.length,
  wave3: WAVE3_TOOLS.length,
  wave4: WAVE4_TOOLS.length,
  total: ALL_TOOLS.length,
}

// Get tools by wave number
export function getToolsByWave(wave: number): ToolDefinition[] {
  switch (wave) {
    case 1: return WAVE1_TOOLS
    case 2: return WAVE2_TOOLS
    case 3: return WAVE3_TOOLS
    case 4: return WAVE4_TOOLS
    default: return []
  }
}

// Get tools by category
export function getToolsByCategory(category: string): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.category === category)
}

// Get tools by pricing tier
export function getToolsByTier(tier: string): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.pricingTier === tier)
}

console.log(`Tool definitions loaded: ${TOOL_COUNTS.total} tools across 4 waves`)
console.log(`  Wave 1: ${TOOL_COUNTS.wave1} tools`)
console.log(`  Wave 2: ${TOOL_COUNTS.wave2} tools`)
console.log(`  Wave 3: ${TOOL_COUNTS.wave3} tools`)
console.log(`  Wave 4: ${TOOL_COUNTS.wave4} tools`)
