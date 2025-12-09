'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchButton } from '@/components/search/SearchButton'

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
              <SearchButton />
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

        {/* Phase 3 Live Features */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle>🚀 Your Dashboard is Ready!</CardTitle>
            <CardDescription>
              Phase 3 MVP - Full AI-powered legal workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Available now:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              <li><strong>20 AI Tools</strong> - Legal research, drafting, analysis, and client communication</li>
              <li><strong>Quality Evaluation</strong> - Real-time output scoring with category-specific thresholds</li>
              <li><strong>Projects System</strong> - Organize work and track tool runs across cases</li>
              <li><strong>Templates Library</strong> - Save and reuse input configurations</li>
              <li><strong>History & Favorites</strong> - Track all executions and mark preferred tools</li>
              <li><strong>Global Search</strong> - Find tools, projects, templates, and history (Cmd/Ctrl+K)</li>
              <li><strong>Streaming Responses</strong> - Watch AI generate results in real-time</li>
              <li><strong>Output Management</strong> - Copy, export to DOCX, save to projects with full provenance</li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 hover:border-blue-400"
              onClick={() => router.push('/dashboard/tools')}
            >
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🔧</div>
                <p className="font-semibold text-lg mb-1">Browse Tools</p>
                <p className="text-sm text-gray-600">
                  Explore 20 AI-powered legal tools
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200 hover:border-purple-400"
              onClick={() => router.push('/dashboard/projects')}
            >
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">📁</div>
                <p className="font-semibold text-lg mb-1">Your Projects</p>
                <p className="text-sm text-gray-600">
                  Manage cases and organize work
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-green-200 hover:border-green-400"
              onClick={() => router.push('/dashboard/history')}
            >
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🕒</div>
                <p className="font-semibold text-lg mb-1">History</p>
                <p className="text-sm text-gray-600">
                  View past tool executions
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-orange-200 hover:border-orange-400"
              onClick={() => router.push('/dashboard/templates')}
            >
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">📝</div>
                <p className="font-semibold text-lg mb-1">Templates</p>
                <p className="text-sm text-gray-600">
                  Reuse saved configurations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              '220+ Additional AI Tools',
              'Team Collaboration',
              'Advanced Analytics',
              'Custom Tool Builder',
              'API Access',
              'Enterprise Features',
            ].map((feature) => (
              <Card key={feature} className="opacity-60 border-dashed">
                <CardContent className="pt-6">
                  <p className="font-medium">{feature}</p>
                  <p className="text-sm text-gray-500 mt-1">Planned for Phase 4+</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
