'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Shield, Ban, Key } from 'lucide-react'

interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  subscriptionTier: string
  subscriptionStatus: string
  status: string
  firmName: string | null
  onboardingCompleted: boolean
  onboardingRole: string | null
  createdAt: string
  lastLoginAt: string | null
  _count: {
    toolRuns: number
    projects: number
    sessions: number
  }
  recentToolRuns: Array<{
    id: string
    toolId: string
    status: string
    createdAt: string
  }>
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchUserDetail(params.id as string)
    }
  }, [params.id])

  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 404) {
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!user) return
    
    const action = user.status === 'suspended' ? 'reactivate' : 'suspend'
    const confirmMsg = `Are you sure you want to ${action} this user?`
    
    if (!confirm(confirmMsg)) return

    setActionLoading('suspend')
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' }),
      })

      if (response.ok) {
        await fetchUserDetail(user.id)
        alert(`User ${action}d successfully`)
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Failed to ${action} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    const confirmMsg = `Are you sure you want to DELETE this user? This action cannot be undone.`
    if (!confirm(confirmMsg)) return

    setActionLoading('delete')
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('User deleted successfully')
        router.push('/admin/users')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async () => {
    if (!user) return
    
    if (!confirm('Send password reset email to this user?')) return

    setActionLoading('reset')
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Password reset email sent successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      alert('Failed to send reset email')
    } finally {
      setActionLoading(null)
    }
  }

  const handleImpersonate = async () => {
    if (!user) return
    
    if (!confirm(`Impersonate ${user.name}? You will be logged in as this user.`)) return

    setActionLoading('impersonate')
    try {
      const response = await fetch(`/api/admin/users/${user.id}/impersonate`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Impersonation started. Redirecting to user dashboard...')
        window.location.href = '/dashboard'
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to impersonate user')
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error)
      alert('Failed to impersonate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async () => {
    if (!user) return
    
    const subject = prompt('Email subject:')
    if (!subject) return
    
    const message = prompt('Email message:')
    if (!message) return

    setActionLoading('email')
    try {
      const response = await fetch('/api/admin/users/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [user.id],
          subject,
          message,
        }),
      })

      if (response.ok) {
        alert('Email sent successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('Failed to send email')
    } finally {
      setActionLoading(null)
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          Back to Users
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
          onClick={() => router.push('/admin/users')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSendEmail}
            disabled={actionLoading === 'email'}
          >
            <Mail className="w-4 h-4" />
            {actionLoading === 'email' ? 'Sending...' : 'Send Email'}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleImpersonate}
            disabled={actionLoading === 'impersonate'}
          >
            <Shield className="w-4 h-4" />
            {actionLoading === 'impersonate' ? 'Starting...' : 'Impersonate'}
          </Button>
          <Button
            variant="outline"
            className={`gap-2 ${user.status === 'suspended' ? 'text-green-600' : 'text-red-600'}`}
            onClick={handleSuspend}
            disabled={actionLoading === 'suspend'}
          >
            <Ban className="w-4 h-4" />
            {actionLoading === 'suspend' 
              ? 'Processing...' 
              : user.status === 'suspended' 
                ? 'Reactivate' 
                : 'Suspend'}
          </Button>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Tier</p>
                <p className="font-semibold capitalize">{user.subscriptionTier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{user.subscriptionStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{user.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Tool Runs</p>
                <p className="font-semibold">{user._count.toolRuns}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="font-semibold">{user._count.projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Firm Name</p>
              <p>{user.firmName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Onboarding Completed</p>
              <p>{user.onboardingCompleted ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Onboarding Role</p>
              <p>{user.onboardingRole || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Joined</p>
              <p>{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Login</p>
              <p>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tool Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tool Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {user.recentToolRuns.length > 0 ? (
            <div className="space-y-2">
              {user.recentToolRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{run.toolId}</p>
                    <p className="text-sm text-gray-600">{new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    run.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No tool runs yet</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
              onClick={handleResetPassword}
              disabled={actionLoading === 'reset'}
            >
              <Key className="w-4 h-4" />
              {actionLoading === 'reset' ? 'Sending...' : 'Reset Password'}
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
            >
              <Ban className="w-4 h-4" />
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
