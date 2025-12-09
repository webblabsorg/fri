import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch project details with runs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to recent 100 runs
        },
        _count: {
          select: { runs: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    if (project.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        privacy: project.privacy,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        totalRuns: project._count.runs,
        runs: project.runs.map(run => ({
          id: run.id,
          toolId: run.toolId,
          inputText: run.inputText,
          outputText: run.outputText,
          status: run.status,
          aiModelUsed: run.aiModelUsed,
          tokensUsed: run.tokensUsed,
          cost: run.cost,
          createdAt: run.createdAt.toISOString(),
          completedAt: run.completedAt?.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, status } = body

    // Verify ownership first
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { createdBy: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existingProject.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        updatedAt: updatedProject.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE - Delete/archive project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership first
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { createdBy: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existingProject.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // Archive instead of hard delete (safer)
    const archivedProject = await prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    })

    return NextResponse.json({
      success: true,
      message: 'Project archived successfully',
      project: {
        id: archivedProject.id,
        status: archivedProject.status,
      },
    })
  } catch (error) {
    console.error('Project delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
