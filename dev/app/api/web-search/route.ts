import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { executeWebSearch } from '@/lib/web-search/web-search-service'
import { checkWebSearchQuota } from '@/lib/web-search/quota-service'
import { prisma } from '@/lib/db'

// Supported sources - only web and news are currently implemented
const SUPPORTED_SOURCES = ['web', 'news']

// POST /api/web-search - Execute a new search
export async function POST(request: NextRequest) {
  try {
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

    // Check subscription tier - web search requires at least starter tier
    const allowedTiers = ['starter', 'pro', 'professional', 'advanced', 'enterprise']
    if (!allowedTiers.includes(user.subscriptionTier.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Legal Web Search requires Starter plan or higher',
          requiredTier: 'starter',
          currentTier: user.subscriptionTier
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      queryText,
      searchMode = 'quick',
      searchType,
      sources = ['web', 'news'],
      dateRangeStart,
      dateRangeEnd,
      jurisdiction,
      projectId,
    } = body

    if (!queryText || queryText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query text is required' },
        { status: 400 }
      )
    }

    // Validate search mode
    const validModes = ['quick', 'deep', 'targeted', 'monitor']
    if (!validModes.includes(searchMode)) {
      return NextResponse.json(
        { error: 'Invalid search mode' },
        { status: 400 }
      )
    }

    // Filter to only supported sources
    const validSources = sources.filter((s: string) => SUPPORTED_SOURCES.includes(s))
    if (validSources.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid source is required (web or news)' },
        { status: 400 }
      )
    }

    // Check quota before executing search
    const quotaCheck = await checkWebSearchQuota(user.id, user.subscriptionTier, searchMode)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.reason || 'Search quota exceeded',
          usage: quotaCheck.usage,
          limits: quotaCheck.limits,
        },
        { status: 403 }
      )
    }

    // Check if Bing API key is configured (production requirement)
    if (!process.env.BING_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Search service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Execute the search
    const result = await executeWebSearch({
      userId: user.id,
      queryText: queryText.trim(),
      searchMode,
      searchType,
      sources: validSources,
      dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : undefined,
      dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : undefined,
      jurisdiction,
      projectId,
    })

    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      resultCount: result.resultCount,
      results: result.results,
    })
  } catch (error) {
    console.error('[WebSearch] Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

// GET /api/web-search - List past queries
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const projectId = searchParams.get('projectId')

    const where: any = { userId: user.id }
    if (projectId) {
      where.projectId = projectId
    }

    const [queries, total] = await Promise.all([
      prisma.webSearchQuery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { results: true },
          },
        },
      }),
      prisma.webSearchQuery.count({ where }),
    ])

    return NextResponse.json({
      queries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List queries error:', error)
    return NextResponse.json(
      { error: 'Failed to list queries' },
      { status: 500 }
    )
  }
}
