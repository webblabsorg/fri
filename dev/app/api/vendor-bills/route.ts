import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createVendorBill, getVendorBills } from '@/lib/finance/expense-service'

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
    const vendorId = searchParams.get('vendorId') || undefined
    const matterId = searchParams.get('matterId') || undefined
    const status = searchParams.get('status') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await getVendorBills(organizationId, {
      vendorId,
      matterId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching vendor bills:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor bills' }, { status: 500 })
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
      vendorId,
      matterId,
      billNumber,
      subtotal,
      taxAmount,
      billDate,
      dueDate,
      documentUrl,
      notes,
      lineItems,
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

    if (!vendorId || !billNumber || !subtotal || !billDate || !dueDate) {
      return NextResponse.json(
        { error: 'Vendor, bill number, subtotal, bill date, and due date are required' },
        { status: 400 }
      )
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400 }
      )
    }

    const bill = await createVendorBill({
      organizationId,
      vendorId,
      matterId,
      billNumber,
      subtotal,
      taxAmount,
      billDate: new Date(billDate),
      dueDate: new Date(dueDate),
      documentUrl,
      notes,
      createdBy: user.id,
      lineItems,
    })

    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor bill:', error)
    return NextResponse.json({ error: 'Failed to create vendor bill' }, { status: 500 })
  }
}
