import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/integrations/clio/callback
 * Handle Clio OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('[Clio] OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=missing_parameters`
      )
    }

    const cookieStore = await cookies()
    const storedState = cookieStore.get('clio_oauth_state')?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=invalid_state`
      )
    }

    // Decode state to get user ID
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
    } catch (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=invalid_state_format`
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://app.clio.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLIO_CLIENT_ID!,
        client_secret: process.env.CLIO_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/clio/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Clio] Token exchange failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get user info from Clio to validate connection
    const userInfoResponse = await fetch('https://app.clio.com/api/v4/users/who_am_i', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=user_info_failed`
      )
    }

    const userInfo = await userInfoResponse.json()
    const clioUser = userInfo.data

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000))

    // Store connection in database
    // First check if connection exists
    const existingConnection = await prisma.clioConnection.findFirst({
      where: { userId },
    })

    if (existingConnection) {
      await prisma.clioConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          clioUserId: clioUser.id.toString(),
          clioFirmId: clioUser.firm?.id?.toString(),
          status: 'active',
        },
      })
    } else {
      await prisma.clioConnection.create({
        data: {
          userId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          scopes: ['read', 'write'],
          clioUserId: clioUser.id.toString(),
          clioFirmId: clioUser.firm?.id?.toString(),
          status: 'active',
        },
      })
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'connected',
        targetType: 'integration',
        targetId: 'clio',
        description: `Connected Clio account for ${clioUser.name} (${clioUser.email})`,
        metadata: {
          clioUserId: clioUser.id,
          clioUserName: clioUser.name,
          clioUserEmail: clioUser.email,
          clioFirmId: clioUser.firm?.id,
          clioFirmName: clioUser.firm?.name,
        },
      },
    })

    // Clear state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_success=connected`
    )
    response.cookies.delete('clio_oauth_state')

    return response
  } catch (error) {
    console.error('[Clio] OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?clio_error=callback_failed`
    )
  }
}
