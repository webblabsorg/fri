import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/workflows
 * List workflows for the current user's workspace
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const organizationId = searchParams.get('organizationId')

    const workflows = await prisma.workflow.findMany({
      where: {
        ...(workspaceId && { workspaceId }),
        ...(organizationId && { organizationId }),
        // If no workspace/org specified, get user's personal workflows
        ...(!workspaceId && !organizationId && { createdById: user.id }),
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { runs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('[API] Get workflows error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, workspaceId, organizationId, steps } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    // Create workflow with steps in a transaction
    const workflow = await prisma.$transaction(async (tx) => {
      const newWorkflow = await tx.workflow.create({
        data: {
          name,
          description,
          workspaceId,
          organizationId,
          createdById: user.id,
          status: 'draft',
        },
      })

      // Create steps if provided
      if (steps && Array.isArray(steps)) {
        await tx.workflowStep.createMany({
          data: steps.map((step: any, index: number) => ({
            workflowId: newWorkflow.id,
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
        where: { id: newWorkflow.id },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId,
        action: 'created',
        targetType: 'workflow',
        targetId: workflow!.id,
        description: `Created workflow "${name}"`,
        metadata: {
          workflowName: name,
          stepCount: steps?.length || 0,
        },
      },
    })

    return NextResponse.json({
      workflow,
      message: 'Workflow created successfully',
    })
  } catch (error) {
    console.error('[API] Create workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
