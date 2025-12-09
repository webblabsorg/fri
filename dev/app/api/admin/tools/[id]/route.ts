import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const tool = await prisma.tool.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        categoryId: true,
        inputType: true,
        outputType: true,
        pricingTier: true,
        aiModel: true,
        popular: true,
        featured: true,
        status: true,
        promptTemplate: true,
        systemPrompt: true,
        maxTokens: true,
        temperature: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
    })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    // Log admin view action
    await logAdminAction(adminUser.id, 'view_tool', 'tool', id)

    return NextResponse.json({ tool })
  } catch (error) {
    console.error('Admin tool detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Update tool
    const updatedTool = await prisma.tool.update({
      where: { id },
      data: body,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'update_tool', 'tool', id, {
      changes: body,
    })

    return NextResponse.json({ tool: updatedTool })
  } catch (error) {
    console.error('Admin tool update error:', error)
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Get tool info before deletion
    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { name: true, slug: true },
    })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    // Soft delete: set status to deprecated
    await prisma.tool.update({
      where: { id },
      data: {
        status: 'deprecated',
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'delete_tool', 'tool', id, {
      toolName: tool.name,
      toolSlug: tool.slug,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin tool delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    )
  }
}
