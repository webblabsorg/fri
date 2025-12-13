'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import OrganizationSwitcher from '@/components/layout/OrganizationSwitcher'
import ThemeToggle from '@/components/layout/ThemeToggle'
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
  X,
  Search
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
    { name: 'Web Search', href: '/dashboard/web-search', icon: Search },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Templates', href: '/dashboard/templates', icon: FileText },
    { name: 'Organization', href: '/dashboard/organization', icon: Building },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="dashboard-theme min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed on all screen sizes */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">Frith AI</span>
              {/* Show Beta badge if not removed */}
              {launchSettings && !launchSettings.betaBadgeRemoved && (
                <Badge variant="outline" className="text-xs">Beta</Badge>
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
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-border rounded-full flex items-center justify-center bg-background">
                <User className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary">
                {user.subscriptionTier}
              </Badge>
              {user.earlyAdopter && (
                <Badge variant="outline">Early Adopter</Badge>
              )}
            </div>
            {user.betaTrialEndsAt && (
              <p className="text-xs text-muted-foreground mt-1">
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
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-card border-b border-border">
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
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-6 pt-4 pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
