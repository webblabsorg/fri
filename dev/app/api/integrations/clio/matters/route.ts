import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createClioClient } from '@/lib/integrations/clio/clio-client'

/**
 * GET /api/integrations/clio/matters
 * List matters from connected Clio account
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Clio connection
    const connection = await prisma.clioConnection.findFirst({
      where: { userId: user.id },
    })

    if (!connection || connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Clio account not connected' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Clio token expired' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined

    // Create Clio client and fetch matters
    const clioClient = createClioClient({
      accessToken: connection.accessToken,
    })

    const response = await clioClient.getMatters({
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      status,
    })

    return NextResponse.json({
      matters: response.data,
      pagination: {
        limit,
        offset,
        total: response.data.length, // Clio doesn't provide total count in this endpoint
      },
    })
  } catch (error) {
    console.error('[Clio] Get matters error:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      // Token might be expired, mark connection as expired
      const cookieStore = await cookies()
      const sessionUser = await getSessionUser(cookieStore.get('session')?.value || '')
      if (sessionUser?.id) {
        await prisma.clioConnection.updateMany({
          where: { userId: sessionUser.id },
          data: { status: 'expired' },
        })
      }
      
      return NextResponse.json(
        { error: 'Clio token expired' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch matters' },
      { status: 500 }
    )
  }
}
