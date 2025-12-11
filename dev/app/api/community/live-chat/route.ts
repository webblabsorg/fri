import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const messageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
  attachments: z.array(z.string().url()).optional(),
})

// GET - Get chat session or list sessions (for agents)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const type = searchParams.get('type') // sessions, messages

    // Get single session with messages
    if (sessionId) {
      const chatSession = await prisma.liveChatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({ session: chatSession })
    }

    // Agent: list sessions
    if (type === 'sessions' && session?.user) {
      const isAgent = await prisma.supportAgent.findUnique({
        where: { userId: (session.user as any).id },
      })

      if (!isAgent && (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const status = searchParams.get('status') || 'waiting'
      
      const sessions = await prisma.liveChatSession.findMany({
        where: { status },
        orderBy: { createdAt: 'asc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      // Get queue stats
      const stats = await prisma.liveChatSession.groupBy({
        by: ['status'],
        _count: { id: true },
      })

      return NextResponse.json({
        sessions,
        stats: stats.reduce((acc, s) => {
          acc[s.status] = s._count.id
          return acc
        }, {} as Record<string, number>),
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching chat data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat data' },
      { status: 500 }
    )
  }
}

// POST - Start chat session or send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()
    const { action, ...data } = body

    // Start new chat session
    if (action === 'start_session') {
      const { handoffFrom, handoffReason, channel } = data

      const chatSession = await prisma.liveChatSession.create({
        data: {
          userId: session?.user ? (session.user as any).id : null,
          visitorId: !session?.user ? `visitor_${Date.now()}` : null,
          channel: channel || 'web',
          handoffFrom,
          handoffReason,
        },
      })

      // Add system message
      await prisma.liveChatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderType: 'system',
          content: 'Chat session started. An agent will be with you shortly.',
        },
      })

      return NextResponse.json({
        success: true,
        session: chatSession,
      })
    }

    // Send message
    if (action === 'send_message') {
      const validated = messageSchema.parse(data)

      // Determine sender type
      let senderType = 'visitor'
      let senderId = null

      if (session?.user) {
        const isAgent = await prisma.supportAgent.findUnique({
          where: { userId: (session.user as any).id },
        })

        if (isAgent) {
          senderType = 'agent'
        } else {
          senderType = 'user'
        }
        senderId = (session.user as any).id
      }

      const message = await prisma.liveChatMessage.create({
        data: {
          sessionId: validated.sessionId,
          senderId,
          senderType,
          content: validated.content,
          attachments: validated.attachments,
        },
      })

      return NextResponse.json({ success: true, message })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in chat action:', error)
    return NextResponse.json(
      { error: 'Failed to process chat action' },
      { status: 500 }
    )
  }
}

// PATCH - Update session (assign agent, close, rate)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, action, ...data } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const chatSession = await prisma.liveChatSession.findUnique({
      where: { id: sessionId },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Agent assigns themselves
    if (action === 'assign') {
      const agent = await prisma.supportAgent.findUnique({
        where: { userId: (session.user as any).id },
      })

      if (!agent) {
        return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
      }

      if (agent.currentChats >= agent.maxConcurrent) {
        return NextResponse.json(
          { error: 'Maximum concurrent chats reached' },
          { status: 400 }
        )
      }

      await prisma.liveChatSession.update({
        where: { id: sessionId },
        data: {
          agentId: (session.user as any).id,
          status: 'active',
          firstResponseAt: chatSession.firstResponseAt || new Date(),
        },
      })

      await prisma.supportAgent.update({
        where: { userId: (session.user as any).id },
        data: { currentChats: { increment: 1 } },
      })

      // Add system message
      await prisma.liveChatMessage.create({
        data: {
          sessionId,
          senderType: 'system',
          content: `${agent.displayName} has joined the chat.`,
        },
      })

      return NextResponse.json({ success: true })
    }

    // Close session
    if (action === 'close') {
      await prisma.liveChatSession.update({
        where: { id: sessionId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      })

      // Decrement agent's current chats
      if (chatSession.agentId) {
        await prisma.supportAgent.update({
          where: { userId: chatSession.agentId },
          data: { currentChats: { decrement: 1 } },
        })
      }

      // Add system message
      await prisma.liveChatMessage.create({
        data: {
          sessionId,
          senderType: 'system',
          content: 'Chat session has ended.',
        },
      })

      return NextResponse.json({ success: true })
    }

    // Rate session (user only)
    if (action === 'rate') {
      const { rating, feedback } = data

      if (chatSession.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.liveChatSession.update({
        where: { id: sessionId },
        data: { rating, feedback },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    )
  }
}
