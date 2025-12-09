import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { executeAITool } from '@/lib/ai/tool-executor'
import { LegalPromptType } from '@/lib/ai/prompt-builder'
import { SubscriptionTier, normalizeTier } from '@/lib/ai/model-service'
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

    // Look up tool by slug (toolId is actually a slug from the client)
    const tool = await prisma.tool.findUnique({
      where: { slug: toolId },
      select: { id: true, name: true, isActive: true },
    })

    if (!tool) {
      return NextResponse.json(
        { error: `Tool not found: ${toolId}` },
        { status: 404 }
      )
    }

    if (!tool.isActive) {
      return NextResponse.json(
        { error: `Tool is currently unavailable: ${tool.name}` },
        { status: 403 }
      )
    }

    // Execute tool with the actual UUID
    const userTier = normalizeTier(user.subscriptionTier)
    
    const result = await executeAITool({
      toolType,
      context,
      userId: user.id,
      toolId: tool.id, // Use UUID from database
      tier: userTier,
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
