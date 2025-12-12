import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// TRUST ACCOUNT SERVICE
// ============================================================================

export interface CreateTrustAccountInput {
  organizationId: string
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  accountType?: 'IOLTA' | 'client_trust' | 'escrow'
  currency?: string
  jurisdiction: string
  stateBarId?: string
  interestRate?: number
}

export async function createTrustAccount(input: CreateTrustAccountInput) {
  return prisma.trustAccount.create({
    data: {
      organizationId: input.organizationId,
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      routingNumber: input.routingNumber,
      accountType: input.accountType || 'IOLTA',
      currency: input.currency || 'USD',
      jurisdiction: input.jurisdiction,
      stateBarId: input.stateBarId,
      interestRate: input.interestRate ? new Decimal(input.interestRate) : null,
      currentBalance: new Decimal(0),
      isActive: true,
    },
  })
}

export async function getTrustAccounts(organizationId: string, options?: {
  isActive?: boolean
  jurisdiction?: string
}) {
  const where: Record<string, unknown> = { organizationId }
  
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }
  if (options?.jurisdiction) {
    where.jurisdiction = options.jurisdiction
  }

  return prisma.trustAccount.findMany({
    where,
    include: {
      _count: {
        select: {
          clientLedgers: true,
          transactions: true,
        },
      },
    },
    orderBy: { accountName: 'asc' },
  })
}

export async function getTrustAccountById(id: string, organizationId: string) {
  return prisma.trustAccount.findFirst({
    where: { id, organizationId },
    include: {
      clientLedgers: {
        include: { client: true, matter: true },
        orderBy: { ledgerName: 'asc' },
      },
      _count: {
        select: { transactions: true, reconciliations: true },
      },
    },
  })
}

export async function updateTrustAccount(
  id: string,
  organizationId: string,
  data: Partial<CreateTrustAccountInput>
) {
  return prisma.trustAccount.update({
    where: { id },
    data: {
      accountName: data.accountName,
      bankName: data.bankName,
      jurisdiction: data.jurisdiction,
      stateBarId: data.stateBarId,
      interestRate: data.interestRate ? new Decimal(data.interestRate) : undefined,
    },
  })
}

export async function deactivateTrustAccount(id: string, organizationId: string) {
  const account = await prisma.trustAccount.findFirst({
    where: { id, organizationId },
  })

  if (!account) {
    throw new Error('Trust account not found')
  }

  if (Number(account.currentBalance) !== 0) {
    throw new Error('Cannot deactivate account with non-zero balance')
  }

  return prisma.trustAccount.update({
    where: { id },
    data: { isActive: false },
  })
}

// ============================================================================
// CLIENT TRUST LEDGER SERVICE
// ============================================================================

export interface CreateClientLedgerInput {
  trustAccountId: string
  clientId: string
  matterId?: string
  ledgerName: string
}

export async function createClientLedger(input: CreateClientLedgerInput) {
  const trustAccount = await prisma.trustAccount.findUnique({
    where: { id: input.trustAccountId },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  return prisma.clientTrustLedger.create({
    data: {
      trustAccountId: input.trustAccountId,
      clientId: input.clientId,
      matterId: input.matterId,
      ledgerName: input.ledgerName,
      balance: new Decimal(0),
      currency: trustAccount.currency,
      status: 'active',
    },
    include: {
      client: true,
      matter: true,
    },
  })
}

export async function getClientLedgers(trustAccountId: string, options?: {
  status?: string
  clientId?: string
}) {
  const where: Record<string, unknown> = { trustAccountId }

  if (options?.status) {
    where.status = options.status
  }
  if (options?.clientId) {
    where.clientId = options.clientId
  }

  return prisma.clientTrustLedger.findMany({
    where,
    include: {
      client: true,
      matter: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { ledgerName: 'asc' },
  })
}

export async function getClientLedgerById(id: string) {
  return prisma.clientTrustLedger.findUnique({
    where: { id },
    include: {
      client: true,
      matter: true,
      trustAccount: true,
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 100,
      },
    },
  })
}

export async function getLedgerTransactions(ledgerId: string, options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { clientLedgerId: ledgerId }

  if (options?.startDate || options?.endDate) {
    where.transactionDate = {}
    if (options?.startDate) {
      (where.transactionDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.transactionDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.trustTransaction.count({ where }),
  ])

  return { transactions, total }
}

// ============================================================================
// TRUST TRANSACTION SERVICE
// ============================================================================

export interface CreateTrustTransactionInput {
  trustAccountId: string
  clientLedgerId: string
  transactionType: 'deposit' | 'transfer_to_operating' | 'disbursement' | 'refund' | 'interest'
  amount: number
  description: string
  paymentMethod?: string
  checkNumber?: string
  referenceNumber?: string
  payee?: string
  fromAccount?: string
  toAccount?: string
  transactionDate: Date
  createdBy: string
}

export async function createTrustTransaction(input: CreateTrustTransactionInput) {
  const ledger = await prisma.clientTrustLedger.findUnique({
    where: { id: input.clientLedgerId },
    include: { trustAccount: true },
  })

  if (!ledger) {
    throw new Error('Client ledger not found')
  }

  const isDebit = ['transfer_to_operating', 'disbursement', 'refund'].includes(input.transactionType)
  const currentBalance = Number(ledger.balance)
  const newBalance = isDebit ? currentBalance - input.amount : currentBalance + input.amount

  if (isDebit && newBalance < 0) {
    throw new Error('Insufficient funds: transaction would result in negative balance')
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const txn = await tx.trustTransaction.create({
      data: {
        trustAccountId: input.trustAccountId,
        clientLedgerId: input.clientLedgerId,
        transactionType: input.transactionType,
        amount: new Decimal(input.amount),
        runningBalance: new Decimal(newBalance),
        currency: ledger.currency,
        description: input.description,
        paymentMethod: input.paymentMethod,
        checkNumber: input.checkNumber,
        referenceNumber: input.referenceNumber,
        payee: input.payee,
        fromAccount: input.fromAccount,
        toAccount: input.toAccount,
        transactionDate: input.transactionDate,
        createdBy: input.createdBy,
      },
    })

    await tx.clientTrustLedger.update({
      where: { id: input.clientLedgerId },
      data: {
        balance: new Decimal(newBalance),
        lastActivityAt: new Date(),
        status: 'active',
        dormantSince: null,
      },
    })

    const trustAccountBalance = Number(ledger.trustAccount.currentBalance)
    const newTrustBalance = isDebit
      ? trustAccountBalance - input.amount
      : trustAccountBalance + input.amount

    await tx.trustAccount.update({
      where: { id: input.trustAccountId },
      data: { currentBalance: new Decimal(newTrustBalance) },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: txn.id,
        eventType: 'created',
        eventData: {
          transactionType: input.transactionType,
          amount: input.amount,
          description: input.description,
          previousBalance: currentBalance,
          newBalance,
        },
        userId: input.createdBy,
      },
    })

    return txn
  })

  return transaction
}

export async function getTrustTransactions(organizationId: string, options?: {
  trustAccountId?: string
  clientLedgerId?: string
  transactionType?: string
  startDate?: Date
  endDate?: Date
  isReconciled?: boolean
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId },
  }

  if (options?.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options?.clientLedgerId) {
    where.clientLedgerId = options.clientLedgerId
  }
  if (options?.transactionType) {
    where.transactionType = options.transactionType
  }
  if (options?.isReconciled !== undefined) {
    where.isReconciled = options.isReconciled
  }
  if (options?.startDate || options?.endDate) {
    where.transactionDate = {}
    if (options?.startDate) {
      (where.transactionDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.transactionDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      include: {
        clientLedger: { include: { client: true } },
        trustAccount: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.trustTransaction.count({ where }),
  ])

  return { transactions, total }
}

export async function getTrustTransactionById(id: string) {
  return prisma.trustTransaction.findUnique({
    where: { id },
    include: {
      clientLedger: { include: { client: true, matter: true } },
      trustAccount: true,
      auditLogs: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function voidTrustTransaction(
  id: string,
  voidedBy: string,
  voidReason: string
) {
  const transaction = await prisma.trustTransaction.findUnique({
    where: { id },
    include: { clientLedger: true, trustAccount: true },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.voidedAt) {
    throw new Error('Transaction already voided')
  }

  if (transaction.isReconciled) {
    throw new Error('Cannot void reconciled transaction')
  }

  const isDebit = ['transfer_to_operating', 'disbursement', 'refund'].includes(
    transaction.transactionType
  )
  const amount = Number(transaction.amount)
  const currentLedgerBalance = Number(transaction.clientLedger.balance)
  const currentTrustBalance = Number(transaction.trustAccount.currentBalance)

  const newLedgerBalance = isDebit
    ? currentLedgerBalance + amount
    : currentLedgerBalance - amount
  const newTrustBalance = isDebit
    ? currentTrustBalance + amount
    : currentTrustBalance - amount

  await prisma.$transaction(async (tx) => {
    await tx.trustTransaction.update({
      where: { id },
      data: {
        voidedAt: new Date(),
        voidedBy,
        voidReason,
      },
    })

    await tx.clientTrustLedger.update({
      where: { id: transaction.clientLedgerId },
      data: { balance: new Decimal(newLedgerBalance) },
    })

    await tx.trustAccount.update({
      where: { id: transaction.trustAccountId },
      data: { currentBalance: new Decimal(newTrustBalance) },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: id,
        eventType: 'voided',
        eventData: {
          voidReason,
          previousLedgerBalance: currentLedgerBalance,
          newLedgerBalance,
        },
        userId: voidedBy,
      },
    })
  })
}

export async function approveTrustTransaction(id: string, approvedBy: string) {
  const transaction = await prisma.trustTransaction.findUnique({
    where: { id },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.approvedAt) {
    throw new Error('Transaction already approved')
  }

  await prisma.$transaction(async (tx) => {
    await tx.trustTransaction.update({
      where: { id },
      data: {
        approvedBy,
        approvedAt: new Date(),
      },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: id,
        eventType: 'approved',
        eventData: { approvedBy },
        userId: approvedBy,
      },
    })
  })
}

// ============================================================================
// THREE-WAY RECONCILIATION SERVICE
// ============================================================================

export interface StartReconciliationInput {
  trustAccountId: string
  periodStart: Date
  periodEnd: Date
  bankBalance: number
  reconciledBy: string
}

export async function startReconciliation(input: StartReconciliationInput) {
  const trustAccount = await prisma.trustAccount.findUnique({
    where: { id: input.trustAccountId },
    include: {
      clientLedgers: true,
      transactions: {
        where: {
          transactionDate: { gte: input.periodStart, lte: input.periodEnd },
          voidedAt: null,
        },
      },
    },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  const trustLedgerBalance = Number(trustAccount.currentBalance)
  const clientLedgersTotal = trustAccount.clientLedgers.reduce(
    (sum, l) => sum + Number(l.balance),
    0
  )

  const outstandingDeposits = trustAccount.transactions
    .filter((t) => !t.isCleared && ['deposit', 'interest'].includes(t.transactionType))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const outstandingChecks = trustAccount.transactions
    .filter(
      (t) =>
        !t.isCleared &&
        ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const adjustedBankBalance =
    input.bankBalance + outstandingDeposits - outstandingChecks

  const discrepancy = Math.abs(adjustedBankBalance - trustLedgerBalance)
  const isBalanced = discrepancy < 0.01

  const threeWayDiscrepancy = Math.abs(trustLedgerBalance - clientLedgersTotal)
  const threeWayBalanced = threeWayDiscrepancy < 0.01

  return prisma.trustReconciliation.create({
    data: {
      trustAccountId: input.trustAccountId,
      reconciliationDate: new Date(),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      bankBalance: new Decimal(input.bankBalance),
      trustLedgerBalance: new Decimal(trustLedgerBalance),
      clientLedgersTotal: new Decimal(clientLedgersTotal),
      outstandingDeposits: new Decimal(outstandingDeposits),
      outstandingChecks: new Decimal(outstandingChecks),
      adjustedBankBalance: new Decimal(adjustedBankBalance),
      isBalanced: isBalanced && threeWayBalanced,
      discrepancy: isBalanced ? null : new Decimal(discrepancy),
      discrepancyNotes: !threeWayBalanced
        ? `Three-way reconciliation discrepancy: Trust ledger (${trustLedgerBalance}) vs Client ledgers (${clientLedgersTotal})`
        : null,
      status: 'draft',
      reconciledBy: input.reconciledBy,
    },
  })
}

export async function getReconciliations(organizationId: string, options?: {
  trustAccountId?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId },
  }

  if (options?.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options?.status) {
    where.status = options.status
  }

  const [reconciliations, total] = await Promise.all([
    prisma.trustReconciliation.findMany({
      where,
      include: { trustAccount: true },
      orderBy: { reconciliationDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.trustReconciliation.count({ where }),
  ])

  return { reconciliations, total }
}

export async function getReconciliationById(id: string) {
  return prisma.trustReconciliation.findUnique({
    where: { id },
    include: {
      trustAccount: {
        include: { clientLedgers: { include: { client: true } } },
      },
      bankStatement: { include: { transactions: true } },
    },
  })
}

export async function completeReconciliation(id: string, notes?: string) {
  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { id },
  })

  if (!reconciliation) {
    throw new Error('Reconciliation not found')
  }

  if (!reconciliation.isBalanced) {
    throw new Error('Cannot complete unbalanced reconciliation')
  }

  return prisma.$transaction(async (tx) => {
    await tx.trustReconciliation.update({
      where: { id },
      data: {
        status: 'completed',
        notes,
      },
    })

    await tx.trustTransaction.updateMany({
      where: {
        trustAccountId: reconciliation.trustAccountId,
        transactionDate: {
          gte: reconciliation.periodStart,
          lte: reconciliation.periodEnd,
        },
        isReconciled: false,
        voidedAt: null,
      },
      data: {
        isReconciled: true,
        reconciledDate: new Date(),
        reconciledBy: reconciliation.reconciledBy,
      },
    })

    await tx.trustAccount.update({
      where: { id: reconciliation.trustAccountId },
      data: {
        lastReconciledBalance: reconciliation.trustLedgerBalance,
        lastReconciledDate: new Date(),
      },
    })

    return tx.trustReconciliation.findUnique({ where: { id } })
  })
}

export async function approveReconciliation(id: string, approvedBy: string) {
  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { id },
  })

  if (!reconciliation) {
    throw new Error('Reconciliation not found')
  }

  if (reconciliation.status !== 'completed') {
    throw new Error('Reconciliation must be completed before approval')
  }

  return prisma.trustReconciliation.update({
    where: { id },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

// ============================================================================
// COMPLIANCE CHECKS
// ============================================================================

export interface ComplianceAlert {
  type: 'negative_balance' | 'commingling' | 'dormant' | 'missing_reconciliation' | 'unusual_activity'
  severity: 'critical' | 'warning' | 'info'
  message: string
  entityId: string
  entityType: 'ledger' | 'account' | 'transaction'
  details?: Record<string, unknown>
}

export async function runComplianceCheck(organizationId: string): Promise<ComplianceAlert[]> {
  const alerts: ComplianceAlert[] = []

  const ledgers = await prisma.clientTrustLedger.findMany({
    where: { trustAccount: { organizationId } },
    include: { trustAccount: true, client: true },
  })

  for (const ledger of ledgers) {
    if (Number(ledger.balance) < 0) {
      alerts.push({
        type: 'negative_balance',
        severity: 'critical',
        message: `Negative balance detected: ${ledger.ledgerName} has balance of $${ledger.balance}`,
        entityId: ledger.id,
        entityType: 'ledger',
        details: { balance: Number(ledger.balance), clientName: ledger.client.displayName },
      })
    }

    const dormantThreshold = new Date()
    dormantThreshold.setMonth(dormantThreshold.getMonth() - 12)

    if (
      ledger.lastActivityAt &&
      ledger.lastActivityAt < dormantThreshold &&
      Number(ledger.balance) > 0
    ) {
      alerts.push({
        type: 'dormant',
        severity: 'warning',
        message: `Dormant account: ${ledger.ledgerName} has had no activity for over 12 months`,
        entityId: ledger.id,
        entityType: 'ledger',
        details: {
          lastActivity: ledger.lastActivityAt,
          balance: Number(ledger.balance),
        },
      })
    }
  }

  const accounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
    include: { clientLedgers: true },
  })

  for (const account of accounts) {
    const clientTotal = account.clientLedgers.reduce(
      (sum, l) => sum + Number(l.balance),
      0
    )
    const accountBalance = Number(account.currentBalance)

    if (Math.abs(accountBalance - clientTotal) > 0.01) {
      alerts.push({
        type: 'commingling',
        severity: 'critical',
        message: `Potential commingling: ${account.accountName} balance ($${accountBalance}) doesn't match client ledgers total ($${clientTotal})`,
        entityId: account.id,
        entityType: 'account',
        details: { accountBalance, clientTotal, difference: accountBalance - clientTotal },
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (!account.lastReconciledDate || account.lastReconciledDate < thirtyDaysAgo) {
      alerts.push({
        type: 'missing_reconciliation',
        severity: 'warning',
        message: `Missing reconciliation: ${account.accountName} has not been reconciled in over 30 days`,
        entityId: account.id,
        entityType: 'account',
        details: { lastReconciled: account.lastReconciledDate },
      })
    }
  }

  return alerts
}

export async function getComplianceAlerts(organizationId: string) {
  return runComplianceCheck(organizationId)
}
