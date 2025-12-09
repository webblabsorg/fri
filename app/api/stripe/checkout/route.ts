import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createCheckoutSession, PRICING_PLANS, PricingTier } from '@/lib/stripe/stripe-service'

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tier } = body

    if (!tier || !['PRO', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid pricing tier' },
        { status: 400 }
      )
    }

    // Create checkout session with dynamic pricing
    const successUrl = `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`
    const cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard/billing?cancelled=true`

    const session = await createCheckoutSession(
      user.id,
      tier as PricingTier,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
