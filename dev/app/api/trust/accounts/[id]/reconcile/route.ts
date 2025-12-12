import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startReconciliation } from '@/lib/finance/trust-service'

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
    const { periodStart, periodEnd, bankBalance } = body

    if (!periodStart || !periodEnd || bankBalance === undefined) {
      return NextResponse.json(
        { error: 'Period start, period end, and bank balance are required' },
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

    const reconciliation = await startReconciliation({
      trustAccountId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      bankBalance,
      reconciledBy: user.id,
    })

    return NextResponse.json({ reconciliation }, { status: 201 })
  } catch (error) {
    console.error('Error starting reconciliation:', error)
    return NextResponse.json({ error: 'Failed to start reconciliation' }, { status: 500 })
  }
}
