'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessageData } from '@/components/chatbot/ChatMessage'

interface UseChatbotProps {
  pageUrl?: string
  userId?: string
  userPlan?: string
}

interface ChatbotState {
  messages: ChatMessageData[]
  isConnected: boolean
  isTyping: boolean
  quickReplies: string[]
  conversationId: string | null
  sessionId: string
}

export function useChatbot({ pageUrl, userId, userPlan }: UseChatbotProps) {
  const [state, setState] = useState<ChatbotState>({
    messages: [],
    isConnected: false,
    isTyping: false,
    quickReplies: [],
    conversationId: null,
    sessionId: uuidv4()
  })

  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    // Initialize socket connection
    socketRef.current = io('/api/chatbot', {
      query: {
        sessionId: state.sessionId,
        pageUrl: pageUrl || window.location.href,
        userId: userId || '',
        userPlan: userPlan || ''
      }
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }))
    })

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false }))
    })

    socket.on('message', (data: {
      message: ChatMessageData
      quickReplies?: string[]
      conversationId?: string
    }) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, data.message],
        quickReplies: data.quickReplies || [],
        conversationId: data.conversationId || prev.conversationId,
        isTyping: false
      }))
    })

    socket.on('typing', (isTyping: boolean) => {
      setState(prev => ({ ...prev, isTyping }))
    })

    socket.on('error', (error: string) => {
      console.error('Chatbot error:', error)
      setState(prev => ({ ...prev, isTyping: false }))
    })

    // Send initial greeting if no messages
    if (state.messages.length === 0) {
      setTimeout(() => {
        const greetingMessage: ChatMessageData = {
          id: uuidv4(),
          senderType: 'bot',
          message: getGreetingMessage(pageUrl, userId),
          createdAt: new Date().toISOString()
        }
        
        setState(prev => ({
          ...prev,
          messages: [greetingMessage],
          quickReplies: getInitialQuickReplies(pageUrl, userId)
        }))
      }, 1000)
    }
  }, [state.sessionId, pageUrl, userId, userPlan, state.messages.length])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setState(prev => ({ ...prev, isConnected: false }))
    }
  }, [])

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current?.connected) return

    const userMessage: ChatMessageData = {
      id: uuidv4(),
      senderType: 'user',
      message,
      createdAt: new Date().toISOString()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      quickReplies: [],
      isTyping: true
    }))

    socketRef.current.emit('message', {
      message,
      sessionId: state.sessionId,
      conversationId: state.conversationId,
      pageUrl: pageUrl || window.location.href,
      userId: userId || null
    })
  }, [state.sessionId, state.conversationId, pageUrl, userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isTyping: state.isTyping,
    quickReplies: state.quickReplies,
    conversationId: state.conversationId,
    sessionId: state.sessionId,
    connect,
    disconnect,
    sendMessage
  }
}

function getGreetingMessage(pageUrl?: string, userId?: string): string {
  if (userId) {
    return "👋 Hi there! I'm back to help. What can I assist you with today?"
  }

  if (pageUrl?.includes('/pricing')) {
    return `👋 Looking at our plans?

I can help you choose the right one! What's most important to you?`
  }

  if (pageUrl?.includes('/support') || pageUrl?.includes('/help')) {
    return `👋 Hi! I'm here to help you find answers quickly.

What can I help you with?`
  }

  // Default homepage greeting
  return `👋 Hi there! I'm Frith Assistant, your AI guide.

I can help you:
• Learn about our 240+ legal AI tools
• See pricing and plans
• Schedule a demo
• Answer any questions

What brings you to Frith AI today?`
}

function getInitialQuickReplies(pageUrl?: string, userId?: string): string[] {
  if (userId) {
    return ['Tool not working', 'Billing question', 'How to use a feature', 'Other']
  }

  if (pageUrl?.includes('/pricing')) {
    return ['Price', 'Features', 'Team Size', 'Compare Plans']
  }

  if (pageUrl?.includes('/support') || pageUrl?.includes('/help')) {
    return ['Tool not working', 'Account help', 'Billing', 'General question']
  }

  // Default homepage quick replies
  return ['Contract Analysis', 'Legal Research', 'Pricing Info', 'Book Demo']
}
