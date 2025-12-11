import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'

/**
 * GET /api/integrations/clio/connect
 * Initiate Clio OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clio OAuth configuration
    const clientId = process.env.CLIO_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/clio/callback`
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Clio integration not configured' },
        { status: 500 }
      )
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64')

    // Store state in session for validation
    const response = NextResponse.redirect(
      `https://app.clio.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=read write&` +
      `state=${state}`
    )

    // Set state cookie for validation in callback
    response.cookies.set('clio_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('[Clio] OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Clio connection' },
      { status: 500 }
    )
  }
}
