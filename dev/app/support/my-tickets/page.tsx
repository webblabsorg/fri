'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Ticket } from 'lucide-react'

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

export default function MyTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, statusFilter])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (!data.user) {
        router.push('/signin?redirect=/support/my-tickets')
        return
      }

      fetchTickets()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/signin')
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support/tickets')
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTickets = () => {
    if (statusFilter === 'all') {
      setFilteredTickets(tickets)
    } else {
      setFilteredTickets(tickets.filter(t => t.status === statusFilter))
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
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      medium: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
      high: 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
      urgent: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
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
          <p className="mt-4 text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Support Tickets</h1>
              <p className="text-sm text-muted-foreground">
                Track and manage your support requests
              </p>
            </div>
            <Link href="/support/submit-ticket">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on_customer">Waiting on Me</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter === 'all'
                  ? "You haven't submitted any support tickets yet."
                  : `No tickets with status: ${statusFilter.replace(/_/g, ' ')}`}
              </p>
              {statusFilter === 'all' && (
                <Link href="/support/submit-ticket">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Ticket
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/tickets/${ticket.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <CardTitle className="text-lg mb-1">{ticket.subject}</CardTitle>
                        <CardDescription className="text-sm">
                          Category: {ticket.category.replace(/_/g, ' ')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      {ticket._count && ticket._count.messages > 0 && (
                        <>
                          <span>•</span>
                          <span>{ticket._count.messages} message{ticket._count.messages !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Help Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for answers?{' '}
            <Link href="/help" className="text-primary hover:underline">
              Browse our Help Center
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
