import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getToolHistory } from '@/lib/ai/tool-executor'

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

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get tool history
    const history = await getToolHistory(user.id, limit, offset)

    return NextResponse.json(history)
  } catch (error) {
    console.error('Tool history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
