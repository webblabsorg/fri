import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const apiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
  rateLimit: z.number().min(100).max(100000).optional(),
  expiresAt: z.string().datetime().optional(),
})

// GET - List API keys for organization
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

    const apiKeys = await prisma.aPIKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        enabled: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...keyData } = body

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

    const validated = apiKeySchema.parse(keyData)

    // Generate API key
    const rawKey = `fri_live_${crypto.randomBytes(32).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.substring(0, 16)

    const apiKey = await prisma.aPIKey.create({
      data: {
        organizationId,
        name: validated.name,
        keyHash,
        keyPrefix,
        permissions: validated.permissions,
        rateLimit: validated.rateLimit || 1000,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        createdById: (session.user as any).id,
      },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'api_key_create',
        eventCategory: 'security',
        resourceType: 'api_key',
        resourceId: apiKey.id,
        action: 'create',
        details: { name: validated.name },
      },
    })

    // Return the raw key only once - it cannot be retrieved again
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Only returned on creation
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
      },
      warning: 'Save this API key securely. It will not be shown again.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

// PATCH - Update API key (enable/disable, update permissions)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, organizationId, enabled, permissions, rateLimit } = body

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and Organization ID required' }, { status: 400 })
    }

    const apiKey = await prisma.aPIKey.update({
      where: { id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(permissions && { permissions }),
        ...(rateLimit && { rateLimit }),
      },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'api_key_update',
        eventCategory: 'security',
        resourceType: 'api_key',
        resourceId: id,
        action: 'update',
        details: { enabled, permissions, rateLimit },
      },
    })

    return NextResponse.json({ success: true, apiKey })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke API key
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

    await prisma.aPIKey.delete({
      where: { id },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'api_key_revoke',
        eventCategory: 'security',
        resourceType: 'api_key',
        resourceId: id,
        action: 'delete',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
