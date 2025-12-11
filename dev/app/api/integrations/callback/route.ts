import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * OAuth Callback Handler for Integrations
 * Handles the OAuth code exchange for various integration providers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const type = searchParams.get('type')
    const organizationId = searchParams.get('org')
    const integrationId = searchParams.get('int')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !type || !organizationId || !integrationId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=missing_params', request.url)
      )
    }

    // Get the integration record
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration || integration.organizationId !== organizationId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=invalid_integration', request.url)
      )
    }

    // Exchange code for tokens based on provider
    let tokens: { accessToken: string; refreshToken?: string; expiresIn?: number } | null = null

    switch (type) {
      case 'google_docs':
        tokens = await exchangeGoogleCode(code, request.url)
        break
      case 'slack':
        tokens = await exchangeSlackCode(code, request.url)
        break
      case 'dropbox':
        tokens = await exchangeDropboxCode(code, request.url)
        break
      case 'teams':
        tokens = await exchangeTeamsCode(code, request.url)
        break
      default:
        return NextResponse.redirect(
          new URL('/dashboard/settings/integrations?error=unsupported_provider', request.url)
        )
    }

    if (!tokens) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=token_exchange_failed', request.url)
      )
    }

    // Update integration with tokens
    const tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null

    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt,
        status: 'connected',
        errorMsg: null,
      },
    })

    // Log the connection
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        eventType: 'integration_oauth_complete',
        eventCategory: 'admin',
        resourceType: 'integration',
        resourceId: integrationId,
        action: 'update',
        details: { type },
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=connected', request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=internal_error', request.url)
    )
  }
}

// Token exchange functions for each provider
async function exchangeGoogleCode(
  code: string,
  callbackUrl: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: new URL('/api/integrations/callback', callbackUrl).toString(),
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      console.error('Google token exchange failed:', await response.text())
      return null
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  } catch (error) {
    console.error('Google token exchange error:', error)
    return null
  }
}

async function exchangeSlackCode(
  code: string,
  callbackUrl: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID || '',
        client_secret: process.env.SLACK_CLIENT_SECRET || '',
        redirect_uri: new URL('/api/integrations/callback', callbackUrl).toString(),
      }),
    })

    const data = await response.json()
    
    if (!data.ok) {
      console.error('Slack token exchange failed:', data.error)
      return null
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    console.error('Slack token exchange error:', error)
    return null
  }
}

async function exchangeDropboxCode(
  code: string,
  callbackUrl: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  try {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.DROPBOX_CLIENT_ID || '',
        client_secret: process.env.DROPBOX_CLIENT_SECRET || '',
        redirect_uri: new URL('/api/integrations/callback', callbackUrl).toString(),
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      console.error('Dropbox token exchange failed:', await response.text())
      return null
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  } catch (error) {
    console.error('Dropbox token exchange error:', error)
    return null
  }
}

async function exchangeTeamsCode(
  code: string,
  callbackUrl: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  try {
    const tenantId = process.env.AZURE_AD_TENANT_ID || 'common'
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.AZURE_AD_CLIENT_ID || '',
          client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
          redirect_uri: new URL('/api/integrations/callback', callbackUrl).toString(),
          grant_type: 'authorization_code',
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    )

    if (!response.ok) {
      console.error('Teams token exchange failed:', await response.text())
      return null
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  } catch (error) {
    console.error('Teams token exchange error:', error)
    return null
  }
}
