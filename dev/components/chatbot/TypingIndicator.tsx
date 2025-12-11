'use client'

import { MessageCircle } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
        <MessageCircle className="w-4 h-4 text-white" />
      </div>
      
      {/* Typing bubble */}
      <div className="max-w-[80%]">
        <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-1 text-left">
          Frith Assistant is typing...
        </p>
      </div>
    </div>
  )
}
