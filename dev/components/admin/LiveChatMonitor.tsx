'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User, Clock, AlertTriangle } from 'lucide-react'

interface LiveConversation {
  id: string
  sessionId: string
  userId?: string
  userAgent?: string
  pageUrl?: string
  startedAt: string
  lastMessageAt: string
  messageCount: number
  status: 'active' | 'idle' | 'escalated'
  user?: {
    name: string
    email: string
  }
  lastMessage?: {
    message: string
    senderType: 'user' | 'bot'
    createdAt: string
  }
}

interface LiveChatMonitorProps {
  refreshInterval?: number
}

export function LiveChatMonitor({ refreshInterval = 10000 }: LiveChatMonitorProps) {
  const [conversations, setConversations] = useState<LiveConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLiveConversations = async () => {
    try {
      const response = await fetch('/api/admin/chatbot/live')
      if (!response.ok) {
        throw new Error('Failed to fetch live conversations')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveConversations()
    const interval = setInterval(fetchLiveConversations, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'escalated': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTimeSince = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const handleTakeOver = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/chatbot/takeover/${conversationId}`, {
        method: 'POST'
      })
      if (response.ok) {
        // Refresh the list
        fetchLiveConversations()
      }
    } catch (err) {
      console.error('Failed to take over conversation:', err)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Live Chat Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading live conversations...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Live Chat Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Error: {error}
            <Button 
              onClick={fetchLiveConversations} 
              className="ml-2"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Live Chat Monitor
            <Badge variant="secondary">{conversations.length} active</Badge>
          </div>
          <Button onClick={fetchLiveConversations} size="sm" variant="outline">
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active conversations
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`} />
                      <span className="font-medium">
                        {conversation.user?.name || 'Anonymous User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {conversation.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {conversation.user?.email || conversation.sessionId.slice(0, 8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {conversation.messageCount} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSince(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>

                    {conversation.pageUrl && (
                      <div className="text-xs text-gray-500 mb-2">
                        Page: {conversation.pageUrl}
                      </div>
                    )}

                    {conversation.lastMessage && (
                      <div className="bg-gray-100 rounded p-2 text-sm">
                        <span className="font-medium">
                          {conversation.lastMessage.senderType === 'user' ? 'User' : 'Bot'}:
                        </span>
                        <span className="ml-2">
                          {conversation.lastMessage.message.length > 100 
                            ? conversation.lastMessage.message.substring(0, 100) + '...'
                            : conversation.lastMessage.message
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {conversation.status === 'escalated' && (
                      <Button
                        size="sm"
                        onClick={() => handleTakeOver(conversation.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Take Over
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/admin/chatbot/conversation/${conversation.id}`, '_blank')}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
