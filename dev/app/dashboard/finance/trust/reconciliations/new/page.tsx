'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Scale,
  X,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  currentBalance: number
  currency: string
}

export default function NewReconciliationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedAccountId = searchParams.get('accountId')
  const { currentOrganization } = useOrganization()
  
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    trustAccountId: preselectedAccountId || '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    bankBalance: '',
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAccounts()
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (preselectedAccountId) {
      setFormData(prev => ({ ...prev, trustAccountId: preselectedAccountId }))
    }
  }, [preselectedAccountId])

  const loadAccounts = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/trust/accounts?organizationId=${currentOrganization.id}`
      )
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAccount = accounts.find(a => a.id === formData.trustAccountId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id || !formData.trustAccountId || !formData.bankBalance) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/trust/accounts/${formData.trustAccountId}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: formData.periodStart,
          periodEnd: formData.periodEnd,
          bankBalance: parseFloat(formData.bankBalance),
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start reconciliation')
      }
      
      const data = await res.json()
      router.push(`/dashboard/finance/trust/reconciliations/${data.reconciliation.id}`)
    } catch (err) {
      console.error('Error starting reconciliation:', err)
      setError(err instanceof Error ? err.message : 'Failed to start reconciliation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/trust" className="hover:text-white">Trust</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/trust/reconciliations" className="hover:text-white">
                Reconciliations
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">New</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Start Reconciliation</h1>
            <p className="mt-1 text-sm text-gray-400">
              Begin a three-way reconciliation for a trust account
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Trust Account *
              </label>
              <select
                value={formData.trustAccountId}
                onChange={(e) => setFormData({ ...formData, trustAccountId: e.target.value })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                required
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} - {account.bankName}
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Book Balance</p>
                    <p className="text-xl font-semibold text-white">
                      {formatCurrency(selectedAccount.currentBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Period Start *
                </label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Period End *
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Bank Statement Balance *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bankBalance}
                  onChange={(e) => setFormData({ ...formData, bankBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-white/20 bg-white/5 pl-8 pr-4 py-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the ending balance from your bank statement for the period
              </p>
            </div>
          </div>

          {/* Reconciliation Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-white mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Three-Way Reconciliation</h4>
                <p className="text-sm text-gray-400 mt-1">
                  This process will compare:
                </p>
                <ul className="text-sm text-gray-400 mt-2 space-y-1">
                  <li>• Bank statement balance</li>
                  <li>• Trust account book balance</li>
                  <li>• Sum of all client ledger balances</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard/finance/trust/reconciliations"
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.trustAccountId || !formData.bankBalance}
              className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              Start Reconciliation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
