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

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all tool runs with cost data
    const toolRuns = await prisma.toolRun.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
        cost: {
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        toolId: true,
        aiModelUsed: true,
        tokensUsed: true,
        cost: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true,
          },
        },
        tool: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Calculate total costs
    const totalCost = toolRuns.reduce((sum, run) => sum + (run.cost || 0), 0)
    const totalTokens = toolRuns.reduce((sum, run) => sum + (run.tokensUsed || 0), 0)

    // Cost by AI model
    const costByModel = toolRuns.reduce((acc: any, run) => {
      const model = run.aiModelUsed
      if (!acc[model]) {
        acc[model] = { cost: 0, tokens: 0, runs: 0 }
      }
      acc[model].cost += run.cost || 0
      acc[model].tokens += run.tokensUsed || 0
      acc[model].runs += 1
      return acc
    }, {})

    // Cost by subscription tier
    const costByTier = toolRuns.reduce((acc: any, run) => {
      const tier = run.user.subscriptionTier
      if (!acc[tier]) {
        acc[tier] = { cost: 0, tokens: 0, runs: 0 }
      }
      acc[tier].cost += run.cost || 0
      acc[tier].tokens += run.tokensUsed || 0
      acc[tier].runs += 1
      return acc
    }, {})

    // Cost by tool
    const costByTool = toolRuns.reduce((acc: any, run) => {
      const toolId = run.toolId
      const toolName = run.tool.name
      if (!acc[toolId]) {
        acc[toolId] = { toolId, toolName, cost: 0, tokens: 0, runs: 0 }
      }
      acc[toolId].cost += run.cost || 0
      acc[toolId].tokens += run.tokensUsed || 0
      acc[toolId].runs += 1
      return acc
    }, {})

    // Top 10 most expensive users
    const costByUser = toolRuns.reduce((acc: any, run) => {
      const userId = run.userId
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: run.user.name,
          userEmail: run.user.email,
          tier: run.user.subscriptionTier,
          cost: 0,
          tokens: 0,
          runs: 0,
        }
      }
      acc[userId].cost += run.cost || 0
      acc[userId].tokens += run.tokensUsed || 0
      acc[userId].runs += 1
      return acc
    }, {})

    const topUsers = Object.values(costByUser)
      .sort((a: any, b: any) => b.cost - a.cost)
      .slice(0, 10)

    // Daily cost breakdown
    const dailyCosts = toolRuns.reduce((acc: any, run) => {
      const date = run.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, cost: 0, tokens: 0, runs: 0 }
      }
      acc[date].cost += run.cost || 0
      acc[date].tokens += run.tokensUsed || 0
      acc[date].runs += 1
      return acc
    }, {})

    const dailyCostsArray = Object.values(dailyCosts).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    )

    // Calculate margin by tier (assuming pricing)
    const tierPricing: any = {
      free: 0,
      starter: 9.99,
      pro: 19.99,
      advanced: 39.99,
    }

    const marginByTier = Object.entries(costByTier).map(([tier, data]: [string, any]) => {
      const revenue = tierPricing[tier] || 0
      const costPerRun = data.cost / data.runs
      return {
        tier,
        revenue,
        cost: data.cost,
        runs: data.runs,
        costPerRun,
        margin: revenue - costPerRun,
        marginPercent: revenue > 0 ? ((revenue - costPerRun) / revenue) * 100 : 0,
      }
    })

    return NextResponse.json({
      summary: {
        totalCost,
        totalTokens,
        totalRuns: toolRuns.length,
        averageCostPerRun: totalCost / toolRuns.length || 0,
        dateRange: {
          from: startDate.toISOString(),
          to: new Date().toISOString(),
          days,
        },
      },
      costByModel: Object.entries(costByModel).map(([model, data]) => ({
        model,
        ...data,
      })),
      costByTier: Object.entries(costByTier).map(([tier, data]) => ({
        tier,
        ...data,
      })),
      costByTool: Object.values(costByTool)
        .sort((a: any, b: any) => b.cost - a.cost)
        .slice(0, 10), // Top 10 most expensive tools
      topUsers,
      dailyCosts: dailyCostsArray,
      marginByTier,
    })
  } catch (error) {
    console.error('Admin AI costs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI cost analytics' },
      { status: 500 }
    )
  }
}
