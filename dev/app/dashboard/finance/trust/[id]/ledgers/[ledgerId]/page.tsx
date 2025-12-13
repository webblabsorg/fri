'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  FileText,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface ClientLedger {
  id: string
  ledgerName: string
  balance: number
  status: string
  client: {
    id: string
    displayName: string
    email: string | null
  }
  matter?: {
    id: string
    name: string
    matterNumber: string | null
  }
  trustAccount: {
    id: string
    accountName: string
    currency: string
  }
  createdAt: string
}

interface Transaction {
  id: string
  transactionType: string
  amount: number
  description: string
  transactionDate: string
  reference: string | null
  isCleared: boolean
}

export default function LedgerDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  const ledgerId = params.ledgerId as string
  const { currentOrganization } = useOrganization()
  
  const [ledger, setLedger] = useState<ClientLedger | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accountId && ledgerId && currentOrganization?.id) {
      loadLedgerDetails()
    }
  }, [accountId, ledgerId, currentOrganization?.id])

  const loadLedgerDetails = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const [ledgerRes, txnRes] = await Promise.all([
        fetch(`/api/trust/ledgers/${ledgerId}`),
        fetch(`/api/trust/transactions?organizationId=${currentOrganization.id}&clientLedgerId=${ledgerId}`),
      ])
      
      if (!ledgerRes.ok) throw new Error('Failed to load ledger')
      const ledgerData = await ledgerRes.json()
      setLedger(ledgerData.ledger)
      
      if (txnRes.ok) {
        const txnData = await txnRes.json()
        setTransactions(txnData.transactions || [])
      }
    } catch (err) {
      console.error('Error loading ledger details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load ledger')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ledger?.trustAccount.currency || 'USD',
    }).format(amount)
  }

  const getTransactionIcon = (type: string) => {
    if (['deposit', 'interest'].includes(type)) {
      return <ArrowDownLeft className="h-4 w-4 text-green-400" />
    }
    return <ArrowUpRight className="h-4 w-4 text-red-400" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !ledger) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Ledger not found'}</p>
          <Link
            href={`/dashboard/finance/trust/${accountId}`}
            className="text-white hover:underline"
          >
            ← Back to Trust Account
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
              <Link href={`/dashboard/finance/trust/${accountId}`} className="hover:text-white">
                {ledger.trustAccount.accountName}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{ledger.ledgerName}</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{ledger.ledgerName}</h1>
            <p className="mt-1 text-sm text-gray-400">
              {ledger.client.displayName}
              {ledger.matter && ` • ${ledger.matter.name}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLedgerDetails}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              href={`/dashboard/finance/trust/transactions?clientLedgerId=${ledgerId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Transaction
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Ledger Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(ledger.balance)}
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
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-xl font-semibold text-white">{ledger.client.displayName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-xl font-semibold text-white capitalize">{ledger.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Ledger Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-400">Ledger Name</dt>
                <dd className="text-white">{ledger.ledgerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Trust Account</dt>
                <dd className="text-white">{ledger.trustAccount.accountName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Client</dt>
                <dd className="text-white">{ledger.client.displayName}</dd>
              </div>
              {ledger.matter && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Matter</dt>
                  <dd className="text-white">
                    {ledger.matter.name}
                    {ledger.matter.matterNumber && ` (${ledger.matter.matterNumber})`}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-white">
                  {new Date(ledger.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/dashboard/finance/trust/transactions?clientLedgerId=${ledgerId}`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">View Transactions</span>
              </Link>
              <Link
                href={`/dashboard/finance/trust/reports?clientLedgerId=${ledgerId}`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <FileText className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">Generate Statement</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-medium">Transaction History</h3>
            <Link
              href={`/dashboard/finance/trust/transactions?clientLedgerId=${ledgerId}`}
              className="text-sm text-gray-400 hover:text-white"
            >
              View All →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {transactions.slice(0, 10).map((txn) => (
                <Link
                  key={txn.id}
                  href={`/dashboard/finance/trust/transactions/${txn.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(txn.transactionType)}
                    <div>
                      <p className="text-white">{txn.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(txn.transactionDate).toLocaleDateString()}
                        {txn.reference && ` • Ref: ${txn.reference}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${
                      ['deposit', 'interest'].includes(txn.transactionType)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {['deposit', 'interest'].includes(txn.transactionType) ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </span>
                    {txn.isCleared && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/30">
                        Cleared
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
