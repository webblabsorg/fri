import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUserUsageStats } from '@/lib/ai/tool-executor'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get usage stats
    const stats = await getUserUsageStats(user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Usage stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
