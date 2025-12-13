import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createVendorCredit, getVendorCredits } from '@/lib/finance/vendor-credit-service'

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
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
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

    const result = await getVendorCredits(organizationId, {
      vendorId,
      status,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching vendor credits:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor credits' }, { status: 500 })
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
      amount,
      currency,
      reason,
      description,
      creditDate,
      expirationDate,
    } = body

    if (!organizationId || !vendorId || !amount || !creditDate) {
      return NextResponse.json(
        { error: 'Organization ID, vendor ID, amount, and credit date are required' },
        { status: 400 }
      )
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

    const credit = await createVendorCredit({
      organizationId,
      vendorId,
      amount,
      currency,
      reason,
      description,
      creditDate: new Date(creditDate),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      createdBy: user.id,
    })

    return NextResponse.json({ credit }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor credit:', error)
    return NextResponse.json({ error: 'Failed to create vendor credit' }, { status: 500 })
  }
}
