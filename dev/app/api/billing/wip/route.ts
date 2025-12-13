import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getWipTimeEntries, generateInvoiceLineItemsFromWip } from '@/lib/finance/billing-rate-service'

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
    const matterId = searchParams.get('matterId')

    if (!organizationId || !matterId) {
      return NextResponse.json({ error: 'organizationId and matterId are required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const entries = await getWipTimeEntries(organizationId, matterId)
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({
      entries,
      summary: {
        count: entries.length,
        totalHours,
        totalAmount,
      },
    })
  } catch (error) {
    console.error('Error fetching WIP entries:', error)
    return NextResponse.json({ error: 'Failed to fetch WIP entries' }, { status: 500 })
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
    const { organizationId, matterId } = body

    if (!organizationId || !matterId) {
      return NextResponse.json({ error: 'organizationId and matterId are required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const lineItems = await generateInvoiceLineItemsFromWip(organizationId, matterId)

    return NextResponse.json({
      lineItems,
      count: lineItems.length,
      totalAmount: lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0),
    })
  } catch (error) {
    console.error('Error generating invoice line items from WIP:', error)
    return NextResponse.json({ error: 'Failed to generate invoice line items' }, { status: 500 })
  }
}
