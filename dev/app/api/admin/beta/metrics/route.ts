import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'

// GET - Get beta launch metrics
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    const metrics = await getBetaMetrics(period)

    return NextResponse.json({
      metrics,
      period,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Beta metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

async function getBetaMetrics(period: string) {
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

  // User Metrics - now tracking beta users specifically
  const [
    totalUsers,
    totalBetaUsers,
    newUsers,
    activeUsers,
    onboardedUsers,
    earlyAdopters,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBetaUser: true } }),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: startDate } } }),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.user.count({ where: { earlyAdopter: true } }),
  ])

  // Tool Usage Metrics
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

  // Support Metrics
  const [
    totalTickets,
    openTickets,
    avgResponseTime,
    slaWithin4h,
  ] = await Promise.all([
    prisma.supportTicket.count({ where: { createdAt: { gte: startDate } } }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    getAverageResponseTime(startDate),
    getSLAWithin4h(startDate),
  ])

  // Feedback Metrics
  const [
    totalFeedback,
    feedbackByType,
    avgRating,
    surveyResponses,
  ] = await Promise.all([
    prisma.feedback.count({ where: { createdAt: { gte: startDate } } }),
    prisma.feedback.groupBy({
      by: ['type'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.feedback.aggregate({
      where: { createdAt: { gte: startDate }, rating: { not: null } },
      _avg: { rating: true },
    }),
    prisma.feedback.count({
      where: { createdAt: { gte: startDate }, type: 'survey' },
    }),
  ])

  // Payment Metrics
  const [
    totalTransactions,
    failedTransactions,
  ] = await Promise.all([
    prisma.transaction.count({ where: { createdAt: { gte: startDate } } }),
    prisma.transaction.count({ where: { createdAt: { gte: startDate }, status: 'failed' } }),
  ])

  const failedPaymentRate = totalTransactions > 0
    ? ((failedTransactions / totalTransactions) * 100).toFixed(2)
    : '0.00'

  // Error Rate
  const errorRate = totalToolRuns > 0 
    ? ((failedToolRuns / totalToolRuns) * 100).toFixed(2) 
    : '0.00'

  // Daily Activity (for charts)
  const dailyActivity = await getDailyActivity(startDate)

  // Top Tools
  const topTools = await prisma.toolRun.groupBy({
    by: ['toolId'],
    where: { createdAt: { gte: startDate }, status: 'completed' },
    _count: true,
    orderBy: { _count: { toolId: 'desc' } },
    take: 10,
  })

  // Get tool names
  const toolIds = topTools.map(t => t.toolId)
  const tools = await prisma.tool.findMany({
    where: { id: { in: toolIds } },
    select: { id: true, name: true, slug: true },
  })

  const topToolsWithNames = topTools.map(t => ({
    ...t,
    tool: tools.find(tool => tool.id === t.toolId),
  }))

  return {
    users: {
      total: totalUsers,
      betaUsers: totalBetaUsers,
      earlyAdopters,
      new: newUsers,
      active: activeUsers,
      onboarded: onboardedUsers,
      onboardingRate: totalUsers > 0 ? ((onboardedUsers / totalUsers) * 100).toFixed(1) : '0',
      targetProgress: Math.min((totalBetaUsers / 100) * 100, 100).toFixed(1), // 100 beta users target
    },
    toolUsage: {
      total: totalToolRuns,
      completed: completedToolRuns,
      failed: failedToolRuns,
      uniqueUsers: uniqueToolUsers,
      errorRate: `${errorRate}%`,
      successRate: totalToolRuns > 0 ? `${(100 - parseFloat(errorRate)).toFixed(2)}%` : '100%',
    },
    support: {
      totalTickets,
      openTickets,
      avgResponseTime: avgResponseTime ? `${avgResponseTime.toFixed(1)} hours` : 'N/A',
      slaWithin4h: slaWithin4h !== null ? `${slaWithin4h.toFixed(1)}%` : 'N/A',
    },
    feedback: {
      total: totalFeedback,
      byType: feedbackByType.reduce((acc, item) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
      avgRating: avgRating._avg.rating?.toFixed(1) || 'N/A',
      surveyResponses,
    },
    payments: {
      total: totalTransactions,
      failed: failedTransactions,
      failedRate: `${failedPaymentRate}%`,
    },
    dailyActivity,
    topTools: topToolsWithNames,
    health: {
      status: parseFloat(errorRate) < 1 ? 'healthy' : parseFloat(errorRate) < 5 ? 'warning' : 'critical',
      errorRate: `${errorRate}%`,
      uptime: '99.9%', // Would come from monitoring service
    },
  }
}

async function getAverageResponseTime(startDate: Date): Promise<number | null> {
  // Get tickets with their first response
  const tickets = await prisma.supportTicket.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      messages: {
        where: { senderType: 'admin' },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  const responseTimes = tickets
    .filter(t => t.messages.length > 0)
    .map(t => {
      const ticketCreated = t.createdAt.getTime()
      const firstResponse = t.messages[0].createdAt.getTime()
      return (firstResponse - ticketCreated) / (1000 * 60 * 60) // Hours
    })

  if (responseTimes.length === 0) return null
  return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
}

async function getSLAWithin4h(startDate: Date): Promise<number | null> {
  const tickets = await prisma.supportTicket.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      messages: {
        where: { senderType: 'admin' },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  const responded = tickets.filter(t => t.messages.length > 0)
  if (responded.length === 0) return null

  const within4h = responded.filter(t => {
    const ticketCreated = t.createdAt.getTime()
    const firstResponse = t.messages[0].createdAt.getTime()
    const hours = (firstResponse - ticketCreated) / (1000 * 60 * 60)
    return hours <= 4
  })

  return (within4h.length / responded.length) * 100
}

async function getDailyActivity(startDate: Date) {
  const days: { date: string; signups: number; toolRuns: number; activeUsers: number }[] = []
  const now = new Date()
  const currentDate = new Date(startDate)

  while (currentDate <= now) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const [signups, toolRuns, activeUsers] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.toolRun.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: dayStart, lte: dayEnd } },
      }),
    ])

    days.push({
      date: dayStart.toISOString().split('T')[0],
      signups,
      toolRuns,
      activeUsers,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}
