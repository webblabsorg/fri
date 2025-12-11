'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, Send, CheckCircle, Paperclip } from 'lucide-react'

interface TicketMessage {
  id: string
  senderId: string
  senderType: string
  message: string
  createdAt: string
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  attachments: any
  messages: TicketMessage[]
  user: {
    name: string
    email: string
  }
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    checkAuthAndFetchTicket()
  }, [ticketId])

  const checkAuthAndFetchTicket = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      if (!sessionData.user) {
        router.push('/signin?redirect=/support/tickets/' + ticketId)
        return
      }

      fetchTicket()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/signin')
    }
  }

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          router.push('/support/my-tickets')
          return
        }
        throw new Error('Failed to fetch ticket')
      }

      const data = await response.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      router.push('/support/my-tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || isSending) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          message: replyMessage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reply')
      }

      setReplyMessage('')
      fetchTicket() // Refresh ticket data
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return

    setIsClosing(true)

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to close ticket')
      }

      fetchTicket() // Refresh ticket data
    } catch (error) {
      console.error('Error closing ticket:', error)
      alert('Failed to close ticket. Please try again.')
    } finally {
      setIsClosing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      in_progress: 'secondary',
      waiting_on_customer: 'outline',
      resolved: 'outline',
      closed: 'outline',
    }

    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      waiting_on_customer: 'Waiting on You',
      resolved: 'Resolved',
      closed: 'Closed',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    const labels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[priority] || colors.medium}`}>
        {labels[priority] || priority}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const canReply = !['closed', 'resolved'].includes(ticket.status)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/support/my-tickets" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to My Tickets
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {ticket.ticketNumber}
                </span>
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
              <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
              <div className="text-sm text-muted-foreground">
                Created {new Date(ticket.createdAt).toLocaleString()}
                {' • '}
                Last updated {new Date(ticket.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Initial Attachments */}
            {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ticket.attachments.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">{file.name}</span>
                        <span className="text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <div className="space-y-4 mb-6">
              {ticket.messages.map((message, index) => {
                const isAdmin = message.senderType === 'admin' || message.senderType === 'system'
                const initials = isAdmin ? 'SA' : ticket.user.name.split(' ').map(n => n[0]).join('').toUpperCase()

                return (
                  <Card key={message.id} className={isAdmin ? 'bg-muted/50' : ''}>
                    <CardContent className="py-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : ''}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {isAdmin ? 'Support Team' : ticket.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.message}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Reply Box */}
            {canReply ? (
              <Card>
                <CardHeader>
                  <CardTitle>Reply to Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || isSending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="py-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    This ticket has been {ticket.status}. If you need further assistance, please create a new ticket.
                  </p>
                  <Link href="/support/submit-ticket">
                    <Button className="mt-4" variant="outline">
                      Create New Ticket
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div className="mt-1 font-medium">
                    {ticket.category.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>
                  <div className="mt-1">
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <span className="text-muted-foreground">Resolved:</span>
                    <div className="mt-1">
                      {new Date(ticket.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canReply && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleClose}
                    disabled={isClosing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isClosing ? 'Closing...' : 'Close Ticket'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Close this ticket if your issue has been resolved.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/help">
                  <Button variant="outline" className="w-full" size="sm">
                    Browse Help Center
                  </Button>
                </Link>
                <Link href="/status">
                  <Button variant="outline" className="w-full" size="sm">
                    Check System Status
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
