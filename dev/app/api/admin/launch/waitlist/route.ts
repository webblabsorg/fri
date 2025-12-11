import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
})

// GET - List waitlist entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.waitlistEntry.count({ where }),
    ])

    // Get stats
    const stats = await prisma.waitlistEntry.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        pending: statsMap.pending || 0,
        invited: statsMap.invited || 0,
        converted: statsMap.converted || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}

// POST - Add to waitlist (public endpoint for signup forms)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = waitlistSchema.parse(body)

    // Check if already exists
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already on waitlist',
        entry: existing,
      })
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        email: validated.email,
        name: validated.name,
        source: validated.source || 'website',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Added to waitlist',
      entry,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error adding to waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    )
  }
}

// PATCH - Update waitlist entry status (invite or convert)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, ids } = body

    // Bulk update
    if (ids && Array.isArray(ids)) {
      await prisma.waitlistEntry.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          invitedAt: status === 'invited' ? new Date() : undefined,
        },
      })

      return NextResponse.json({
        success: true,
        updated: ids.length,
      })
    }

    // Single update
    if (id) {
      const entry = await prisma.waitlistEntry.update({
        where: { id },
        data: {
          status,
          invitedAt: status === 'invited' ? new Date() : undefined,
        },
      })

      return NextResponse.json({
        success: true,
        entry,
      })
    }

    return NextResponse.json({ error: 'Missing id or ids' }, { status: 400 })
  } catch (error) {
    console.error('Error updating waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to update waitlist' },
      { status: 500 }
    )
  }
}
