import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// CHECK PRINTING SERVICE
// Generate check runs and manage check printing for vendor payments
// ============================================================================

export interface CheckRunItem {
  billId: string
  vendorId: string
  vendorName: string
  vendorAddress?: string
  amount: number
  memo?: string
}

export interface CheckRunResult {
  checkRunId: string
  checkDate: Date
  startingCheckNumber: number
  checks: Array<{
    checkNumber: number
    vendorId: string
    vendorName: string
    amount: number
    billIds: string[]
    memo: string
  }>
  totalAmount: number
  checkCount: number
}

export async function generateCheckRunNumber(organizationId: string): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.systemSetting.findFirst({
    where: { key: `checkRunCount:${organizationId}:${dateStr}` },
  })

  const runNumber = count?.value ? parseInt(count.value) + 1 : 1

  await prisma.systemSetting.upsert({
    where: { key: `checkRunCount:${organizationId}:${dateStr}` },
    update: { value: String(runNumber) },
    create: { key: `checkRunCount:${organizationId}:${dateStr}`, value: String(runNumber) },
  })

  return `CHK-${dateStr}-${String(runNumber).padStart(3, '0')}`
}

export async function getNextCheckNumber(organizationId: string): Promise<number> {
  const setting = await prisma.systemSetting.findFirst({
    where: { key: `lastCheckNumber:${organizationId}` },
  })

  return setting?.value ? parseInt(setting.value) + 1 : 1001
}

export async function updateLastCheckNumber(
  organizationId: string,
  checkNumber: number
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: `lastCheckNumber:${organizationId}` },
    update: { value: String(checkNumber) },
    create: { key: `lastCheckNumber:${organizationId}`, value: String(checkNumber) },
  })
}

export interface CreateCheckRunInput {
  organizationId: string
  billIds: string[]
  checkDate: Date
  startingCheckNumber?: number
  createdBy: string
  consolidateByVendor?: boolean
}

export async function createCheckRun(input: CreateCheckRunInput): Promise<CheckRunResult> {
  const checkRunId = await generateCheckRunNumber(input.organizationId)
  let currentCheckNumber = input.startingCheckNumber || await getNextCheckNumber(input.organizationId)

  // Fetch bills with vendor info
  const bills = await prisma.vendorBill.findMany({
    where: {
      id: { in: input.billIds },
      organizationId: input.organizationId,
      status: { in: ['approved', 'scheduled'] },
      balanceDue: { gt: 0 },
    },
    include: {
      vendor: true,
    },
  })

  if (bills.length === 0) {
    throw new Error('No eligible bills found for check run')
  }

  // Group by vendor if consolidating
  const checkItems: Map<string, {
    vendor: typeof bills[0]['vendor']
    bills: typeof bills
    totalAmount: number
  }> = new Map()

  for (const bill of bills) {
    const key = input.consolidateByVendor ? bill.vendorId : bill.id

    if (!checkItems.has(key)) {
      checkItems.set(key, {
        vendor: bill.vendor,
        bills: [],
        totalAmount: 0,
      })
    }

    const item = checkItems.get(key)!
    item.bills.push(bill)
    item.totalAmount += Number(bill.balanceDue)
  }

  const checks: CheckRunResult['checks'] = []
  let totalAmount = 0

  // Create payments and generate check data
  await prisma.$transaction(async (tx) => {
    for (const [, item] of checkItems) {
      const checkNumber = currentCheckNumber++
      const amount = item.totalAmount

      // Create payment records for each bill
      for (const bill of item.bills) {
        await tx.vendorPayment.create({
          data: {
            organizationId: input.organizationId,
            vendorId: bill.vendorId,
            billId: bill.id,
            amount: bill.balanceDue,
            currency: bill.currency || 'USD',
            paymentMethod: 'check',
            paymentDate: input.checkDate,
            checkNumber: String(checkNumber),
            status: 'pending', // Will be 'completed' after checks are printed
            notes: `Check Run: ${checkRunId}`,
            processedBy: input.createdBy,
          },
        })

        // Update bill status
        await tx.vendorBill.update({
          where: { id: bill.id },
          data: {
            status: 'paid',
            paidAmount: bill.totalAmount,
            balanceDue: new Decimal(0),
            paidAt: input.checkDate,
            paymentMethod: 'check',
            paymentReference: `Check #${checkNumber}`,
          },
        })
      }

      // Update vendor totals
      await tx.vendor.update({
        where: { id: item.vendor.id },
        data: {
          totalPaid: { increment: amount },
        },
      })

      const billNumbers = item.bills.map((b) => b.billNumber).join(', ')
      checks.push({
        checkNumber,
        vendorId: item.vendor.id,
        vendorName: item.vendor.name,
        amount,
        billIds: item.bills.map((b) => b.id),
        memo: `Payment for: ${billNumbers}`,
      })

      totalAmount += amount
    }
  })

  // Update last check number
  await updateLastCheckNumber(input.organizationId, currentCheckNumber - 1)

  // Store check run metadata
  await prisma.systemSetting.upsert({
    where: { key: `checkRun:${checkRunId}` },
    update: {
      value: JSON.stringify({
        checkRunId,
        organizationId: input.organizationId,
        checkDate: input.checkDate.toISOString(),
        startingCheckNumber: input.startingCheckNumber || currentCheckNumber - checks.length,
        endingCheckNumber: currentCheckNumber - 1,
        checkCount: checks.length,
        totalAmount,
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
        status: 'generated',
      }),
    },
    create: {
      key: `checkRun:${checkRunId}`,
      value: JSON.stringify({
        checkRunId,
        organizationId: input.organizationId,
        checkDate: input.checkDate.toISOString(),
        startingCheckNumber: input.startingCheckNumber || currentCheckNumber - checks.length,
        endingCheckNumber: currentCheckNumber - 1,
        checkCount: checks.length,
        totalAmount,
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
        status: 'generated',
      }),
    },
  })

  return {
    checkRunId,
    checkDate: input.checkDate,
    startingCheckNumber: input.startingCheckNumber || currentCheckNumber - checks.length,
    checks,
    totalAmount,
    checkCount: checks.length,
  }
}

export interface CheckPrintData {
  checkNumber: number
  date: string
  payee: string
  payeeAddress: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
  }
  amount: number
  amountInWords: string
  memo: string
}

export function generateCheckPrintData(
  check: CheckRunResult['checks'][0],
  checkDate: Date,
  vendorAddress?: {
    address1?: string
    address2?: string
    city?: string
    state?: string
    postalCode?: string
  }
): CheckPrintData {
  return {
    checkNumber: check.checkNumber,
    date: checkDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    payee: check.vendorName,
    payeeAddress: {
      line1: vendorAddress?.address1,
      line2: vendorAddress?.address2,
      city: vendorAddress?.city,
      state: vendorAddress?.state,
      postalCode: vendorAddress?.postalCode,
    },
    amount: check.amount,
    amountInWords: numberToWords(check.amount),
    memo: check.memo,
  }
}

function numberToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  const dollars = Math.floor(amount)
  const cents = Math.round((amount - dollars) * 100)

  function convertHundreds(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '')
  }

  function convert(n: number): string {
    if (n === 0) return 'Zero'

    let result = ''

    if (n >= 1000000) {
      result += convertHundreds(Math.floor(n / 1000000)) + ' Million '
      n %= 1000000
    }

    if (n >= 1000) {
      result += convertHundreds(Math.floor(n / 1000)) + ' Thousand '
      n %= 1000
    }

    result += convertHundreds(n)

    return result.trim()
  }

  const dollarsInWords = convert(dollars)
  const centsStr = cents.toString().padStart(2, '0')

  return `${dollarsInWords} and ${centsStr}/100 Dollars`
}

export async function getCheckRunHistory(
  organizationId: string,
  limit = 50
): Promise<Array<{
  checkRunId: string
  checkDate: string
  checkCount: number
  totalAmount: number
  status: string
  createdAt: string
}>> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { startsWith: 'checkRun:CHK-' },
    },
    orderBy: { key: 'desc' },
    take: limit * 2, // Fetch more to filter by org
  })

  const runs: Array<{
    checkRunId: string
    checkDate: string
    checkCount: number
    totalAmount: number
    status: string
    createdAt: string
  }> = []

  for (const setting of settings) {
    try {
      const data = JSON.parse(setting.value)
      if (data.organizationId === organizationId) {
        runs.push({
          checkRunId: data.checkRunId,
          checkDate: data.checkDate,
          checkCount: data.checkCount,
          totalAmount: data.totalAmount,
          status: data.status,
          createdAt: data.createdAt,
        })
        if (runs.length >= limit) break
      }
    } catch {
      // Skip invalid entries
    }
  }

  return runs
}

export async function voidCheck(
  organizationId: string,
  checkNumber: string,
  voidedBy: string,
  reason: string
): Promise<void> {
  // Find payment with this check number
  const payment = await prisma.vendorPayment.findFirst({
    where: {
      organizationId,
      checkNumber,
      paymentMethod: 'check',
    },
    include: {
      bill: true,
    },
  })

  if (!payment) {
    throw new Error('Check not found')
  }

  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.vendorPayment.update({
      where: { id: payment.id },
      data: {
        status: 'voided',
        notes: `${payment.notes || ''}\nVoided by ${voidedBy}: ${reason}`,
      },
    })

    // Reverse bill payment if applicable
    if (payment.bill) {
      const newPaidAmount = Math.max(0, Number(payment.bill.paidAmount) - Number(payment.amount))
      const newBalanceDue = Number(payment.bill.totalAmount) - newPaidAmount

      await tx.vendorBill.update({
        where: { id: payment.bill.id },
        data: {
          paidAmount: new Decimal(newPaidAmount),
          balanceDue: new Decimal(newBalanceDue),
          status: newBalanceDue > 0 ? 'approved' : 'paid',
          paidAt: newBalanceDue > 0 ? null : payment.bill.paidAt,
        },
      })
    }

    // Reverse vendor total
    await tx.vendor.update({
      where: { id: payment.vendorId },
      data: {
        totalPaid: { decrement: Number(payment.amount) },
      },
    })
  })
}
