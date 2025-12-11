import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        firmName: user.firmName,
        emailVerified: user.emailVerified,
        onboardingCompleted: user.onboardingCompleted,
        // Beta program fields
        isBetaUser: user.isBetaUser,
        earlyAdopter: user.earlyAdopter,
        betaTrialEndsAt: user.betaTrialEndsAt,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
