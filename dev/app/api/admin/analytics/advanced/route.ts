import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  const adminCheck = await isAdmin()
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // User Metrics - DAU/MAU
    const dailyActiveUsers = await prisma.toolRun.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: {
        userId: true,
      },
    })

    const monthlyActiveUsers = await prisma.toolRun.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        userId: true,
      },
    })

    // User Growth Over Time
    const userGrowth = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `

    // Engagement Metrics
    const engagementData = await prisma.toolRun.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    })

    const avgRunsPerUser = 
      engagementData.length > 0
        ? engagementData.reduce((sum, u) => sum + u._count.id, 0) / engagementData.length
        : 0

    // Conversion Metrics (free → paid)
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({
      where: {
        subscription_tier: {
          in: ['starter', 'pro', 'advanced'],
        },
      },
    })
    const freeUsers = totalUsers - paidUsers
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0

    // Revenue Metrics
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'completed',
        created_at: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        created_at: true,
        user: {
          select: {
            subscription_tier: true,
          },
        },
      },
    })

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const mrr = totalRevenue / (days / 30) // Normalize to monthly
    const arr = mrr * 12
    const arpu = paidUsers > 0 ? totalRevenue / paidUsers : 0

    // Revenue by Tier
    const revenueByTier: Record<string, number> = {}
    transactions.forEach((t) => {
      const tier = t.user.subscription_tier || 'free'
      revenueByTier[tier] = (revenueByTier[tier] || 0) + t.amount
    })

    // Tool Usage Distribution
    const toolUsage = await prisma.toolRun.groupBy({
      by: ['tool_slug'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Daily Revenue Trend
    const dailyRevenue = await prisma.$queryRaw<
      Array<{ date: string; amount: number }>
    >`
      SELECT DATE(created_at) as date, SUM(amount)::float as amount
      FROM "Transaction"
      WHERE status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `

    // Churn Rate (simplified - users who canceled in period)
    const canceledSubscriptions = await prisma.transaction.count({
      where: {
        status: 'refunded',
        created_at: {
          gte: startDate,
        },
      },
    })
    const churnRate = paidUsers > 0 ? (canceledSubscriptions / paidUsers) * 100 : 0

    // System Health Metrics
    const totalToolRuns = await prisma.toolRun.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const failedRuns = await prisma.toolRun.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'failed',
      },
    })

    const errorRate = totalToolRuns > 0 ? (failedRuns / totalToolRuns) * 100 : 0

    // Response time (avg tokens / 100 as proxy for response time in ms)
    const avgResponseTime = await prisma.toolRun.aggregate({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _avg: {
        tokensUsed: true,
      },
    })

    return NextResponse.json({
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days,
      },
      userMetrics: {
        dau: dailyActiveUsers.length,
        mau: monthlyActiveUsers.length,
        totalUsers,
        freeUsers,
        paidUsers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        userGrowth: userGrowth.map((row) => ({
          date: row.date,
          count: Number(row.count),
        })),
      },
      engagementMetrics: {
        totalRuns: totalToolRuns,
        avgRunsPerUser: Math.round(avgRunsPerUser * 100) / 100,
        activeUsers: engagementData.length,
        toolUsage: toolUsage.map((t) => ({
          tool: t.tool_slug,
          runs: t._count.id,
        })),
      },
      revenueMetrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        arpu: Math.round(arpu * 100) / 100,
        revenueByTier: Object.entries(revenueByTier).map(([tier, amount]) => ({
          tier,
          amount: Math.round(amount * 100) / 100,
        })),
        dailyRevenue: dailyRevenue.map((row) => ({
          date: row.date,
          amount: Math.round(row.amount * 100) / 100,
        })),
      },
      technicalMetrics: {
        totalRuns: totalToolRuns,
        failedRuns,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round((avgResponseTime._avg.tokensUsed || 0) / 10), // Proxy metric
        uptime: 100 - errorRate, // Simplified uptime calculation
      },
    })
  } catch (error) {
    console.error('Error fetching advanced analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
