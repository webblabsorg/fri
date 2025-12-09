'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  MessageSquare, 
  DollarSign, 
  Activity,
  FileText,
  Settings 
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (!data.user) {
        router.push('/signin')
        return
      }

      // Check if user has admin role
      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Tools', href: '/admin/tools', icon: Wrench },
    { name: 'Support', href: '/admin/support', icon: MessageSquare },
    { name: 'Billing', href: '/admin/billing', icon: DollarSign },
    { name: 'AI Costs', href: '/admin/ai-costs', icon: Activity },
    { name: 'Analytics', href: '/admin/analytics', icon: FileText },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { name: 'System Status', href: '/admin/system-status', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Warning Banner */}
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold">
        ⚠️ ADMIN MODE - You have elevated privileges
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Frith AI</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>

          <nav className="px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-sm text-gray-400 hover:text-white text-left"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
