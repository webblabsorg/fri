/**
 * Enterprise Middleware Helpers
 * Used by route handlers to enforce SSO and IP whitelist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

export interface EnterpriseCheckResult {
  allowed: boolean
  response?: NextResponse
  organizationId?: string
  userId?: string
}

/**
 * Check if SSO is enforced and user authenticated via SSO
 */
export async function checkSSOEnforcement(
  request: NextRequest,
  userId: string
): Promise<{ enforced: boolean; requiresRedirect: boolean; ssoUrl?: string }> {
  try {
    // Get user's organization memberships
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: { id: true, planTier: true },
        },
      },
    })

    // Check each enterprise organization for SSO enforcement
    for (const membership of memberships) {
      if (membership.organization.planTier === 'enterprise') {
        const ssoConfig = await prisma.sSOConfig.findUnique({
          where: { organizationId: membership.organizationId },
        })

        if (ssoConfig?.enabled && ssoConfig?.enforceSSO) {
          // Check if user logged in via SSO (check session metadata)
          // For now, we assume SSO users have no password hash
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
          })

          // If user has a password hash and SSO is enforced, they need to use SSO
          if (user?.passwordHash && user.passwordHash.length > 0) {
            // Generate SSO redirect URL
            const callbackUrl = `${new URL(request.url).origin}/sso/callback`
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

            return { enforced: true, requiresRedirect: true, ssoUrl }
          }
        }
      }
    }

    return { enforced: false, requiresRedirect: false }
  } catch (error) {
    console.error('SSO enforcement check error:', error)
    return { enforced: false, requiresRedirect: false }
  }
}

/**
 * Check IP whitelist for user's organization
 */
export async function checkIPWhitelist(
  request: NextRequest,
  userId: string
): Promise<{ allowed: boolean; blocked: boolean; reason?: string }> {
  try {
    // Get client IP from header set by middleware
    const clientIP = request.headers.get('x-client-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     '127.0.0.1'

    // Get user's primary organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: {
        organization: {
          select: { id: true, planTier: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!membership || membership.organization.planTier !== 'enterprise') {
      return { allowed: true, blocked: false }
    }

    // Get whitelist entries
    const whitelist = await prisma.iPWhitelist.findMany({
      where: {
        organizationId: membership.organizationId,
        enabled: true,
      },
    })

    // If no whitelist entries, allow all
    if (whitelist.length === 0) {
      return { allowed: true, blocked: false }
    }

    // Check if IP matches any entry
    for (const entry of whitelist) {
      if (ipMatchesEntry(clientIP, entry.ipAddress)) {
        return { allowed: true, blocked: false }
      }
    }

    // IP not in whitelist - log and block
    await logAuditEvent({
      organizationId: membership.organizationId,
      userId,
      eventType: 'ip_blocked',
      eventCategory: 'security',
      action: 'read',
      details: { clientIP, path: request.nextUrl.pathname },
      ipAddress: clientIP,
      riskLevel: 'high',
    })

    return { allowed: false, blocked: true, reason: 'IP not in whitelist' }
  } catch (error) {
    console.error('IP whitelist check error:', error)
    // Fail open on error
    return { allowed: true, blocked: false }
  }
}

/**
 * Check if IP matches whitelist entry (supports CIDR)
 */
function ipMatchesEntry(clientIP: string, whitelistEntry: string): boolean {
  if (clientIP === whitelistEntry) return true

  if (whitelistEntry.includes('/')) {
    return ipInCIDR(clientIP, whitelistEntry)
  }

  return false
}

function ipInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/')
  const mask = parseInt(bits, 10)

  if (isNaN(mask) || mask < 0 || mask > 32) return false

  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(range)

  if (ipNum === null || rangeNum === null) return false

  const maskNum = ~(2 ** (32 - mask) - 1)
  return (ipNum & maskNum) === (rangeNum & maskNum)
}

function ipToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null

  let num = 0
  for (const part of parts) {
    const octet = parseInt(part, 10)
    if (isNaN(octet) || octet < 0 || octet > 255) return null
    num = (num << 8) + octet
  }
  return num >>> 0
}

/**
 * Combined enterprise check for route handlers
 */
export async function enforceEnterpriseRules(
  request: NextRequest
): Promise<EnterpriseCheckResult> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return { allowed: true } // Let auth middleware handle unauthenticated
  }

  const userId = (session.user as any).id

  // Check IP whitelist first
  const ipCheck = await checkIPWhitelist(request, userId)
  if (ipCheck.blocked) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Access denied: IP not whitelisted', code: 'IP_BLOCKED' },
        { status: 403 }
      ),
    }
  }

  // Check SSO enforcement
  const ssoCheck = await checkSSOEnforcement(request, userId)
  if (ssoCheck.requiresRedirect && ssoCheck.ssoUrl) {
    return {
      allowed: false,
      response: NextResponse.redirect(ssoCheck.ssoUrl),
    }
  }

  return { allowed: true, userId }
}
