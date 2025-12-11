'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, TrendingUp, Clock, Eye, Download } from 'lucide-react'

interface ChatbotStats {
  totalConversations: number
  activeConversations: number
  leadsCaptured: number
  conversionsToday: number
  avgResponseTime: number
  containmentRate: number
}

interface Conversation {
  id: string
  sessionId: string
  userId?: string
  pageUrl?: string
  startedAt: string
  endedAt?: string
  leadCaptured: boolean
  converted: boolean
  escalated: boolean
  messageCount: number
  user?: {
    name: string
    email: string
  }
}

export default function AdminChatbotPage() {
  const [stats, setStats] = useState<ChatbotStats>({
    totalConversations: 0,
    activeConversations: 0,
    leadsCaptured: 0,
    conversionsToday: 0,
    avgResponseTime: 0,
    containmentRate: 0
  })
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchStats()
    fetchConversations()
  }, [filter])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/chatbot/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch chatbot stats:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      
      const response = await fetch(`/api/admin/chatbot/conversations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportConversations = async () => {
    try {
      const response = await fetch('/api/admin/chatbot/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chatbot-conversations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export conversations:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chatbot Analytics</h1>
          <p className="text-gray-600">Monitor AI chatbot performance and conversations</p>
        </div>
        <Button onClick={exportConversations} className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <p className="text-2xl font-bold">{stats.totalConversations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-600" />
              <p className="text-2xl font-bold">{stats.activeConversations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Leads Captured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-2xl font-bold">{stats.leadsCaptured}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Conversions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <p className="text-2xl font-bold">{stats.conversionsToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-2xl font-bold">{stats.avgResponseTime}s</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Containment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-red-600" />
              <p className="text-2xl font-bold">{stats.containmentRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Conversations ({conversations.length})</CardTitle>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Conversations</option>
                <option value="active">Active</option>
                <option value="leads">Lead Captured</option>
                <option value="converted">Converted</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No conversations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Session</th>
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Page</th>
                    <th className="text-left p-3 font-semibold">Messages</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Started</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation) => (
                    <tr key={conversation.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-mono text-xs">
                          {conversation.sessionId.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="p-3">
                        {conversation.user ? (
                          <div>
                            <p className="text-sm font-medium">{conversation.user.name}</p>
                            <p className="text-xs text-gray-600">{conversation.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Anonymous</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-gray-600">
                          {conversation.pageUrl ? new URL(conversation.pageUrl).pathname : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-center">{conversation.messageCount}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {conversation.leadCaptured && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Lead
                            </span>
                          )}
                          {conversation.converted && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Converted
                            </span>
                          )}
                          {conversation.escalated && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Escalated
                            </span>
                          )}
                          {!conversation.endedAt && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(conversation.startedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(`/admin/chatbot/conversations/${conversation.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
