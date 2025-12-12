import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { completeReconciliation } from '@/lib/finance/trust-service'

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

    const { id } = await params
    const body = await request.json()
    const { notes } = body

    const reconciliation = await prisma.trustReconciliation.findUnique({
      where: { id },
      include: { trustAccount: { select: { organizationId: true } } },
    })

    if (!reconciliation) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: reconciliation.trustAccount.organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const completed = await completeReconciliation(id, notes)

    return NextResponse.json({ reconciliation: completed })
  } catch (error) {
    console.error('Error completing reconciliation:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to complete reconciliation' }, { status: 500 })
  }
}
