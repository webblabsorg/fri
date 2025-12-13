import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { batchCreateInvoices } from '@/lib/finance/billing-service'

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
    const { organizationId, invoices } = body

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

    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: 'At least one invoice is required' }, { status: 400 })
    }

    const inputs = invoices.map((inv: {
      clientId: string
      matterId?: string
      billingType: 'hourly' | 'fixed_fee' | 'contingency' | 'hybrid'
      issueDate: string
      dueDate: string
      paymentTerms?: string
      currency?: string
      notes?: string
      lineItems: Array<{
        itemType: 'time_entry' | 'expense' | 'fixed_fee' | 'adjustment' | 'credit'
        description: string
        quantity: number
        rate: number
        taxable?: boolean
        taxRate?: number
      }>
    }) => ({
      input: {
        organizationId,
        clientId: inv.clientId,
        matterId: inv.matterId,
        billingType: inv.billingType,
        issueDate: new Date(inv.issueDate),
        dueDate: new Date(inv.dueDate),
        paymentTerms: inv.paymentTerms,
        currency: inv.currency,
        notes: inv.notes,
        createdBy: user.id,
      },
      lineItems: inv.lineItems,
    }))

    const result = await batchCreateInvoices(inputs)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error batch creating invoices:', error)
    return NextResponse.json({ error: 'Failed to batch create invoices' }, { status: 500 })
  }
}
