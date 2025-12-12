import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createBillingRate, getBillingRates } from '@/lib/finance/billing-service'

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
    const userId = searchParams.get('userId') || undefined
    const clientId = searchParams.get('clientId') || undefined
    const matterId = searchParams.get('matterId') || undefined
    const rateType = searchParams.get('rateType') || undefined
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const rates = await getBillingRates(organizationId, {
      userId,
      clientId,
      matterId,
      rateType,
      activeOnly,
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Error fetching billing rates:', error)
    return NextResponse.json({ error: 'Failed to fetch billing rates' }, { status: 500 })
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
      userId,
      clientId,
      matterId,
      matterType,
      rateType,
      rate,
      currency,
      effectiveDate,
      expirationDate,
      isDefault,
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

    if (!rateType || !rate || !effectiveDate) {
      return NextResponse.json(
        { error: 'Rate type, rate, and effective date are required' },
        { status: 400 }
      )
    }

    const billingRate = await createBillingRate({
      organizationId,
      userId,
      clientId,
      matterId,
      matterType,
      rateType,
      rate,
      currency,
      effectiveDate: new Date(effectiveDate),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      isDefault,
    })

    return NextResponse.json({ rate: billingRate }, { status: 201 })
  } catch (error) {
    console.error('Error creating billing rate:', error)
    return NextResponse.json({ error: 'Failed to create billing rate' }, { status: 500 })
  }
}
