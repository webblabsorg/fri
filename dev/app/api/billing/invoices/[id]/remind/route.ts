import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createInvoiceReminder } from '@/lib/finance/billing-service'

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

    const { id: invoiceId } = await params
    const body = await request.json()
    const {
      organizationId,
      reminderType,
      scheduledFor,
      emailTo,
      emailSubject,
      emailBody,
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

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!reminderType || !scheduledFor || !emailTo || !emailSubject || !emailBody) {
      return NextResponse.json(
        { error: 'Reminder type, scheduled date, email recipient, subject, and body are required' },
        { status: 400 }
      )
    }

    const reminder = await createInvoiceReminder({
      invoiceId,
      reminderType,
      scheduledFor: new Date(scheduledFor),
      emailTo,
      emailSubject,
      emailBody,
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice reminder:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}
