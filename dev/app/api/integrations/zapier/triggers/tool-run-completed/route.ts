import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/integrations/zapier/triggers/tool-run-completed
 * Zapier polling trigger for completed tool runs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Get recent tool run completed events
    const events = await prisma.zapierEvent.findMany({
      where: {
        userId,
        eventType: 'tool_run_completed',
        consumed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100), // Cap at 100
    })

    // Mark events as consumed (optional - depends on your Zapier app design)
    if (events.length > 0) {
      await prisma.zapierEvent.updateMany({
        where: {
          id: {
            in: events.map(e => e.id),
          },
        },
        data: {
          consumed: true,
        },
      })
    }

    // Transform events to Zapier-friendly format
    const zapierData = events.map(event => {
      const payload = (event.payload as any) || {}

      return {
        id: event.id,
        tool_run_id: payload.toolRunId,
        tool_id: payload.toolId,
        status: payload.status,
        output_text: payload.outputText,
        tokens_used: payload.tokensUsed,
        cost: payload.cost,
        created_at: event.createdAt.toISOString(),
        user_id: event.userId,
      }
    })

    return NextResponse.json(zapierData)
  } catch (error) {
    console.error('[Zapier] Tool run completed trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool run events' },
      { status: 500 }
    )
  }
}
