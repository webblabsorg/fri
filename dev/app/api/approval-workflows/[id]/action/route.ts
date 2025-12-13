import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processApprovalAction } from '@/lib/finance/approval-workflow-service'

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

    const { id: requestId } = await params
    const body = await request.json()
    const { organizationId, action, comments } = body

    if (!organizationId || !action) {
      return NextResponse.json(
        { error: 'Organization ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'delegated'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approved, rejected, or delegated' },
        { status: 400 }
      )
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await processApprovalAction(organizationId, {
      requestId,
      approverId: user.id,
      action,
      comments,
    })

    return NextResponse.json({
      result,
      message: `Request ${result.status}`,
    })
  } catch (error) {
    console.error('Error processing approval action:', error)
    const message = (error as Error).message || 'Failed to process approval'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
