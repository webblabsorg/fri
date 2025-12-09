'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  name: string
  email: string
  subscriptionTier: string
  firmName?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

      // Redirect to onboarding if not completed
      if (!data.user.onboardingCompleted) {
        router.push('/welcome')
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Session check error:', error)
      router.push('/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/signin')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Frith AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">
            Subscription: <span className="font-medium capitalize">{user.subscriptionTier}</span>
            {user.firmName && ` • ${user.firmName}`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tools Available</CardTitle>
              <CardDescription>Based on your plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {user.subscriptionTier === 'free' ? '3' : '240+'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools Used</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium text-green-600">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 1 Complete Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>🎉 Phase 1: Core Infrastructure Complete!</CardTitle>
            <CardDescription>
              Authentication system is now functional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Completed features:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              <li>User registration with email verification</li>
              <li>Secure sign-in with session management</li>
              <li>Password reset flow</li>
              <li>Multi-tenant organization structure</li>
              <li>Personal workspace creation</li>
            </ul>
            <p className="text-sm mt-4 text-gray-600">
              Next steps: Build tool catalog, AI integration, and payment system
            </p>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Tool Catalog (240+ AI Tools)',
              'Legal Research Assistant',
              'Contract Drafting',
              'Document Review',
              'Case Law Analysis',
              'Team Collaboration',
            ].map((feature) => (
              <Card key={feature} className="opacity-50">
                <CardContent className="pt-6">
                  <p className="font-medium">{feature}</p>
                  <p className="text-sm text-gray-500 mt-1">Under development</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
