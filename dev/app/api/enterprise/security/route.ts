import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// ============================================================================
// IP WHITELIST
// ============================================================================

const ipWhitelistSchema = z.object({
  ipAddress: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
})

// GET - Get security settings for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type') // ip_whitelist, retention_policy, audit_logs

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

    if (type === 'ip_whitelist') {
      const whitelist = await prisma.iPWhitelist.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ whitelist })
    }

    if (type === 'retention_policy') {
      const policy = await prisma.dataRetentionPolicy.findUnique({
        where: { organizationId },
      })
      return NextResponse.json({ policy })
    }

    if (type === 'audit_logs') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const skip = (page - 1) * limit

      const [logs, total] = await Promise.all([
        prisma.enhancedAuditLog.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.enhancedAuditLog.count({ where: { organizationId } }),
      ])

      return NextResponse.json({
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    }

    // Return all security settings
    const [whitelist, retentionPolicy] = await Promise.all([
      prisma.iPWhitelist.findMany({ where: { organizationId } }),
      prisma.dataRetentionPolicy.findUnique({ where: { organizationId } }),
    ])

    return NextResponse.json({
      whitelist,
      retentionPolicy,
    })
  } catch (error) {
    console.error('Error fetching security settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    )
  }
}

// POST - Add IP to whitelist or create retention policy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, type, ...data } = body

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

    // Check enterprise plan
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (organization?.planTier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Advanced security features require Enterprise plan' },
        { status: 403 }
      )
    }

    if (type === 'ip_whitelist') {
      const validated = ipWhitelistSchema.parse(data)
      
      const entry = await prisma.iPWhitelist.create({
        data: {
          organizationId,
          ...validated,
          createdById: (session.user as any).id,
        },
      })

      await prisma.enhancedAuditLog.create({
        data: {
          organizationId,
          userId: (session.user as any).id,
          eventType: 'ip_whitelist_add',
          eventCategory: 'security',
          resourceType: 'ip_whitelist',
          resourceId: entry.id,
          action: 'create',
          details: { ipAddress: validated.ipAddress },
        },
      })

      return NextResponse.json({ success: true, entry })
    }

    if (type === 'retention_policy') {
      const policy = await prisma.dataRetentionPolicy.upsert({
        where: { organizationId },
        update: data,
        create: {
          organizationId,
          ...data,
        },
      })

      await prisma.enhancedAuditLog.create({
        data: {
          organizationId,
          userId: (session.user as any).id,
          eventType: 'retention_policy_update',
          eventCategory: 'security',
          resourceType: 'retention_policy',
          resourceId: policy.id,
          action: 'update',
          details: data,
        },
      })

      return NextResponse.json({ success: true, policy })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error saving security settings:', error)
    return NextResponse.json(
      { error: 'Failed to save security settings' },
      { status: 500 }
    )
  }
}

// DELETE - Remove IP from whitelist
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

    await prisma.iPWhitelist.delete({
      where: { id },
    })

    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'ip_whitelist_remove',
        eventCategory: 'security',
        resourceType: 'ip_whitelist',
        resourceId: id,
        action: 'delete',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting IP whitelist entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete IP whitelist entry' },
      { status: 500 }
    )
  }
}
