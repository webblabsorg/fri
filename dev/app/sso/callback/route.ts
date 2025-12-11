import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

/**
 * SSO Callback Handler
 * Handles OAuth callbacks from Azure AD, Okta, and other SSO providers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Organization ID
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('SSO error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/signin?error=sso_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/signin?error=invalid_callback', request.url)
      )
    }

    const organizationId = state

    // Get SSO config for this organization
    const ssoConfig = await prisma.sSOConfig.findUnique({
      where: { organizationId },
      include: {
        organization: true,
      },
    })

    if (!ssoConfig || !ssoConfig.enabled) {
      return NextResponse.redirect(
        new URL('/signin?error=sso_not_configured', request.url)
      )
    }

    // Exchange code for tokens based on provider
    let userInfo: { email: string; name?: string; sub?: string } | null = null

    if (ssoConfig.provider === 'azure_ad') {
      userInfo = await exchangeAzureADCode(code, ssoConfig, request.url)
    } else if (ssoConfig.provider === 'okta') {
      userInfo = await exchangeOktaCode(code, ssoConfig, request.url)
    } else if (ssoConfig.provider === 'oauth') {
      userInfo = await exchangeGenericOAuthCode(code, ssoConfig, request.url)
    }

    if (!userInfo || !userInfo.email) {
      return NextResponse.redirect(
        new URL('/signin?error=sso_user_info_failed', request.url)
      )
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email.toLowerCase() },
    })

    if (!user && ssoConfig.autoProvision) {
      // Auto-provision new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email.toLowerCase(),
          name: userInfo.name || userInfo.email.split('@')[0],
          passwordHash: '', // SSO users don't have passwords
          emailVerified: true, // SSO users are pre-verified
          role: ssoConfig.defaultRole || 'member',
          status: 'active',
        },
      })

      // Add to organization
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId,
          role: ssoConfig.defaultRole || 'member',
        },
      })

      await logAuditEvent({
        organizationId,
        userId: user.id,
        eventType: 'user_provisioned_sso',
        eventCategory: 'user_management',
        action: 'create',
        details: { email: user.email, provider: ssoConfig.provider },
      })
    }

    if (!user) {
      return NextResponse.redirect(
        new URL('/signin?error=user_not_found&message=No account exists for this email', request.url)
      )
    }

    // Check if user is member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    })

    if (!membership) {
      return NextResponse.redirect(
        new URL('/signin?error=not_org_member', request.url)
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    const sessionToken = await createSession(user.id)

    // Log SSO login
    await logAuditEvent({
      organizationId,
      userId: user.id,
      eventType: 'sso_login',
      eventCategory: 'authentication',
      action: 'create',
      details: { provider: ssoConfig.provider },
    })

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/',
    })

    return response
  } catch (error) {
    console.error('SSO callback error:', error)
    return NextResponse.redirect(
      new URL('/signin?error=sso_callback_failed', request.url)
    )
  }
}

/**
 * Exchange Azure AD authorization code for user info
 */
async function exchangeAzureADCode(
  code: string,
  ssoConfig: any,
  requestUrl: string
): Promise<{ email: string; name?: string; sub?: string } | null> {
  try {
    const callbackUrl = new URL('/sso/callback', requestUrl).toString()
    
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${ssoConfig.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: ssoConfig.oauthClientId,
          client_secret: ssoConfig.oauthClientSecret,
          code,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      }
    )

    if (!tokenResponse.ok) {
      console.error('Azure AD token exchange failed:', await tokenResponse.text())
      return null
    }

    const tokens = await tokenResponse.json()

    // Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      console.error('Azure AD user info failed:', await userResponse.text())
      return null
    }

    const userInfo = await userResponse.json()
    return {
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName,
      sub: userInfo.id,
    }
  } catch (error) {
    console.error('Azure AD exchange error:', error)
    return null
  }
}

/**
 * Exchange Okta authorization code for user info
 */
async function exchangeOktaCode(
  code: string,
  ssoConfig: any,
  requestUrl: string
): Promise<{ email: string; name?: string; sub?: string } | null> {
  try {
    const callbackUrl = new URL('/sso/callback', requestUrl).toString()
    
    const tokenResponse = await fetch(
      `https://${ssoConfig.domain}/oauth2/v1/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${ssoConfig.oauthClientId}:${ssoConfig.oauthClientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      }
    )

    if (!tokenResponse.ok) {
      console.error('Okta token exchange failed:', await tokenResponse.text())
      return null
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch(
      `https://${ssoConfig.domain}/oauth2/v1/userinfo`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    if (!userResponse.ok) {
      console.error('Okta user info failed:', await userResponse.text())
      return null
    }

    const userInfo = await userResponse.json()
    return {
      email: userInfo.email,
      name: userInfo.name,
      sub: userInfo.sub,
    }
  } catch (error) {
    console.error('Okta exchange error:', error)
    return null
  }
}

/**
 * Exchange generic OAuth authorization code for user info
 */
async function exchangeGenericOAuthCode(
  code: string,
  ssoConfig: any,
  requestUrl: string
): Promise<{ email: string; name?: string; sub?: string } | null> {
  try {
    const callbackUrl = new URL('/sso/callback', requestUrl).toString()
    
    const tokenResponse = await fetch(ssoConfig.oauthTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: ssoConfig.oauthClientId,
        client_secret: ssoConfig.oauthClientSecret,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('OAuth token exchange failed:', await tokenResponse.text())
      return null
    }

    const tokens = await tokenResponse.json()

    const userResponse = await fetch(ssoConfig.oauthUserInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      console.error('OAuth user info failed:', await userResponse.text())
      return null
    }

    const userInfo = await userResponse.json()
    return {
      email: userInfo.email,
      name: userInfo.name,
      sub: userInfo.sub,
    }
  } catch (error) {
    console.error('OAuth exchange error:', error)
    return null
  }
}
