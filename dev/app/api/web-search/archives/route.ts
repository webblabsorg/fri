import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/web-search/archives - List user's archives with pagination
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

    const [archives, total] = await Promise.all([
      prisma.webSearchArchive.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          originalUrl: true,
          contentHash: true,
          captureMethod: true,
          createdAt: true,
          resultId: true,
        },
      }),
      prisma.webSearchArchive.count({
        where: { userId: user.id },
      }),
    ])

    return NextResponse.json({
      archives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List archives error:', error)
    return NextResponse.json(
      { error: 'Failed to list archives' },
      { status: 500 }
    )
  }
}
