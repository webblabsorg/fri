import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

/**
 * Public Launch Metrics API
 * Tracks key metrics for launch week and post-launch analysis
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    const now = new Date()
    let startDate: Date

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // ============================================================================
    // USER METRICS
    // ============================================================================

    const [
      totalUsers,
      newUsers,
      activeUsers,
      freeUsers,
      paidUsers,
      day7Retention,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: startDate } } }),
      prisma.user.count({ where: { subscriptionTier: 'free' } }),
      prisma.user.count({ where: { subscriptionTier: { not: 'free' } } }),
      calculateDay7Retention(startDate),
    ])

    const conversionRate = totalUsers > 0 
      ? ((paidUsers / totalUsers) * 100).toFixed(2) 
      : '0'

    // ============================================================================
    // TOOL USAGE METRICS
    // ============================================================================

    const [
      totalToolRuns,
      completedToolRuns,
      failedToolRuns,
      uniqueToolUsers,
    ] = await Promise.all([
      prisma.toolRun.count({ where: { createdAt: { gte: startDate } } }),
      prisma.toolRun.count({ where: { createdAt: { gte: startDate }, status: 'completed' } }),
      prisma.toolRun.count({ where: { createdAt: { gte: startDate }, status: 'failed' } }),
      prisma.toolRun.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
      }).then(groups => groups.length),
    ])

    const errorRate = totalToolRuns > 0 
      ? ((failedToolRuns / totalToolRuns) * 100).toFixed(2) 
      : '0'

    const toolRunsPerUser = uniqueToolUsers > 0 
      ? (totalToolRuns / uniqueToolUsers).toFixed(1) 
      : '0'

    // ============================================================================
    // REVENUE METRICS
    // ============================================================================

    const [
      totalTransactions,
      successfulTransactions,
      totalRevenue,
    ] = await Promise.all([
      prisma.transaction.count({ where: { createdAt: { gte: startDate } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startDate }, status: 'completed' } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startDate }, status: 'completed' },
        _sum: { amount: true },
      }),
    ])

    // ============================================================================
    // SUPPORT METRICS
    // ============================================================================

    const [
      totalTickets,
      openTickets,
      avgResponseTime,
      slaWithin4h,
    ] = await Promise.all([
      prisma.supportTicket.count({ where: { createdAt: { gte: startDate } } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      calculateAvgResponseTime(startDate),
      calculateSLAWithin4h(startDate),
    ])

    // ============================================================================
    // DAILY ACTIVITY (for charts)
    // ============================================================================

    const dailyActivity = await getDailyActivity(startDate)

    // ============================================================================
    // LAUNCH TARGETS
    // ============================================================================

    const targets = {
      signups: { target: 500, current: newUsers, met: newUsers >= 500 },
      conversionRate: { target: 2, current: parseFloat(conversionRate), met: parseFloat(conversionRate) >= 2 },
      toolRunsPerUser: { target: 5, current: parseFloat(toolRunsPerUser), met: parseFloat(toolRunsPerUser) >= 5 },
      errorRate: { target: 1, current: parseFloat(errorRate), met: parseFloat(errorRate) <= 1 },
      day7Retention: { target: 40, current: day7Retention, met: day7Retention >= 40 },
    }

    const targetsMetCount = Object.values(targets).filter(t => t.met).length
    const launchSuccess = targetsMetCount >= 4 // At least 4 of 5 targets met

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        free: freeUsers,
        paid: paidUsers,
        conversionRate: `${conversionRate}%`,
        day7Retention: `${day7Retention.toFixed(1)}%`,
      },
      toolUsage: {
        total: totalToolRuns,
        completed: completedToolRuns,
        failed: failedToolRuns,
        uniqueUsers: uniqueToolUsers,
        errorRate: `${errorRate}%`,
        runsPerUser: toolRunsPerUser,
      },
      revenue: {
        transactions: totalTransactions,
        successful: successfulTransactions,
        total: totalRevenue._sum.amount || 0,
        currency: 'USD',
      },
      support: {
        totalTickets,
        openTickets,
        avgResponseTime: avgResponseTime ? `${avgResponseTime.toFixed(1)} hours` : 'N/A',
        slaWithin4h: slaWithin4h !== null ? `${slaWithin4h.toFixed(1)}%` : 'N/A',
      },
      dailyActivity,
      targets,
      launchSuccess,
      targetsMetCount,
    })
  } catch (error) {
    console.error('Error fetching launch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launch metrics' },
      { status: 500 }
    )
  }
}

// POST - Record daily metrics snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Calculate metrics for yesterday
    const [signups, toolRuns, activeUsers, conversions, revenue, errorRate] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.toolRun.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.user.count({
        where: {
          subscriptionTier: { not: 'free' },
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      calculateDailyErrorRate(yesterday, today),
    ])

    // Upsert the metric
    const metric = await prisma.launchMetric.upsert({
      where: { date: yesterday },
      update: {
        signups,
        toolRuns,
        activeUsers,
        conversions,
        revenue: revenue._sum.amount || 0,
        errorRate,
      },
      create: {
        date: yesterday,
        signups,
        toolRuns,
        activeUsers,
        conversions,
        revenue: revenue._sum.amount || 0,
        errorRate,
      },
    })

    return NextResponse.json({
      success: true,
      metric,
    })
  } catch (error) {
    console.error('Error recording launch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to record launch metrics' },
      { status: 500 }
    )
  }
}

// Helper functions
async function calculateDay7Retention(startDate: Date): Promise<number> {
  try {
    // Users who signed up 7+ days ago
    const sevenDaysAgo = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000)

    const cohort = await prisma.user.count({
      where: {
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    })

    if (cohort === 0) return 0

    // Of those, how many logged in within the last 7 days
    const retained = await prisma.user.count({
      where: {
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        lastLoginAt: { gte: sevenDaysAgo },
      },
    })

    return (retained / cohort) * 100
  } catch {
    return 0
  }
}

async function calculateAvgResponseTime(startDate: Date): Promise<number | null> {
  try {
    // Get tickets with their first staff message (as proxy for first response)
    const tickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['resolved', 'closed', 'in_progress'] },
      },
      include: {
        messages: {
          where: { senderType: 'admin' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    // Filter to tickets that have a staff response
    const ticketsWithResponse = tickets.filter(t => t.messages.length > 0)
    
    if (ticketsWithResponse.length === 0) return null

    const totalHours = ticketsWithResponse.reduce((sum, ticket) => {
      const firstResponse = ticket.messages[0]
      const diff = firstResponse.createdAt.getTime() - ticket.createdAt.getTime()
      return sum + diff / (1000 * 60 * 60)
    }, 0)

    return totalHours / ticketsWithResponse.length
  } catch {
    return null
  }
}

async function calculateSLAWithin4h(startDate: Date): Promise<number | null> {
  try {
    // Get tickets with their first staff message
    const tickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        messages: {
          where: { senderType: 'admin' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    // Filter to tickets that have a staff response
    const ticketsWithResponse = tickets.filter(t => t.messages.length > 0)
    
    if (ticketsWithResponse.length === 0) return null

    // Count tickets responded to within 4 hours
    const within4h = ticketsWithResponse.filter(ticket => {
      const firstResponse = ticket.messages[0]
      const diffHours = (firstResponse.createdAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
      return diffHours <= 4
    }).length

    return (within4h / ticketsWithResponse.length) * 100
  } catch {
    return null
  }
}

async function getDailyActivity(startDate: Date): Promise<Array<{
  date: string
  signups: number
  toolRuns: number
  activeUsers: number
}>> {
  try {
    // Try to get from LaunchMetric table first
    const metrics = await prisma.launchMetric.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    })

    if (metrics.length > 0) {
      return metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        signups: m.signups,
        toolRuns: m.toolRuns,
        activeUsers: m.activeUsers,
      }))
    }

    // Fallback: calculate from raw data (slower)
    const days = Math.ceil((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    const activity: Array<{ date: string; signups: number; toolRuns: number; activeUsers: number }> = []

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const [signups, toolRuns, activeUsers] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.toolRun.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: dayStart, lt: dayEnd } } }),
      ])

      activity.push({
        date: dayStart.toISOString().split('T')[0],
        signups,
        toolRuns,
        activeUsers,
      })
    }

    return activity
  } catch {
    return []
  }
}

async function calculateDailyErrorRate(start: Date, end: Date): Promise<number> {
  try {
    const [total, failed] = await Promise.all([
      prisma.toolRun.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.toolRun.count({ where: { createdAt: { gte: start, lt: end }, status: 'failed' } }),
    ])

    return total > 0 ? (failed / total) * 100 : 0
  } catch {
    return 0
  }
}
