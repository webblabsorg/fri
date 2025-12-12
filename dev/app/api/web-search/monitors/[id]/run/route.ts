import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { executeWebSearch } from '@/lib/web-search/web-search-service'
import { checkWebSearchQuota } from '@/lib/web-search/quota-service'

// POST /api/web-search/monitors/:id/run - Run monitor now
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Verify ownership
    const monitor = await prisma.webSearchMonitor.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      )
    }

    // Check quota before running
    const quotaCheck = await checkWebSearchQuota(user.id, user.subscriptionTier, 'quick')
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason || 'Search quota exceeded' },
        { status: 403 }
      )
    }

    // Execute the search
    const result = await executeWebSearch({
      userId: user.id,
      queryText: monitor.queryText,
      searchMode: 'quick',
      sources: monitor.sources,
      projectId: monitor.projectId || undefined,
    })

    // Get existing result URLs for deduplication
    const existingResults = await prisma.webSearchResult.findMany({
      where: {
        query: {
          userId: user.id,
        },
        sourceUrl: {
          in: result.results.map(r => r.sourceUrl),
        },
      },
      select: { sourceUrl: true },
    })

    const existingUrls = new Set(existingResults.map(r => r.sourceUrl))
    const newResults = result.results.filter(r => !existingUrls.has(r.sourceUrl))

    // Calculate next run time
    const now = new Date()
    const nextRunAt = new Date(now)
    
    switch (monitor.frequency) {
      case 'daily':
        nextRunAt.setDate(nextRunAt.getDate() + 1)
        nextRunAt.setHours(6, 0, 0, 0)
        break
      case 'weekly':
        nextRunAt.setDate(nextRunAt.getDate() + 7)
        nextRunAt.setHours(6, 0, 0, 0)
        break
      case 'realtime':
        nextRunAt.setMinutes(nextRunAt.getMinutes() + 15)
        break
    }

    // Update monitor stats
    await prisma.webSearchMonitor.update({
      where: { id },
      data: {
        lastRunAt: now,
        nextRunAt,
        totalResults: { increment: result.resultCount },
        newResults: newResults.length,
      },
    })

    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      totalResults: result.resultCount,
      newResults: newResults.length,
      nextRunAt,
    })
  } catch (error) {
    console.error('Run monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to run monitor' },
      { status: 500 }
    )
  }
}
