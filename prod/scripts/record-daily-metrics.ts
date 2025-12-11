/**
 * Record Daily Launch Metrics
 * 
 * This script records daily metrics snapshots for launch tracking.
 * Should be run daily via cron job during launch week.
 * 
 * Run with: npx ts-node prod/scripts/record-daily-metrics.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recordDailyMetrics() {
  console.log('📊 Recording Daily Launch Metrics')
  console.log('==================================')
  console.log('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  console.log(`📅 Recording metrics for: ${yesterday.toISOString().split('T')[0]}`)

  try {
    // Calculate metrics for yesterday
    const [signups, toolRuns, activeUsers, conversions, revenueResult, totalRuns, failedRuns] = await Promise.all([
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
      prisma.toolRun.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.toolRun.count({
        where: { createdAt: { gte: yesterday, lt: today }, status: 'failed' },
      }),
    ])

    const revenue = revenueResult._sum.amount || 0
    const errorRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0

    // Calculate average response time
    const tickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: yesterday, lt: today },
        firstResponseAt: { not: null },
      },
      select: {
        createdAt: true,
        firstResponseAt: true,
      },
    })

    let avgResponseTime = 0
    if (tickets.length > 0) {
      const totalHours = tickets.reduce((sum, ticket) => {
        const diff = ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime()
        return sum + diff / (1000 * 60 * 60)
      }, 0)
      avgResponseTime = totalHours / tickets.length
    }

    // Upsert the metric
    const metric = await prisma.launchMetric.upsert({
      where: { date: yesterday },
      update: {
        signups,
        toolRuns,
        activeUsers,
        conversions,
        revenue,
        errorRate,
        avgResponseTime,
      },
      create: {
        date: yesterday,
        signups,
        toolRuns,
        activeUsers,
        conversions,
        revenue,
        errorRate,
        avgResponseTime,
      },
    })

    console.log('')
    console.log('📈 Metrics Recorded:')
    console.log(`   Signups: ${signups}`)
    console.log(`   Tool Runs: ${toolRuns}`)
    console.log(`   Active Users: ${activeUsers}`)
    console.log(`   Conversions: ${conversions}`)
    console.log(`   Revenue: $${revenue.toFixed(2)}`)
    console.log(`   Error Rate: ${errorRate.toFixed(2)}%`)
    console.log(`   Avg Response Time: ${avgResponseTime.toFixed(1)} hours`)
    console.log('')
    console.log(`✓ Metric ID: ${metric.id}`)

  } catch (error) {
    console.error('Error recording metrics:', error)
    process.exit(1)
  }

  await prisma.$disconnect()
}

recordDailyMetrics().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
