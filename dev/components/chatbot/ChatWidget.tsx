'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Minus, Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChatMessage, ChatMessageData } from './ChatMessage'
import { QuickReplies } from './QuickReplies'
import { TypingIndicator } from './TypingIndicator'
import { useChatbot } from '@/hooks/useChatbot'

interface ChatWidgetProps {
  pageUrl?: string
  userId?: string
  userPlan?: string
  proactiveDelay?: number // milliseconds to wait before showing proactive message
}

export function ChatWidget({ 
  pageUrl, 
  userId, 
  userPlan,
  proactiveDelay = 30000 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const [showProactive, setShowProactive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    quickReplies,
    conversationId,
    connect,
    disconnect
  } = useChatbot({
    pageUrl,
    userId,
    userPlan
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Proactive engagement
  useEffect(() => {
    if (!isOpen && !showProactive && proactiveDelay > 0) {
      const timer = setTimeout(() => {
        setShowProactive(true)
      }, proactiveDelay)

      return () => clearTimeout(timer)
    }
  }, [isOpen, showProactive, proactiveDelay])

  // Connect when widget opens
  useEffect(() => {
    if (isOpen && !isConnected) {
      connect()
    }
  }, [isOpen, isConnected, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setShowProactive(false)
    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickReply = (reply: string) => {
    if (isConnected) {
      sendMessage(reply)
    }
  }

  // Collapsed state (chat button)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Proactive message */}
        {showProactive && (
          <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="w-80 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Need help?</p>
                    <p className="text-xs text-gray-600 mt-1">
                      I can help you find the right AI tools for your practice.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={handleOpen}>
                        Chat now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowProactive(false)}
                      >
                        Maybe later
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowProactive(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat button */}
        <Button
          onClick={handleOpen}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
          size="lg"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>

        {/* Optional label */}
        <div className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Need help?
        </div>
      </div>
    )
  }

  // Expanded state (chat window)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 h-[600px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${
        isMinimized ? 'h-16' : ''
      }`}>
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Frith Assistant</h3>
                <p className="text-xs opacity-90">
                  {isConnected ? '🟢 Online' : '🔴 Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleMinimize}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat body - only show if not minimized */}
        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0 h-[440px] overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        👋 Hi! I'm Frith Assistant. How can I help you today?
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg: ChatMessageData) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                  
                  {quickReplies.length > 0 && (
                    <QuickReplies 
                      replies={quickReplies} 
                      onSelect={handleQuickReply} 
                    />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        className="w-full resize-none border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-20"
                        rows={1}
                        disabled={!isConnected}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1 h-6 w-6 p-0 text-gray-400"
                      >
                        <Paperclip className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || !isConnected}
                      className="bg-blue-500 hover:bg-blue-600"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Powered by Claude AI
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
