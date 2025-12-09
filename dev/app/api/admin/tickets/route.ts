import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        where.assignedTo = null
      } else if (assignedTo === 'me') {
        where.assignedTo = adminUser.id
      } else {
        where.assignedTo = assignedTo
      }
    }

    if (category && category !== 'all') {
      where.category = category
    }

    // Fetch tickets
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [
          { status: 'asc' }, // Open tickets first
          { priority: 'desc' }, // High priority first
          { updatedAt: 'desc' }, // Most recent first
        ],
        select: {
          id: true,
          ticketNumber: true,
          userId: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          assignedTo: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    return NextResponse.json({
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin tickets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
