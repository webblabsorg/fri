import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTrustTransaction, getTrustTransactions } from '@/lib/finance/trust-service'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const trustAccountId = searchParams.get('trustAccountId') || undefined
    const clientLedgerId = searchParams.get('clientLedgerId') || undefined
    const transactionType = searchParams.get('transactionType') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isReconciled = searchParams.get('isReconciled')
    const limit = parseInt(searchParams.get('limit') || '100')
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

    const result = await getTrustTransactions(organizationId, {
      trustAccountId,
      clientLedgerId,
      transactionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isReconciled: isReconciled ? isReconciled === 'true' : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching trust transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      trustAccountId,
      clientLedgerId,
      transactionType,
      amount,
      description,
      paymentMethod,
      checkNumber,
      referenceNumber,
      payee,
      fromAccount,
      toAccount,
      transactionDate,
    } = body

    if (!trustAccountId || !clientLedgerId || !transactionType || !amount || !description) {
      return NextResponse.json(
        { error: 'Trust account, client ledger, transaction type, amount, and description are required' },
        { status: 400 }
      )
    }

    const validTypes = ['deposit', 'transfer_to_operating', 'disbursement', 'refund', 'interest']
    if (!validTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: `Transaction type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const trustAccount = await prisma.trustAccount.findUnique({
      where: { id: trustAccountId },
      select: { organizationId: true },
    })

    if (!trustAccount) {
      return NextResponse.json({ error: 'Trust account not found' }, { status: 404 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: trustAccount.organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const transaction = await createTrustTransaction({
      trustAccountId,
      clientLedgerId,
      transactionType,
      amount,
      description,
      paymentMethod,
      checkNumber,
      referenceNumber,
      payee,
      fromAccount,
      toAccount,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      createdBy: user.id,
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Error creating trust transaction:', error)
    if ((error as Error).message?.includes('Insufficient funds')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
