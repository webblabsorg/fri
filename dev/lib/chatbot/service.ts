import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { hubspotService } from '@/lib/integrations/hubspot'

interface ProcessMessageRequest {
  message: string
  conversationId: string
  userId?: string | null
  pageUrl?: string
  userPlan?: string | null
}

interface ProcessMessageResponse {
  message: string
  intent?: string
  quickReplies?: string[]
  leadData?: {
    email: string
    name?: string
    company?: string
    role?: string
    leadScore?: string
  }
}

interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

export class ChatbotService {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })
  }

  async processMessage(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    try {
      // Get conversation history
      const messages = await prisma.chatbotMessage.findMany({
        where: { conversationId: request.conversationId },
        orderBy: { createdAt: 'asc' },
        take: 20 // Last 20 messages for context
      })

      // Get user info if available
      let userContext = ''
      if (request.userId) {
        const user = await prisma.user.findUnique({
          where: { id: request.userId },
          select: {
            name: true,
            email: true,
            subscriptionTier: true,
            firmName: true
          }
        })

        if (user) {
          userContext = `User: ${user.name} (${user.email}), Plan: ${user.subscriptionTier || 'Free'}, Firm: ${user.firmName || 'N/A'}`
        }
      }

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(request.pageUrl || '', userContext, request.userPlan || undefined)

      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: (msg as any).senderType === 'user' ? 'user' : 'assistant',
        content: msg.message
      }))

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: request.message
      })

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: conversationHistory as any,
        tools: this.getAvailableTools()
      })

      let responseMessage = ''
      const functionCalls: FunctionCall[] = []

      // Process response
      for (const content of response.content) {
        if (content.type === 'text') {
          responseMessage += content.text
        } else if (content.type === 'tool_use') {
          functionCalls.push({
            name: content.name,
            arguments: content.input as Record<string, any>
          })
        }
      }

      // Execute function calls
      let leadData: ProcessMessageResponse['leadData']
      let quickReplies: string[] = []

      for (const call of functionCalls) {
        const result = await this.executeFunctionCall(call, request)
        
        if (call.name === 'create_lead') {
          leadData = result as ProcessMessageResponse['leadData']
        } else if (call.name === 'get_quick_replies') {
          quickReplies = result as string[]
        }
      }

      // Determine intent
      const intent = this.classifyIntent(request.message)

      // Get default quick replies if none from function calls
      if (quickReplies.length === 0) {
        quickReplies = this.getDefaultQuickReplies(intent, request.pageUrl)
      }

      return {
        message: responseMessage || "I'm here to help! What would you like to know?",
        intent,
        quickReplies,
        leadData
      }

    } catch (error) {
      console.error('Error processing message:', error)
      return {
        message: "I'm sorry, I'm having trouble right now. Please try again or contact our support team.",
        intent: 'error'
      }
    }
  }

  private buildSystemPrompt(pageUrl?: string, userContext?: string, userPlan?: string): string {
    let prompt = `You are Frith Assistant, an AI customer success agent for Frith AI, the leading legal AI platform with 240+ specialized tools for legal professionals.

Your goals:
1. Help visitors learn about Frith AI
2. Qualify leads and capture emails
3. Guide users to signup or upgrade
4. Answer product questions accurately
5. Troubleshoot issues and reduce support tickets
6. Be friendly, professional, and helpful

Context about Frith AI:
- Platform: 240+ AI legal tools for contract review, legal research, drafting, litigation support, and more
- Pricing: Free (15 queries/mo), Starter ($79/mo), Professional ($199/mo), Advanced ($499/mo)
- Key differentiator: Most comprehensive legal AI platform (competitors have 10-20 tools)
- 45-day money-back guarantee
- Powered by Claude AI (Anthropic)
- Target users: Solo practitioners, law firms, in-house counsel, legal ops

Tone: Professional yet approachable. Use legal terminology when appropriate, but explain complex concepts simply. Use emojis sparingly (1-2 per message max).

Constraints:
- Don't make up features that don't exist
- If you don't know something, say "I'm not sure, but let me connect you with our team"
- Don't provide legal advice (you're a product assistant, not a lawyer)
- Keep messages concise (2-4 sentences, use bullet points)
- Always provide quick reply options when possible`

    if (pageUrl) {
      prompt += `\n\nCurrent page: ${pageUrl}`
    }

    if (userContext) {
      prompt += `\n\nUser context: ${userContext}`
    }

    return prompt
  }

  private getAvailableTools() {
    return [
      {
        name: 'search_knowledge_base',
        description: 'Search the help center and knowledge base for relevant articles',
        input_schema: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string' as const,
              description: 'Search query for the knowledge base'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_tool_info',
        description: 'Get information about a specific AI tool',
        input_schema: {
          type: 'object' as const,
          properties: {
            toolName: {
              type: 'string' as const,
              description: 'Name of the AI tool to get information about'
            }
          },
          required: ['toolName']
        }
      },
      {
        name: 'create_lead',
        description: 'Capture lead information when user provides email',
        input_schema: {
          type: 'object' as const,
          properties: {
            email: {
              type: 'string' as const,
              description: 'User email address'
            },
            name: {
              type: 'string' as const,
              description: 'User name (optional)'
            },
            company: {
              type: 'string' as const,
              description: 'Company/firm name (optional)'
            },
            role: {
              type: 'string' as const,
              description: 'User role (optional)'
            },
            leadScore: {
              type: 'string' as const,
              enum: ['high', 'medium', 'low'] as const,
              description: 'Lead score based on qualification'
            }
          },
          required: ['email']
        }
      },
      {
        name: 'create_support_ticket',
        description: 'Create a support ticket for the user',
        input_schema: {
          type: 'object' as const,
          properties: {
            subject: {
              type: 'string' as const,
              description: 'Ticket subject'
            },
            description: {
              type: 'string' as const,
              description: 'Detailed description of the issue'
            }
          },
          required: ['subject', 'description']
        }
      },
      {
        name: 'escalate_to_human',
        description: 'Escalate the conversation to a human agent when the AI cannot help',
        input_schema: {
          type: 'object' as const,
          properties: {
            reason: {
              type: 'string' as const,
              description: 'Reason for escalation'
            },
            priority: {
              type: 'string' as const,
              enum: ['low', 'medium', 'high', 'urgent'] as const,
              description: 'Priority level for the escalation'
            }
          },
          required: ['reason']
        }
      }
    ]
  }

  private async executeFunctionCall(call: FunctionCall, request: ProcessMessageRequest): Promise<any> {
    switch (call.name) {
      case 'search_knowledge_base':
        return await this.searchKnowledgeBase(call.arguments.query)
      
      case 'get_tool_info':
        return await this.getToolInfo(call.arguments.toolName)
      
      case 'create_lead':
        return await this.createLead(call.arguments, request.conversationId)
      
      case 'create_support_ticket':
        return await this.createSupportTicket(call.arguments, request.userId)
      
      case 'escalate_to_human':
        return await this.escalateToHuman(call.arguments, request.conversationId, request.userId)
      
      default:
        return null
    }
  }

  private async searchKnowledgeBase(query: string): Promise<any[]> {
    // Enhanced text search with keyword extraction and relevance scoring
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2)
    
    // Build search conditions
    const searchConditions = [
      { title: { contains: query, mode: 'insensitive' as const } },
      { content: { contains: query, mode: 'insensitive' as const } },
      { excerpt: { contains: query, mode: 'insensitive' as const } }
    ]
    
    // Add keyword searches
    keywords.forEach(keyword => {
      searchConditions.push(
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { content: { contains: keyword, mode: 'insensitive' as const } },
        { excerpt: { contains: keyword, mode: 'insensitive' as const } }
      )
    })
    
    // Search in help articles
    const articles = await prisma.helpArticle.findMany({
      where: {
        published: true,
        OR: searchConditions
      },
      take: 5,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        content: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Score and rank results by relevance
    const scoredArticles = articles.map(article => {
      let score = 0
      const titleLower = article.title.toLowerCase()
      const excerptLower = article.excerpt?.toLowerCase() || ''
      const contentLower = article.content.toLowerCase()
      
      // Exact phrase match in title gets highest score
      if (titleLower.includes(query.toLowerCase())) score += 10
      
      // Exact phrase match in excerpt
      if (excerptLower.includes(query.toLowerCase())) score += 5
      
      // Keyword matches
      keywords.forEach(keyword => {
        if (titleLower.includes(keyword)) score += 3
        if (excerptLower.includes(keyword)) score += 2
        if (contentLower.includes(keyword)) score += 1
      })
      
      return { ...article, relevanceScore: score }
    })

    // Sort by relevance and return top 3
    return scoredArticles
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(({ relevanceScore, content, ...article }) => article)
  }

  private async getToolInfo(toolName: string): Promise<any> {
    const tool = await prisma.tool.findFirst({
      where: {
        name: { contains: toolName, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true
      }
    })

    return tool
  }

  private async createSupportTicket(args: any, userId?: string | null): Promise<any> {
    if (!userId) {
      return { error: 'User must be logged in to create support ticket' }
    }

    // Generate ticket number
    const ticketCount = await prisma.supportTicket.count()
    const ticketNumber = `FRITH-${(ticketCount + 1).toString().padStart(6, '0')}`

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: args.subject,
        category: 'technical',
        priority: 'medium',
        status: 'open'
      }
    })

    // Create initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType: 'user',
        message: args.description
      }
    })

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber
    }
  }

  private classifyIntent(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      return 'pricing'
    }
    if (lowerMessage.includes('demo') || lowerMessage.includes('schedule')) {
      return 'demo'
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return 'support'
    }
    if (lowerMessage.includes('tool') || lowerMessage.includes('feature')) {
      return 'product'
    }
    if (lowerMessage.includes('@') && lowerMessage.includes('.')) {
      return 'lead_capture'
    }

    return 'general'
  }

  private getDefaultQuickReplies(intent: string, pageUrl?: string): string[] {
    if (pageUrl?.includes('/pricing')) {
      return ['Compare plans', 'Free trial', 'Contact sales', 'I have a question']
    }

    if (pageUrl?.includes('/support') || pageUrl?.includes('/help')) {
      return ['Tool not working', 'Account help', 'Billing', 'Talk to human']
    }

    switch (intent) {
      case 'pricing':
        return ['See all plans', 'Free trial', 'Enterprise pricing', 'Money-back guarantee']
      case 'support':
        return ['Create ticket', 'Search help center', 'Talk to human', 'Common issues']
      case 'product':
        return ['See all tools', 'Contract tools', 'Research tools', 'Book demo']
      default:
        return ['Pricing info', 'See tools', 'Book demo', 'Get help']
    }
  }

  private async createLead(leadData: any, conversationId: string): Promise<any> {
    try {
      // Enhanced lead qualification logic
      let leadScore = leadData.leadScore || 'medium'
      
      // Auto-qualify based on provided information
      if (leadData.company && leadData.role) {
        // High score for decision makers at firms
        if (leadData.role.toLowerCase().includes('partner') || 
            leadData.role.toLowerCase().includes('director') ||
            leadData.role.toLowerCase().includes('counsel')) {
          leadScore = 'high'
        }
        // Medium score for associates and other legal roles
        else if (leadData.role.toLowerCase().includes('associate') ||
                 leadData.role.toLowerCase().includes('attorney') ||
                 leadData.role.toLowerCase().includes('lawyer')) {
          leadScore = 'medium'
        }
      }
      
      // Create lead in database
      const lead = await prisma.chatbotLead.create({
        data: {
          conversationId,
          email: leadData.email,
          name: leadData.name || null,
          company: leadData.company || null,
          role: leadData.role || null,
          leadScore,
          sourcePage: leadData.sourcePage || null,
          practiceAreas: leadData.practiceAreas || null,
          firmSize: leadData.firmSize || null
        }
      })

      // Sync to HubSpot CRM
      try {
        const hubspotContact = await hubspotService.syncLead({
          ...leadData,
          leadScore,
          id: lead.id
        })
        
        if (hubspotContact) {
          console.log('Lead synced to HubSpot:', hubspotContact.id)
          
          // Add a note about the chatbot interaction
          await hubspotService.addNote(
            hubspotContact.id,
            `Lead captured via AI Chatbot. Initial conversation context: User interested in ${leadData.company ? 'legal AI tools for ' + leadData.company : 'legal AI solutions'}.`
          )
        }
      } catch (error) {
        console.error('Failed to sync lead to HubSpot:', error)
        // Don't fail the lead creation if HubSpot sync fails
      }

      return {
        id: lead.id,
        email: leadData.email,
        name: leadData.name,
        company: leadData.company,
        role: leadData.role,
        leadScore,
        message: `Thanks ${leadData.name || 'there'}! I've captured your information. Our team will follow up within 24 hours. In the meantime, feel free to explore our tools or ask me any questions! 🚀`
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      return {
        error: 'Failed to capture lead information',
        message: 'Sorry, there was an issue saving your information. Please try again or contact our support team directly.'
      }
    }
  }

  private async escalateToHuman(escalationData: any, conversationId: string, userId?: string | null): Promise<any> {
    try {
      if (!userId) {
        return {
          error: 'User authentication required for escalation',
          message: 'Please sign in to escalate this conversation to a human agent.'
        }
      }

      // Get conversation with messages for context
      const conversation = await prisma.chatbotConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!conversation) {
        return {
          error: 'Conversation not found',
          message: 'Unable to escalate - conversation not found.'
        }
      }

      // Generate ticket number
      const ticketCount = await prisma.supportTicket.count()
      const ticketNumber = `FRITH-${(ticketCount + 1).toString().padStart(6, '0')}`

      // Create support ticket
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId,
          subject: `Escalated: ${escalationData.reason}`,
          category: 'technical',
          priority: escalationData.priority || 'medium',
          status: 'open'
        }
      })

      // Create conversation transcript
      const transcript = conversation.messages
        .map((msg: any) => `${msg.senderType === 'user' ? 'User' : 'Bot'}: ${msg.message}`)
        .join('\n\n')

      // Create initial ticket message
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          senderType: 'user',
          message: `Escalation Reason: ${escalationData.reason}\n\nConversation Transcript:\n\n${transcript}`
        }
      })

      // Mark conversation as escalated
      await prisma.chatbotConversation.update({
        where: { id: conversationId },
        data: { escalated: true }
      })

      return {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        message: `I've escalated your request to our human support team. Your ticket number is ${ticket.ticketNumber}. A team member will respond within 24 hours. You can track your ticket in the support section of your dashboard.`
      }
    } catch (error) {
      console.error('Error escalating to human:', error)
      return {
        error: 'Failed to escalate conversation',
        message: 'Sorry, there was an issue escalating your request. Please try contacting our support team directly.'
      }
    }
  }
}
