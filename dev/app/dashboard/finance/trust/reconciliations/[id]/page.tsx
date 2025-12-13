'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Scale,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  Users,
  Building2,
  Check,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Reconciliation {
  id: string
  status: 'in_progress' | 'completed' | 'failed'
  periodStart: string
  periodEnd: string
  bankBalance: number
  bookBalance: number
  ledgerBalance: number
  discrepancy: number
  notes: string | null
  completedAt: string | null
  createdAt: string
  trustAccount: {
    id: string
    accountName: string
    bankName: string
    currency: string
  }
  performedBy?: {
    displayName: string
  }
}

export default function ReconciliationDetailPage() {
  const params = useParams()
  const reconciliationId = params.id as string
  const { currentOrganization } = useOrganization()
  
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reconciliationId && currentOrganization?.id) {
      loadReconciliation()
    }
  }, [reconciliationId, currentOrganization?.id])

  const loadReconciliation = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trust/reconciliations/${reconciliationId}`)
      if (!res.ok) throw new Error('Failed to load reconciliation')
      const data = await res.json()
      setReconciliation(data.reconciliation)
    } catch (err) {
      console.error('Error loading reconciliation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reconciliation')
    } finally {
      setIsLoading(false)
    }
  }

  const completeReconciliation = async () => {
    if (!reconciliation) return
    setIsCompleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/trust/reconciliations/${reconciliationId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to complete reconciliation')
      }
      loadReconciliation()
    } catch (err) {
      console.error('Error completing reconciliation:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete reconciliation')
    } finally {
      setIsCompleting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: reconciliation?.trustAccount.currency || 'USD',
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10 text-green-400 border-green-400/30'
      case 'failed':
        return 'bg-red-400/10 text-red-400 border-red-400/30'
      default:
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !reconciliation) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Reconciliation not found'}</p>
          <Link
            href="/dashboard/finance/trust/reconciliations"
            className="text-white hover:underline"
          >
            Back to Reconciliations
          </Link>
        </div>
      </div>
    )
  }

  const isBalanced = Math.abs(reconciliation.discrepancy) < 0.01

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
              <span className="text-white">Details</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">
                {reconciliation.trustAccount.accountName} Reconciliation
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(reconciliation.status)}`}>
                {getStatusIcon(reconciliation.status)}
                {reconciliation.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Period: {new Date(reconciliation.periodStart).toLocaleDateString()} -{' '}
              {new Date(reconciliation.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReconciliation}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {reconciliation.status === 'in_progress' && isBalanced && (
              <button
                onClick={completeReconciliation}
                disabled={isCompleting}
                className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isCompleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Complete Reconciliation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Bank Balance</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(reconciliation.bankBalance)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Book Balance</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(reconciliation.bookBalance)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ledger Balance</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(reconciliation.ledgerBalance)}
                </p>
              </div>
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${
            isBalanced
              ? 'border-green-400/30 bg-green-400/10'
              : 'border-red-400/30 bg-red-400/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${
                isBalanced ? 'bg-green-400/20' : 'bg-red-400/20'
              }`}>
                <Scale className={`h-5 w-5 ${isBalanced ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className={`text-sm ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                  Discrepancy
                </p>
                <p className={`text-xl font-semibold ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(reconciliation.discrepancy)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Reconciliation Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-400">Trust Account</dt>
                <dd className="text-white">{reconciliation.trustAccount.accountName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Bank</dt>
                <dd className="text-white">{reconciliation.trustAccount.bankName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Period</dt>
                <dd className="text-white">
                  {new Date(reconciliation.periodStart).toLocaleDateString()} -{' '}
                  {new Date(reconciliation.periodEnd).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Status</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getStatusColor(reconciliation.status)}`}>
                    {reconciliation.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              {reconciliation.performedBy && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Performed By</dt>
                  <dd className="text-white">{reconciliation.performedBy.displayName}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Started</dt>
                <dd className="text-white">
                  {new Date(reconciliation.createdAt).toLocaleString()}
                </dd>
              </div>
              {reconciliation.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Completed</dt>
                  <dd className="text-white">
                    {new Date(reconciliation.completedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Three-Way Balance Check</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-gray-400">Bank Statement Balance</span>
                <span className="text-white font-medium">{formatCurrency(reconciliation.bankBalance)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-gray-400">Trust Account Book Balance</span>
                <span className="text-white font-medium">{formatCurrency(reconciliation.bookBalance)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-gray-400">Sum of Client Ledgers</span>
                <span className="text-white font-medium">{formatCurrency(reconciliation.ledgerBalance)}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                isBalanced ? 'bg-green-400/10' : 'bg-red-400/10'
              }`}>
                <span className={isBalanced ? 'text-green-400' : 'text-red-400'}>
                  {isBalanced ? 'Balanced' : 'Discrepancy'}
                </span>
                <span className={`font-medium ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(reconciliation.discrepancy)}
                </span>
              </div>
            </div>
            {reconciliation.notes && (
              <div className="mt-4 p-3 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Notes</p>
                <p className="text-white">{reconciliation.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
