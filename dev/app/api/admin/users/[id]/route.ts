import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'

export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        status: true,
        firmName: true,
        onboardingCompleted: true,
        onboardingRole: true,
        onboardingPracticeAreas: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            toolRuns: true,
            projects: true,
            sessions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent tool runs
    const recentToolRuns = await prisma.toolRun.findMany({
      where: { userId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        toolId: true,
        status: true,
        createdAt: true,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'view_user', 'user', id)

    return NextResponse.json({
      user: {
        ...user,
        recentToolRuns,
      },
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
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

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate: prevent non-super-admins from modifying super-admin users
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })

    if (
      targetUser?.role === 'super_admin' &&
      adminUser.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Only super admins can modify super admin accounts' },
        { status: 403 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    // Log admin action
    await logAdminAction(
      adminUser.id,
      'update_user',
      'user',
      id,
      { changes: body }
    )

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
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

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Validate: prevent non-super-admins from deleting super-admin users
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      targetUser.role === 'super_admin' &&
      adminUser.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Only super admins can delete super admin accounts' },
        { status: 403 }
      )
    }

    // Soft delete: set status to 'deleted'
    await prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        email: `deleted_${id}@deleted.local`, // Prevent email conflicts
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'delete_user', 'user', id, {
      deletedEmail: targetUser.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
