import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { importBankStatement, listBankStatements } from '@/lib/finance/trust-service'
import { parseCsvBankStatement, parseOfxQfxBankStatement } from '@/lib/finance/bank-statement-parser'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: trustAccountId } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const trustAccount = await prisma.trustAccount.findFirst({
      where: { id: trustAccountId, organizationId },
    })

    if (!trustAccount) {
      return NextResponse.json({ error: 'Trust account not found' }, { status: 404 })
    }

    const result = await listBankStatements(trustAccountId, { limit, offset })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching bank statements:', error)
    return NextResponse.json({ error: 'Failed to fetch bank statements' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: trustAccountId } = await params
    const contentType = request.headers.get('content-type') || ''

    let organizationId: string | null = null
    let statementDate: string | null = null
    let periodStart: string | null = null
    let periodEnd: string | null = null
    let openingBalance: number | undefined
    let closingBalance: number | undefined
    let fileUrl: string | undefined
    let format: 'csv' | 'ofx' | 'qfx' | undefined
    let transactions: Array<{
      transactionDate: string
      description: string
      amount: number
      transactionType: 'debit' | 'credit'
      checkNumber?: string
      referenceNumber?: string
    }> | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      organizationId = (form.get('organizationId') as string) || null
      statementDate = (form.get('statementDate') as string) || null
      periodStart = (form.get('periodStart') as string) || null
      periodEnd = (form.get('periodEnd') as string) || null
      const openingBalanceRaw = form.get('openingBalance') as string
      const closingBalanceRaw = form.get('closingBalance') as string
      openingBalance = openingBalanceRaw !== null && openingBalanceRaw !== undefined && openingBalanceRaw !== ''
        ? Number(openingBalanceRaw)
        : undefined
      closingBalance = closingBalanceRaw !== null && closingBalanceRaw !== undefined && closingBalanceRaw !== ''
        ? Number(closingBalanceRaw)
        : undefined
      fileUrl = (form.get('fileUrl') as string) || undefined

      const file = form.get('file')
      const fmtRaw = (form.get('format') as string) || ''
      if (fmtRaw === 'csv' || fmtRaw === 'ofx' || fmtRaw === 'qfx') {
        format = fmtRaw
      }

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'file is required for multipart import' },
          { status: 400 }
        )
      }

      const name = (file as File).name || ''
      if (!format) {
        const lower = name.toLowerCase()
        if (lower.endsWith('.csv')) format = 'csv'
        if (lower.endsWith('.ofx')) format = 'ofx'
        if (lower.endsWith('.qfx')) format = 'qfx'
      }

      if (!format) {
        return NextResponse.json(
          { error: 'Format must be csv, ofx, or qfx' },
          { status: 400 }
        )
      }

      const text = await (file as File).text()
      const parsed =
        format === 'csv'
          ? parseCsvBankStatement(text)
          : parseOfxQfxBankStatement(text, format)

      const parsedTxns = parsed.transactions
      const net = parsedTxns.reduce((sum, t) => {
        return sum + (t.transactionType === 'credit' ? t.amount : -t.amount)
      }, 0)

      const closing = closingBalance ?? parsed.closingBalance
      const opening = openingBalance ?? parsed.openingBalance

      if (closing === undefined && opening === undefined) {
        return NextResponse.json(
          { error: 'openingBalance or closingBalance is required (CSV/OFX/QFX may not include balances)' },
          { status: 400 }
        )
      }

      const computedClosing = closing !== undefined ? closing : (opening as number) + net
      const computedOpening = opening !== undefined ? opening : computedClosing - net

      if (!Number.isFinite(computedOpening) || !Number.isFinite(computedClosing)) {
        return NextResponse.json(
          { error: 'Invalid opening/closing balance values' },
          { status: 400 }
        )
      }

      openingBalance = computedOpening
      closingBalance = computedClosing

      const start = parsed.periodStart
      const end = parsed.periodEnd

      periodStart = periodStart || (start ? start.toISOString() : null)
      periodEnd = periodEnd || (end ? end.toISOString() : null)
      statementDate = statementDate || (parsed.statementDate ? parsed.statementDate.toISOString() : (end ? end.toISOString() : null))

      transactions = parsedTxns.map((t) => ({
        transactionDate: t.transactionDate.toISOString(),
        description: t.description,
        amount: t.amount,
        transactionType: t.transactionType,
        checkNumber: t.checkNumber,
        referenceNumber: t.referenceNumber,
      }))
    } else {
      const body = await request.json()
      organizationId = body.organizationId || null
      statementDate = body.statementDate || null
      periodStart = body.periodStart || null
      periodEnd = body.periodEnd || null
      openingBalance = body.openingBalance
      closingBalance = body.closingBalance
      fileUrl = body.fileUrl
      format = body.format
      transactions = body.transactions
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const trustAccount = await prisma.trustAccount.findFirst({
      where: { id: trustAccountId, organizationId },
    })

    if (!trustAccount) {
      return NextResponse.json({ error: 'Trust account not found' }, { status: 404 })
    }

    if (!statementDate || !periodStart || !periodEnd || openingBalance === undefined || closingBalance === undefined) {
      return NextResponse.json(
        { error: 'Statement date, period start/end, and balances are required' },
        { status: 400 }
      )
    }

    if (!format || !['csv', 'ofx', 'qfx'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be csv, ofx, or qfx' },
        { status: 400 }
      )
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'At least one transaction is required' },
        { status: 400 }
      )
    }

    const statement = await importBankStatement({
      trustAccountId,
      statementDate: new Date(statementDate),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      openingBalance,
      closingBalance,
      fileUrl,
      format,
      transactions: transactions.map((t: {
        transactionDate: string
        description: string
        amount: number
        transactionType: 'debit' | 'credit'
        checkNumber?: string
        referenceNumber?: string
      }) => ({
        transactionDate: new Date(t.transactionDate),
        description: t.description,
        amount: t.amount,
        transactionType: t.transactionType,
        checkNumber: t.checkNumber,
        referenceNumber: t.referenceNumber,
      })),
      importedBy: user.id,
    })

    return NextResponse.json({ statement }, { status: 201 })
  } catch (error) {
    console.error('Error importing bank statement:', error)
    return NextResponse.json({ error: 'Failed to import bank statement' }, { status: 500 })
  }
}
