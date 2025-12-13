import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { voidTrustTransaction } from '@/lib/finance/trust-service'
import { getAuditContext } from '@/lib/audit-context'

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
    const { voidReason } = body

    if (!voidReason) {
      return NextResponse.json({ error: 'Void reason is required' }, { status: 400 })
    }

    const transaction = await prisma.trustTransaction.findUnique({
      where: { id },
      include: { trustAccount: { select: { organizationId: true } } },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: transaction.trustAccount.organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const auditContext = getAuditContext(request)

    await voidTrustTransaction(id, user.id, voidReason, auditContext)

    return NextResponse.json({ message: 'Transaction voided' })
  } catch (error) {
    console.error('Error voiding transaction:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to void transaction' }, { status: 500 })
  }
}
