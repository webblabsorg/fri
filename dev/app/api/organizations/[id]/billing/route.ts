import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { 
  getOrganizationBilling,
  createOrganizationCheckoutSession,
  createOrganizationBillingPortalSession,
  updateOrganizationSeats,
  PricingTier
} from '@/lib/stripe/stripe-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const userId = (session.user as any).id

    // Check if user is owner or admin
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['owner', 'admin'] },
        status: 'active'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const billing = await getOrganizationBilling(organizationId)

    return NextResponse.json({ billing })
  } catch (error) {
    console.error('Error fetching organization billing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { action, tier, seats } = body

    // Check if user is owner or admin
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['owner', 'admin'] },
        status: 'active'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (action === 'create_checkout') {
      if (!tier || !['PRO', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 })
      }

      const seatCount = seats || 1
      const successUrl = `${process.env.NEXTAUTH_URL}/dashboard/organization?billing_success=true`
      const cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard/organization?billing_cancelled=true`

      const checkoutSession = await createOrganizationCheckoutSession(
        organizationId,
        tier as PricingTier,
        successUrl,
        cancelUrl,
        seatCount
      )

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      })
    }

    if (action === 'create_portal') {
      const returnUrl = `${process.env.NEXTAUTH_URL}/dashboard/organization`
      
      const portalSession = await createOrganizationBillingPortalSession(
        organizationId,
        returnUrl
      )

      return NextResponse.json({
        url: portalSession.url,
      })
    }

    if (action === 'update_seats') {
      if (!seats || seats < 1) {
        return NextResponse.json({ error: 'Invalid seat count' }, { status: 400 })
      }

      await updateOrganizationSeats(organizationId, seats)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling organization billing:', error)
    return NextResponse.json(
      { error: 'Failed to process billing request' },
      { status: 500 }
    )
  }
}
