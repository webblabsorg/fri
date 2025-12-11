import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/schedules
 * List scheduled jobs for the current user
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
    const type = searchParams.get('type')

    const schedules = await prisma.scheduledJob.findMany({
      where: {
        createdById: user.id,
        ...(workspaceId && { workspaceId }),
        ...(organizationId && { organizationId }),
        ...(type && { type }),
      },
      orderBy: { nextRunAt: 'asc' },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('[API] Get schedules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules
 * Create a new scheduled job
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
    const {
      name,
      description,
      type,
      toolId,
      workflowId,
      cronExpression,
      frequency,
      timezone,
      config,
      emailResults,
      emailTo,
      workspaceId,
      organizationId,
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (type === 'tool' && !toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required for tool schedules' },
        { status: 400 }
      )
    }

    if (type === 'workflow' && !workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required for workflow schedules' },
        { status: 400 }
      )
    }

    if (!cronExpression && !frequency) {
      return NextResponse.json(
        { error: 'Either cron expression or frequency is required' },
        { status: 400 }
      )
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(cronExpression, frequency, timezone)

    const schedule = await prisma.scheduledJob.create({
      data: {
        name,
        description,
        type,
        toolId,
        workflowId,
        cronExpression,
        frequency,
        timezone: timezone || 'UTC',
        config: config || {},
        emailResults: emailResults || false,
        emailTo: emailTo || [],
        nextRunAt,
        createdById: user.id,
        workspaceId,
        organizationId,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId,
        action: 'created',
        targetType: 'schedule',
        targetId: schedule.id,
        description: `Created scheduled job "${name}"`,
        metadata: {
          scheduleName: name,
          type,
          frequency: frequency || cronExpression,
        },
      },
    })

    return NextResponse.json({
      schedule,
      message: 'Schedule created successfully',
    })
  } catch (error) {
    console.error('[API] Create schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

/**
 * Calculate next run time based on frequency or cron expression
 */
function calculateNextRun(
  cronExpression?: string,
  frequency?: string,
  timezone: string = 'UTC'
): Date {
  const now = new Date()

  if (frequency) {
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 60 * 60 * 1000) // Default to 1 hour
    }
  }

  if (cronExpression) {
    // For a production implementation, you would use a cron parser library
    // For now, we'll default to 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000)
  }

  return new Date(now.getTime() + 60 * 60 * 1000)
}
