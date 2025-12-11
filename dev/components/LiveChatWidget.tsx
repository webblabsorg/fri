'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'agent' | 'system'
  timestamp: Date
  agentName?: string
}

interface LiveChatWidgetProps {
  userId?: string
  userName?: string
  userEmail?: string
}

export default function LiveChatWidget({ userId, userName, userEmail }: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeChat()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function initializeChat() {
    try {
      const response = await fetch('/api/community/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId,
          userName,
          userEmail,
        }),
      })

      const data = await response.json()

      if (data.sessionId) {
        setSessionId(data.sessionId)
        setIsConnected(true)
        setMessages([
          {
            id: '1',
            content: 'Welcome to Frith AI Support! An agent will be with you shortly.',
            sender: 'system',
            timestamp: new Date(),
          },
        ])

        // Start polling for new messages
        startPolling(data.sessionId)
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
      setMessages([
        {
          id: '1',
          content: 'Unable to connect to support. Please try again later.',
          sender: 'system',
          timestamp: new Date(),
        },
      ])
    }
  }

  function startPolling(sid: string) {
    const interval = setInterval(async () => {
      if (!isOpen) {
        clearInterval(interval)
        return
      }

      try {
        const response = await fetch(`/api/community/live-chat?sessionId=${sid}`)
        const data = await response.json()

        if (data.messages) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id))
            return [...prev, ...newMessages]
          })
        }

        setIsTyping(data.agentTyping || false)
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }

  async function sendMessage() {
    if (!inputValue.trim() || !sessionId) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    try {
      await fetch('/api/community/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          sessionId,
          content: inputValue,
        }),
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  async function endChat() {
    if (sessionId) {
      try {
        await fetch('/api/community/live-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            sessionId,
          }),
        })
      } catch (error) {
        console.error('Error ending chat:', error)
      }
    }

    setIsOpen(false)
    setSessionId(null)
    setMessages([])
    setIsConnected(false)
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 w-72 bg-white rounded-lg shadow-xl z-50">
        <div 
          className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <span className="font-medium">Support Chat</span>
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            <button onClick={(e) => { e.stopPropagation(); endChat(); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Full chat widget
  return (
    <div className="fixed bottom-6 right-6 w-80 h-[480px] bg-white rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-lg">
        <div>
          <span className="font-medium">Support Chat</span>
          <div className="flex items-center gap-1 text-xs text-blue-100">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="hover:bg-blue-500 p-1 rounded">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={endChat} className="hover:bg-blue-500 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.sender === 'system'
                  ? 'bg-gray-100 text-gray-600 text-sm'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.sender === 'agent' && message.agentName && (
                <p className="text-xs text-gray-500 mb-1">{message.agentName}</p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
