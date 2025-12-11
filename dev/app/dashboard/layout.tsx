'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import OrganizationSwitcher from '@/components/layout/OrganizationSwitcher'
import { FeedbackWidget } from '@/components/beta/FeedbackWidget'
import { 
  Home, 
  Wrench, 
  FolderOpen, 
  History, 
  Settings, 
  Building, 
  CreditCard,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  subscriptionTier: string
  firmName?: string
  // Beta program fields
  isBetaUser?: boolean
  earlyAdopter?: boolean
  betaTrialEndsAt?: string
}

interface LaunchSettings {
  betaBadgeRemoved: boolean
  openSignups: boolean
  launchAnnounced: boolean
  maintenanceMode: boolean
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [launchSettings, setLaunchSettings] = useState<LaunchSettings | null>(null)

  useEffect(() => {
    checkSession()
    fetchNotifications()
    fetchLaunchSettings()
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

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5')
      // In some contexts (e.g. expired session) this endpoint can return 401.
      // We simply skip updating notifications in that case to avoid noisy
      // errors in the console.
      if (response.status === 401) {
        return
      }

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchLaunchSettings = async () => {
    try {
      const response = await fetch('/api/launch/settings')
      if (response.ok) {
        const data = await response.json()
        setLaunchSettings(data)
      }
    } catch (error) {
      console.error('Error fetching launch settings:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      })

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('currentOrganizationId')
        localStorage.removeItem('currentWorkspaceId')
        router.push('/signin')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Tools', href: '/dashboard/tools', icon: Wrench },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Templates', href: '/dashboard/templates', icon: FileText },
    { name: 'Organization', href: '/dashboard/organization', icon: Building },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'professional': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">Frith AI</span>
              {/* Show Beta badge if not removed */}
              {launchSettings && !launchSettings.betaBadgeRemoved && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Beta</Badge>
              )}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge className={getTierBadgeColor(user.subscriptionTier)} variant="secondary">
                {user.subscriptionTier}
              </Badge>
              {user.earlyAdopter && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  ⭐ Early Adopter
                </Badge>
              )}
            </div>
            {user.betaTrialEndsAt && (
              <p className="text-xs text-gray-500 mt-1">
                Beta trial ends: {new Date(user.betaTrialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Organization/Workspace Switcher */}
            <div className="flex-1 flex justify-center lg:justify-start lg:ml-4">
              <OrganizationSwitcher />
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
        <FeedbackWidget position="bottom-right" />
      </div>
    </div>
  )
}
