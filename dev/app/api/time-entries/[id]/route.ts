import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const timeEntry = await prisma.timeEntry.findFirst({
      where: { id, organizationId },
      include: {
        matter: { include: { client: true } },
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error('Error fetching time entry:', error)
    return NextResponse.json({ error: 'Failed to fetch time entry' }, { status: 500 })
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
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { organizationId, date, hours, rate, description, isBillable, utbmsTaskCode, utbmsActivityCode } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existing = await prisma.timeEntry.findFirst({
      where: { id, organizationId, status: { in: ['draft', 'submitted'] } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Time entry not found or cannot be edited' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (date) updateData.date = new Date(date)
    if (hours !== undefined) {
      updateData.hours = new Decimal(hours)
      updateData.amount = new Decimal(hours * (rate || Number(existing.rate)))
    }
    if (rate !== undefined) {
      updateData.rate = new Decimal(rate)
      updateData.amount = new Decimal((hours || Number(existing.hours)) * rate)
    }
    if (description) updateData.description = description
    if (isBillable !== undefined) updateData.isBillable = isBillable
    if (utbmsTaskCode !== undefined) updateData.utbmsTaskCode = utbmsTaskCode
    if (utbmsActivityCode !== undefined) updateData.utbmsActivityCode = utbmsActivityCode

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        matter: { include: { client: true } },
      },
    })

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 })
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
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existing = await prisma.timeEntry.findFirst({
      where: { id, organizationId, status: 'draft' },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Time entry not found or cannot be deleted' }, { status: 404 })
    }

    await prisma.timeEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 })
  }
}
