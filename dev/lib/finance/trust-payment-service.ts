/**
 * Trust Retainer Auto-Deduction Payment Service
 * Handles paying invoices from client trust balances
 */

import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { createPayment } from './billing-service'
import { createTrustDisbursementJournalEntry } from './accounting-automation'

export interface TrustPaymentResult {
  success: boolean
  paymentId?: string
  trustTransactionId?: string
  amountPaid: number
  remainingBalance: number
  error?: string
}

/**
 * Get client's available trust balance for a matter or overall
 */
export async function getClientTrustBalance(
  organizationId: string,
  clientId: string,
  matterId?: string
): Promise<{ balance: number; ledgerId: string | null; currency: string }> {
  // First try to find matter-specific ledger
  if (matterId) {
    const matterLedger = await prisma.clientTrustLedger.findFirst({
      where: {
        clientId,
        matterId,
        status: 'active',
        trustAccount: { organizationId },
      },
      include: { trustAccount: true },
    })

    if (matterLedger && Number(matterLedger.balance) > 0) {
      return {
        balance: Number(matterLedger.balance),
        ledgerId: matterLedger.id,
        currency: matterLedger.currency,
      }
    }
  }

  // Fall back to client's general trust ledger (no matter)
  const clientLedger = await prisma.clientTrustLedger.findFirst({
    where: {
      clientId,
      matterId: null,
      status: 'active',
      trustAccount: { organizationId },
    },
    include: { trustAccount: true },
  })

  if (clientLedger) {
    return {
      balance: Number(clientLedger.balance),
      ledgerId: clientLedger.id,
      currency: clientLedger.currency,
    }
  }

  // Sum all client ledgers if no specific one found
  const allLedgers = await prisma.clientTrustLedger.findMany({
    where: {
      clientId,
      status: 'active',
      trustAccount: { organizationId },
    },
  })

  const totalBalance = allLedgers.reduce((sum, l) => sum + Number(l.balance), 0)
  const primaryLedger = allLedgers.find((l) => Number(l.balance) > 0)

  return {
    balance: totalBalance,
    ledgerId: primaryLedger?.id || null,
    currency: primaryLedger?.currency || 'USD',
  }
}

/**
 * Pay an invoice from client's trust balance
 */
export async function payInvoiceFromTrust(
  organizationId: string,
  invoiceId: string,
  amount: number,
  processedBy: string,
  options?: {
    matterId?: string
    ledgerId?: string
    description?: string
  }
): Promise<TrustPaymentResult> {
  // Get invoice details
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { client: true, matter: true },
  })

  if (!invoice) {
    return { success: false, amountPaid: 0, remainingBalance: 0, error: 'Invoice not found' }
  }

  const balanceDue = Number(invoice.balanceDue)
  if (balanceDue <= 0) {
    return { success: false, amountPaid: 0, remainingBalance: 0, error: 'Invoice already paid' }
  }

  // Determine payment amount
  const paymentAmount = Math.min(amount, balanceDue)

  // Find the trust ledger to use
  let ledgerId = options?.ledgerId
  let trustBalance: number

  if (ledgerId) {
    const ledger = await prisma.clientTrustLedger.findFirst({
      where: { id: ledgerId, clientId: invoice.clientId, status: 'active' },
    })
    if (!ledger) {
      return { success: false, amountPaid: 0, remainingBalance: 0, error: 'Trust ledger not found' }
    }
    trustBalance = Number(ledger.balance)
  } else {
    const trustInfo = await getClientTrustBalance(
      organizationId,
      invoice.clientId,
      options?.matterId || invoice.matterId || undefined
    )
    ledgerId = trustInfo.ledgerId || undefined
    trustBalance = trustInfo.balance
  }

  if (!ledgerId) {
    return { success: false, amountPaid: 0, remainingBalance: 0, error: 'No trust ledger found for client' }
  }

  if (trustBalance < paymentAmount) {
    return {
      success: false,
      amountPaid: 0,
      remainingBalance: trustBalance,
      error: `Insufficient trust balance. Available: ${trustBalance.toFixed(2)}, Required: ${paymentAmount.toFixed(2)}`,
    }
  }

  // Get ledger details for transaction
  const ledger = await prisma.clientTrustLedger.findUnique({
    where: { id: ledgerId },
    include: { trustAccount: true },
  })

  if (!ledger) {
    return { success: false, amountPaid: 0, remainingBalance: 0, error: 'Trust ledger not found' }
  }

  // Execute the trust payment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create trust transaction (disbursement to operating)
    const newBalance = Number(ledger.balance) - paymentAmount
    const trustTransaction = await tx.trustTransaction.create({
      data: {
        trustAccountId: ledger.trustAccountId,
        clientLedgerId: ledgerId!,
        transactionType: 'transfer_to_operating',
        amount: new Decimal(paymentAmount),
        runningBalance: new Decimal(newBalance),
        currency: ledger.currency,
        description: options?.description || `Payment for Invoice ${invoice.invoiceNumber}`,
        referenceNumber: invoice.invoiceNumber,
        transactionDate: new Date(),
        postedDate: new Date(),
        createdBy: processedBy,
      },
    })

    // 2. Update ledger balance
    await tx.clientTrustLedger.update({
      where: { id: ledgerId },
      data: {
        balance: new Decimal(newBalance),
        lastActivityAt: new Date(),
      },
    })

    // 3. Update trust account balance
    await tx.trustAccount.update({
      where: { id: ledger.trustAccountId },
      data: {
        currentBalance: {
          decrement: paymentAmount,
        },
      },
    })

    return { trustTransaction, newBalance }
  })

  // 4. Create payment record (outside transaction to avoid nesting issues)
  const payment = await createPayment({
    organizationId,
    invoiceId,
    clientId: invoice.clientId,
    amount: paymentAmount,
    currency: ledger.currency,
    paymentMethod: 'trust_transfer',
    paymentDate: new Date(),
    trustTransactionId: result.trustTransaction.id,
    referenceNumber: `TRUST-${result.trustTransaction.id.slice(0, 8)}`,
    notes: `Paid from trust retainer - ${options?.description || ''}`.trim(),
    processedBy,
  })

  // 5. Create accounting journal entry
  try {
    await createTrustDisbursementJournalEntry(
      organizationId,
      result.trustTransaction.id,
      invoice.clientId,
      paymentAmount,
      processedBy
    )
  } catch (err) {
    console.warn('Failed to create trust disbursement journal entry:', err)
  }

  return {
    success: true,
    paymentId: payment.id,
    trustTransactionId: result.trustTransaction.id,
    amountPaid: paymentAmount,
    remainingBalance: result.newBalance,
  }
}

/**
 * Auto-pay invoice from trust if sufficient balance exists
 * Returns null if no trust balance available, otherwise returns payment result
 */
export async function autoPayFromTrustIfAvailable(
  organizationId: string,
  invoiceId: string,
  processedBy: string
): Promise<TrustPaymentResult | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  })

  if (!invoice || Number(invoice.balanceDue) <= 0) {
    return null
  }

  const trustInfo = await getClientTrustBalance(
    organizationId,
    invoice.clientId,
    invoice.matterId || undefined
  )

  if (trustInfo.balance <= 0 || !trustInfo.ledgerId) {
    return null
  }

  // Pay as much as possible from trust
  const amountToPay = Math.min(trustInfo.balance, Number(invoice.balanceDue))

  return payInvoiceFromTrust(
    organizationId,
    invoiceId,
    amountToPay,
    processedBy,
    {
      matterId: invoice.matterId || undefined,
      ledgerId: trustInfo.ledgerId,
      description: 'Auto-deduction from trust retainer',
    }
  )
}

/**
 * Check if invoice can be paid from trust
 */
export async function canPayFromTrust(
  organizationId: string,
  invoiceId: string
): Promise<{
  canPay: boolean
  availableBalance: number
  invoiceBalance: number
  canPayFull: boolean
}> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  })

  if (!invoice) {
    return { canPay: false, availableBalance: 0, invoiceBalance: 0, canPayFull: false }
  }

  const trustInfo = await getClientTrustBalance(
    organizationId,
    invoice.clientId,
    invoice.matterId || undefined
  )

  const invoiceBalance = Number(invoice.balanceDue)

  return {
    canPay: trustInfo.balance > 0 && invoiceBalance > 0,
    availableBalance: trustInfo.balance,
    invoiceBalance,
    canPayFull: trustInfo.balance >= invoiceBalance,
  }
}
