import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const SUPPORTED_INTEGRATIONS = [
  'google_docs',
  'imanage',
  'netdocuments',
  'slack',
  'teams',
  'dropbox',
  'onedrive',
] as const

const integrationSchema = z.object({
  type: z.enum(SUPPORTED_INTEGRATIONS),
  name: z.string().min(1),
  config: z.record(z.any()).optional(),
})

// GET - List integrations for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check user has access
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
      },
    })

    if (!membership && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const integrations = await prisma.integration.findMany({
      where: { organizationId },
      select: {
        id: true,
        type: true,
        name: true,
        enabled: true,
        status: true,
        lastSyncAt: true,
        errorMsg: true,
        createdAt: true,
      },
    })

    // Return available integrations with connection status
    const available = SUPPORTED_INTEGRATIONS.map((type) => {
      const existing = integrations.find((i) => i.type === type)
      return {
        type,
        name: getIntegrationName(type),
        description: getIntegrationDescription(type),
        icon: getIntegrationIcon(type),
        connected: !!existing,
        integration: existing || null,
      }
    })

    return NextResponse.json({ integrations: available })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST - Connect new integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...data } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check user has admin access
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!membership && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const validated = integrationSchema.parse(data)

    // Check if integration already exists
    const existing = await prisma.integration.findUnique({
      where: {
        organizationId_type: {
          organizationId,
          type: validated.type,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Integration already connected' },
        { status: 400 }
      )
    }

    // Generate webhook secret for integrations that need it
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    const integration = await prisma.integration.create({
      data: {
        organizationId,
        type: validated.type,
        name: validated.name,
        config: validated.config,
        webhookSecret,
        createdById: (session.user as any).id,
      },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'integration_connect',
        eventCategory: 'admin',
        resourceType: 'integration',
        resourceId: integration.id,
        action: 'create',
        details: { type: validated.type },
      },
    })

    // Return OAuth URL if needed
    const oauthUrl = getOAuthUrl(validated.type, organizationId, integration.id)

    return NextResponse.json({
      success: true,
      integration,
      oauthUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error connecting integration:', error)
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    )
  }
}

// PATCH - Update integration settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, organizationId, enabled, config } = body

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and Organization ID required' }, { status: 400 })
    }

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(config && { config }),
      },
    })

    return NextResponse.json({ success: true, integration })
  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}

// DELETE - Disconnect integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organizationId')

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and Organization ID required' }, { status: 400 })
    }

    const integration = await prisma.integration.delete({
      where: { id },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'integration_disconnect',
        eventCategory: 'admin',
        resourceType: 'integration',
        resourceId: id,
        action: 'delete',
        details: { type: integration.type },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    )
  }
}

// Helper functions
function getIntegrationName(type: string): string {
  const names: Record<string, string> = {
    google_docs: 'Google Docs',
    imanage: 'iManage',
    netdocuments: 'NetDocuments',
    slack: 'Slack',
    teams: 'Microsoft Teams',
    dropbox: 'Dropbox',
    onedrive: 'OneDrive',
  }
  return names[type] || type
}

function getIntegrationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    google_docs: 'Import and export documents from Google Docs',
    imanage: 'Connect to iManage document management system',
    netdocuments: 'Sync with NetDocuments DMS',
    slack: 'Send notifications and results to Slack channels',
    teams: 'Integrate with Microsoft Teams for notifications',
    dropbox: 'Access files from Dropbox',
    onedrive: 'Connect to OneDrive for file storage',
  }
  return descriptions[type] || ''
}

function getIntegrationIcon(type: string): string {
  const icons: Record<string, string> = {
    google_docs: 'file-text',
    imanage: 'folder',
    netdocuments: 'folder',
    slack: 'message-square',
    teams: 'users',
    dropbox: 'cloud',
    onedrive: 'cloud',
  }
  return icons[type] || 'link'
}

function getOAuthUrl(type: string, organizationId: string, integrationId: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const callbackUrl = `${baseUrl}/api/integrations/callback?type=${type}&org=${organizationId}&int=${integrationId}`

  // In production, these would be actual OAuth URLs
  const oauthUrls: Record<string, string> = {
    google_docs: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=https://www.googleapis.com/auth/drive.file&response_type=code`,
    slack: `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=chat:write,files:read`,
    dropbox: `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code`,
  }

  return oauthUrls[type] || null
}
