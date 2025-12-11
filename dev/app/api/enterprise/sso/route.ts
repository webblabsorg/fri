import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ssoConfigSchema = z.object({
  provider: z.enum(['saml', 'oauth', 'azure_ad', 'okta']),
  enabled: z.boolean().optional(),
  // SAML
  samlEntityId: z.string().optional(),
  samlSsoUrl: z.string().url().optional(),
  samlCertificate: z.string().optional(),
  samlSignRequest: z.boolean().optional(),
  // OAuth
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  oauthAuthUrl: z.string().url().optional(),
  oauthTokenUrl: z.string().url().optional(),
  oauthUserInfoUrl: z.string().url().optional(),
  oauthScopes: z.string().optional(),
  // Azure AD / Okta
  tenantId: z.string().optional(),
  domain: z.string().optional(),
  // Settings
  autoProvision: z.boolean().optional(),
  defaultRole: z.string().optional(),
  enforceSSO: z.boolean().optional(),
})

// GET - Get SSO configuration for organization
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

    // Check user has admin access to organization
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

    const ssoConfig = await prisma.sSOConfig.findUnique({
      where: { organizationId },
      select: {
        id: true,
        provider: true,
        enabled: true,
        samlEntityId: true,
        samlSsoUrl: true,
        samlSignRequest: true,
        oauthClientId: true,
        oauthAuthUrl: true,
        oauthTokenUrl: true,
        oauthUserInfoUrl: true,
        oauthScopes: true,
        tenantId: true,
        domain: true,
        autoProvision: true,
        defaultRole: true,
        enforceSSO: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ ssoConfig })
  } catch (error) {
    console.error('Error fetching SSO config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SSO configuration' },
      { status: 500 }
    )
  }
}

// POST - Create or update SSO configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...configData } = body

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

    // Check organization has enterprise plan
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (organization?.planTier !== 'enterprise') {
      return NextResponse.json(
        { error: 'SSO is only available on Enterprise plans' },
        { status: 403 }
      )
    }

    const validated = ssoConfigSchema.parse(configData)

    const ssoConfig = await prisma.sSOConfig.upsert({
      where: { organizationId },
      update: validated,
      create: {
        organizationId,
        ...validated,
      },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'sso_config_update',
        eventCategory: 'security',
        resourceType: 'sso_config',
        resourceId: ssoConfig.id,
        action: 'update',
        details: { provider: validated.provider },
      },
    })

    return NextResponse.json({
      success: true,
      ssoConfig,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error saving SSO config:', error)
    return NextResponse.json(
      { error: 'Failed to save SSO configuration' },
      { status: 500 }
    )
  }
}

// DELETE - Remove SSO configuration
export async function DELETE(request: NextRequest) {
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

    await prisma.sSOConfig.delete({
      where: { organizationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting SSO config:', error)
    return NextResponse.json(
      { error: 'Failed to delete SSO configuration' },
      { status: 500 }
    )
  }
}
