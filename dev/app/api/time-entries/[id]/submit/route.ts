import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
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
    const { organizationId } = body

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
      return NextResponse.json({ error: 'Time entry not found or already submitted' }, { status: 404 })
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: { status: 'submitted' },
      include: {
        matter: { include: { client: true } },
      },
    })

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error('Error submitting time entry:', error)
    return NextResponse.json({ error: 'Failed to submit time entry' }, { status: 500 })
  }
}
