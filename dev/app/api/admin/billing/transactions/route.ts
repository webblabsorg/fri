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
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (userId) {
      where.userId = userId
    }

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          amount: true,
          currency: true,
          status: true,
          type: true,
          stripePaymentId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])

    // Calculate stats
    const stats = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalCount: stats._count,
      },
    })
  } catch (error) {
    console.error('Admin transactions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
