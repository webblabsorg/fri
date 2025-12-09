import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildPrompt } from '@/lib/ai/prompt-builder'
import { getToolConfig } from '@/lib/tools/tool-configs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { toolId, context } = body

    if (!toolId || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: toolId, context' },
        { status: 400 }
      )
    }

    // Get tool configuration
    const toolConfig = getToolConfig(toolId)

    if (!toolConfig) {
      return NextResponse.json(
        { error: `Tool configuration not found: ${toolId}` },
        { status: 404 }
      )
    }

    // Check user's tier access
    const userTier = user.subscriptionTier as 'free' | 'starter' | 'pro' | 'advanced'
    const tierOrder = ['free', 'starter', 'pro', 'advanced']
    const requiredTierIndex = tierOrder.indexOf(toolConfig.requiredTier)
    const userTierIndex = tierOrder.indexOf(userTier)

    if (userTierIndex < requiredTierIndex) {
      return NextResponse.json(
        { 
          error: `This tool requires ${toolConfig.requiredTier} plan or higher`,
          requiredTier: toolConfig.requiredTier,
          currentTier: userTier
        },
        { status: 403 }
      )
    }

    // Get AI model for user's tier
    const aiModel = toolConfig.aiModel[userTier]

    // Build prompts using the prompt builder
    const prompts = buildPrompt(mapToolToPromptType(toolId), context)

    // For now, return a simulated response (will integrate with actual AI in next step)
    // TODO: Integrate with Anthropic Claude and Google Gemini APIs
    const mockResponse = {
      content: `[AI Response from ${aiModel}]\n\nThis is a simulated response for ${toolConfig.name}.\n\nSystem Prompt: ${prompts.system.substring(0, 100)}...\n\nUser Request: ${prompts.user.substring(0, 200)}...\n\n[In production, this would be the actual AI-generated content]`,
      tokensUsed: 150,
      cost: 0.001,
    }

    // Save tool run to database
    try {
      const toolRun = await prisma.toolRun.create({
        data: {
          userId: user.id,
          toolId: toolId,
          inputText: JSON.stringify(context),
          outputText: mockResponse.content,
          status: 'completed',
          aiModelUsed: aiModel,
          tokensUsed: mockResponse.tokensUsed,
          cost: mockResponse.cost,
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        executionId: toolRun.id,
        content: mockResponse.content,
        tokensUsed: mockResponse.tokensUsed,
        cost: mockResponse.cost,
        model: aiModel,
        toolName: toolConfig.name,
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return response even if DB save fails
      return NextResponse.json({
        success: true,
        content: mockResponse.content,
        tokensUsed: mockResponse.tokensUsed,
        cost: mockResponse.cost,
        model: aiModel,
        toolName: toolConfig.name,
      })
    }
  } catch (error) {
    console.error('AI execute error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Map tool slugs to prompt types
function mapToolToPromptType(toolSlug: string): string {
  const mapping: Record<string, string> = {
    'legal-email-drafter': 'EMAIL_DRAFTER',
    'case-law-summarizer': 'CASE_SUMMARIZER',
    'contract-risk-analyzer': 'CONTRACT_RISK_ANALYZER',
    'deposition-summarizer': 'DEPOSITION_SUMMARIZER',
    'legal-memo-writer': 'LEGAL_MEMO_WRITER',
    'legal-issue-spotter': 'LEGAL_ISSUE_SPOTTER',
    'demand-letter-generator': 'DEMAND_LETTER',
    'contract-drafter-nda': 'CONTRACT_DRAFTER',
    'contract-clause-extractor': 'CONTRACT_CLAUSE_EXTRACTOR',
    'contract-summary-generator': 'CONTRACT_SUMMARY',
    'discovery-request-generator': 'DISCOVERY_REQUEST',
    'motion-to-dismiss-drafter': 'MOTION_TO_DISMISS',
    'manda-due-diligence-analyzer': 'DUE_DILIGENCE',
    'board-resolution-drafter': 'BOARD_RESOLUTION',
    'employment-contract-generator': 'EMPLOYMENT_CONTRACT',
    'termination-letter-drafter': 'TERMINATION_LETTER',
    'patent-prior-art-search': 'PATENT_SEARCH',
    'client-status-update': 'CLIENT_UPDATE',
    'lease-agreement-analyzer': 'LEASE_ANALYZER',
    'legal-research-assistant': 'LEGAL_RESEARCH',
  }

  return mapping[toolSlug] || 'EMAIL_DRAFTER'
}
