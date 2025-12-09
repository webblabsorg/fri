'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Users, CreditCard, RefreshCw, AlertCircle } from 'lucide-react'

interface Transaction {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  type: string
  createdAt: string
}

interface RefundRequest {
  id: string
  transactionId: string
  userId: string
  amount: number
  reason: string
  status: string
  requestedAt: string
  user: {
    name: string
    email: string
  }
}

export default function AdminBillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    mrr: 0,
    activeSubscriptions: 0,
    transactionsThisMonth: 0,
    totalRevenue: 0,
  })
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const [transactionsRes, refundsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/billing/transactions?limit=10'),
        fetch('/api/admin/billing/refunds?status=pending'),
        fetch('/api/admin/analytics/overview'),
      ])

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions)
      }

      if (refundsRes.ok) {
        const data = await refundsRes.json()
        setRefunds(data.refunds)
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setStats({
          mrr: data.monthlyRevenue || 0,
          activeSubscriptions: data.activeSubscriptions || 0,
          transactionsThisMonth: data.totalUsers || 0,
          totalRevenue: data.monthlyRevenue || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateRefund = (transactionId: string) => {
    setSelectedTransaction(transactionId)
    setShowRefundModal(true)
  }

  const processRefund = async (reason: string, notes: string) => {
    if (!selectedTransaction) return

    try {
      const response = await fetch('/api/admin/billing/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTransaction,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Refund processed successfully')
        setShowRefundModal(false)
        setSelectedTransaction(null)
        fetchBillingData() // Refresh data
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to process refund')
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
      alert('Failed to process refund')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Revenue</h1>
          <p className="text-gray-600">
            Manage transactions, refunds, and revenue tracking
          </p>
        </div>
        <Button onClick={fetchBillingData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Revenue (MRR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">
                ${(stats.mrr / 100).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <p className="text-3xl font-bold">{transactions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="text-3xl font-bold">{refunds.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 45-Day Guarantee Tracking */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>45-Day Money-Back Guarantee</span>
            <span className="text-sm font-normal text-gray-600">Active Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Track subscriptions within the 45-day guarantee window and manage refund requests.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Within Window</p>
              <p className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => {
                  const days = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / (1000*60*60*24))
                  return days <= 45
                }).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Refund Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{refunds.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Refunds Processed</p>
              <p className="text-2xl font-bold text-green-600">
                {refunds.filter(r => r.status === 'processed').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Refunds */}
      {refunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Refund Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {refunds.map((refund) => (
                <div key={refund.id} className="p-4 border rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{refund.user.name}</p>
                    <p className="text-sm text-gray-600">{refund.user.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {refund.reason.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${(refund.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(refund.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">ID</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const daysSince = Math.floor(
                      (Date.now() - new Date(transaction.createdAt).getTime()) / (1000*60*60*24)
                    )
                    const within45Days = daysSince <= 45

                    return (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-mono text-sm">
                            {transaction.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="p-3 font-semibold">
                          ${(transaction.amount / 100).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'refunded' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="p-3 capitalize">{transaction.type}</td>
                        <td className="p-3 text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                          {within45Days && (
                            <span className="ml-2 text-xs text-blue-600">
                              ({45 - daysSince}d left)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {transaction.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInitiateRefund(transaction.id)}
                              className="text-orange-600"
                            >
                              Issue Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Issue Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select
                  id="refundReason"
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="not_satisfied">Not Satisfied with Service</option>
                  <option value="too_expensive">Too Expensive</option>
                  <option value="feature_missing">Missing Features</option>
                  <option value="technical_issues">Technical Issues</option>
                  <option value="switching_competitor">Switching to Competitor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  id="refundNotes"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-900">
                  ℹ️ Refunds within the 45-day guarantee window will be processed automatically via Stripe.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedTransaction(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const reason = (document.getElementById('refundReason') as HTMLSelectElement).value
                    const notes = (document.getElementById('refundNotes') as HTMLTextAreaElement).value
                    processRefund(reason, notes)
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Process Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
