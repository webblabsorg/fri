import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createReconciliationSchedule,
  getReconciliationSchedules,
  deactivateReconciliationSchedule,
  runAutomatedReconciliation,
  getReconciliationJobHistory,
  getReconciliationAlerts,
} from '@/lib/finance/daily-reconciliation-scheduler'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const action = searchParams.get('action')
    const trustAccountId = searchParams.get('trustAccountId')
    const scheduleId = searchParams.get('scheduleId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (action === 'alerts') {
      const alerts = await getReconciliationAlerts(organizationId)

      return NextResponse.json({
        success: true,
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === 'critical').length,
          high: alerts.filter((a) => a.severity === 'high').length,
          medium: alerts.filter((a) => a.severity === 'medium').length,
        },
      })
    }

    if (action === 'history') {
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const status = searchParams.get('status') as 'completed' | 'failed' | null

      const history = await getReconciliationJobHistory(
        organizationId,
        {
          trustAccountId: trustAccountId || undefined,
          scheduleId: scheduleId || undefined,
          status: status || undefined,
          limit,
        }
      )

      return NextResponse.json({
        success: true,
        jobs: history,
        summary: {
          total: history.length,
          completed: history.filter((j) => j.status === 'completed').length,
          failed: history.filter((j) => j.status === 'failed').length,
        },
      })
    }

    const schedules = await getReconciliationSchedules(organizationId)

    return NextResponse.json({
      success: true,
      schedules,
      summary: {
        total: schedules.length,
        active: schedules.filter((s) => s.isActive).length,
        daily: schedules.filter((s) => s.frequency === 'daily').length,
        weekly: schedules.filter((s) => s.frequency === 'weekly').length,
        monthly: schedules.filter((s) => s.frequency === 'monthly').length,
      },
    })
  } catch (error) {
    console.error('Error getting reconciliation schedules:', error)
    return NextResponse.json(
      { error: 'Failed to get reconciliation schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, organizationId, trustAccountId, scheduleId, frequency, timeOfDay, dayOfWeek, dayOfMonth } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active', role: { in: ['owner', 'admin'] } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (action === 'run') {
      if (!trustAccountId || !scheduleId) {
        return NextResponse.json(
          { error: 'Trust account ID and schedule ID are required' },
          { status: 400 }
        )
      }

      const job = await runAutomatedReconciliation(
        organizationId,
        trustAccountId,
        scheduleId,
        user.id
      )

      return NextResponse.json({
        success: true,
        job,
      })
    }

    if (action === 'deactivate') {
      if (!scheduleId) {
        return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
      }

      await deactivateReconciliationSchedule(scheduleId, user.id)

      return NextResponse.json({
        success: true,
        message: 'Schedule deactivated',
      })
    }

    // Create new schedule
    if (!trustAccountId) {
      return NextResponse.json({ error: 'Trust account ID is required' }, { status: 400 })
    }

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json({ error: 'Valid frequency is required (daily, weekly, monthly)' }, { status: 400 })
    }

    if (!timeOfDay || !/^\d{2}:\d{2}$/.test(timeOfDay)) {
      return NextResponse.json({ error: 'Valid time of day is required (HH:MM format)' }, { status: 400 })
    }

    const schedule = await createReconciliationSchedule(
      organizationId,
      trustAccountId,
      frequency,
      timeOfDay,
      user.id,
      {
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      }
    )

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error managing reconciliation schedule:', error)
    return NextResponse.json(
      { error: 'Failed to manage reconciliation schedule' },
      { status: 500 }
    )
  }
}
