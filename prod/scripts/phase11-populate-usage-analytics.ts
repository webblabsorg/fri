/**
 * Phase 11: Populate Usage Analytics
 * 
 * This script aggregates daily usage data from ToolRun, User, and Transaction
 * into the UsageAnalytics table for advanced reporting.
 * 
 * Run daily via cron: 0 1 * * * (1 AM daily)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DailyStats {
  toolRuns: number
  uniqueUsers: number
  tokensUsed: number
  aiCost: number
  byCategory: Record<string, number>
  byTool: Record<string, number>
  byUser: Record<string, number>
  avgRunTime: number
  errorRate: number
}

async function populateUsageAnalytics(date?: Date) {
  const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday by default
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  console.log(`Populating usage analytics for ${startOfDay.toISOString().split('T')[0]}`)

  // Get all organizations
  const organizations = await prisma.organization.findMany({
    select: { id: true },
  })

  for (const org of organizations) {
    try {
      const stats = await calculateOrgStats(org.id, startOfDay, endOfDay)
      
      await prisma.usageAnalytics.upsert({
        where: {
          organizationId_date: {
            organizationId: org.id,
            date: startOfDay,
          },
        },
        update: {
          toolRuns: stats.toolRuns,
          uniqueUsers: stats.uniqueUsers,
          tokensUsed: stats.tokensUsed,
          aiCost: stats.aiCost,
          byCategory: stats.byCategory,
          byTool: stats.byTool,
          byUser: stats.byUser,
          avgRunTime: stats.avgRunTime,
          errorRate: stats.errorRate,
        },
        create: {
          organizationId: org.id,
          date: startOfDay,
          toolRuns: stats.toolRuns,
          uniqueUsers: stats.uniqueUsers,
          tokensUsed: stats.tokensUsed,
          aiCost: stats.aiCost,
          byCategory: stats.byCategory,
          byTool: stats.byTool,
          byUser: stats.byUser,
          avgRunTime: stats.avgRunTime,
          errorRate: stats.errorRate,
        },
      })

      console.log(`  ✓ ${org.id}: ${stats.toolRuns} runs, ${stats.uniqueUsers} users`)
    } catch (error) {
      console.error(`  ✗ Error for org ${org.id}:`, error)
    }
  }

  console.log('Usage analytics population complete')
}

async function calculateOrgStats(
  organizationId: string,
  startOfDay: Date,
  endOfDay: Date
): Promise<DailyStats> {
  // Get tool runs for the organization
  const toolRuns = await prisma.toolRun.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      user: {
        organizationMembers: {
          some: { organizationId },
        },
      },
    },
    include: {
      tool: {
        select: { name: true, category: true },
      },
    },
  })

  // Calculate stats
  const uniqueUserIds = new Set(toolRuns.map(r => r.userId))
  const byCategory: Record<string, number> = {}
  const byTool: Record<string, number> = {}
  const byUser: Record<string, number> = {}
  let totalTokens = 0
  let totalCost = 0
  let totalRunTime = 0
  let errorCount = 0

  for (const run of toolRuns) {
    // By category
    const category = run.tool?.category || 'uncategorized'
    byCategory[category] = (byCategory[category] || 0) + 1

    // By tool
    const toolName = run.tool?.name || 'unknown'
    byTool[toolName] = (byTool[toolName] || 0) + 1

    // By user
    byUser[run.userId] = (byUser[run.userId] || 0) + 1

    // Tokens and cost (from metadata if available)
    const metadata = run.metadata as Record<string, unknown> | null
    if (metadata) {
      totalTokens += (metadata.tokensUsed as number) || 0
      totalCost += (metadata.aiCost as number) || 0
    }

    // Run time
    if (run.completedAt && run.createdAt) {
      totalRunTime += new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime()
    }

    // Errors
    if (run.status === 'failed') {
      errorCount++
    }
  }

  const avgRunTime = toolRuns.length > 0 ? totalRunTime / toolRuns.length : 0
  const errorRate = toolRuns.length > 0 ? errorCount / toolRuns.length : 0

  return {
    toolRuns: toolRuns.length,
    uniqueUsers: uniqueUserIds.size,
    tokensUsed: totalTokens,
    aiCost: totalCost,
    byCategory,
    byTool,
    byUser,
    avgRunTime,
    errorRate,
  }
}

// Run if called directly
const args = process.argv.slice(2)
const dateArg = args.find(a => a.startsWith('--date='))
const targetDate = dateArg ? new Date(dateArg.split('=')[1]) : undefined

populateUsageAnalytics(targetDate)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
