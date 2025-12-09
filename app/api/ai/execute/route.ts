import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { executeAITool } from '@/lib/ai/tool-executor'
import { LegalPromptType } from '@/lib/ai/prompt-builder'
import { SubscriptionTier } from '@/lib/ai/model-service'

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
    const { toolType, toolId, context } = body

    if (!toolType || !toolId || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: toolType, toolId, context' },
        { status: 400 }
      )
    }

    // Validate tool type
    const validToolTypes: LegalPromptType[] = [
      'EMAIL_DRAFTER',
      'CASE_SUMMARIZER',
      'CONTRACT_REVIEWER',
      'LEGAL_RESEARCH',
      'MOTION_DRAFTER',
      'DOCUMENT_ANALYZER',
    ]

    if (!validToolTypes.includes(toolType)) {
      return NextResponse.json(
        { error: 'Invalid tool type' },
        { status: 400 }
      )
    }

    // Execute tool
    const result = await executeAITool({
      toolType,
      context,
      userId: user.id,
      toolId,
      tier: user.subscriptionTier as SubscriptionTier,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Tool execution failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      content: result.content,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      model: result.model,
      provider: result.provider,
    })
  } catch (error) {
    console.error('AI execute error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
