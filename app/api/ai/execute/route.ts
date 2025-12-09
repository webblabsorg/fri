import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildPrompt } from '@/lib/ai/prompt-builder'
import { getToolConfig } from '@/lib/tools/tool-configs'
import { generateAIResponse, normalizeTier, SubscriptionTier, validateAPIKeys } from '@/lib/ai/model-service'
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

    // Validate API keys are configured
    const apiKeys = validateAPIKeys()
    if (!apiKeys.anthropic && !apiKeys.google) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Build prompts using the prompt builder
    const prompts = buildPrompt(mapToolToPromptType(toolId), context)

    // Prepare messages for AI
    const messages = [
      { role: 'system' as const, content: prompts.system },
      { role: 'user' as const, content: prompts.user },
    ]

    // Normalize tier for model service
    const normalizedTier = normalizeTier(userTier.toUpperCase())

    // Get AI model name for display
    const aiModelDisplay = toolConfig.aiModel[userTier]

    // Generate AI response
    let aiResponse
    try {
      aiResponse = await generateAIResponse({
        messages,
        tier: normalizedTier,
        temperature: 0.7,
        userId: user.id,
        toolId: toolId,
      })
    } catch (aiError) {
      console.error('AI generation error:', aiError)
      
      // Save failed run to database
      try {
        await prisma.toolRun.create({
          data: {
            userId: user.id,
            toolId: toolId,
            inputText: JSON.stringify(context),
            outputText: '',
            status: 'failed',
            aiModelUsed: aiModelDisplay,
            tokensUsed: 0,
            cost: 0,
            completedAt: new Date(),
          },
        })
      } catch (dbError) {
        console.error('Database error logging failure:', dbError)
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate AI response. Please try again.',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Save successful tool run to database
    try {
      const toolRun = await prisma.toolRun.create({
        data: {
          userId: user.id,
          toolId: toolId,
          inputText: JSON.stringify(context),
          outputText: aiResponse.content,
          status: 'completed',
          aiModelUsed: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed.total,
          cost: aiResponse.cost,
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        executionId: toolRun.id,
        content: aiResponse.content,
        tokensUsed: aiResponse.tokensUsed.total,
        cost: aiResponse.cost,
        model: aiResponse.model,
        provider: aiResponse.provider,
        toolName: toolConfig.name,
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      
      // Return AI response even if DB save fails
      return NextResponse.json({
        success: true,
        content: aiResponse.content,
        tokensUsed: aiResponse.tokensUsed.total,
        cost: aiResponse.cost,
        model: aiResponse.model,
        provider: aiResponse.provider,
        toolName: toolConfig.name,
        warning: 'Response generated but not saved to history',
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
