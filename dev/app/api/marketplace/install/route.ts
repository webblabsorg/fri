import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - List installed marketplace tools for organization
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

    const installations = await prisma.marketplaceInstall.findMany({
      where: { organizationId },
      include: {
        tool: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            category: true,
            icon: true,
            pricing: true,
          },
        },
      },
    })

    return NextResponse.json({ installations })
  } catch (error) {
    console.error('Error fetching installations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installations' },
      { status: 500 }
    )
  }
}

// POST - Install marketplace tool
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, toolId, config } = body

    if (!organizationId || !toolId) {
      return NextResponse.json(
        { error: 'Organization ID and Tool ID required' },
        { status: 400 }
      )
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

    // Check tool exists and is published
    const tool = await prisma.marketplaceTool.findUnique({
      where: { id: toolId },
    })

    if (!tool || tool.status !== 'published') {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    // Check if already installed
    const existing = await prisma.marketplaceInstall.findUnique({
      where: {
        toolId_organizationId: {
          toolId,
          organizationId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Tool already installed' },
        { status: 400 }
      )
    }

    // Create installation
    const installation = await prisma.marketplaceInstall.create({
      data: {
        toolId,
        organizationId,
        installedById: (session.user as any).id,
        config,
      },
    })

    // Increment install count
    await prisma.marketplaceTool.update({
      where: { id: toolId },
      data: { installCount: { increment: 1 } },
    })

    // Log audit event
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        userId: (session.user as any).id,
        eventType: 'marketplace_install',
        eventCategory: 'admin',
        resourceType: 'marketplace_tool',
        resourceId: toolId,
        action: 'create',
        details: { toolName: tool.name },
      },
    })

    return NextResponse.json({
      success: true,
      installation,
    })
  } catch (error) {
    console.error('Error installing tool:', error)
    return NextResponse.json(
      { error: 'Failed to install tool' },
      { status: 500 }
    )
  }
}

// DELETE - Uninstall marketplace tool
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    const organizationId = searchParams.get('organizationId')

    if (!toolId || !organizationId) {
      return NextResponse.json(
        { error: 'Tool ID and Organization ID required' },
        { status: 400 }
      )
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

    await prisma.marketplaceInstall.delete({
      where: {
        toolId_organizationId: {
          toolId,
          organizationId,
        },
      },
    })

    // Decrement install count
    await prisma.marketplaceTool.update({
      where: { id: toolId },
      data: { installCount: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error uninstalling tool:', error)
    return NextResponse.json(
      { error: 'Failed to uninstall tool' },
      { status: 500 }
    )
  }
}
