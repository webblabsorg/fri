'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')

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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['profile', 'security', 'preferences'].map((tab) => (
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
    </div>
  )
}
