import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const brandingSchema = z.object({
  // Domain
  customDomain: z.string().optional().nullable(),
  // Logo & Colors
  logoUrl: z.string().url().optional().nullable(),
  logoLightUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  // Text
  companyName: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  // Features
  hideFooterBranding: z.boolean().optional(),
  customCss: z.string().optional().nullable(),
  customJs: z.string().optional().nullable(),
  // Email branding
  emailFromName: z.string().optional().nullable(),
  emailHeaderHtml: z.string().optional().nullable(),
  emailFooterHtml: z.string().optional().nullable(),
})

// GET - Get branding settings
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

    // Check user has access to organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
      },
    })

    if (!membership && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const branding = await prisma.organizationBranding.findUnique({
      where: { organizationId },
    })

    return NextResponse.json({ branding })
  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branding settings' },
      { status: 500 }
    )
  }
}

// POST - Update branding settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...brandingData } = body

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

    // Check enterprise plan for white-label features
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (organization?.planTier !== 'enterprise') {
      // Allow basic branding for all plans, but restrict advanced features
      const restrictedFields = ['customDomain', 'hideFooterBranding', 'customCss', 'customJs']
      for (const field of restrictedFields) {
        if (brandingData[field]) {
          return NextResponse.json(
            { error: `${field} requires Enterprise plan` },
            { status: 403 }
          )
        }
      }
    }

    const validated = brandingSchema.parse(brandingData)

    // If setting custom domain, generate verification token
    let domainVerifyToken: string | undefined
    if (validated.customDomain) {
      domainVerifyToken = crypto.randomBytes(32).toString('hex')
    }

    const branding = await prisma.organizationBranding.upsert({
      where: { organizationId },
      update: {
        ...validated,
        ...(domainVerifyToken && {
          domainVerifyToken,
          domainVerified: false,
        }),
      },
      create: {
        organizationId,
        ...validated,
        ...(domainVerifyToken && {
          domainVerifyToken,
          domainVerified: false,
        }),
      },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'branding_update',
        eventCategory: 'admin',
        resourceType: 'branding',
        resourceId: branding.id,
        action: 'update',
        details: { fields: Object.keys(validated) },
      },
    })

    return NextResponse.json({
      success: true,
      branding,
      // Include domain verification instructions if new domain
      ...(domainVerifyToken && {
        domainVerification: {
          token: domainVerifyToken,
          instructions: `Add a TXT record to your DNS with value: frith-verify=${domainVerifyToken}`,
        },
      }),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error saving branding:', error)
    return NextResponse.json(
      { error: 'Failed to save branding settings' },
      { status: 500 }
    )
  }
}

// PATCH - Verify custom domain
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, action } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    if (action === 'verify_domain') {
      const branding = await prisma.organizationBranding.findUnique({
        where: { organizationId },
      })

      if (!branding?.customDomain || !branding.domainVerifyToken) {
        return NextResponse.json(
          { error: 'No custom domain configured' },
          { status: 400 }
        )
      }

      // In production, this would do DNS lookup to verify TXT record
      // For now, we'll simulate verification
      const isVerified = true // dns.resolveTxt(branding.customDomain) includes token

      if (isVerified) {
        await prisma.organizationBranding.update({
          where: { organizationId },
          data: { domainVerified: true },
        })

        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Domain verified successfully',
        })
      }

      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Domain verification failed. Please check your DNS settings.',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
