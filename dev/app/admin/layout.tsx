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
  Settings,
  Search 
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface SearchResult {
  id: string
  type: string
  link: string
  [key: string]: any
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query || query.length < 2) {
      setSearchResults(null)
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const closeSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
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
        <aside className="w-64 bg-gray-900 text-white min-h-screen relative">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Frith AI</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>

          <nav className="px-3 pb-24">
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
          {/* Global Search Bar */}
          <div className="mb-6 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users, tickets, tools, transactions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchResults && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                {searching && (
                  <div className="p-4 text-center text-gray-600">Searching...</div>
                )}

                {!searching && searchResults.totalResults === 0 && (
                  <div className="p-4 text-center text-gray-600">No results found</div>
                )}

                {!searching && searchResults.totalResults > 0 && (
                  <div className="p-2">
                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div className="mb-4">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Users</p>
                        {searchResults.users.map((user: any) => (
                          <Link
                            key={user.id}
                            href={user.link}
                            onClick={closeSearch}
                            className="block px-3 py-2 hover:bg-gray-50 rounded-md"
                          >
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Tickets */}
                    {searchResults.tickets.length > 0 && (
                      <div className="mb-4">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Support Tickets</p>
                        {searchResults.tickets.map((ticket: any) => (
                          <Link
                            key={ticket.id}
                            href={ticket.link}
                            onClick={closeSearch}
                            className="block px-3 py-2 hover:bg-gray-50 rounded-md"
                          >
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-gray-600">
                              {ticket.status} • {ticket.user.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Tools */}
                    {searchResults.tools.length > 0 && (
                      <div className="mb-4">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Tools</p>
                        {searchResults.tools.map((tool: any) => (
                          <Link
                            key={tool.id}
                            href={tool.link}
                            onClick={closeSearch}
                            className="block px-3 py-2 hover:bg-gray-50 rounded-md"
                          >
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-sm text-gray-600">{tool.category.name}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Transactions */}
                    {searchResults.transactions.length > 0 && (
                      <div className="mb-4">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Transactions</p>
                        {searchResults.transactions.map((transaction: any) => (
                          <Link
                            key={transaction.id}
                            href={transaction.link}
                            onClick={closeSearch}
                            className="block px-3 py-2 hover:bg-gray-50 rounded-md"
                          >
                            <p className="font-medium">${transaction.amount}</p>
                            <p className="text-sm text-gray-600">
                              {transaction.status} • {transaction.user.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}
