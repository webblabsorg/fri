'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
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
}

export function ChatWidget({ 
  pageUrl, 
  userId, 
  userPlan
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    quickReplies,
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
    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }

  const handleClose = () => {
    setIsOpen(false)
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

  // Collapsed state - minimal floating button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleOpen}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </button>
      </div>
    )
  }

  // Expanded state (chat window)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[500px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        {/* Header */}
        <CardHeader className="bg-gray-700 text-white p-3 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Frith Assistant</h3>
                <p className="text-xs opacity-80">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Chat body */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    Hi! How can I help you today?
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
            <div className="p-3 border-t bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 max-h-20"
                  rows={1}
                  disabled={!isConnected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected}
                  className="bg-gray-700 hover:bg-gray-800"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
