'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Building2,
  ChevronRight,
  RefreshCw,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Scale,
  Edit,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber: string | null
  jurisdiction: string
  accountType: string
  currentBalance: number
  currency: string
  isActive: boolean
  lastReconciledDate: string | null
  createdAt: string
}

interface ClientLedger {
  id: string
  ledgerName: string
  balance: number
  status: string
  client: {
    id: string
    displayName: string
  }
  matter?: {
    id: string
    name: string
  }
  _count: {
    transactions: number
  }
}

interface RecentTransaction {
  id: string
  transactionType: string
  amount: number
  description: string
  transactionDate: string
  clientLedger?: {
    ledgerName: string
    client: { displayName: string }
  }
}

export default function TrustAccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  const { currentOrganization } = useOrganization()
  
  const [account, setAccount] = useState<TrustAccount | null>(null)
  const [ledgers, setLedgers] = useState<ClientLedger[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accountId && currentOrganization?.id) {
      loadAccountDetails()
    }
  }, [accountId, currentOrganization?.id])

  const loadAccountDetails = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      // Load account details
      const accountRes = await fetch(
        `/api/trust/accounts/${accountId}?organizationId=${currentOrganization.id}`
      )
      if (!accountRes.ok) throw new Error('Failed to load account')
      const accountData = await accountRes.json()
      setAccount(accountData.account)

      // Load client ledgers
      const ledgersRes = await fetch(`/api/trust/accounts/${accountId}/ledgers`)
      if (ledgersRes.ok) {
        const ledgersData = await ledgersRes.json()
        setLedgers(ledgersData.ledgers || [])
      }

      // Load recent transactions
      if (currentOrganization?.id) {
        const txnRes = await fetch(
          `/api/trust/transactions?organizationId=${currentOrganization.id}&trustAccountId=${accountId}&limit=10`
        )
        if (txnRes.ok) {
          const txnData = await txnRes.json()
          setRecentTransactions(txnData.transactions || [])
        }
      }
    } catch (err) {
      console.error('Error loading account details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load account')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account?.currency || 'USD',
    }).format(amount)
  }

  const maskAccountNumber = (num: string) => {
    if (!num || num.length < 4) return num
    return '••••' + num.slice(-4)
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

  if (error || !account) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Account not found'}</p>
          <Link
            href="/dashboard/finance/trust"
            className="text-white hover:underline"
          >
            ← Back to Trust Accounts
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
              <span className="text-white">{account.accountName}</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{account.accountName}</h1>
            <p className="mt-1 text-sm text-gray-400">
              {account.bankName} • {account.jurisdiction}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAccountDetails}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              href={`/dashboard/finance/trust/${accountId}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href={`/dashboard/finance/trust/reconciliations/new?accountId=${accountId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Scale className="h-4 w-4" />
              Reconcile
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(account.currentBalance)}
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
                <p className="text-sm text-gray-400">Client Ledgers</p>
                <p className="text-xl font-semibold text-white">{ledgers.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Account Type</p>
                <p className="text-xl font-semibold text-white">{account.accountType}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Reconciled</p>
                <p className="text-xl font-semibold text-white">
                  {account.lastReconciledDate
                    ? new Date(account.lastReconciledDate).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Account Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-400">Bank Name</dt>
                <dd className="text-white">{account.bankName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Account Number</dt>
                <dd className="text-white font-mono">{maskAccountNumber(account.accountNumber)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Routing Number</dt>
                <dd className="text-white font-mono">
                  {account.routingNumber ? maskAccountNumber(account.routingNumber) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Jurisdiction</dt>
                <dd className="text-white">{account.jurisdiction}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Status</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    account.isActive
                      ? 'bg-white/10 text-green-400 border border-green-400/30'
                      : 'bg-white/10 text-gray-400 border border-white/20'
                  }`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/dashboard/finance/trust/transactions?accountId=${accountId}`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">View Transactions</span>
              </Link>
              <Link
                href={`/dashboard/finance/trust/${accountId}/ledgers/new`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <Plus className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">Add Ledger</span>
              </Link>
              <Link
                href={`/dashboard/finance/trust/reports?accountId=${accountId}`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <Building2 className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">Generate Report</span>
              </Link>
              <Link
                href={`/dashboard/finance/trust/${accountId}/statements`}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
              >
                <Calendar className="h-5 w-5 mx-auto mb-1 text-white" />
                <span className="text-sm text-white">Import Statement</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Client Ledgers */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-medium">Client Ledgers</h3>
            <Link
              href={`/dashboard/finance/trust/${accountId}/ledgers/new`}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Ledger
            </Link>
          </div>
          {ledgers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No client ledgers yet
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {ledgers.map((ledger) => (
                <Link
                  key={ledger.id}
                  href={`/dashboard/finance/trust/${accountId}/ledgers/${ledger.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{ledger.ledgerName}</p>
                    <p className="text-sm text-gray-400">
                      {ledger.client.displayName}
                      {ledger.matter && ` • ${ledger.matter.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(ledger.balance)}</p>
                      <p className="text-xs text-gray-400">{ledger._count.transactions} transactions</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-medium">Recent Transactions</h3>
            <Link
              href={`/dashboard/finance/trust/transactions?accountId=${accountId}`}
              className="text-sm text-gray-400 hover:text-white"
            >
              View All →
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(txn.transactionType)}
                    <div>
                      <p className="text-white">{txn.description}</p>
                      <p className="text-xs text-gray-400">
                        {txn.clientLedger?.client.displayName || 'Unknown'} •{' '}
                        {new Date(txn.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    ['deposit', 'interest'].includes(txn.transactionType)
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {['deposit', 'interest'].includes(txn.transactionType) ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
