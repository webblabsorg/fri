import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
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

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason, duration } = body // duration in days, null = permanent

    // Prevent self-suspension
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400 }
      )
    }

    // Validate: prevent non-super-admins from suspending super-admin users
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, status: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      targetUser.role === 'super_admin' &&
      adminUser.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Only super admins can suspend super admin accounts' },
        { status: 403 }
      )
    }

    // Toggle suspension: if already suspended, reactivate
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended'
    const action = newStatus === 'suspended' ? 'suspend' : 'reactivate'

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, `${action}_user`, 'user', id, {
      reason,
      duration,
      previousStatus: targetUser.status,
      newStatus,
    })

    return NextResponse.json({ user: updatedUser, action })
  } catch (error) {
    console.error('Admin suspend user error:', error)
    return NextResponse.json(
      { error: 'Failed to suspend/reactivate user' },
      { status: 500 }
    )
  }
}
