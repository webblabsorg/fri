'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  firmName?: string
  subscriptionTier: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'feedback'>('profile')

  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    firmName: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Feedback form
  const [feedbackType, setFeedbackType] = useState('general')
  const [feedbackCategory, setFeedbackCategory] = useState('')
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false)
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([])

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (!data.user) {
        router.push('/signin')
        return
      }

      setUser(data.user)
      setProfileData({
        name: data.user.name,
        firmName: data.user.firmName || '',
      })
    } catch (error) {
      console.error('Session check error:', error)
      router.push('/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        setProfileMessage(data.error || 'Failed to update profile')
        return
      }

      // Update local user state
      if (data.user) {
        setUser(data.user)
      }

      setProfileMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      setProfileMessage('Network error. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchFeedbackHistory = async () => {
    try {
      const response = await fetch('/api/support/feedback')
      if (response.ok) {
        const data = await response.json()
        setFeedbackHistory(data.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback history:', error)
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackError('')
    setFeedbackSuccess('')

    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      setFeedbackError('Please fill in all required fields')
      return
    }

    setFeedbackLoading(true)

    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          category: feedbackCategory || undefined,
          subject: feedbackSubject,
          message: feedbackMessage,
          rating: feedbackRating,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setFeedbackSuccess('Thank you for your feedback! We appreciate your input.')
      setFeedbackType('general')
      setFeedbackCategory('')
      setFeedbackSubject('')
      setFeedbackMessage('')
      setFeedbackRating(null)

      if (showFeedbackHistory) {
        fetchFeedbackHistory()
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      setFeedbackError(error.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    setPasswordError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          // Validation errors
          const errors = Object.values(data.details).flat()
          setPasswordError(errors.join(', '))
        } else {
          setPasswordError(data.error || 'Failed to change password')
        }
        return
      }

      setPasswordMessage(data.message || 'Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordError('Network error. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['profile', 'security', 'preferences', 'feedback'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {profileMessage && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                      {profileMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firmName">Law Firm / Organization</Label>
                    <Input
                      id="firmName"
                      value={profileData.firmName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firmName: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <div className="text-sm font-medium capitalize">{user.subscriptionTier}</div>
                    <p className="text-xs text-gray-500">
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href="/pricing">Upgrade your plan</a>
                      </Button>
                    </p>
                  </div>

                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {passwordMessage && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                      {passwordMessage}
                    </div>
                  )}
                  {passwordError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, number, and special
                      character
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Two-factor authentication is not yet enabled for your account.
                </p>
                <Button variant="outline" disabled>
                  Enable 2FA (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email notifications</p>
                    <p className="text-sm text-gray-500">Receive email about your account</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing emails</p>
                    <p className="text-sm text-gray-500">Receive updates and promotions</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security alerts</p>
                    <p className="text-sm text-gray-500">Get notified of security events</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" disabled />
                </div>
                <Button disabled>Save Preferences (Coming Soon)</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" disabled>
                  Delete Account (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Success Message */}
            {feedbackSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{feedbackSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {feedbackError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{feedbackError}</p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Share Your Feedback
                </CardTitle>
                <CardDescription>
                  Help us improve Frith AI by sharing your thoughts, suggestions, or reporting issues.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedbackType">
                      Feedback Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={feedbackType} onValueChange={setFeedbackType}>
                      <SelectTrigger id="feedbackType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Feedback</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedbackCategory">Category (Optional)</Label>
                    <Input
                      id="feedbackCategory"
                      placeholder="e.g., Dashboard, Tools, Billing"
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedbackSubject">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="feedbackSubject"
                      placeholder="Brief summary of your feedback"
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedbackMessage">
                      Details <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="feedbackMessage"
                      placeholder="Please provide details about your feedback, feature request, or issue..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Overall Experience (Optional)</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFeedbackRating(value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                            feedbackRating === value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">1 = Poor, 5 = Excellent</p>
                  </div>

                  <Button type="submit" disabled={feedbackLoading}>
                    {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Feedback History */}
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackHistory(!showFeedbackHistory)
                  if (!showFeedbackHistory) fetchFeedbackHistory()
                }}
                className="w-full"
              >
                {showFeedbackHistory ? 'Hide' : 'View'} My Feedback History
              </Button>

              {showFeedbackHistory && (
                <div className="mt-4 space-y-4">
                  {feedbackHistory.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500">
                        No feedback history found.
                      </CardContent>
                    </Card>
                  ) : (
                    feedbackHistory.map((fb) => (
                      <Card key={fb.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {fb.type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {fb.status}
                                </span>
                                {fb.rating && (
                                  <span className="text-xs">⭐ {fb.rating}/5</span>
                                )}
                              </div>
                              <CardTitle className="text-base">{fb.subject}</CardTitle>
                              <CardDescription className="mt-1 text-xs">
                                Submitted {new Date(fb.createdAt).toLocaleString()}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-2">{fb.message}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
