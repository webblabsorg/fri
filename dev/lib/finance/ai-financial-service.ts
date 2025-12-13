import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// AI EXPENSE CATEGORIZATION SERVICE
// ============================================================================

export interface ExpenseCategoryPrediction {
  category: string
  subcategory?: string
  confidence: number
  alternativeCategories: Array<{ category: string; confidence: number }>
  suggestedAccountId?: string
  isBillable: boolean
  billableConfidence: number
}

export const EXPENSE_CATEGORIES = {
  court_fees: {
    name: 'Court Fees',
    subcategories: ['filing_fees', 'service_fees', 'transcript_fees', 'certification_fees'],
    keywords: ['court', 'filing', 'clerk', 'transcript', 'certification', 'docket'],
    defaultBillable: true,
  },
  expert_witness: {
    name: 'Expert Witness',
    subcategories: ['medical', 'financial', 'technical', 'forensic'],
    keywords: ['expert', 'witness', 'testimony', 'deposition', 'forensic', 'medical expert'],
    defaultBillable: true,
  },
  travel: {
    name: 'Travel',
    subcategories: ['airfare', 'lodging', 'ground_transport', 'mileage', 'parking'],
    keywords: ['flight', 'hotel', 'uber', 'lyft', 'taxi', 'rental car', 'parking', 'mileage', 'airfare'],
    defaultBillable: true,
  },
  meals: {
    name: 'Meals & Entertainment',
    subcategories: ['client_meals', 'team_meals', 'working_meals'],
    keywords: ['restaurant', 'lunch', 'dinner', 'breakfast', 'catering', 'food'],
    defaultBillable: false,
  },
  office_supplies: {
    name: 'Office Supplies',
    subcategories: ['general', 'technology', 'furniture'],
    keywords: ['staples', 'office depot', 'amazon', 'supplies', 'paper', 'ink', 'toner'],
    defaultBillable: false,
  },
  research: {
    name: 'Research & Subscriptions',
    subcategories: ['legal_research', 'databases', 'publications'],
    keywords: ['westlaw', 'lexis', 'pacer', 'research', 'subscription', 'database'],
    defaultBillable: true,
  },
  copying: {
    name: 'Copying & Printing',
    subcategories: ['internal', 'external', 'binding'],
    keywords: ['copy', 'print', 'fedex', 'ups', 'binding', 'reproduction'],
    defaultBillable: true,
  },
  postage: {
    name: 'Postage & Delivery',
    subcategories: ['mail', 'courier', 'overnight'],
    keywords: ['usps', 'fedex', 'ups', 'dhl', 'postage', 'shipping', 'courier'],
    defaultBillable: true,
  },
  technology: {
    name: 'Technology',
    subcategories: ['software', 'hardware', 'services'],
    keywords: ['software', 'license', 'subscription', 'computer', 'equipment'],
    defaultBillable: false,
  },
  professional_services: {
    name: 'Professional Services',
    subcategories: ['accounting', 'consulting', 'investigators'],
    keywords: ['consultant', 'accountant', 'investigator', 'process server'],
    defaultBillable: true,
  },
  insurance: {
    name: 'Insurance',
    subcategories: ['malpractice', 'general', 'health'],
    keywords: ['insurance', 'malpractice', 'liability', 'premium'],
    defaultBillable: false,
  },
  marketing: {
    name: 'Marketing & Advertising',
    subcategories: ['advertising', 'events', 'sponsorships'],
    keywords: ['advertising', 'marketing', 'promotion', 'sponsorship', 'event'],
    defaultBillable: false,
  },
}

/**
 * AI-powered expense categorization
 * Uses keyword matching + historical learning from user corrections
 */
export async function categorizeExpense(
  organizationId: string,
  description: string,
  vendorName?: string,
  amount?: number
): Promise<ExpenseCategoryPrediction> {
  const normalizedDesc = description.toLowerCase()
  const normalizedVendor = vendorName?.toLowerCase() || ''
  const combinedText = `${normalizedDesc} ${normalizedVendor}`

  // Score each category based on keyword matches
  const scores: Array<{ category: string; score: number; subcategory?: string }> = []

  for (const [categoryKey, categoryData] of Object.entries(EXPENSE_CATEGORIES)) {
    let score = 0
    let matchedSubcategory: string | undefined

    for (const keyword of categoryData.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        score += keyword.length // Longer matches = higher confidence
      }
    }

    // Check subcategories for more specific matches
    for (const sub of categoryData.subcategories) {
      if (combinedText.includes(sub.replace('_', ' '))) {
        score += 5
        matchedSubcategory = sub
      }
    }

    if (score > 0) {
      scores.push({ category: categoryKey, score, subcategory: matchedSubcategory })
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  // Check historical categorizations for this organization
  const historicalMatch = await prisma.expense.findFirst({
    where: {
      organizationId,
      OR: [
        { description: { contains: description.substring(0, 20), mode: 'insensitive' } },
        vendorName ? { vendor: { name: { contains: vendorName, mode: 'insensitive' } } } : {},
      ],
      category: { not: '' },
    },
    orderBy: { createdAt: 'desc' },
  })

  // If we have historical data, boost that category's score
  if (historicalMatch?.category) {
    const histIndex = scores.findIndex(s => s.category === historicalMatch.category)
    if (histIndex >= 0) {
      scores[histIndex].score += 20 // Strong boost for historical match
    } else {
      scores.unshift({
        category: historicalMatch.category,
        score: 15,
        subcategory: historicalMatch.subcategory || undefined,
      })
    }
    scores.sort((a, b) => b.score - a.score)
  }

  // Calculate confidence based on score distribution
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const topScore = scores[0]?.score || 0
  const confidence = totalScore > 0 ? Math.min(95, Math.round((topScore / totalScore) * 100)) : 30

  // Determine billability
  const topCategory = scores[0]?.category
  const categoryData = topCategory ? EXPENSE_CATEGORIES[topCategory as keyof typeof EXPENSE_CATEGORIES] : null
  const isBillable = categoryData?.defaultBillable ?? true

  // Find suggested account
  let suggestedAccountId: string | undefined
  if (topCategory) {
    const account = await prisma.chartOfAccount.findFirst({
      where: {
        organizationId,
        accountType: 'expense',
        accountName: { contains: categoryData?.name || topCategory, mode: 'insensitive' },
        isActive: true,
      },
    })
    suggestedAccountId = account?.id
  }

  return {
    category: topCategory || 'other',
    subcategory: scores[0]?.subcategory,
    confidence,
    alternativeCategories: scores.slice(1, 4).map(s => ({
      category: s.category,
      confidence: totalScore > 0 ? Math.round((s.score / totalScore) * 100) : 0,
    })),
    suggestedAccountId,
    isBillable,
    billableConfidence: isBillable ? 85 : 75,
  }
}

/**
 * Learn from user corrections to improve categorization
 */
export async function learnFromCorrection(
  organizationId: string,
  expenseId: string,
  correctedCategory: string,
  correctedSubcategory?: string
): Promise<void> {
  // Update the expense with the correction
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      category: correctedCategory,
      subcategory: correctedSubcategory,
    },
  })

  // Log the correction for future learning (could be used for ML training)
  console.log(`[AI Learning] Expense ${expenseId} corrected to ${correctedCategory}/${correctedSubcategory}`)
}

// ============================================================================
// CASH FLOW FORECASTING SERVICE
// ============================================================================

export interface CashFlowForecast {
  periodStart: Date
  periodEnd: Date
  forecastDate: Date
  periods: CashFlowPeriod[]
  summary: {
    totalProjectedInflow: number
    totalProjectedOutflow: number
    netCashFlow: number
    endingCashBalance: number
    confidenceScore: number
  }
  alerts: CashFlowAlert[]
}

export interface CashFlowPeriod {
  periodStart: Date
  periodEnd: Date
  projectedInflows: {
    invoiceCollections: number
    trustDeposits: number
    otherIncome: number
    total: number
  }
  projectedOutflows: {
    operatingExpenses: number
    payroll: number
    vendorPayments: number
    trustDisbursements: number
    total: number
  }
  netCashFlow: number
  runningBalance: number
  confidence: number
}

export interface CashFlowAlert {
  type: 'low_balance' | 'negative_balance' | 'large_outflow' | 'collection_risk'
  severity: 'info' | 'warning' | 'critical'
  message: string
  periodStart: Date
  amount?: number
}

/**
 * Generate 3-month rolling cash flow forecast
 */
export async function generateCashFlowForecast(
  organizationId: string,
  startDate?: Date
): Promise<CashFlowForecast> {
  const forecastStart = startDate || new Date()
  const forecastEnd = new Date(forecastStart)
  forecastEnd.setMonth(forecastEnd.getMonth() + 3)

  // Get current cash balance
  const cashAccounts = await prisma.chartOfAccount.findMany({
    where: {
      organizationId,
      accountType: 'asset',
      accountName: { contains: 'cash', mode: 'insensitive' },
      isActive: true,
    },
  })

  const cashAccountIds = cashAccounts.map(a => a.id)
  
  const cashBalanceEntries = await prisma.generalLedgerEntry.groupBy({
    by: ['accountId'],
    where: {
      organizationId,
      accountId: { in: cashAccountIds },
      journal: { status: 'posted' },
    },
    _sum: { debit: true, credit: true },
  })

  let currentCashBalance = 0
  for (const entry of cashBalanceEntries) {
    currentCashBalance += Number(entry._sum.debit || 0) - Number(entry._sum.credit || 0)
  }

  // Get historical data for forecasting
  const threeMonthsAgo = new Date(forecastStart)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Historical invoice collections
  const historicalPayments = await prisma.payment.aggregate({
    where: {
      organizationId,
      paymentDate: { gte: threeMonthsAgo, lt: forecastStart },
      status: 'completed',
    },
    _sum: { amount: true },
    _count: true,
  })

  const avgMonthlyCollections = Number(historicalPayments._sum.amount || 0) / 3

  // Historical expenses
  const historicalExpenses = await prisma.expense.aggregate({
    where: {
      organizationId,
      expenseDate: { gte: threeMonthsAgo, lt: forecastStart },
      status: { in: ['approved', 'paid'] },
    },
    _sum: { amount: true },
  })

  const avgMonthlyExpenses = Number(historicalExpenses._sum.amount || 0) / 3

  // Outstanding invoices (AR)
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['sent', 'viewed', 'overdue'] },
      balanceDue: { gt: 0 },
    },
    select: {
      id: true,
      balanceDue: true,
      dueDate: true,
      issueDate: true,
      status: true,
    },
  })

  // Upcoming vendor bills
  const upcomingBills = await prisma.vendorBill.findMany({
    where: {
      organizationId,
      status: { in: ['pending', 'approved'] },
      dueDate: { gte: forecastStart, lte: forecastEnd },
    },
    select: {
      id: true,
      balanceDue: true,
      dueDate: true,
    },
  })

  // Generate weekly periods
  const periods: CashFlowPeriod[] = []
  let runningBalance = currentCashBalance
  const alerts: CashFlowAlert[] = []

  const periodDuration = 7 // days per period (weekly)
  let periodStart = new Date(forecastStart)

  while (periodStart < forecastEnd) {
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + periodDuration)

    // Project invoice collections for this period
    let projectedCollections = 0
    for (const invoice of outstandingInvoices) {
      const dueDate = new Date(invoice.dueDate)
      if (dueDate >= periodStart && dueDate < periodEnd) {
        // Apply collection probability based on age
        const daysPastDue = Math.max(0, (periodStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const collectionProbability = Math.max(0.3, 1 - (daysPastDue / 90) * 0.7)
        projectedCollections += Number(invoice.balanceDue) * collectionProbability
      }
    }

    // Add baseline collections from historical average
    projectedCollections += (avgMonthlyCollections / 4) * 0.8 // Weekly portion with conservative factor

    // Project vendor payments for this period
    let projectedVendorPayments = 0
    for (const bill of upcomingBills) {
      const dueDate = new Date(bill.dueDate)
      if (dueDate >= periodStart && dueDate < periodEnd) {
        projectedVendorPayments += Number(bill.balanceDue)
      }
    }

    // Estimate operating expenses from historical average
    const projectedOperatingExpenses = (avgMonthlyExpenses / 4) * 1.1 // Weekly with buffer

    const projectedInflows = {
      invoiceCollections: Math.round(projectedCollections * 100) / 100,
      trustDeposits: 0, // Would need trust transaction history
      otherIncome: 0,
      total: Math.round(projectedCollections * 100) / 100,
    }

    const projectedOutflows = {
      operatingExpenses: Math.round(projectedOperatingExpenses * 100) / 100,
      payroll: 0, // Would need payroll data
      vendorPayments: Math.round(projectedVendorPayments * 100) / 100,
      trustDisbursements: 0,
      total: Math.round((projectedOperatingExpenses + projectedVendorPayments) * 100) / 100,
    }

    const netCashFlow = projectedInflows.total - projectedOutflows.total
    runningBalance += netCashFlow

    // Calculate confidence based on data quality
    const confidence = Math.min(90, 60 + (outstandingInvoices.length > 0 ? 15 : 0) + (upcomingBills.length > 0 ? 15 : 0))

    periods.push({
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      projectedInflows,
      projectedOutflows,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      runningBalance: Math.round(runningBalance * 100) / 100,
      confidence,
    })

    // Generate alerts
    if (runningBalance < 0) {
      alerts.push({
        type: 'negative_balance',
        severity: 'critical',
        message: `Projected negative cash balance of $${Math.abs(runningBalance).toLocaleString()} by ${periodEnd.toLocaleDateString()}`,
        periodStart: new Date(periodStart),
        amount: runningBalance,
      })
    } else if (runningBalance < currentCashBalance * 0.2) {
      alerts.push({
        type: 'low_balance',
        severity: 'warning',
        message: `Cash balance projected to drop below 20% of current level by ${periodEnd.toLocaleDateString()}`,
        periodStart: new Date(periodStart),
        amount: runningBalance,
      })
    }

    if (projectedOutflows.total > projectedInflows.total * 2) {
      alerts.push({
        type: 'large_outflow',
        severity: 'warning',
        message: `Large outflows expected week of ${periodStart.toLocaleDateString()}: $${projectedOutflows.total.toLocaleString()}`,
        periodStart: new Date(periodStart),
        amount: projectedOutflows.total,
      })
    }

    periodStart = new Date(periodEnd)
  }

  // Calculate summary
  const totalProjectedInflow = periods.reduce((sum, p) => sum + p.projectedInflows.total, 0)
  const totalProjectedOutflow = periods.reduce((sum, p) => sum + p.projectedOutflows.total, 0)
  const avgConfidence = periods.reduce((sum, p) => sum + p.confidence, 0) / periods.length

  return {
    periodStart: forecastStart,
    periodEnd: forecastEnd,
    forecastDate: new Date(),
    periods,
    summary: {
      totalProjectedInflow: Math.round(totalProjectedInflow * 100) / 100,
      totalProjectedOutflow: Math.round(totalProjectedOutflow * 100) / 100,
      netCashFlow: Math.round((totalProjectedInflow - totalProjectedOutflow) * 100) / 100,
      endingCashBalance: Math.round(runningBalance * 100) / 100,
      confidenceScore: Math.round(avgConfidence),
    },
    alerts,
  }
}

// ============================================================================
// ANOMALY DETECTION SERVICE
// ============================================================================

export interface TransactionAnomaly {
  id: string
  transactionId: string
  transactionType: 'journal_entry' | 'expense' | 'invoice' | 'payment' | 'trust_transaction'
  anomalyType: 'unusual_amount' | 'unusual_pattern' | 'duplicate' | 'timing' | 'category_mismatch' | 'potential_fraud'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  amount: number
  expectedRange?: { min: number; max: number }
  confidence: number
  detectedAt: Date
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: Date
  resolution?: string
}

export interface AnomalyDetectionResult {
  anomalies: TransactionAnomaly[]
  summary: {
    total: number
    bySeverity: { low: number; medium: number; high: number; critical: number }
    byType: Record<string, number>
  }
  scannedTransactions: number
  scanDate: Date
}

/**
 * Detect anomalies in financial transactions
 */
export async function detectAnomalies(
  organizationId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    transactionTypes?: string[]
  }
): Promise<AnomalyDetectionResult> {
  const anomalies: TransactionAnomaly[] = []
  const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  const endDate = options?.endDate || new Date()
  let scannedTransactions = 0

  // 1. Check expenses for anomalies
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      expenseDate: { gte: startDate, lte: endDate },
    },
    include: { vendor: true },
  })

  // Calculate expense statistics
  const expenseAmounts = expenses.map(e => Number(e.amount))
  const avgExpense = expenseAmounts.length > 0 ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length : 0
  const stdDevExpense = calculateStdDev(expenseAmounts)

  for (const expense of expenses) {
    scannedTransactions++
    const amount = Number(expense.amount)

    // Check for unusual amounts (> 3 standard deviations)
    if (stdDevExpense > 0 && Math.abs(amount - avgExpense) > 3 * stdDevExpense) {
      anomalies.push({
        id: `anomaly-expense-${expense.id}`,
        transactionId: expense.id,
        transactionType: 'expense',
        anomalyType: 'unusual_amount',
        severity: amount > avgExpense + 4 * stdDevExpense ? 'high' : 'medium',
        description: `Expense amount $${amount.toLocaleString()} is significantly ${amount > avgExpense ? 'higher' : 'lower'} than average ($${avgExpense.toFixed(2)})`,
        amount,
        expectedRange: { min: avgExpense - 2 * stdDevExpense, max: avgExpense + 2 * stdDevExpense },
        confidence: 85,
        detectedAt: new Date(),
        reviewed: false,
      })
    }

    // Check for potential duplicates
    const potentialDuplicates = expenses.filter(e =>
      e.id !== expense.id &&
      Math.abs(Number(e.amount) - amount) < 0.01 &&
      e.vendorId === expense.vendorId &&
      Math.abs(new Date(e.expenseDate).getTime() - new Date(expense.expenseDate).getTime()) < 7 * 24 * 60 * 60 * 1000
    )

    if (potentialDuplicates.length > 0) {
      anomalies.push({
        id: `anomaly-duplicate-${expense.id}`,
        transactionId: expense.id,
        transactionType: 'expense',
        anomalyType: 'duplicate',
        severity: 'medium',
        description: `Potential duplicate expense: ${potentialDuplicates.length} similar transaction(s) found within 7 days`,
        amount,
        confidence: 75,
        detectedAt: new Date(),
        reviewed: false,
      })
    }
  }

  // 2. Check journal entries for anomalies
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      organizationId,
      postedDate: { gte: startDate, lte: endDate },
    },
    include: { entries: true },
  })

  for (const je of journalEntries) {
    scannedTransactions++
    const totalDebit = Number(je.totalDebit)

    // Check for round number entries (potential fraud indicator)
    if (totalDebit >= 10000 && totalDebit % 1000 === 0) {
      anomalies.push({
        id: `anomaly-je-round-${je.id}`,
        transactionId: je.id,
        transactionType: 'journal_entry',
        anomalyType: 'unusual_pattern',
        severity: 'low',
        description: `Large round-number journal entry: $${totalDebit.toLocaleString()}. May warrant review.`,
        amount: totalDebit,
        confidence: 60,
        detectedAt: new Date(),
        reviewed: false,
      })
    }

    // Check for entries posted on weekends/holidays
    const postedDate = new Date(je.postedDate)
    const dayOfWeek = postedDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      anomalies.push({
        id: `anomaly-je-weekend-${je.id}`,
        transactionId: je.id,
        transactionType: 'journal_entry',
        anomalyType: 'timing',
        severity: 'low',
        description: `Journal entry posted on weekend (${postedDate.toLocaleDateString()})`,
        amount: totalDebit,
        confidence: 50,
        detectedAt: new Date(),
        reviewed: false,
      })
    }
  }

  // 3. Check trust transactions for compliance issues
  const trustTransactions = await prisma.trustTransaction.findMany({
    where: {
      trustAccount: { organizationId },
      transactionDate: { gte: startDate, lte: endDate },
    },
    include: { clientLedger: true },
  })

  for (const tt of trustTransactions) {
    scannedTransactions++
    const amount = Number(tt.amount)

    // Check for negative running balance (compliance violation)
    if (Number(tt.runningBalance) < 0) {
      anomalies.push({
        id: `anomaly-trust-negative-${tt.id}`,
        transactionId: tt.id,
        transactionType: 'trust_transaction',
        anomalyType: 'potential_fraud',
        severity: 'critical',
        description: `Trust account shows negative balance after transaction. This is a compliance violation.`,
        amount,
        confidence: 100,
        detectedAt: new Date(),
        reviewed: false,
      })
    }

    // Check for unusually large trust withdrawals
    if (tt.transactionType === 'disbursement' && amount > 50000) {
      anomalies.push({
        id: `anomaly-trust-large-${tt.id}`,
        transactionId: tt.id,
        transactionType: 'trust_transaction',
        anomalyType: 'unusual_amount',
        severity: 'medium',
        description: `Large trust disbursement of $${amount.toLocaleString()}. Verify authorization.`,
        amount,
        confidence: 70,
        detectedAt: new Date(),
        reviewed: false,
      })
    }
  }

  // 4. Check payments for anomalies
  const payments = await prisma.payment.findMany({
    where: {
      organizationId,
      paymentDate: { gte: startDate, lte: endDate },
    },
  })

  for (const payment of payments) {
    scannedTransactions++
    const amount = Number(payment.amount)

    // Check for payments without invoices
    if (!payment.invoiceId && amount > 1000) {
      anomalies.push({
        id: `anomaly-payment-noinvoice-${payment.id}`,
        transactionId: payment.id,
        transactionType: 'payment',
        anomalyType: 'unusual_pattern',
        severity: 'low',
        description: `Payment of $${amount.toLocaleString()} received without linked invoice`,
        amount,
        confidence: 65,
        detectedAt: new Date(),
        reviewed: false,
      })
    }
  }

  // Calculate summary
  const summary = {
    total: anomalies.length,
    bySeverity: {
      low: anomalies.filter(a => a.severity === 'low').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      critical: anomalies.filter(a => a.severity === 'critical').length,
    },
    byType: anomalies.reduce((acc, a) => {
      acc[a.anomalyType] = (acc[a.anomalyType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return {
    anomalies: anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }),
    summary,
    scannedTransactions,
    scanDate: new Date(),
  }
}

/**
 * Persist detected anomalies to database
 */
export async function persistAnomalies(
  organizationId: string,
  anomalies: TransactionAnomaly[]
): Promise<number> {
  let persisted = 0
  
  for (const anomaly of anomalies) {
    try {
      await prisma.financialAnomaly.upsert({
        where: {
          organizationId_transactionType_transactionId_anomalyType: {
            organizationId,
            transactionType: anomaly.transactionType,
            transactionId: anomaly.transactionId,
            anomalyType: anomaly.anomalyType,
          },
        },
        update: {
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: anomaly.description,
          amount: anomaly.amount,
          detectedAt: anomaly.detectedAt,
          metadata: {
            expectedRange: anomaly.expectedRange,
          },
        },
        create: {
          organizationId,
          transactionType: anomaly.transactionType,
          transactionId: anomaly.transactionId,
          anomalyType: anomaly.anomalyType,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: anomaly.description,
          amount: anomaly.amount,
          detectedAt: anomaly.detectedAt,
          detectionMethod: 'rule_based',
          metadata: {
            expectedRange: anomaly.expectedRange,
          },
        },
      })
      persisted++
    } catch (err) {
      console.warn(`Failed to persist anomaly ${anomaly.id}:`, err)
    }
  }
  
  return persisted
}

/**
 * Get persisted anomalies from database
 */
export async function getPersistedAnomalies(
  organizationId: string,
  options?: {
    status?: string
    severity?: string
    transactionType?: string
    limit?: number
    offset?: number
  }
) {
  const where: Record<string, unknown> = { organizationId }
  
  if (options?.status) where.status = options.status
  if (options?.severity) where.severity = options.severity
  if (options?.transactionType) where.transactionType = options.transactionType
  
  const [anomalies, total] = await Promise.all([
    prisma.financialAnomaly.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' },
      ],
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.financialAnomaly.count({ where }),
  ])
  
  return { anomalies, total }
}

/**
 * Flag a transaction for review
 */
export async function flagTransactionForReview(
  organizationId: string,
  anomalyId: string,
  userId: string,
  notes?: string
): Promise<void> {
  await prisma.financialAnomaly.update({
    where: { id: anomalyId },
    data: {
      status: 'reviewed',
      reviewedBy: userId,
      reviewedAt: new Date(),
      resolutionNotes: notes,
    },
  })
}

/**
 * Mark anomaly as resolved
 */
export async function resolveAnomaly(
  organizationId: string,
  anomalyId: string,
  userId: string,
  resolution: 'approved' | 'rejected' | 'corrected' | 'flagged_fraud',
  notes?: string
): Promise<void> {
  await prisma.financialAnomaly.update({
    where: { id: anomalyId },
    data: {
      status: 'resolved',
      resolution,
      reviewedBy: userId,
      reviewedAt: new Date(),
      resolutionNotes: notes,
    },
  })
}

/**
 * Dismiss an anomaly as false positive
 */
export async function dismissAnomaly(
  organizationId: string,
  anomalyId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await prisma.financialAnomaly.update({
    where: { id: anomalyId },
    data: {
      status: 'dismissed',
      resolution: 'approved',
      reviewedBy: userId,
      reviewedAt: new Date(),
      resolutionNotes: reason || 'Dismissed as false positive',
    },
  })
}

/**
 * Escalate an anomaly for further investigation
 */
export async function escalateAnomaly(
  organizationId: string,
  anomalyId: string,
  userId: string,
  reason: string
): Promise<void> {
  await prisma.financialAnomaly.update({
    where: { id: anomalyId },
    data: {
      status: 'escalated',
      reviewedBy: userId,
      reviewedAt: new Date(),
      resolutionNotes: reason,
    },
  })
}

/**
 * Get anomaly statistics for dashboard
 */
export async function getAnomalyStats(organizationId: string) {
  const [pending, byType, bySeverity, recentCritical] = await Promise.all([
    prisma.financialAnomaly.count({
      where: { organizationId, status: 'pending' },
    }),
    prisma.financialAnomaly.groupBy({
      by: ['anomalyType'],
      where: { organizationId, status: 'pending' },
      _count: true,
    }),
    prisma.financialAnomaly.groupBy({
      by: ['severity'],
      where: { organizationId, status: 'pending' },
      _count: true,
    }),
    prisma.financialAnomaly.findMany({
      where: { organizationId, severity: 'critical', status: 'pending' },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    }),
  ])
  
  return {
    pendingCount: pending,
    byType: byType.reduce((acc: Record<string, number>, item: { anomalyType: string; _count: number }) => {
      acc[item.anomalyType] = item._count
      return acc
    }, {} as Record<string, number>),
    bySeverity: bySeverity.reduce((acc: Record<string, number>, item: { severity: string; _count: number }) => {
      acc[item.severity] = item._count
      return acc
    }, {} as Record<string, number>),
    recentCritical,
  }
}

// ============================================================================
// AI ACCOUNT STRUCTURE SUGGESTIONS
// ============================================================================

export interface AccountStructureSuggestion {
  template: string
  templateName: string
  confidence: number
  reasoning: string
  additionalAccounts: Array<{
    accountNumber: string
    accountName: string
    accountType: string
    normalBalance: string
    reason: string
  }>
}

/**
 * AI suggests optimal chart of accounts structure based on firm profile
 */
export async function suggestAccountStructure(
  firmSize: 'solo' | 'small' | 'mid' | 'large',
  jurisdiction: string,
  practiceAreas: string[]
): Promise<AccountStructureSuggestion> {
  // Map practice areas to templates
  const practiceAreaTemplates: Record<string, string> = {
    litigation: 'litigation',
    'civil litigation': 'litigation',
    'trial practice': 'litigation',
    corporate: 'corporate',
    'business law': 'corporate',
    'mergers and acquisitions': 'corporate',
    'm&a': 'corporate',
    family: 'family',
    'family law': 'family',
    divorce: 'family',
    custody: 'family',
    'real estate': 'realEstate',
    property: 'realEstate',
    criminal: 'criminal',
    'criminal defense': 'criminal',
    dui: 'criminal',
    immigration: 'immigration',
    visa: 'immigration',
    'intellectual property': 'intellectualProperty',
    ip: 'intellectualProperty',
    patent: 'intellectualProperty',
    trademark: 'intellectualProperty',
    bankruptcy: 'bankruptcy',
    restructuring: 'bankruptcy',
    'personal injury': 'personalInjury',
    pi: 'personalInjury',
    'medical malpractice': 'personalInjury',
    estate: 'estatePlanning',
    'estate planning': 'estatePlanning',
    probate: 'estatePlanning',
    trusts: 'estatePlanning',
  }

  // Find best matching template
  let bestTemplate = 'litigation' // default
  let matchCount = 0

  for (const area of practiceAreas) {
    const normalizedArea = area.toLowerCase()
    for (const [key, template] of Object.entries(practiceAreaTemplates)) {
      if (normalizedArea.includes(key) || key.includes(normalizedArea)) {
        const currentMatchCount = practiceAreas.filter(a =>
          Object.keys(practiceAreaTemplates).some(k =>
            a.toLowerCase().includes(k) && practiceAreaTemplates[k] === template
          )
        ).length
        if (currentMatchCount > matchCount) {
          matchCount = currentMatchCount
          bestTemplate = template
        }
      }
    }
  }

  // Solo practitioners get simplified template
  if (firmSize === 'solo') {
    bestTemplate = 'solo'
  }

  // Generate additional account suggestions based on jurisdiction and size
  const additionalAccounts: AccountStructureSuggestion['additionalAccounts'] = []

  // Multi-state firms need separate trust accounts
  if (firmSize === 'mid' || firmSize === 'large') {
    additionalAccounts.push({
      accountNumber: '1015',
      accountName: `Cash - IOLTA Trust (${jurisdiction})`,
      accountType: 'asset',
      normalBalance: 'debit',
      reason: 'Separate trust account for jurisdiction-specific compliance',
    })
  }

  // Large firms need departmental tracking
  if (firmSize === 'large') {
    additionalAccounts.push({
      accountNumber: '4500',
      accountName: 'Legal Fees - By Department',
      accountType: 'revenue',
      normalBalance: 'credit',
      reason: 'Track revenue by practice group/department',
    })
    additionalAccounts.push({
      accountNumber: '5500',
      accountName: 'Partner Compensation',
      accountType: 'expense',
      normalBalance: 'debit',
      reason: 'Separate tracking for partner draws and compensation',
    })
  }

  // Calculate confidence
  const confidence = Math.min(95, 60 + (matchCount * 10) + (firmSize === 'solo' ? 15 : 0))

  const templateNames: Record<string, string> = {
    litigation: 'Litigation & Trial Practice',
    corporate: 'Corporate & Business Law',
    solo: 'Solo Practitioner',
    family: 'Family Law',
    realEstate: 'Real Estate Law',
    criminal: 'Criminal Defense',
    immigration: 'Immigration Law',
    intellectualProperty: 'Intellectual Property',
    bankruptcy: 'Bankruptcy & Restructuring',
    personalInjury: 'Personal Injury / Contingency',
    estatePlanning: 'Estate Planning & Probate',
  }

  return {
    template: bestTemplate,
    templateName: templateNames[bestTemplate] || bestTemplate,
    confidence,
    reasoning: `Based on ${practiceAreas.length > 0 ? practiceAreas.join(', ') : 'general practice'} practice areas and ${firmSize} firm size in ${jurisdiction}`,
    additionalAccounts,
  }
}

// ============================================================================
// SMART EXPENSE SPLITTING
// ============================================================================

export interface ExpenseSplitSuggestion {
  originalExpenseId: string
  splits: Array<{
    matterId: string
    matterName: string
    percentage: number
    amount: number
    reason: string
  }>
  confidence: number
}

/**
 * AI suggests how to split shared expenses across matters/clients
 */
export async function suggestExpenseSplit(
  organizationId: string,
  expenseId: string,
  expenseDescription: string,
  expenseAmount: number
): Promise<ExpenseSplitSuggestion> {
  // Get active matters for the organization
  const activeMatters = await prisma.matter.findMany({
    where: {
      organizationId,
      status: 'active',
    },
    include: {
      client: true,
      timeEntries: {
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { hours: true },
      },
    },
  })

  if (activeMatters.length === 0) {
    return {
      originalExpenseId: expenseId,
      splits: [],
      confidence: 0,
    }
  }

  // Calculate split based on recent time allocation
  const totalHours = activeMatters.reduce((sum, m) =>
    sum + m.timeEntries.reduce((h, te) => h + Number(te.hours), 0), 0
  )

  const splits = activeMatters
    .map(matter => {
      const matterHours = matter.timeEntries.reduce((h, te) => h + Number(te.hours), 0)
      const percentage = totalHours > 0 ? (matterHours / totalHours) * 100 : 100 / activeMatters.length
      return {
        matterId: matter.id,
        matterName: matter.name,
        percentage: Math.round(percentage * 100) / 100,
        amount: Math.round((expenseAmount * percentage / 100) * 100) / 100,
        reason: `${matterHours.toFixed(1)} hours billed in last 30 days (${percentage.toFixed(1)}% of total)`,
      }
    })
    .filter(s => s.percentage >= 5) // Only include matters with at least 5%
    .sort((a, b) => b.percentage - a.percentage)

  // Normalize to 100%
  const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0)
  if (totalPercentage !== 100 && splits.length > 0) {
    const adjustment = 100 - totalPercentage
    splits[0].percentage += adjustment
    splits[0].amount = Math.round((expenseAmount * splits[0].percentage / 100) * 100) / 100
  }

  return {
    originalExpenseId: expenseId,
    splits,
    confidence: totalHours > 0 ? 80 : 50,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
  return Math.sqrt(avgSquareDiff)
}
