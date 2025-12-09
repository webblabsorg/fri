'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send } from 'lucide-react'

interface TicketDetail {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  user: {
    id: string
    name: string
    email: string
    firmName: string | null
    subscriptionTier: string
  }
  messages: Array<{
    id: string
    senderId: string
    senderType: string
    message: string
    createdAt: string
  }>
}

export default function AdminTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTicket(params.id as string)
    }
  }, [params.id])

  const fetchTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
      } else if (response.status === 404) {
        router.push('/admin/support')
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!ticket || !replyMessage.trim()) return

    setReplying(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      })

      if (response.ok) {
        setReplyMessage('')
        await fetchTicket(ticket.id)
        alert('Reply sent successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
      alert('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTicket(ticket.id)
        alert('Status updated successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePriority = async (newPriority: string) => {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (response.ok) {
        await fetchTicket(ticket.id)
        alert('Priority updated successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update priority')
      }
    } catch (error) {
      console.error('Failed to update priority:', error)
      alert('Failed to update priority')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ticket not found</p>
        <Button onClick={() => router.push('/admin/support')} className="mt-4">
          Back to Tickets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/support')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
          <p className="text-gray-600">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.senderType === 'admin'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold">
                        {message.senderType === 'admin' ? 'Support Team' : ticket.user.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))}

                {ticket.messages.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No messages yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>Reply to Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full min-h-[150px] p-3 border rounded-md"
                  disabled={replying}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleReply}
                    disabled={replying || !replyMessage.trim()}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {replying ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Ticket Info & Actions */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{ticket.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{ticket.user.email}</p>
              </div>
              {ticket.user.firmName && (
                <div>
                  <p className="text-sm text-gray-600">Firm</p>
                  <p className="font-medium">{ticket.user.firmName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Subscription</p>
                <p className="font-medium capitalize">{ticket.user.subscriptionTier}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_on_customer">Waiting on Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Priority</p>
                <select
                  value={ticket.priority}
                  onChange={(e) => handleUpdatePriority(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium capitalize">{ticket.category}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="font-medium">{new Date(ticket.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/users/${ticket.user.id}`)}
              >
                View User Profile
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpdateStatus('resolved')}
                disabled={updating || ticket.status === 'resolved'}
              >
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600"
                onClick={() => handleUpdateStatus('closed')}
                disabled={updating || ticket.status === 'closed'}
              >
                Close Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
