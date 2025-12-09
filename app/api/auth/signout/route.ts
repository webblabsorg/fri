import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken)

      // Log audit event (if we can find the user)
      try {
        const session = await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: true },
        })

        if (session) {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              eventType: 'user_signout',
              eventData: {
                timestamp: new Date().toISOString(),
              },
            },
          })
        }
      } catch (error) {
        // Session may already be deleted, that's okay
        console.log('Could not log signout event:', error)
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    })

    // Clear session cookie
    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during sign out' },
      { status: 500 }
    )
  }
}
