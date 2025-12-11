/**
 * Metrics Instrumentation Library
 * Tracks Phase 11 business metrics and usage analytics
 */

import { prisma } from '@/lib/db'

// ============================================================================
// Types
// ============================================================================

export interface MetricEvent {
  name: string
  value?: number
  tags?: Record<string, string>
  timestamp?: Date
}

export interface BusinessMetrics {
  dailyActiveUsers: number
  monthlyActiveUsers: number
  toolRunsToday: number
  toolRunsThisMonth: number
  averageToolRunTime: number
  successRate: number
  revenueThisMonth: number
  newUsersThisMonth: number
  churnRate: number
  nps: number
}

// ============================================================================
// Metric Recording
// ============================================================================

/**
 * Record a metric event
 */
export async function recordMetric(event: MetricEvent): Promise<void> {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${event.name}`, event.value, event.tags)
    }

    // Send to external analytics if configured
    if (process.env.ANALYTICS_ENDPOINT) {
      await fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
        },
        body: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date(),
          environment: process.env.NODE_ENV,
        }),
      }).catch(console.error)
    }
  } catch (error) {
    console.error('Metric recording error:', error)
  }
}

/**
 * Record tool run metrics
 */
export async function recordToolRun(data: {
  toolId: string
  toolName: string
  userId: string
  organizationId?: string
  duration: number
  success: boolean
  tokensUsed?: number
  cost?: number
}): Promise<void> {
  await recordMetric({
    name: 'tool_run',
    value: data.duration,
    tags: {
      tool_id: data.toolId,
      tool_name: data.toolName,
      user_id: data.userId,
      organization_id: data.organizationId || 'personal',
      success: String(data.success),
    },
  })

  // Update usage analytics
  if (data.organizationId) {
    await updateUsageAnalytics(data.organizationId, {
      toolRuns: 1,
      tokensUsed: data.tokensUsed || 0,
      cost: data.cost || 0,
    })
  }
}

/**
 * Record API request metrics
 */
export async function recordAPIRequest(data: {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  userId?: string
  apiKeyId?: string
}): Promise<void> {
  await recordMetric({
    name: 'api_request',
    value: data.duration,
    tags: {
      endpoint: data.endpoint,
      method: data.method,
      status_code: String(data.statusCode),
      user_id: data.userId || 'anonymous',
      api_key_id: data.apiKeyId || 'none',
    },
  })
}

/**
 * Record user activity metrics
 */
export async function recordUserActivity(data: {
  userId: string
  action: string
  page?: string
  feature?: string
}): Promise<void> {
  await recordMetric({
    name: 'user_activity',
    tags: {
      user_id: data.userId,
      action: data.action,
      page: data.page || 'unknown',
      feature: data.feature || 'general',
    },
  })
}

/**
 * Record subscription event
 */
export async function recordSubscriptionEvent(data: {
  userId: string
  organizationId?: string
  event: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed'
  fromPlan?: string
  toPlan: string
  mrr?: number
}): Promise<void> {
  await recordMetric({
    name: 'subscription_event',
    value: data.mrr,
    tags: {
      user_id: data.userId,
      organization_id: data.organizationId || 'personal',
      event: data.event,
      from_plan: data.fromPlan || 'none',
      to_plan: data.toPlan,
    },
  })
}

// ============================================================================
// Usage Analytics
// ============================================================================

/**
 * Update daily usage analytics for an organization
 */
export async function updateUsageAnalytics(
  organizationId: string,
  data: {
    toolRuns?: number
    tokensUsed?: number
    cost?: number
  }
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await prisma.usageAnalytics.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: today,
        },
      },
      update: {
        toolRuns: { increment: data.toolRuns || 0 },
        tokensUsed: { increment: data.tokensUsed || 0 },
        aiCost: { increment: data.cost || 0 },
      },
      create: {
        organizationId,
        date: today,
        toolRuns: data.toolRuns || 0,
        tokensUsed: data.tokensUsed || 0,
        aiCost: data.cost || 0,
      },
    })
  } catch (error) {
    console.error('Usage analytics update error:', error)
  }
}

/**
 * Record active user for the day
 */
export async function recordActiveUser(
  organizationId: string,
  userId: string
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Use a simple approach: increment if this is the first activity today
    // In production, use Redis SET with NX to avoid double-counting
    await prisma.usageAnalytics.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: today,
        },
      },
      update: {
        uniqueUsers: { increment: 1 },
      },
      create: {
        organizationId,
        date: today,
        uniqueUsers: 1,
        toolRuns: 0,
        tokensUsed: 0,
        aiCost: 0,
      },
    })
  } catch (error) {
    console.error('Active user recording error:', error)
  }
}

// ============================================================================
// Business Metrics Queries
// ============================================================================

/**
 * Get business metrics for dashboard
 */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  try {
    // Daily active users
    const dauResult = await prisma.user.count({
      where: {
        lastLoginAt: { gte: today },
      },
    })

    // Monthly active users
    const mauResult = await prisma.user.count({
      where: {
        lastLoginAt: { gte: monthStart },
      },
    })

    // Tool runs today
    const toolRunsToday = await prisma.toolRun.count({
      where: {
        createdAt: { gte: today },
      },
    })

    // Tool runs this month
    const toolRunsMonth = await prisma.toolRun.count({
      where: {
        createdAt: { gte: monthStart },
      },
    })

    // Average tool run time
    const avgRunTime = await prisma.toolRun.aggregate({
      _avg: { runTimeMs: true },
      where: {
        createdAt: { gte: monthStart },
        status: 'completed',
      },
    })

    // Success rate
    const totalRuns = await prisma.toolRun.count({
      where: { createdAt: { gte: monthStart } },
    })
    const successfulRuns = await prisma.toolRun.count({
      where: {
        createdAt: { gte: monthStart },
        status: 'completed',
      },
    })

    // New users this month
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: monthStart },
      },
    })

    return {
      dailyActiveUsers: dauResult,
      monthlyActiveUsers: mauResult,
      toolRunsToday,
      toolRunsThisMonth: toolRunsMonth,
      averageToolRunTime: avgRunTime._avg.runTimeMs || 0,
      successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100,
      revenueThisMonth: 0, // Would come from Stripe
      newUsersThisMonth: newUsers,
      churnRate: 0, // Would require subscription tracking
      nps: 0, // Would require survey data
    }
  } catch (error) {
    console.error('Business metrics error:', error)
    return {
      dailyActiveUsers: 0,
      monthlyActiveUsers: 0,
      toolRunsToday: 0,
      toolRunsThisMonth: 0,
      averageToolRunTime: 0,
      successRate: 100,
      revenueThisMonth: 0,
      newUsersThisMonth: 0,
      churnRate: 0,
      nps: 0,
    }
  }
}

/**
 * Get tool usage breakdown
 */
export async function getToolUsageBreakdown(
  organizationId?: string,
  days: number = 30
): Promise<Array<{ toolId: string; toolName: string; runs: number; avgTime: number }>> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  try {
    const results = await prisma.toolRun.groupBy({
      by: ['toolId'],
      where: {
        createdAt: { gte: since },
        ...(organizationId && {
          user: {
            organizationMembers: {
              some: { organizationId },
            },
          },
        }),
      },
      _count: { id: true },
      _avg: { runTimeMs: true },
    })

    // Get tool names
    const toolIds = results.map(r => r.toolId)
    const tools = await prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { id: true, name: true },
    })

    const toolMap = new Map(tools.map(t => [t.id, t.name]))

    return results.map(r => ({
      toolId: r.toolId,
      toolName: toolMap.get(r.toolId) || 'Unknown',
      runs: r._count.id,
      avgTime: r._avg.runTimeMs || 0,
    }))
  } catch (error) {
    console.error('Tool usage breakdown error:', error)
    return []
  }
}

/**
 * Get usage trend data
 */
export async function getUsageTrend(
  organizationId: string,
  days: number = 30
): Promise<Array<{ date: string; toolRuns: number; uniqueUsers: number; cost: number }>> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  try {
    const analytics = await prisma.usageAnalytics.findMany({
      where: {
        organizationId,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    })

    return analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      toolRuns: a.toolRuns,
      uniqueUsers: a.uniqueUsers,
      cost: a.aiCost,
    }))
  } catch (error) {
    console.error('Usage trend error:', error)
    return []
  }
}
