'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  Send,
  Edit,
  Trash2,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TimeEntry {
  id: string
  date: string
  hours: number
  rate: number
  amount: number
  description: string
  status: string
  isBillable: boolean
  isBilled: boolean
  utbmsTaskCode?: string
  utbmsActivityCode?: string
  matter: {
    id: string
    name: string
    matterNumber: string
    client: {
      displayName: string
    }
  }
}

interface Matter {
  id: string
  name: string
  matterNumber: string
  client: {
    displayName: string
  }
}

export default function TimeEntriesPage() {
  const { currentOrganization } = useOrganization()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newEntry, setNewEntry] = useState({
    matterId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    rate: 0,
    description: '',
    isBillable: true,
  })

  const [stats, setStats] = useState({
    totalHours: 0,
    billableHours: 0,
    unbilledAmount: 0,
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadTimeEntries()
      loadMatters()
    }
  }, [currentOrganization?.id, statusFilter])

  const loadTimeEntries = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        organizationId: currentOrganization.id,
        limit: '100',
      })
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/time-entries?${params}`)
      if (!res.ok) throw new Error('Failed to load time entries')
      const data = await res.json()
      setTimeEntries(data.timeEntries || [])

      const entries = data.timeEntries || []
      const totalHours = entries.reduce((sum: number, e: TimeEntry) => sum + Number(e.hours), 0)
      const billableHours = entries
        .filter((e: TimeEntry) => e.isBillable)
        .reduce((sum: number, e: TimeEntry) => sum + Number(e.hours), 0)
      const unbilledAmount = entries
        .filter((e: TimeEntry) => e.isBillable && !e.isBilled)
        .reduce((sum: number, e: TimeEntry) => sum + Number(e.amount), 0)

      setStats({ totalHours, billableHours, unbilledAmount })
    } catch (err) {
      console.error('Error loading time entries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load time entries')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMatters = async () => {
    if (!currentOrganization?.id) return
    try {
      const res = await fetch(`/api/matters?organizationId=${currentOrganization.id}&status=active`)
      if (res.ok) {
        const data = await res.json()
        setMatters(data.matters || [])
      }
    } catch (err) {
      console.error('Error loading matters:', err)
    }
  }

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return

    if (!newEntry.matterId || !newEntry.description || newEntry.hours <= 0) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          ...newEntry,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create time entry')
      }

      setShowNewEntry(false)
      setNewEntry({
        matterId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        rate: 0,
        description: '',
        isBillable: true,
      })
      loadTimeEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEntry = async (id: string) => {
    if (!currentOrganization?.id) return
    try {
      const res = await fetch(`/api/time-entries/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) throw new Error('Failed to submit time entry')
      loadTimeEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit time entry')
    }
  }

  const handleApproveEntry = async (id: string) => {
    if (!currentOrganization?.id) return
    try {
      const res = await fetch(`/api/time-entries/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) throw new Error('Failed to approve time entry')
      loadTimeEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve time entry')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!currentOrganization?.id) return
    if (!confirm('Are you sure you want to delete this time entry?')) return
    try {
      const res = await fetch(
        `/api/time-entries/${id}?organizationId=${currentOrganization.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete time entry')
      loadTimeEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time entry')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
      submitted: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
      approved: 'bg-green-400/10 text-green-400 border-green-400/30',
      billed: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
    }
    return styles[status] || styles.draft
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/billing" className="hover:text-white">Billing</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Time Entries</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Time Entries</h1>
            <p className="mt-1 text-sm text-gray-400">
              Track billable and non-billable time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTimeEntries}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowNewEntry(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Hours</p>
                <p className="text-xl font-semibold text-white">{stats.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-400/10">
                <Clock className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Billable Hours</p>
                <p className="text-xl font-semibold text-white">{stats.billableHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-400/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Unbilled Amount</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(stats.unbilledAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntry && (
          <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
            <h3 className="text-white font-medium mb-4">New Time Entry</h3>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Matter *</label>
                  <select
                    value={newEntry.matterId}
                    onChange={(e) => setNewEntry({ ...newEntry, matterId: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  >
                    <option value="">Select a matter</option>
                    {matters.map((matter) => (
                      <option key={matter.id} value={matter.id}>
                        {matter.matterNumber} - {matter.name} ({matter.client.displayName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hours *</label>
                  <input
                    type="number"
                    value={newEntry.hours}
                    onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) || 0 })}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rate ($/hr) *</label>
                  <input
                    type="number"
                    value={newEntry.rate}
                    onChange={(e) => setNewEntry({ ...newEntry, rate: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 resize-none"
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEntry.isBillable}
                    onChange={(e) => setNewEntry({ ...newEntry, isBillable: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-black"
                  />
                  <span className="text-sm text-gray-400">Billable</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewEntry(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['', 'draft', 'submitted', 'approved', 'billed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Time Entries Table */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Matter</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Hours</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Rate</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No time entries found</p>
                    <p className="text-sm mt-1">Create your first time entry to get started</p>
                  </td>
                </tr>
              ) : (
                timeEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{entry.matter.matterNumber}</p>
                      <p className="text-xs text-gray-400">{entry.matter.client.displayName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-right text-white">{Number(entry.hours).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(entry.rate)}</td>
                    <td className="px-4 py-3 text-right text-white">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {entry.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleSubmitEntry(entry.id)}
                              className="p-1.5 text-gray-400 hover:text-yellow-400 transition-colors"
                              title="Submit"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {entry.status === 'submitted' && (
                          <button
                            onClick={() => handleApproveEntry(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
