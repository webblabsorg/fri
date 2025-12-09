import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get the tool run ID from params
    const { id: toolRunId } = await params

    // Parse request body
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify the tool run belongs to the user
    const toolRun = await prisma.toolRun.findUnique({
      where: { id: toolRunId },
      select: { userId: true },
    })

    if (!toolRun) {
      return NextResponse.json(
        { error: 'Tool run not found' },
        { status: 404 }
      )
    }

    if (toolRun.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to tool run' },
        { status: 403 }
      )
    }

    // Verify the project belongs to the user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdBy: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to project' },
        { status: 403 }
      )
    }

    // Link the tool run to the project
    const updatedToolRun = await prisma.toolRun.update({
      where: { id: toolRunId },
      data: { projectId },
    })

    return NextResponse.json({
      success: true,
      toolRun: updatedToolRun,
    })
  } catch (error) {
    console.error('Link tool run to project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
