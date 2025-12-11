import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/workflows/[id]
 * Get workflow details with steps
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { runs: true },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      workflow.createdById === user.id ||
      (workflow.workspaceId && await checkWorkspaceAccess(user.id, workflow.workspaceId)) ||
      (workflow.organizationId && await checkOrganizationAccess(user.id, workflow.organizationId))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('[API] Get workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update workflow
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, description, status, steps } = body

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: true },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check permissions
    const hasAccess = 
      workflow.createdById === user.id ||
      (workflow.workspaceId && await checkWorkspaceAccess(user.id, workflow.workspaceId)) ||
      (workflow.organizationId && await checkOrganizationAccess(user.id, workflow.organizationId))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update workflow and steps in transaction
    const updatedWorkflow = await prisma.$transaction(async (tx) => {
      // Update workflow
      const updated = await tx.workflow.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
        },
      })

      // Update steps if provided
      if (steps && Array.isArray(steps)) {
        // Delete existing steps
        await tx.workflowStep.deleteMany({
          where: { workflowId: id },
        })

        // Create new steps
        await tx.workflowStep.createMany({
          data: steps.map((step: any, index: number) => ({
            workflowId: id,
            order: index + 1,
            toolId: step.toolId,
            name: step.name || `Step ${index + 1}`,
            config: step.config || {},
            waitForPrevious: step.waitForPrevious ?? true,
            continueOnError: step.continueOnError ?? false,
          })),
        })
      }

      return tx.workflow.findUnique({
        where: { id },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    return NextResponse.json({
      workflow: updatedWorkflow,
      message: 'Workflow updated successfully',
    })
  } catch (error) {
    console.error('[API] Update workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete workflow
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check permissions
    const hasAccess = 
      workflow.createdById === user.id ||
      (workflow.workspaceId && await checkWorkspaceAccess(user.id, workflow.workspaceId)) ||
      (workflow.organizationId && await checkOrganizationAccess(user.id, workflow.organizationId))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.workflow.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    console.error('[API] Delete workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

// Helper functions for access control
async function checkWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  })
  return !!member
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  })
  return !!member
}
