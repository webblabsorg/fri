import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active conversations (no endedAt or recent activity)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    const conversations = await (prisma as any).chatbotConversation.findMany({
      where: {
        OR: [
          { endedAt: null },
          { 
            endedAt: null,
            startedAt: {
              gte: thirtyMinutesAgo
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            message: true,
            senderType: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 50
    })

    // Transform data for frontend
    const liveConversations = conversations.map((conv: any) => {
      const lastMessage = conv.messages[0]
      const now = new Date()
      const lastActivity = lastMessage ? new Date(lastMessage.createdAt) : new Date(conv.startedAt)
      const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
      
      let status = 'active'
      if (conv.escalated) {
        status = 'escalated'
      } else if (minutesSinceActivity > 10) {
        status = 'idle'
      }

      return {
        id: conv.id,
        sessionId: conv.sessionId,
        userId: conv.userId,
        userAgent: conv.userAgent,
        pageUrl: conv.pageUrl,
        startedAt: conv.startedAt,
        lastMessageAt: lastMessage ? lastMessage.createdAt : conv.startedAt,
        messageCount: conv._count.messages,
        status,
        user: conv.user,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          senderType: lastMessage.senderType,
          createdAt: lastMessage.createdAt
        } : null
      }
    })

    return NextResponse.json({
      conversations: liveConversations,
      totalActive: liveConversations.filter((c: any) => c.status === 'active').length,
      totalIdle: liveConversations.filter((c: any) => c.status === 'idle').length,
      totalEscalated: liveConversations.filter((c: any) => c.status === 'escalated').length
    })
  } catch (error) {
    console.error('Error fetching live conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live conversations' },
      { status: 500 }
    )
  }
}
