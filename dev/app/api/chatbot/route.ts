import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { ChatbotService } from '@/lib/chatbot/service'

// Store the Socket.IO server instance
let io: SocketIOServer | undefined

export async function GET(request: NextRequest) {
  // This endpoint is used to initialize the Socket.IO server
  // In a production environment, you might want to use a separate server
  
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = new HTTPServer()
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id)
      
      const { sessionId, pageUrl, userId, userPlan } = socket.handshake.query
      
      // Initialize conversation
      let conversation = await prisma.chatbotConversation.findUnique({
        where: { sessionId: sessionId as string }
      })

      if (!conversation) {
        conversation = await prisma.chatbotConversation.create({
          data: {
            sessionId: sessionId as string,
            pageUrl: pageUrl as string,
            userId: userId as string || null,
            userAgent: socket.handshake.headers['user-agent'] || null
          }
        })
      }

      socket.on('message', async (data) => {
        try {
          const { message, conversationId } = data
          
          // Save user message
          const userMessage = await prisma.chatbotMessage.create({
            data: {
              conversationId: conversation!.id,
              senderType: 'user',
              senderId: userId as string || null,
              message: message
            }
          })

          // Emit typing indicator
          socket.emit('typing', true)

          // Get AI response
          const chatbotService = new ChatbotService()
          const response = await chatbotService.processMessage({
            message,
            conversationId: conversation!.id,
            userId: userId as string || null,
            pageUrl: pageUrl as string,
            userPlan: userPlan as string || null
          })

          // Save bot message
          const botMessage = await prisma.chatbotMessage.create({
            data: {
              conversationId: conversation!.id,
              senderType: 'bot',
              message: response.message,
              intent: response.intent
            }
          })

          // Stop typing and send response
          socket.emit('typing', false)
          socket.emit('message', {
            message: {
              id: botMessage.id,
              senderType: 'bot',
              message: response.message,
              createdAt: botMessage.createdAt.toISOString(),
              intent: response.intent
            },
            quickReplies: response.quickReplies || [],
            conversationId: conversation!.id
          })

          // Handle lead capture if email provided
          if (response.leadData) {
            await prisma.chatbotLead.create({
              data: {
                conversationId: conversation!.id,
                email: response.leadData.email,
                name: response.leadData.name,
                company: response.leadData.company,
                role: response.leadData.role,
                leadScore: response.leadData.leadScore,
                sourcePage: pageUrl as string
              }
            })

            // Update conversation
            await prisma.chatbotConversation.update({
              where: { id: conversation!.id },
              data: {
                leadCaptured: true,
                emailCaptured: response.leadData.email
              }
            })
          }

        } catch (error) {
          console.error('Error processing message:', error)
          socket.emit('error', 'Failed to process message')
        }
      })

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id)
        
        // Update conversation end time
        if (conversation) {
          await prisma.chatbotConversation.update({
            where: { id: conversation.id },
            data: { endedAt: new Date() }
          })
        }
      })
    })
  }

  return NextResponse.json({ message: 'Socket.IO server initialized' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, conversationId, feedback, feedbackComment } = body

    if (action === 'feedback') {
      await prisma.chatbotConversation.update({
        where: { id: conversationId },
        data: {
          feedback,
          feedbackComment
        }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'escalate') {
      // Create support ticket from conversation
      const conversation = await prisma.chatbotConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          user: true
        }
      })

      if (!conversation || !conversation.user) {
        return NextResponse.json(
          { error: 'Conversation or user not found' },
          { status: 404 }
        )
      }

      // Generate ticket number
      const ticketCount = await prisma.supportTicket.count()
      const ticketNumber = `FRITH-${(ticketCount + 1).toString().padStart(6, '0')}`

      // Create support ticket
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: conversation.userId!,
          subject: 'Escalated from chatbot conversation',
          category: 'technical',
          priority: 'medium',
          status: 'open'
        }
      })

      // Create initial message with conversation transcript
      const transcript = conversation.messages
        .map(msg => `${msg.senderType === 'user' ? 'User' : 'Bot'}: ${msg.message}`)
        .join('\n\n')

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: conversation.userId!,
          senderType: 'user',
          message: `Conversation transcript:\n\n${transcript}`
        }
      })

      // Update conversation
      await prisma.chatbotConversation.update({
        where: { id: conversationId },
        data: { escalated: true }
      })

      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in chatbot API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
