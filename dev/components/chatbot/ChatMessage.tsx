'use client'

import { MessageCircle, User } from 'lucide-react'

export interface ChatMessageData {
  id: string
  senderType: 'user' | 'bot' | 'admin'
  message: string
  createdAt: string
  intent?: string
  attachments?: any[]
}

interface ChatMessageProps {
  message: ChatMessageData
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.senderType === 'bot'
  const isAdmin = message.senderType === 'admin'
  
  return (
    <div className={`flex gap-3 ${isBot || isAdmin ? 'justify-start' : 'justify-end'}`}>
      {/* Avatar - only for bot/admin messages */}
      {(isBot || isAdmin) && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Message bubble */}
      <div className={`max-w-[80%] ${isBot || isAdmin ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isBot || isAdmin
              ? 'bg-white shadow-sm border text-gray-900'
              : 'bg-blue-500 text-white'
          }`}
        >
          {/* Sender name for admin messages */}
          {isAdmin && (
            <p className="text-xs font-medium text-blue-600 mb-1">Support Team</p>
          )}
          
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </div>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center gap-1"
                >
                  <span>📎</span>
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 ${
          isBot || isAdmin ? 'text-left' : 'text-right'
        }`}>
          {new Date(message.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
      
      {/* User avatar placeholder */}
      {!isBot && !isAdmin && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  )
}
