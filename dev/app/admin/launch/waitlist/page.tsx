'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Mail, 
  Users,
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

interface WaitlistEntry {
  id: string
  email: string
  name: string | null
  source: string | null
  status: string
  invitedAt: string | null
  createdAt: string
}

interface WaitlistStats {
  total: number
  pending: number
  invited: number
  converted: number
}

export default function WaitlistAdminPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WaitlistStats>({ total: 0, pending: 0, invited: 0, converted: 0 })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [statusFilter])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const url = statusFilter 
        ? `/api/admin/launch/waitlist?status=${statusFilter}` 
        : '/api/admin/launch/waitlist'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries)
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (status: string) => {
    if (selectedIds.size === 0) {
      toast.error('No entries selected')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/launch/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: Array.from(selectedIds), 
          status 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Updated ${data.updated} entries`)
        setSelectedIds(new Set())
        fetchEntries()
      }
    } catch (error) {
      toast.error('Failed to update entries')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSingleAction = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/launch/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        toast.success('Entry updated')
        fetchEntries()
      }
    } catch (error) {
      toast.error('Failed to update entry')
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge className="bg-blue-100 text-blue-800">Invited</Badge>
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/launch">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Waitlist Management
            </h1>
            <p className="text-gray-600">Manage waitlist subscribers and send invitations</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('invited')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Invited</p>
                <p className="text-2xl font-bold">{stats.invited}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('converted')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Converted</p>
                <p className="text-2xl font-bold">{stats.converted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} entries selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkAction('invited')}
                  disabled={actionLoading}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Mark as Invited
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('converted')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Converted
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Script Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Sending Emails</CardTitle>
          <CardDescription>
            To send launch emails to waitlist subscribers, run the following script:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            <code>cd prod/scripts && npx ts-node send-launch-emails.ts</code>
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Use <code>--dry-run</code> to preview without sending. Use <code>--limit=N</code> to limit the number of emails.
          </p>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Waitlist Entries</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchEntries}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No waitlist entries found.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm">
                <input
                  type="checkbox"
                  checked={selectedIds.size === entries.length && entries.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
                <span className="flex-1">Email</span>
                <span className="w-32">Name</span>
                <span className="w-24">Source</span>
                <span className="w-24">Status</span>
                <span className="w-32">Signed Up</span>
                <span className="w-24">Actions</span>
              </div>

              {/* Entries */}
              {entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 ${
                    selectedIds.has(entry.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={() => toggleSelect(entry.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1 text-sm truncate">{entry.email}</span>
                  <span className="w-32 text-sm text-gray-600 truncate">{entry.name || '-'}</span>
                  <span className="w-24 text-xs text-gray-500">{entry.source || '-'}</span>
                  <span className="w-24">{getStatusBadge(entry.status)}</span>
                  <span className="w-32 text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <div className="w-24 flex gap-1">
                    {entry.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSingleAction(entry.id, 'invited')}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                    {entry.status === 'invited' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSingleAction(entry.id, 'converted')}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
