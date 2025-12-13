'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  jurisdiction: string
  currentBalance: number
  lastReconciledDate: string | null
  clientLedgerCount: number
  isActive: boolean
}

export default function TrustAccountsPage() {
  const { currentOrganization } = useOrganization()
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAccounts()
    }
  }, [currentOrganization?.id])

  const loadAccounts = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/trust/accounts?organizationId=${currentOrganization.id}`)
      if (!response.ok) {
        throw new Error('Failed to load trust accounts')
      }
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
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

  const getReconciliationStatus = (lastReconciled: string | null) => {
    if (!lastReconciled) {
      return { status: 'never', label: 'Never reconciled', color: 'text-red-400' }
    }
    const days = Math.floor((Date.now() - new Date(lastReconciled).getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 7) {
      return { status: 'current', label: 'Current', color: 'text-green-400' }
    } else if (days <= 30) {
      return { status: 'due', label: 'Due soon', color: 'text-yellow-400' }
    } else {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-400' }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Trust Accounts</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Trust Accounting</h1>
            <p className="text-gray-400 mt-1">
              IOLTA compliance and client trust ledgers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAccounts}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/finance/trust/new"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Total Trust Balance</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(accounts.reduce((sum, a) => sum + a.currentBalance, 0))}
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Active Accounts</p>
            <p className="text-2xl font-bold text-white mt-1">
              {accounts.filter(a => a.isActive).length}
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Client Ledgers</p>
            <p className="text-2xl font-bold text-white mt-1">
              {accounts.reduce((sum, a) => sum + a.clientLedgerCount, 0)}
            </p>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Trust Accounts</h2>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400">{error}</p>
              <button
                onClick={loadAccounts}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No trust accounts configured</p>
              <Link
                href="/dashboard/finance/trust/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Account
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {accounts.map((account) => {
                const reconcileStatus = getReconciliationStatus(account.lastReconciledDate)
                return (
                  <Link
                    key={account.id}
                    href={`/dashboard/finance/trust/${account.id}`}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{account.accountName}</p>
                        <p className="text-gray-400 text-sm">
                          {account.bankName} • {account.jurisdiction}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatCurrency(account.currentBalance)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {account.clientLedgerCount} client ledgers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reconcileStatus.status === 'current' && (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                        {reconcileStatus.status === 'due' && (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                        {(reconcileStatus.status === 'overdue' || reconcileStatus.status === 'never') && (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        )}
                        <span className={`text-sm ${reconcileStatus.color}`}>
                          {reconcileStatus.label}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/finance/trust/compliance"
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-400 mb-2" />
            <p className="text-white font-medium">Compliance Check</p>
            <p className="text-gray-400 text-sm">Run IOLTA compliance verification</p>
          </Link>
          <Link
            href="/dashboard/finance/trust/reconcile"
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-white font-medium">Three-Way Reconciliation</p>
            <p className="text-gray-400 text-sm">Reconcile bank, trust, and client ledgers</p>
          </Link>
          <Link
            href="/dashboard/finance/trust/reports"
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <Building2 className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-white font-medium">Trust Reports</p>
            <p className="text-gray-400 text-sm">Generate audit-ready reports</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
