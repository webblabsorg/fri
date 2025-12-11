/**
 * SSO Authentication Helper
 * Handles SSO enforcement and login flows for enterprise organizations
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export interface SSOConfig {
  id: string
  organizationId: string
  provider: string
  enabled: boolean
  enforceSSO: boolean
  autoProvision: boolean
  defaultRole: string
  // Provider-specific config
  samlEntityId?: string | null
  samlSsoUrl?: string | null
  samlCertificate?: string | null
  oauthClientId?: string | null
  oauthAuthUrl?: string | null
  oauthTokenUrl?: string | null
  oauthUserInfoUrl?: string | null
  oauthScopes?: string | null
  tenantId?: string | null
  domain?: string | null
}

/**
 * Get SSO configuration for an organization
 */
export async function getSSOConfig(organizationId: string): Promise<SSOConfig | null> {
  try {
    const config = await prisma.sSOConfig.findUnique({
      where: { organizationId },
    })
    return config as SSOConfig | null
  } catch (error) {
    console.error('Error fetching SSO config:', error)
    return null
  }
}

/**
 * Check if SSO is enforced for a user's organization
 */
export async function isSSOEnforced(userId: string): Promise<{ enforced: boolean; organizationId?: string; provider?: string }> {
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

    // Check each organization for SSO enforcement
    for (const membership of memberships) {
      if (membership.organization.planTier === 'enterprise') {
        const ssoConfig = await getSSOConfig(membership.organizationId)
        if (ssoConfig?.enabled && ssoConfig?.enforceSSO) {
          return {
            enforced: true,
            organizationId: membership.organizationId,
            provider: ssoConfig.provider,
          }
        }
      }
    }

    return { enforced: false }
  } catch (error) {
    console.error('Error checking SSO enforcement:', error)
    return { enforced: false }
  }
}

/**
 * Generate SSO login URL based on provider
 */
export function generateSSOLoginUrl(
  config: SSOConfig,
  callbackUrl: string,
  state?: string
): string {
  const stateParam = state || generateState()
  
  switch (config.provider) {
    case 'saml':
      // For SAML, redirect to the IdP's SSO URL
      if (config.samlSsoUrl) {
        const params = new URLSearchParams({
          SAMLRequest: '', // Would be generated with actual SAML library
          RelayState: stateParam,
        })
        return `${config.samlSsoUrl}?${params}`
      }
      break

    case 'oauth':
      if (config.oauthAuthUrl && config.oauthClientId) {
        const params = new URLSearchParams({
          client_id: config.oauthClientId,
          redirect_uri: callbackUrl,
          response_type: 'code',
          scope: config.oauthScopes || 'openid profile email',
          state: stateParam,
        })
        return `${config.oauthAuthUrl}?${params}`
      }
      break

    case 'azure_ad':
      if (config.tenantId && config.oauthClientId) {
        const params = new URLSearchParams({
          client_id: config.oauthClientId,
          redirect_uri: callbackUrl,
          response_type: 'code',
          scope: 'openid profile email',
          state: stateParam,
        })
        return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params}`
      }
      break

    case 'okta':
      if (config.domain && config.oauthClientId) {
        const params = new URLSearchParams({
          client_id: config.oauthClientId,
          redirect_uri: callbackUrl,
          response_type: 'code',
          scope: 'openid profile email',
          state: stateParam,
        })
        return `https://${config.domain}/oauth2/v1/authorize?${params}`
      }
      break
  }

  throw new Error(`Invalid SSO configuration for provider: ${config.provider}`)
}

/**
 * Generate a random state parameter for OAuth
 */
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate SSO callback and exchange code for tokens
 */
export async function handleSSOCallback(
  config: SSOConfig,
  code: string,
  callbackUrl: string
): Promise<{ success: boolean; user?: { email: string; name?: string; id?: string }; error?: string }> {
  try {
    switch (config.provider) {
      case 'azure_ad':
        return await handleAzureADCallback(config, code, callbackUrl)
      case 'okta':
        return await handleOktaCallback(config, code, callbackUrl)
      case 'oauth':
        return await handleGenericOAuthCallback(config, code, callbackUrl)
      case 'saml':
        // SAML would need a proper SAML library
        return { success: false, error: 'SAML not yet implemented' }
      default:
        return { success: false, error: 'Unknown provider' }
    }
  } catch (error) {
    console.error('SSO callback error:', error)
    return { success: false, error: 'SSO authentication failed' }
  }
}

async function handleAzureADCallback(
  config: SSOConfig,
  code: string,
  callbackUrl: string
): Promise<{ success: boolean; user?: { email: string; name?: string; id?: string }; error?: string }> {
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.oauthClientId || '',
        client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    }
  )

  if (!tokenResponse.ok) {
    return { success: false, error: 'Token exchange failed' }
  }

  const tokens = await tokenResponse.json()

  // Get user info
  const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userResponse.ok) {
    return { success: false, error: 'Failed to get user info' }
  }

  const userInfo = await userResponse.json()

  return {
    success: true,
    user: {
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName,
      id: userInfo.id,
    },
  }
}

async function handleOktaCallback(
  config: SSOConfig,
  code: string,
  callbackUrl: string
): Promise<{ success: boolean; user?: { email: string; name?: string; id?: string }; error?: string }> {
  const tokenResponse = await fetch(
    `https://${config.domain}/oauth2/v1/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.oauthClientId || '',
        client_secret: process.env.OKTA_CLIENT_SECRET || '',
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    }
  )

  if (!tokenResponse.ok) {
    return { success: false, error: 'Token exchange failed' }
  }

  const tokens = await tokenResponse.json()

  // Get user info
  const userResponse = await fetch(`https://${config.domain}/oauth2/v1/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userResponse.ok) {
    return { success: false, error: 'Failed to get user info' }
  }

  const userInfo = await userResponse.json()

  return {
    success: true,
    user: {
      email: userInfo.email,
      name: userInfo.name,
      id: userInfo.sub,
    },
  }
}

async function handleGenericOAuthCallback(
  config: SSOConfig,
  code: string,
  callbackUrl: string
): Promise<{ success: boolean; user?: { email: string; name?: string; id?: string }; error?: string }> {
  if (!config.oauthTokenUrl || !config.oauthUserInfoUrl) {
    return { success: false, error: 'OAuth URLs not configured' }
  }

  const tokenResponse = await fetch(config.oauthTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.oauthClientId || '',
      client_secret: process.env.OAUTH_CLIENT_SECRET || '',
      code,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    return { success: false, error: 'Token exchange failed' }
  }

  const tokens = await tokenResponse.json()

  // Get user info
  const userResponse = await fetch(config.oauthUserInfoUrl, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userResponse.ok) {
    return { success: false, error: 'Failed to get user info' }
  }

  const userInfo = await userResponse.json()

  return {
    success: true,
    user: {
      email: userInfo.email,
      name: userInfo.name,
      id: userInfo.sub || userInfo.id,
    },
  }
}

/**
 * Auto-provision user from SSO
 */
export async function provisionSSOUser(
  organizationId: string,
  email: string,
  name: string | undefined,
  defaultRole: string
): Promise<{ userId: string; created: boolean }> {
  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email },
  })

  const created = !user

  if (!user) {
    // Create user
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        emailVerified: true, // SSO users are pre-verified
        passwordHash: '', // SSO users don't have a password
      },
    })
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  })

  if (!existingMember) {
    // Add to organization
    await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role: defaultRole,
      },
    })
  }

  return { userId: user.id, created }
}
