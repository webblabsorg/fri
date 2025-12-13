import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const clientId = searchParams.get('clientId') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const where: Record<string, unknown> = { organizationId }

    if (clientId) {
      where.clientId = clientId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { matterNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [matters, total] = await Promise.all([
      prisma.matter.findMany({
        where,
        select: {
          id: true,
          matterNumber: true,
          name: true,
          description: true,
          status: true,
          clientId: true,
          client: {
            select: {
              id: true,
              displayName: true,
            },
          },
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.matter.count({ where }),
    ])

    return NextResponse.json({ matters, total })
  } catch (error) {
    console.error('Error fetching matters:', error)
    return NextResponse.json({ error: 'Failed to fetch matters' }, { status: 500 })
  }
}
