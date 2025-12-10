'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Mail, Shield, Ban, Trash2, Eye } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  subscriptionTier: string
  subscriptionStatus: string
  status: string
  createdAt: string
  lastLoginAt: string | null
  _count: {
    toolRuns: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [bulkEmailSubject, setBulkEmailSubject] = useState('')
  const [bulkEmailMessage, setBulkEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterTier !== 'all') params.append('tier', filterTier)
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchUsers()
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
  }

  const handleBulkEmail = async () => {
    if (!bulkEmailSubject || !bulkEmailMessage) {
      alert('Please provide both subject and message')
      return
    }

    setSendingEmail(true)
    try {
      const response = await fetch('/api/admin/users/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          subject: bulkEmailSubject,
          message: bulkEmailMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Email sent successfully to ${data.totalSent} users`)
        setShowBulkEmailModal(false)
        setBulkEmailSubject('')
        setBulkEmailMessage('')
        setSelectedUsers(new Set())
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send emails')
      }
    } catch (error) {
      console.error('Failed to send bulk email:', error)
      alert('Failed to send emails')
    } finally {
      setSendingEmail(false)
    }
  }

  const exportSelectedUsers = () => {
    const selectedUserData = users.filter(u => selectedUsers.has(u.id))
    const csv = [
      ['Name', 'Email', 'Role', 'Tier', 'Status', 'Tool Runs', 'Joined'],
      ...selectedUserData.map(u => [
        u.name,
        u.email,
        u.role,
        u.subscriptionTier,
        u.status,
        u._count.toolRuns.toString(),
        new Date(u.createdAt).toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected-users-${new Date().toISOString()}.csv`
    a.click()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'advanced':
        return 'bg-purple-100 text-purple-800'
      case 'pro':
        return 'bg-blue-100 text-blue-800'
      case 'starter':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <Card className="border-blue-500 border-2">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-blue-600">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkEmailModal(true)}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email to Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSelectedUsers}
                  className="gap-2"
                >
                  Export Selected as CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({users.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Tier</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Tool Runs</th>
                    <th className="text-left p-3 font-semibold">Joined</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(user.subscriptionTier)}`}>
                          {user.subscriptionTier}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {user._count.toolRuns}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="p-1 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-yellow-50 rounded"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4 text-yellow-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-orange-50 rounded"
                            title="Edit Role"
                          >
                            <Shield className="w-4 h-4 text-orange-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-red-50 rounded"
                            title="Suspend"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Send Email to {selectedUsers.size} Users</h2>
              <button
                onClick={() => setShowBulkEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Mail className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <Input
                  type="text"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  value={bulkEmailMessage}
                  onChange={(e) => setBulkEmailMessage(e.target.value)}
                  placeholder="Email message (HTML supported)"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={10}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkEmailModal(false)}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkEmail}
                  disabled={sendingEmail || !bulkEmailSubject || !bulkEmailMessage}
                >
                  {sendingEmail ? 'Sending...' : `Send to ${selectedUsers.size} Users`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
