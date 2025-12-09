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

    const user = await getSessionUser(sessionToken)
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch metrics in parallel for better performance
    const [
      totalUsers,
      activeSubscriptions,
      toolRunsToday,
      userGrowthData,
      recentUsers,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active subscriptions (paid tiers)
      prisma.user.count({
        where: {
          subscriptionTier: {
            in: ['starter', 'pro', 'advanced'],
          },
          subscriptionStatus: 'active',
        },
      }),

      // Tool runs today
      prisma.toolRun.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // User growth (last 30 days)
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          subscriptionTier: true,
        },
      }),
    ])

    // Calculate monthly revenue (mock calculation - in production, integrate with Stripe)
    const monthlyRevenue = activeSubscriptions * 1999 // Average $19.99/month

    // Format user growth data
    const userGrowth = userGrowthData.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count,
    }))

    // Format recent activity
    const recentActivity = recentUsers.map((user) => ({
      id: user.id,
      type: 'new_user',
      description: `${user.name} signed up (${user.subscriptionTier})`,
      timestamp: user.createdAt.toISOString(),
    }))

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue,
      toolRunsToday,
      userGrowth,
      recentActivity,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
