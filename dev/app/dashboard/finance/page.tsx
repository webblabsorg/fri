'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Building2,
  Receipt,
  Users,
  ChevronRight,
  RefreshCw,
  PieChart,
  BarChart3,
} from 'lucide-react'

interface FinanceStats {
  trustBalance: number
  outstandingAR: number
  unbilledWIP: number
  monthlyRevenue: number
  complianceAlerts: number
}

interface RecentActivity {
  id: string
  type: 'invoice' | 'payment' | 'expense' | 'trust'
  description: string
  amount: number
  date: string
}

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceStats>({
    trustBalance: 0,
    outstandingAR: 0,
    unbilledWIP: 0,
    monthlyRevenue: 0,
    complianceAlerts: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const orgRes = await fetch('/api/organizations/current')
      if (!orgRes.ok) {
        console.error('Failed to get current organization')
        return
      }
      const orgData = await orgRes.json()
      const organizationId = orgData.organization?.id

      if (!organizationId) {
        console.error('No organization found')
        return
      }

      const res = await fetch(`/api/finance/dashboard/stats?organizationId=${organizationId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      const data = await res.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Trust Account Balance',
      value: formatCurrency(stats.trustBalance),
      icon: Building2,
      href: '/dashboard/finance/trust',
      color: 'text-white',
    },
    {
      title: 'Outstanding A/R',
      value: formatCurrency(stats.outstandingAR),
      icon: FileText,
      href: '/dashboard/finance/invoices',
      color: 'text-white',
    },
    {
      title: 'Unbilled WIP',
      value: formatCurrency(stats.unbilledWIP),
      icon: TrendingUp,
      href: '/dashboard/finance/billing',
      color: 'text-white',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      href: '/dashboard/finance/reports',
      color: 'text-white',
    },
  ]

  const quickActions = [
    { title: 'Create Invoice', href: '/dashboard/finance/billing/new', icon: FileText },
    { title: 'Record Payment', href: '/dashboard/finance/payments/new', icon: CreditCard },
    { title: 'Add Expense', href: '/dashboard/finance/expenses/new', icon: Receipt },
    { title: 'Trust Transaction', href: '/dashboard/finance/trust/transaction', icon: Building2 },
  ]

  const moduleLinks = [
    { title: 'Chart of Accounts', description: 'Manage your general ledger accounts', href: '/dashboard/finance/accounts', icon: PieChart },
    { title: 'Trust Accounting', description: 'IOLTA compliance and client ledgers', href: '/dashboard/finance/trust', icon: Building2 },
    { title: 'Billing & Invoices', description: 'Create and manage client invoices', href: '/dashboard/finance/billing', icon: FileText },
    { title: 'Time Entries', description: 'Track billable time and WIP', href: '/dashboard/finance/billing/time-entries', icon: TrendingUp },
    { title: 'Payments', description: 'Track payments and collections', href: '/dashboard/finance/payments', icon: CreditCard },
    { title: 'Expenses', description: 'Track and manage expenses', href: '/dashboard/finance/expenses', icon: Receipt },
    { title: 'Vendors', description: 'Manage vendors and bills', href: '/dashboard/finance/vendors', icon: Users },
    { title: 'Billing Reports', description: 'AR aging, WIP, and revenue forecasts', href: '/dashboard/finance/billing/reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Management</h1>
            <p className="text-gray-400 mt-1">
              Trust accounting, billing, and expense management
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Compliance Alert Banner */}
        {stats.complianceAlerts > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-yellow-500 font-medium">
                {stats.complianceAlerts} compliance alert{stats.complianceAlerts > 1 ? 's' : ''} require attention
              </p>
              <p className="text-yellow-500/70 text-sm">
                Review trust account reconciliation and dormant accounts
              </p>
            </div>
            <Link
              href="/dashboard/finance/trust/compliance"
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg transition-colors"
            >
              View Alerts
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-white/60" />
                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                <action.icon className="h-5 w-5 text-white/60" />
                <span className="text-white font-medium">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No recent activity
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'payment' ? 'bg-green-500/20' :
                            activity.type === 'invoice' ? 'bg-blue-500/20' :
                            activity.type === 'expense' ? 'bg-red-500/20' :
                            'bg-purple-500/20'
                          }`}>
                            {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-green-400" />}
                            {activity.type === 'invoice' && <FileText className="h-4 w-4 text-blue-400" />}
                            {activity.type === 'expense' && <Receipt className="h-4 w-4 text-red-400" />}
                            {activity.type === 'trust' && <Building2 className="h-4 w-4 text-purple-400" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{activity.description}</p>
                            <p className="text-gray-400 text-sm">{activity.date}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${
                          activity.type === 'expense' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {activity.type === 'expense' ? '-' : '+'}{formatCurrency(activity.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Module Links */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Finance Modules</h2>
            <div className="space-y-2">
              {moduleLinks.map((module) => (
                <Link
                  key={module.title}
                  href={module.href}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                >
                  <module.icon className="h-5 w-5 text-white/60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{module.title}</p>
                    <p className="text-gray-400 text-sm truncate">{module.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
