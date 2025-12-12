import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTrustAccount, getTrustAccounts } from '@/lib/finance/trust-service'

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
    const isActive = searchParams.get('isActive')
    const jurisdiction = searchParams.get('jurisdiction') || undefined

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const accounts = await getTrustAccounts(organizationId, {
      isActive: isActive ? isActive === 'true' : undefined,
      jurisdiction,
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching trust accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch trust accounts' }, { status: 500 })
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
      organizationId,
      accountName,
      bankName,
      accountNumber,
      routingNumber,
      accountType,
      currency,
      jurisdiction,
      stateBarId,
      interestRate,
    } = body

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

    if (!accountName || !bankName || !accountNumber || !jurisdiction) {
      return NextResponse.json(
        { error: 'Account name, bank name, account number, and jurisdiction are required' },
        { status: 400 }
      )
    }

    const account = await createTrustAccount({
      organizationId,
      accountName,
      bankName,
      accountNumber,
      routingNumber,
      accountType,
      currency,
      jurisdiction,
      stateBarId,
      interestRate,
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Error creating trust account:', error)
    return NextResponse.json({ error: 'Failed to create trust account' }, { status: 500 })
  }
}
