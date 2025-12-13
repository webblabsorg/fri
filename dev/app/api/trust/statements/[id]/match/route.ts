import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { autoMatchBankStatement } from '@/lib/finance/trust-service'

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

    const { id: statementId } = await params
    const body = await request.json()
    const { organizationId } = body

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

    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { trustAccount: true },
    })

    if (!statement) {
      return NextResponse.json({ error: 'Bank statement not found' }, { status: 404 })
    }

    if (statement.trustAccount.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await autoMatchBankStatement(statementId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error matching bank statement:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to match bank statement' }, { status: 500 })
  }
}
