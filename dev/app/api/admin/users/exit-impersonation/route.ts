import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    // Get impersonation metadata from cookie
    const impersonationCookie = request.cookies.get('impersonation')?.value

    if (!impersonationCookie) {
      return NextResponse.json(
        { error: 'Not in impersonation mode' },
        { status: 400 }
      )
    }

    const impersonationData = JSON.parse(impersonationCookie)
    const { originalAdminId, originalSessionToken, targetUserId } =
      impersonationData

    // Log exit action
    await logAdminAction(originalAdminId, 'exit_impersonation', 'user', targetUserId)

    // Restore original admin session
    const response = NextResponse.json({
      success: true,
      message: 'Exited impersonation mode',
    })

    // Restore original session cookie
    response.cookies.set('session', originalSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // Clear impersonation cookie
    response.cookies.delete('impersonation')

    return response
  } catch (error) {
    console.error('Exit impersonation error:', error)
    return NextResponse.json(
      { error: 'Failed to exit impersonation' },
      { status: 500 }
    )
  }
}
