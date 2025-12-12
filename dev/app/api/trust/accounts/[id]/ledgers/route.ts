import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createClientLedger, getClientLedgers } from '@/lib/finance/trust-service'

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
    const status = searchParams.get('status') || undefined
    const clientId = searchParams.get('clientId') || undefined

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
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const ledgers = await getClientLedgers(trustAccountId, { status, clientId })

    return NextResponse.json({ ledgers })
  } catch (error) {
    console.error('Error fetching client ledgers:', error)
    return NextResponse.json({ error: 'Failed to fetch client ledgers' }, { status: 500 })
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
    const body = await request.json()
    const { clientId, matterId, ledgerName } = body

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

    if (!clientId || !ledgerName) {
      return NextResponse.json(
        { error: 'Client ID and ledger name are required' },
        { status: 400 }
      )
    }

    const ledger = await createClientLedger({
      trustAccountId,
      clientId,
      matterId,
      ledgerName,
    })

    return NextResponse.json({ ledger }, { status: 201 })
  } catch (error) {
    console.error('Error creating client ledger:', error)
    if ((error as Error).message?.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ledger already exists for this client/matter combination' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create client ledger' }, { status: 500 })
  }
}
