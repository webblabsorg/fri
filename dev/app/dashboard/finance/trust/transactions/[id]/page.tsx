'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Transaction {
  id: string
  transactionType: string
  amount: number
  description: string
  reference: string | null
  transactionDate: string
  isCleared: boolean
  clearedDate: string | null
  createdAt: string
  trustAccount: {
    id: string
    accountName: string
    currency: string
  }
  clientLedger?: {
    id: string
    ledgerName: string
    client: {
      id: string
      displayName: string
    }
    matter?: {
      id: string
      name: string
    }
  }
  createdBy?: {
    displayName: string
  }
}

export default function TransactionDetailPage() {
  const params = useParams()
  const transactionId = params.id as string
  const { currentOrganization } = useOrganization()
  
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (transactionId && currentOrganization?.id) {
      loadTransaction()
    }
  }, [transactionId, currentOrganization?.id])

  const loadTransaction = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trust/transactions/${transactionId}`)
      if (!res.ok) throw new Error('Failed to load transaction')
      const data = await res.json()
      setTransaction(data.transaction)
    } catch (err) {
      console.error('Error loading transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCleared = async () => {
    if (!transaction) return
    setIsClearing(true)
    setError(null)
    try {
      const res = await fetch(`/api/trust/transactions/${transactionId}/clear`, {
        method: transaction.isCleared ? 'DELETE' : 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update cleared status')
      }
      loadTransaction()
    } catch (err) {
      console.error('Error updating cleared status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update cleared status')
    } finally {
      setIsClearing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: transaction?.trustAccount.currency || 'USD',
    }).format(amount)
  }

  const isCredit = (type: string) => ['deposit', 'interest'].includes(type)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Transaction not found'}</p>
          <Link
            href="/dashboard/finance/trust/transactions"
            className="text-white hover:underline"
          >
            Back to Transactions
          </Link>
        </div>
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
              <Link href="/dashboard/finance/trust/transactions" className="hover:text-white">
                Transactions
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Details</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isCredit(transaction.transactionType) ? 'bg-green-400/10' : 'bg-red-400/10'
              }`}>
                {isCredit(transaction.transactionType) ? (
                  <ArrowDownLeft className="h-6 w-6 text-green-400" />
                ) : (
                  <ArrowUpRight className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">{transaction.description}</h1>
                <p className="text-sm text-gray-400 capitalize">
                  {transaction.transactionType.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTransaction}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={toggleCleared}
              disabled={isClearing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                transaction.isCleared
                  ? 'bg-green-400/10 text-green-400 border border-green-400/30 hover:bg-green-400/20'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isClearing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : transaction.isCleared ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {transaction.isCleared ? 'Cleared' : 'Mark as Cleared'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className={`text-xl font-semibold ${
                  isCredit(transaction.transactionType) ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isCredit(transaction.transactionType) ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Transaction Date</p>
                <p className="text-xl font-semibold text-white">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${
                transaction.isCleared ? 'bg-green-400/10' : 'bg-yellow-400/10'
              }`}>
                {transaction.isCleared ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`text-xl font-semibold ${
                  transaction.isCleared ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {transaction.isCleared ? 'Cleared' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Transaction Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-400">Description</dt>
                <dd className="text-white">{transaction.description}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Type</dt>
                <dd className="text-white capitalize">{transaction.transactionType.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Amount</dt>
                <dd className={isCredit(transaction.transactionType) ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(transaction.amount)}
                </dd>
              </div>
              {transaction.reference && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Reference</dt>
                  <dd className="text-white font-mono">{transaction.reference}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Transaction Date</dt>
                <dd className="text-white">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Status</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                    transaction.isCleared
                      ? 'bg-green-400/10 text-green-400 border-green-400/30'
                      : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                  }`}>
                    {transaction.isCleared ? 'Cleared' : 'Pending'}
                  </span>
                </dd>
              </div>
              {transaction.clearedDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Cleared Date</dt>
                  <dd className="text-white">
                    {new Date(transaction.clearedDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-white">
                  {new Date(transaction.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-white font-medium mb-4">Trust Account</h3>
              <Link
                href={`/dashboard/finance/trust/${transaction.trustAccount.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-white" />
                  <span className="text-white">{transaction.trustAccount.accountName}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>

            {transaction.clientLedger && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-white font-medium mb-4">Client Ledger</h3>
                <Link
                  href={`/dashboard/finance/trust/${transaction.trustAccount.id}/ledgers/${transaction.clientLedger.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white">{transaction.clientLedger.ledgerName}</p>
                    <p className="text-sm text-gray-400">
                      {transaction.clientLedger.client.displayName}
                      {transaction.clientLedger.matter && ` - ${transaction.clientLedger.matter.name}`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            )}

            {transaction.createdBy && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-white font-medium mb-4">Created By</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <User className="h-5 w-5 text-white" />
                  <span className="text-white">{transaction.createdBy.displayName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
