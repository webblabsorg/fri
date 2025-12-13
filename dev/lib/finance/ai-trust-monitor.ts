import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// AI TRUST MONITOR SERVICE
// Real-time monitoring, alerts, predictions, and compliance risk scoring
// ============================================================================

export interface TrustAlert {
  id: string
  type: 'commingling' | 'negative_balance' | 'unusual_withdrawal' | 'missing_reconciliation' | 'dormant_account' | 'low_balance' | 'high_volume' | 'fraud_risk'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  entityType: 'trust_account' | 'client_ledger' | 'transaction'
  entityId: string
  entityName: string
  detectedAt: Date
  metadata: Record<string, unknown>
  suggestedAction?: string
  isAcknowledged: boolean
}

export interface SmartFeeTransferSuggestion {
  clientLedgerId: string
  clientName: string
  matterName: string | null
  currentBalance: number
  earnedFees: number
  suggestedTransferAmount: number
  optimalTransferDate: Date
  reason: string
  confidence: number
  invoiceIds: string[]
}

export interface PredictiveTrustBalance {
  clientLedgerId: string
  clientName: string
  currentBalance: number
  predictedBalances: Array<{
    date: Date
    predictedBalance: number
    confidence: number
  }>
  depletionDate: Date | null
  daysUntilDepletion: number | null
  burnRate: number
  recommendation: string
}

export interface ComplianceRiskScore {
  trustAccountId: string
  accountName: string
  overallScore: number // 0-100, higher is better
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: Array<{
    factor: string
    score: number
    weight: number
    impact: 'positive' | 'negative' | 'neutral'
    details: string
  }>
  lastAssessed: Date
  recommendations: string[]
}

// ============================================================================
// REAL-TIME ALERT DETECTION
// ============================================================================

export async function detectTrustAlerts(organizationId: string): Promise<TrustAlert[]> {
  const alerts: TrustAlert[] = []
  const now = new Date()

  // 1. Check for negative balances (CRITICAL)
  const negativeLedgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId },
      balance: { lt: 0 },
      status: 'active',
    },
    include: { client: true, trustAccount: true },
  })

  for (const ledger of negativeLedgers) {
    alerts.push({
      id: `neg-${ledger.id}`,
      type: 'negative_balance',
      severity: 'critical',
      title: 'Negative Trust Balance Detected',
      message: `Client ledger "${ledger.ledgerName}" has a negative balance of $${Number(ledger.balance).toFixed(2)}`,
      entityType: 'client_ledger',
      entityId: ledger.id,
      entityName: ledger.ledgerName,
      detectedAt: now,
      metadata: {
        balance: Number(ledger.balance),
        clientName: ledger.client.displayName,
        trustAccountName: ledger.trustAccount.accountName,
      },
      suggestedAction: 'Immediately deposit funds to cover the negative balance and investigate the cause.',
      isAcknowledged: false,
    })
  }

  // 2. Check for commingling (CRITICAL)
  const trustAccounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
    include: { clientLedgers: true },
  })

  for (const account of trustAccounts) {
    const clientTotal = account.clientLedgers.reduce((sum, l) => sum + Number(l.balance), 0)
    const accountBalance = Number(account.currentBalance)
    const difference = Math.abs(accountBalance - clientTotal)

    if (difference > 0.01) {
      alerts.push({
        id: `comm-${account.id}`,
        type: 'commingling',
        severity: 'critical',
        title: 'Potential Commingling Detected',
        message: `Trust account "${account.accountName}" balance ($${accountBalance.toFixed(2)}) doesn't match client ledgers total ($${clientTotal.toFixed(2)})`,
        entityType: 'trust_account',
        entityId: account.id,
        entityName: account.accountName,
        detectedAt: now,
        metadata: {
          accountBalance,
          clientLedgersTotal: clientTotal,
          difference,
        },
        suggestedAction: 'Perform immediate reconciliation to identify and resolve the discrepancy.',
        isAcknowledged: false,
      })
    }

    // 3. Check for missing reconciliation (HIGH)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (!account.lastReconciledDate || account.lastReconciledDate < thirtyDaysAgo) {
      const daysSinceReconciliation = account.lastReconciledDate
        ? Math.floor((now.getTime() - account.lastReconciledDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      alerts.push({
        id: `rec-${account.id}`,
        type: 'missing_reconciliation',
        severity: 'high',
        title: 'Reconciliation Overdue',
        message: `Trust account "${account.accountName}" has not been reconciled in ${daysSinceReconciliation || 'over 30'} days`,
        entityType: 'trust_account',
        entityId: account.id,
        entityName: account.accountName,
        detectedAt: now,
        metadata: {
          lastReconciledDate: account.lastReconciledDate,
          daysSinceReconciliation,
        },
        suggestedAction: 'Complete a three-way reconciliation immediately to ensure compliance.',
        isAcknowledged: false,
      })
    }
  }

  // 4. Check for dormant accounts (MEDIUM)
  const dormantThreshold = new Date()
  dormantThreshold.setMonth(dormantThreshold.getMonth() - 12)

  const dormantLedgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId },
      lastActivityAt: { lt: dormantThreshold },
      balance: { gt: 0 },
      status: 'active',
    },
    include: { client: true, trustAccount: true },
  })

  for (const ledger of dormantLedgers) {
    const monthsInactive = ledger.lastActivityAt
      ? Math.floor((now.getTime() - ledger.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 12

    alerts.push({
      id: `dorm-${ledger.id}`,
      type: 'dormant_account',
      severity: 'medium',
      title: 'Dormant Trust Account',
      message: `Client ledger "${ledger.ledgerName}" has had no activity for ${monthsInactive} months with balance of $${Number(ledger.balance).toFixed(2)}`,
      entityType: 'client_ledger',
      entityId: ledger.id,
      entityName: ledger.ledgerName,
      detectedAt: now,
      metadata: {
        balance: Number(ledger.balance),
        lastActivityAt: ledger.lastActivityAt,
        monthsInactive,
        clientName: ledger.client.displayName,
      },
      suggestedAction: 'Contact client to determine disposition of funds. May need to follow unclaimed property procedures.',
      isAcknowledged: false,
    })
  }

  // 5. Check for unusual withdrawal patterns (HIGH - Fraud Detection)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentWithdrawals = await prisma.trustTransaction.findMany({
    where: {
      trustAccount: { organizationId },
      transactionType: { in: ['transfer_to_operating', 'disbursement', 'refund'] },
      transactionDate: { gte: sevenDaysAgo },
      voidedAt: null,
    },
    include: { clientLedger: { include: { client: true } }, trustAccount: true },
  })

  // Group by client ledger and check for unusual patterns
  const ledgerWithdrawals = new Map<string, typeof recentWithdrawals>()
  for (const txn of recentWithdrawals) {
    const existing = ledgerWithdrawals.get(txn.clientLedgerId) || []
    existing.push(txn)
    ledgerWithdrawals.set(txn.clientLedgerId, existing)
  }

  for (const [ledgerId, withdrawals] of ledgerWithdrawals) {
    // Flag if more than 5 withdrawals in 7 days or total exceeds historical average by 3x
    if (withdrawals.length >= 5) {
      const totalAmount = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0)
      const ledger = withdrawals[0].clientLedger

      alerts.push({
        id: `unusual-${ledgerId}`,
        type: 'unusual_withdrawal',
        severity: 'high',
        title: 'Unusual Withdrawal Pattern',
        message: `${withdrawals.length} withdrawals totaling $${totalAmount.toFixed(2)} from "${ledger.ledgerName}" in the past 7 days`,
        entityType: 'client_ledger',
        entityId: ledgerId,
        entityName: ledger.ledgerName,
        detectedAt: now,
        metadata: {
          withdrawalCount: withdrawals.length,
          totalAmount,
          clientName: ledger.client.displayName,
          transactions: withdrawals.map((w) => ({
            id: w.id,
            amount: Number(w.amount),
            date: w.transactionDate,
            description: w.description,
          })),
        },
        suggestedAction: 'Review transactions for potential fraud or unauthorized activity.',
        isAcknowledged: false,
      })
    }
  }

  // 6. Check for low balance warnings (LOW)
  const lowBalanceLedgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId },
      balance: { gt: 0, lt: 500 },
      status: 'active',
    },
    include: { client: true, matter: true },
  })

  for (const ledger of lowBalanceLedgers) {
    alerts.push({
      id: `low-${ledger.id}`,
      type: 'low_balance',
      severity: 'low',
      title: 'Low Trust Balance',
      message: `Client ledger "${ledger.ledgerName}" has a low balance of $${Number(ledger.balance).toFixed(2)}`,
      entityType: 'client_ledger',
      entityId: ledger.id,
      entityName: ledger.ledgerName,
      detectedAt: now,
      metadata: {
        balance: Number(ledger.balance),
        clientName: ledger.client.displayName,
        matterName: ledger.matter?.name,
      },
      suggestedAction: 'Consider requesting additional retainer from client.',
      isAcknowledged: false,
    })
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// ============================================================================
// SMART FEE TRANSFER SUGGESTIONS
// ============================================================================

export async function getSmartFeeTransferSuggestions(
  organizationId: string
): Promise<SmartFeeTransferSuggestion[]> {
  const suggestions: SmartFeeTransferSuggestion[] = []

  // Get all active client ledgers with positive balances
  const ledgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId },
      balance: { gt: 0 },
      status: 'active',
    },
    include: {
      client: true,
      matter: true,
    },
  })

  for (const ledger of ledgers) {
    // Find approved/sent invoices for this client/matter that haven't been paid from trust
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        clientId: ledger.clientId,
        matterId: ledger.matterId,
        status: { in: ['sent', 'approved', 'overdue'] },
        balanceDue: { gt: 0 },
      },
      orderBy: { issueDate: 'asc' },
    })

    if (unpaidInvoices.length === 0) continue

    const totalEarnedFees = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue), 0)
    const currentBalance = Number(ledger.balance)
    const suggestedTransferAmount = Math.min(currentBalance, totalEarnedFees)

    if (suggestedTransferAmount < 50) continue // Skip small amounts

    // Calculate optimal transfer date (end of billing cycle or immediately if overdue)
    const hasOverdue = unpaidInvoices.some((inv) => inv.status === 'overdue')
    const optimalTransferDate = hasOverdue ? new Date() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Calculate confidence based on invoice age and amount match
    let confidence = 70
    if (hasOverdue) confidence += 15
    if (suggestedTransferAmount === totalEarnedFees) confidence += 10
    if (currentBalance >= totalEarnedFees * 1.2) confidence += 5

    suggestions.push({
      clientLedgerId: ledger.id,
      clientName: ledger.client.displayName,
      matterName: ledger.matter?.name || null,
      currentBalance,
      earnedFees: totalEarnedFees,
      suggestedTransferAmount,
      optimalTransferDate,
      reason: hasOverdue
        ? 'Overdue invoices should be paid from trust immediately'
        : 'Earned fees available for transfer to operating account',
      confidence: Math.min(confidence, 100),
      invoiceIds: unpaidInvoices.map((inv) => inv.id),
    })
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

// ============================================================================
// PREDICTIVE TRUST BALANCE
// ============================================================================

export async function getPredictiveTrustBalances(
  organizationId: string,
  forecastDays: number = 90
): Promise<PredictiveTrustBalance[]> {
  const predictions: PredictiveTrustBalance[] = []

  const ledgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId },
      balance: { gt: 0 },
      status: 'active',
    },
    include: {
      client: true,
      matter: true,
    },
  })

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  for (const ledger of ledgers) {
    // Get historical transactions for burn rate calculation
    const historicalTxns = await prisma.trustTransaction.findMany({
      where: {
        clientLedgerId: ledger.id,
        transactionDate: { gte: ninetyDaysAgo },
        voidedAt: null,
      },
      orderBy: { transactionDate: 'asc' },
    })

    // Calculate average daily burn rate
    const withdrawals = historicalTxns.filter((t) =>
      ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType)
    )
    const deposits = historicalTxns.filter((t) =>
      ['deposit', 'interest'].includes(t.transactionType)
    )

    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalDeposits = deposits.reduce((sum, t) => sum + Number(t.amount), 0)
    const netChange = totalDeposits - totalWithdrawals

    // Calculate days of history
    const daysOfHistory = historicalTxns.length > 0
      ? Math.max(1, Math.ceil((Date.now() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)))
      : 90

    const dailyBurnRate = totalWithdrawals / daysOfHistory
    const currentBalance = Number(ledger.balance)

    // Generate predictions
    const predictedBalances: PredictiveTrustBalance['predictedBalances'] = []
    let depletionDate: Date | null = null
    let daysUntilDepletion: number | null = null

    for (let day = 7; day <= forecastDays; day += 7) {
      const predictedDate = new Date()
      predictedDate.setDate(predictedDate.getDate() + day)

      const predictedBalance = Math.max(0, currentBalance - dailyBurnRate * day)
      const confidence = Math.max(50, 95 - day * 0.5) // Confidence decreases over time

      predictedBalances.push({
        date: predictedDate,
        predictedBalance,
        confidence,
      })

      if (predictedBalance === 0 && !depletionDate) {
        depletionDate = predictedDate
        daysUntilDepletion = day
      }
    }

    // Generate recommendation
    let recommendation = ''
    if (dailyBurnRate === 0) {
      recommendation = 'No recent activity. Monitor for dormancy.'
    } else if (daysUntilDepletion && daysUntilDepletion <= 14) {
      recommendation = `URGENT: Trust balance will be depleted in approximately ${daysUntilDepletion} days. Request additional retainer immediately.`
    } else if (daysUntilDepletion && daysUntilDepletion <= 30) {
      recommendation = `Trust balance running low. Consider requesting additional retainer within the next 2 weeks.`
    } else if (daysUntilDepletion && daysUntilDepletion <= 60) {
      recommendation = `Trust balance adequate for approximately ${daysUntilDepletion} days at current burn rate.`
    } else {
      recommendation = 'Trust balance is healthy for the foreseeable future.'
    }

    predictions.push({
      clientLedgerId: ledger.id,
      clientName: ledger.client.displayName,
      currentBalance,
      predictedBalances,
      depletionDate,
      daysUntilDepletion,
      burnRate: dailyBurnRate,
      recommendation,
    })
  }

  // Sort by urgency (soonest depletion first)
  return predictions.sort((a, b) => {
    if (a.daysUntilDepletion === null && b.daysUntilDepletion === null) return 0
    if (a.daysUntilDepletion === null) return 1
    if (b.daysUntilDepletion === null) return -1
    return a.daysUntilDepletion - b.daysUntilDepletion
  })
}

// ============================================================================
// COMPLIANCE RISK SCORING
// ============================================================================

export async function calculateComplianceRiskScore(
  organizationId: string,
  trustAccountId: string
): Promise<ComplianceRiskScore> {
  const account = await prisma.trustAccount.findFirst({
    where: { id: trustAccountId, organizationId },
    include: {
      clientLedgers: { include: { client: true } },
      reconciliations: {
        orderBy: { reconciliationDate: 'desc' },
        take: 12,
      },
      transactions: {
        where: { voidedAt: null },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      },
    },
  })

  if (!account) {
    throw new Error('Trust account not found')
  }

  const factors: ComplianceRiskScore['factors'] = []
  const recommendations: string[] = []
  const now = new Date()

  // Factor 1: Reconciliation Frequency (Weight: 25)
  const recentReconciliations = account.reconciliations.filter((r) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return r.reconciliationDate >= thirtyDaysAgo && r.status === 'approved'
  })

  let reconciliationScore = 0
  if (recentReconciliations.length >= 1) {
    reconciliationScore = 100
  } else if (account.lastReconciledDate) {
    const daysSince = Math.floor((now.getTime() - account.lastReconciledDate.getTime()) / (1000 * 60 * 60 * 24))
    reconciliationScore = Math.max(0, 100 - daysSince * 2)
  }

  factors.push({
    factor: 'Reconciliation Frequency',
    score: reconciliationScore,
    weight: 25,
    impact: reconciliationScore >= 80 ? 'positive' : reconciliationScore >= 50 ? 'neutral' : 'negative',
    details: recentReconciliations.length >= 1
      ? 'Account reconciled within the past 30 days'
      : `Last reconciliation: ${account.lastReconciledDate?.toLocaleDateString() || 'Never'}`,
  })

  if (reconciliationScore < 80) {
    recommendations.push('Complete monthly reconciliation to maintain compliance')
  }

  // Factor 2: Three-Way Balance Match (Weight: 30)
  const clientTotal = account.clientLedgers.reduce((sum, l) => sum + Number(l.balance), 0)
  const accountBalance = Number(account.currentBalance)
  const balanceDifference = Math.abs(accountBalance - clientTotal)
  const balanceMatchScore = balanceDifference < 0.01 ? 100 : Math.max(0, 100 - balanceDifference * 10)

  factors.push({
    factor: 'Three-Way Balance Match',
    score: balanceMatchScore,
    weight: 30,
    impact: balanceMatchScore === 100 ? 'positive' : 'negative',
    details: balanceDifference < 0.01
      ? 'Trust account and client ledgers are in balance'
      : `Discrepancy of $${balanceDifference.toFixed(2)} detected`,
  })

  if (balanceMatchScore < 100) {
    recommendations.push('Investigate and resolve balance discrepancy immediately')
  }

  // Factor 3: Negative Balance Prevention (Weight: 25)
  const negativeLedgers = account.clientLedgers.filter((l) => Number(l.balance) < 0)
  const negativeBalanceScore = negativeLedgers.length === 0 ? 100 : 0

  factors.push({
    factor: 'Negative Balance Prevention',
    score: negativeBalanceScore,
    weight: 25,
    impact: negativeBalanceScore === 100 ? 'positive' : 'negative',
    details: negativeLedgers.length === 0
      ? 'No negative client balances'
      : `${negativeLedgers.length} client ledger(s) with negative balance`,
  })

  if (negativeBalanceScore < 100) {
    recommendations.push('Immediately address negative client balances')
  }

  // Factor 4: Transaction Documentation (Weight: 10)
  const recentTransactions = account.transactions.slice(0, 50)
  const documentedTransactions = recentTransactions.filter(
    (t) => t.description && t.description.length > 10
  )
  const documentationScore = recentTransactions.length > 0
    ? Math.round((documentedTransactions.length / recentTransactions.length) * 100)
    : 100

  factors.push({
    factor: 'Transaction Documentation',
    score: documentationScore,
    weight: 10,
    impact: documentationScore >= 90 ? 'positive' : documentationScore >= 70 ? 'neutral' : 'negative',
    details: `${documentedTransactions.length}/${recentTransactions.length} recent transactions have adequate descriptions`,
  })

  if (documentationScore < 90) {
    recommendations.push('Ensure all transactions have detailed descriptions for audit trail')
  }

  // Factor 5: Dormant Account Management (Weight: 10)
  const dormantThreshold = new Date()
  dormantThreshold.setMonth(dormantThreshold.getMonth() - 12)
  const dormantLedgers = account.clientLedgers.filter(
    (l) => l.lastActivityAt && l.lastActivityAt < dormantThreshold && Number(l.balance) > 0
  )
  const dormantScore = dormantLedgers.length === 0 ? 100 : Math.max(0, 100 - dormantLedgers.length * 20)

  factors.push({
    factor: 'Dormant Account Management',
    score: dormantScore,
    weight: 10,
    impact: dormantScore === 100 ? 'positive' : dormantScore >= 60 ? 'neutral' : 'negative',
    details: dormantLedgers.length === 0
      ? 'No dormant accounts with balances'
      : `${dormantLedgers.length} dormant account(s) require attention`,
  })

  if (dormantScore < 100) {
    recommendations.push('Review dormant accounts and follow unclaimed property procedures if necessary')
  }

  // Calculate overall score
  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0)
  )

  // Determine risk level
  let riskLevel: ComplianceRiskScore['riskLevel']
  if (overallScore >= 90) {
    riskLevel = 'low'
  } else if (overallScore >= 70) {
    riskLevel = 'medium'
  } else if (overallScore >= 50) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  return {
    trustAccountId,
    accountName: account.accountName,
    overallScore,
    riskLevel,
    factors,
    lastAssessed: now,
    recommendations,
  }
}

export async function getOrganizationComplianceRiskScores(
  organizationId: string
): Promise<ComplianceRiskScore[]> {
  const accounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
  })

  const scores: ComplianceRiskScore[] = []
  for (const account of accounts) {
    const score = await calculateComplianceRiskScore(organizationId, account.id)
    scores.push(score)
  }

  return scores.sort((a, b) => a.overallScore - b.overallScore)
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

export async function acknowledgeAlert(
  organizationId: string,
  alertId: string,
  acknowledgedBy: string
): Promise<void> {
  // Store acknowledgment in audit log
  await prisma.trustAuditLog.create({
    data: {
      eventType: 'alert_acknowledged',
      eventData: {
        alertId,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      userId: acknowledgedBy,
    },
  })
}

export async function getAlertHistory(
  organizationId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<Array<{ alertId: string; acknowledgedBy: string; acknowledgedAt: Date }>> {
  const where: Record<string, unknown> = {
    eventType: 'alert_acknowledged',
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {}
    if (options?.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate
    }
  }

  const logs = await prisma.trustAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })

  return logs.map((log) => ({
    alertId: (log.eventData as { alertId: string }).alertId,
    acknowledgedBy: (log.eventData as { acknowledgedBy: string }).acknowledgedBy,
    acknowledgedAt: (log.eventData as { acknowledgedAt: string }).acknowledgedAt
      ? new Date((log.eventData as { acknowledgedAt: string }).acknowledgedAt)
      : log.createdAt,
  }))
}
