import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyPassword,
  createSession,
  handleFailedLogin,
  resetFailedLoginAttempts,
} from '@/lib/auth'
import { signInSchema } from '@/lib/validations/auth'

/**
 * Check if user's organization enforces SSO
 */
async function checkSSORequired(userId: string): Promise<{
  required: boolean
  ssoUrl?: string
  organizationName?: string
}> {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: { id: true, name: true, planTier: true },
        },
      },
    })

    for (const membership of memberships) {
      if (membership.organization.planTier === 'enterprise') {
        const ssoConfig = await prisma.sSOConfig.findUnique({
          where: { organizationId: membership.organizationId },
        })

        if (ssoConfig?.enabled && ssoConfig?.enforceSSO) {
          const callbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sso/callback`
          let ssoUrl: string | undefined

          if (ssoConfig.provider === 'azure_ad' && ssoConfig.tenantId && ssoConfig.oauthClientId) {
            const params = new URLSearchParams({
              client_id: ssoConfig.oauthClientId,
              redirect_uri: callbackUrl,
              response_type: 'code',
              scope: 'openid profile email',
              state: membership.organizationId,
            })
            ssoUrl = `https://login.microsoftonline.com/${ssoConfig.tenantId}/oauth2/v2.0/authorize?${params}`
          } else if (ssoConfig.provider === 'okta' && ssoConfig.domain && ssoConfig.oauthClientId) {
            const params = new URLSearchParams({
              client_id: ssoConfig.oauthClientId,
              redirect_uri: callbackUrl,
              response_type: 'code',
              scope: 'openid profile email',
              state: membership.organizationId,
            })
            ssoUrl = `https://${ssoConfig.domain}/oauth2/v1/authorize?${params}`
          } else if (ssoConfig.samlSsoUrl) {
            ssoUrl = ssoConfig.samlSsoUrl
          }

          return {
            required: true,
            ssoUrl,
            organizationName: membership.organization.name,
          }
        }
      }
    }

    return { required: false }
  } catch (error) {
    console.error('SSO check error:', error)
    return { required: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Validate input
    const validationResult = signInSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      return NextResponse.json(
        {
          error: `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
        },
        { status: 423 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)

    if (!isPasswordValid) {
      // Handle failed login
      const isLocked = await handleFailedLogin(user.id)

      if (isLocked) {
        return NextResponse.json(
          {
            error:
              'Too many failed login attempts. Your account has been locked for 30 minutes.',
          },
          { status: 423 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before signing in.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        {
          error: 'Your account has been suspended. Please contact support.',
        },
        { status: 403 }
      )
    }

    if (user.status === 'deleted') {
      return NextResponse.json(
        { error: 'This account no longer exists.' },
        { status: 403 }
      )
    }

    // Check if SSO is required for this user's organization
    const ssoCheck = await checkSSORequired(user.id)
    if (ssoCheck.required) {
      return NextResponse.json(
        {
          error: `Your organization "${ssoCheck.organizationName}" requires SSO login. Please use the SSO button to sign in.`,
          code: 'SSO_REQUIRED',
          ssoUrl: ssoCheck.ssoUrl,
        },
        { status: 403 }
      )
    }

    // Reset failed login attempts
    await resetFailedLoginAttempts(user.id)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    const sessionToken = await createSession(user.id)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'user_signin',
        eventData: {
          email: user.email,
          rememberMe,
        },
      },
    })

    // Return user data and session
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          firmName: user.firmName,
        },
      },
      { status: 200 }
    )

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.frithai.com' : undefined,
    })

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'An error occurred during sign in. Please try again.' },
      { status: 500 }
    )
  }
}
