import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleSSOCallback, provisionSSOUser } from '@/lib/sso'
import { logAuditEvent } from '@/lib/audit'
import crypto from 'crypto'

/**
 * SSO Callback Handler
 * Exchanges authorization code for user info and creates/updates user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, organizationId } = body

    if (!code || !organizationId) {
      return NextResponse.json(
        { error: 'Missing code or organizationId' },
        { status: 400 }
      )
    }

    // Get SSO config for organization
    const ssoConfig = await prisma.sSOConfig.findUnique({
      where: { organizationId },
    })

    if (!ssoConfig || !ssoConfig.enabled) {
      return NextResponse.json(
        { error: 'SSO not configured for this organization' },
        { status: 400 }
      )
    }

    // Exchange code for user info
    const callbackUrl = `${new URL(request.url).origin}/sso/callback`
    const result = await handleSSOCallback(ssoConfig as any, code, callbackUrl)

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'SSO authentication failed' },
        { status: 401 }
      )
    }

    // Provision or get user
    const { userId, created } = await provisionSSOUser(
      organizationId,
      result.user.email,
      result.user.name,
      ssoConfig.defaultRole
    )

    // Generate a one-time SSO token for NextAuth sign-in
    const ssoToken = crypto.randomBytes(32).toString('hex')
    const ssoTokenExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store token temporarily (in production, use Redis or similar)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store in a metadata field or dedicated column
        // For now, we'll use a simple approach
      },
    })

    // Log the SSO login
    await logAuditEvent({
      organizationId,
      userId,
      eventType: created ? 'sso_user_provisioned' : 'sso_login',
      eventCategory: 'security',
      action: 'login',
      details: {
        provider: ssoConfig.provider,
        email: result.user.email,
        created,
      },
    })

    return NextResponse.json({
      success: true,
      email: result.user.email,
      ssoToken,
      userId,
    })
  } catch (error) {
    console.error('SSO callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
