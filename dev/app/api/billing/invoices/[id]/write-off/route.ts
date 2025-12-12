import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeOffInvoice } from '@/lib/finance/billing-service'

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
    const { organizationId, amount, reason } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid write-off amount required' }, { status: 400 })
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

    const invoice = await writeOffInvoice(id, organizationId, amount, reason)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error writing off invoice:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to write off invoice' }, { status: 500 })
  }
}
