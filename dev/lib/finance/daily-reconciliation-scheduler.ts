import { prisma } from '@/lib/db'
import { startReconciliation, autoMatchBankStatement } from './trust-service'

// ============================================================================
// DAILY AUTOMATED RECONCILIATION SCHEDULER
// Automated reconciliation for trust accounts
// ============================================================================

export interface ReconciliationSchedule {
  id: string
  trustAccountId: string
  trustAccountName: string
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  timeOfDay: string // HH:MM format
  isActive: boolean
  lastRunAt?: Date
  nextRunAt: Date
  createdBy: string
}

export interface ReconciliationJob {
  id: string
  scheduleId: string
  trustAccountId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  result?: {
    reconciliationId: string
    isBalanced: boolean
    discrepancy?: number
    matchedTransactions: number
    unmatchedTransactions: number
  }
  error?: string
}

// ============================================================================
// SCHEDULE MANAGEMENT
// ============================================================================

export async function createReconciliationSchedule(
  organizationId: string,
  trustAccountId: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  timeOfDay: string,
  createdBy: string,
  options?: {
    dayOfWeek?: number
    dayOfMonth?: number
  }
): Promise<ReconciliationSchedule> {
  const trustAccount = await prisma.trustAccount.findFirst({
    where: { id: trustAccountId, organizationId, isActive: true },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  const nextRunAt = calculateNextRunTime(frequency, timeOfDay, options?.dayOfWeek, options?.dayOfMonth)

  // Store schedule in audit log (could be a dedicated table in production)
  const scheduleId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  await prisma.trustAuditLog.create({
    data: {
      eventType: 'reconciliation_schedule_created',
      eventData: {
        scheduleId,
        trustAccountId,
        frequency,
        timeOfDay,
        dayOfWeek: options?.dayOfWeek,
        dayOfMonth: options?.dayOfMonth,
        nextRunAt: nextRunAt.toISOString(),
        isActive: true,
      },
      userId: createdBy,
    },
  })

  return {
    id: scheduleId,
    trustAccountId,
    trustAccountName: trustAccount.accountName,
    frequency,
    dayOfWeek: options?.dayOfWeek,
    dayOfMonth: options?.dayOfMonth,
    timeOfDay,
    isActive: true,
    nextRunAt,
    createdBy,
  }
}

function calculateNextRunTime(
  frequency: 'daily' | 'weekly' | 'monthly',
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const now = new Date()
  const next = new Date()

  next.setHours(hours, minutes, 0, 0)

  if (frequency === 'daily') {
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
  } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
    const currentDay = now.getDay()
    let daysUntil = dayOfWeek - currentDay
    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
      daysUntil += 7
    }
    next.setDate(next.getDate() + daysUntil)
  } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
    }
  }

  return next
}

export async function getReconciliationSchedules(
  organizationId: string
): Promise<ReconciliationSchedule[]> {
  const trustAccounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
  })

  const accountIds = trustAccounts.map((a) => a.id)
  const accountMap = new Map(trustAccounts.map((a) => [a.id, a.accountName]))

  // Get schedules from audit logs
  const scheduleLogs = await prisma.trustAuditLog.findMany({
    where: {
      eventType: 'reconciliation_schedule_created',
    },
    orderBy: { createdAt: 'desc' },
  })

  const schedules: ReconciliationSchedule[] = []
  const seenSchedules = new Set<string>()

  for (const log of scheduleLogs) {
    const data = log.eventData as {
      scheduleId: string
      trustAccountId: string
      frequency: 'daily' | 'weekly' | 'monthly'
      timeOfDay: string
      dayOfWeek?: number
      dayOfMonth?: number
      nextRunAt: string
      isActive: boolean
    }

    if (!accountIds.includes(data.trustAccountId)) continue
    if (seenSchedules.has(data.scheduleId)) continue

    seenSchedules.add(data.scheduleId)

    // Check if schedule was deactivated
    const deactivation = await prisma.trustAuditLog.findFirst({
      where: {
        eventType: 'reconciliation_schedule_deactivated',
        eventData: { path: ['scheduleId'], equals: data.scheduleId },
      },
    })

    if (deactivation) continue

    // Get last run
    const lastRun = await prisma.trustAuditLog.findFirst({
      where: {
        eventType: 'reconciliation_job_completed',
        eventData: { path: ['scheduleId'], equals: data.scheduleId },
      },
      orderBy: { createdAt: 'desc' },
    })

    schedules.push({
      id: data.scheduleId,
      trustAccountId: data.trustAccountId,
      trustAccountName: accountMap.get(data.trustAccountId) || 'Unknown',
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      timeOfDay: data.timeOfDay,
      isActive: true,
      lastRunAt: lastRun?.createdAt,
      nextRunAt: calculateNextRunTime(data.frequency, data.timeOfDay, data.dayOfWeek, data.dayOfMonth),
      createdBy: log.userId,
    })
  }

  return schedules
}

export async function deactivateReconciliationSchedule(
  scheduleId: string,
  deactivatedBy: string
): Promise<void> {
  await prisma.trustAuditLog.create({
    data: {
      eventType: 'reconciliation_schedule_deactivated',
      eventData: { scheduleId, deactivatedAt: new Date().toISOString() },
      userId: deactivatedBy,
    },
  })
}

// ============================================================================
// AUTOMATED RECONCILIATION EXECUTION
// ============================================================================

export async function runAutomatedReconciliation(
  organizationId: string,
  trustAccountId: string,
  scheduleId: string,
  runBy: string
): Promise<ReconciliationJob> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const startedAt = new Date()

  // Log job start
  await prisma.trustAuditLog.create({
    data: {
      eventType: 'reconciliation_job_started',
      eventData: { jobId, scheduleId, trustAccountId, startedAt: startedAt.toISOString() },
      userId: runBy,
    },
  })

  try {
    const trustAccount = await prisma.trustAccount.findFirst({
      where: { id: trustAccountId, organizationId, isActive: true },
      include: {
        clientLedgers: true,
        transactions: {
          where: { voidedAt: null },
          orderBy: { transactionDate: 'desc' },
          take: 500,
        },
      },
    })

    if (!trustAccount) {
      throw new Error('Trust account not found')
    }

    // Get the most recent bank statement
    const latestStatement = await prisma.bankStatement.findFirst({
      where: { trustAccountId },
      orderBy: { statementDate: 'desc' },
      include: { transactions: true },
    })

    // Calculate current balances
    const trustLedgerBalance = Number(trustAccount.currentBalance)
    const clientLedgersTotal = trustAccount.clientLedgers.reduce(
      (sum, l) => sum + Number(l.balance),
      0
    )

    // Use bank statement balance or estimate from transactions
    const bankBalance = latestStatement
      ? Number(latestStatement.closingBalance)
      : trustLedgerBalance

    // Calculate outstanding items
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = trustAccount.transactions.filter(
      (t) => new Date(t.transactionDate) >= thirtyDaysAgo
    )

    const outstandingDeposits = recentTransactions
      .filter((t) => !t.isCleared && ['deposit', 'interest'].includes(t.transactionType))
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const outstandingChecks = recentTransactions
      .filter((t) => !t.isCleared && ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType))
      .reduce((sum, t) => sum + Number(t.amount), 0)

    // Create reconciliation
    const reconciliation = await startReconciliation({
      trustAccountId,
      periodStart: thirtyDaysAgo,
      periodEnd: new Date(),
      bankBalance,
      reconciledBy: runBy,
    })

    // Auto-match if we have a bank statement
    let matchedCount = 0
    let unmatchedCount = 0

    if (latestStatement) {
      const matchResult = await autoMatchBankStatement(latestStatement.id)
      matchedCount = matchResult.matchedCount
      unmatchedCount = matchResult.totalCount - matchResult.matchedCount
    }

    const completedAt = new Date()

    const result = {
      reconciliationId: reconciliation.id,
      isBalanced: reconciliation.isBalanced,
      discrepancy: reconciliation.discrepancy ? Number(reconciliation.discrepancy) : undefined,
      matchedTransactions: matchedCount,
      unmatchedTransactions: unmatchedCount,
    }

    // Log job completion
    await prisma.trustAuditLog.create({
      data: {
        eventType: 'reconciliation_job_completed',
        eventData: {
          jobId,
          scheduleId,
          trustAccountId,
          completedAt: completedAt.toISOString(),
          result,
        },
        userId: runBy,
      },
    })

    return {
      id: jobId,
      scheduleId,
      trustAccountId,
      status: 'completed',
      startedAt,
      completedAt,
      result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log job failure
    await prisma.trustAuditLog.create({
      data: {
        eventType: 'reconciliation_job_failed',
        eventData: {
          jobId,
          scheduleId,
          trustAccountId,
          error: errorMessage,
        },
        userId: runBy,
      },
    })

    return {
      id: jobId,
      scheduleId,
      trustAccountId,
      status: 'failed',
      startedAt,
      error: errorMessage,
    }
  }
}

// ============================================================================
// SCHEDULED JOB PROCESSOR
// This would be called by a cron job or scheduler service
// ============================================================================

export async function processDueReconciliations(
  systemUserId: string = 'system'
): Promise<ReconciliationJob[]> {
  const now = new Date()
  const jobs: ReconciliationJob[] = []

  // Get all organizations with trust accounts
  const organizations = await prisma.organization.findMany({
    where: {
      trustAccounts: { some: { isActive: true } },
    },
  })

  for (const org of organizations) {
    const schedules = await getReconciliationSchedules(org.id)

    for (const schedule of schedules) {
      if (!schedule.isActive) continue
      if (schedule.nextRunAt > now) continue

      // Check if already run today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (schedule.lastRunAt && schedule.lastRunAt >= today) {
        continue // Already run today
      }

      const job = await runAutomatedReconciliation(
        org.id,
        schedule.trustAccountId,
        schedule.id,
        systemUserId
      )

      jobs.push(job)
    }
  }

  return jobs
}

// ============================================================================
// RECONCILIATION JOB HISTORY
// ============================================================================

export async function getReconciliationJobHistory(
  organizationId: string,
  options?: {
    trustAccountId?: string
    scheduleId?: string
    status?: 'completed' | 'failed'
    limit?: number
  }
): Promise<ReconciliationJob[]> {
  const trustAccounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
  })

  const accountIds = new Set(trustAccounts.map((a) => a.id))

  const eventTypes = ['reconciliation_job_completed', 'reconciliation_job_failed']
  if (options?.status === 'completed') {
    eventTypes.splice(1, 1)
  } else if (options?.status === 'failed') {
    eventTypes.splice(0, 1)
  }

  const logs = await prisma.trustAuditLog.findMany({
    where: {
      eventType: { in: eventTypes },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })

  const jobs: ReconciliationJob[] = []

  for (const log of logs) {
    const data = log.eventData as {
      jobId: string
      scheduleId: string
      trustAccountId: string
      completedAt?: string
      result?: ReconciliationJob['result']
      error?: string
    }

    if (!accountIds.has(data.trustAccountId)) continue
    if (options?.trustAccountId && data.trustAccountId !== options.trustAccountId) continue
    if (options?.scheduleId && data.scheduleId !== options.scheduleId) continue

    jobs.push({
      id: data.jobId,
      scheduleId: data.scheduleId,
      trustAccountId: data.trustAccountId,
      status: log.eventType === 'reconciliation_job_completed' ? 'completed' : 'failed',
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      result: data.result,
      error: data.error,
    })
  }

  return jobs
}

// ============================================================================
// RECONCILIATION ALERTS
// ============================================================================

export interface ReconciliationAlert {
  type: 'overdue' | 'failed' | 'unbalanced'
  severity: 'critical' | 'high' | 'medium'
  trustAccountId: string
  trustAccountName: string
  message: string
  details: Record<string, unknown>
}

export async function getReconciliationAlerts(
  organizationId: string
): Promise<ReconciliationAlert[]> {
  const alerts: ReconciliationAlert[] = []

  const trustAccounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
  })

  const now = new Date()

  for (const account of trustAccounts) {
    // Check for overdue reconciliation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (!account.lastReconciledDate || account.lastReconciledDate < thirtyDaysAgo) {
      const daysSince = account.lastReconciledDate
        ? Math.floor((now.getTime() - account.lastReconciledDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      alerts.push({
        type: 'overdue',
        severity: daysSince && daysSince > 45 ? 'critical' : 'high',
        trustAccountId: account.id,
        trustAccountName: account.accountName,
        message: `Reconciliation overdue by ${daysSince || 'more than 30'} days`,
        details: {
          lastReconciledDate: account.lastReconciledDate,
          daysSinceReconciliation: daysSince,
        },
      })
    }

    // Check for recent failed reconciliation jobs
    const recentFailures = await prisma.trustAuditLog.findMany({
      where: {
        eventType: 'reconciliation_job_failed',
        eventData: { path: ['trustAccountId'], equals: account.id },
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    if (recentFailures.length > 0) {
      alerts.push({
        type: 'failed',
        severity: 'high',
        trustAccountId: account.id,
        trustAccountName: account.accountName,
        message: `${recentFailures.length} reconciliation job(s) failed in the past 30 days`,
        details: {
          failureCount: recentFailures.length,
          lastFailure: recentFailures[0]?.createdAt,
        },
      })
    }

    // Check for unbalanced reconciliations
    const unbalancedReconciliations = await prisma.trustReconciliation.findMany({
      where: {
        trustAccountId: account.id,
        isBalanced: false,
        status: { not: 'approved' },
      },
    })

    if (unbalancedReconciliations.length > 0) {
      alerts.push({
        type: 'unbalanced',
        severity: 'critical',
        trustAccountId: account.id,
        trustAccountName: account.accountName,
        message: `${unbalancedReconciliations.length} unbalanced reconciliation(s) require attention`,
        details: {
          unbalancedCount: unbalancedReconciliations.length,
          reconciliationIds: unbalancedReconciliations.map((r) => r.id),
        },
      })
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}
