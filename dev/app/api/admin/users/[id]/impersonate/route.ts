import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isSuperAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

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
    
    // Only super_admin can impersonate
    if (!adminUser || !isSuperAdmin(adminUser.role)) {
      return NextResponse.json(
        { error: 'Only super admins can impersonate users' },
        { status: 403 }
      )
    }

    const { id: targetUserId } = await params

    // Prevent self-impersonation
    if (targetUserId === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot impersonate yourself' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent impersonating other super admins
    if (targetUser.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot impersonate other super admins' },
        { status: 403 }
      )
    }

    // Create new session for impersonation
    const newSessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours max

    // Store impersonation session with special metadata
    await prisma.session.create({
      data: {
        userId: targetUserId,
        sessionToken: newSessionToken,
        expiresAt,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      },
    })

    // Store original admin session for later restoration
    // We'll use a cookie for this
    const impersonationData = {
      originalAdminId: adminUser.id,
      originalSessionToken: sessionToken,
      targetUserId,
      startedAt: new Date().toISOString(),
    }

    // Log impersonation action
    await logAdminAction(adminUser.id, 'impersonate_user', 'user', targetUserId, {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    })

    // Return new session token and impersonation metadata
    const response = NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
      impersonationData,
    })

    // Set the new session cookie
    response.cookies.set('session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/',
    })

    // Set impersonation metadata cookie
    response.cookies.set('impersonation', JSON.stringify(impersonationData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Admin impersonate user error:', error)
    return NextResponse.json(
      { error: 'Failed to impersonate user' },
      { status: 500 }
    )
  }
}
