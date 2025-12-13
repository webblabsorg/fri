'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Sparkles,
  X,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface LineItem {
  id: string
  lineNumber: number
  itemType: string
  description: string
  quantity: number
  rate: number
  amount: number
  serviceDate?: string
  utbmsTaskCode?: string
  utbmsActivityCode?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  billingType: string
  issueDate: string
  dueDate: string
  paymentTerms?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  writeOffAmount: number
  currency: string
  notes?: string
  internalNotes?: string
  termsAndConditions?: string
  ledesFormat: boolean
  aiPaymentProbability?: number
  sentAt?: string
  viewedAt?: string
  paidAt?: string
  client: {
    id: string
    displayName: string
    email?: string
  }
  matter?: {
    id: string
    name: string
    matterNumber: string
  } | null
  lineItems: LineItem[]
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    paymentDate: string
    status: string
  }>
}

interface AiReviewResult {
  paymentProbability: number
  suggestionsCount: number
  suggestions: Array<{
    type: 'warning' | 'suggestion' | 'info'
    category: string
    message: string
    impact?: number
  }>
  summary: {
    warnings: number
    suggestions: number
    info: number
    potentialAdjustment: number
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const { currentOrganization } = useOrganization()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiReview, setAiReview] = useState<AiReviewResult | null>(null)
  const [showAiReview, setShowAiReview] = useState(false)

  useEffect(() => {
    if (invoiceId && currentOrganization?.id) {
      loadInvoice()
    }
  }, [invoiceId, currentOrganization?.id])

  const loadInvoice = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/billing/invoices/${invoiceId}?organizationId=${currentOrganization.id}`
      )
      if (!res.ok) throw new Error('Failed to load invoice')
      const data = await res.json()
      setInvoice(data.invoice)
    } catch (err) {
      console.error('Error loading invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!currentOrganization?.id || !invoice) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) throw new Error('Failed to approve invoice')
      loadInvoice()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve invoice')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSend = async () => {
    if (!currentOrganization?.id || !invoice) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      loadInvoice()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!currentOrganization?.id || !invoice) return
    window.open(
      `/api/billing/invoices/${invoiceId}/pdf?organizationId=${currentOrganization.id}`,
      '_blank'
    )
  }

  const handleAiReview = async () => {
    if (!currentOrganization?.id || !invoice) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) throw new Error('Failed to run AI review')
      const data = await res.json()
      setAiReview(data)
      setShowAiReview(true)
      loadInvoice()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run AI review')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
      pending_approval: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
      approved: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
      sent: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
      viewed: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
      paid: 'bg-green-400/10 text-green-400 border-green-400/30',
      overdue: 'bg-red-400/10 text-red-400 border-red-400/30',
      cancelled: 'bg-gray-400/10 text-gray-500 border-gray-500/30',
      written_off: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
    }
    return styles[status] || styles.draft
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard/finance/billing" className="text-white hover:underline">
            ← Back to Billing
          </Link>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/billing" className="hover:text-white">Billing</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{invoice.invoiceNumber}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${getStatusBadge(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {invoice.client.displayName} • {invoice.matter?.name || 'No matter'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAiReview}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              AI Review
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            {invoice.status === 'draft' && (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
            )}
            {invoice.status === 'approved' && (
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* AI Review Panel */}
        {showAiReview && aiReview && (
          <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <h3 className="text-white font-medium">AI Review Results</h3>
              </div>
              <button onClick={() => setShowAiReview(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400">Payment Probability</p>
                <p className="text-xl font-semibold text-white">{aiReview.paymentProbability}%</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-400/10">
                <p className="text-sm text-yellow-400">Warnings</p>
                <p className="text-xl font-semibold text-yellow-400">{aiReview.summary.warnings}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-400/10">
                <p className="text-sm text-blue-400">Suggestions</p>
                <p className="text-xl font-semibold text-blue-400">{aiReview.summary.suggestions}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400">Potential Adjustment</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(aiReview.summary.potentialAdjustment)}
                </p>
              </div>
            </div>
            {aiReview.suggestions.length > 0 && (
              <div className="space-y-2">
                {aiReview.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      suggestion.type === 'warning'
                        ? 'border-yellow-400/30 bg-yellow-400/5'
                        : suggestion.type === 'suggestion'
                        ? 'border-blue-400/30 bg-blue-400/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <p className={`text-sm ${
                      suggestion.type === 'warning'
                        ? 'text-yellow-400'
                        : suggestion.type === 'suggestion'
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }`}>
                      {suggestion.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Line Items */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-medium">Line Items</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Description</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Qty</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Rate</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <p className="text-white">{item.description}</p>
                        {item.serviceDate && (
                          <p className="text-xs text-gray-400">
                            {new Date(item.serviceDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-right text-white">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={3} className="px-4 py-2 text-right text-gray-400">Subtotal</td>
                    <td className="px-4 py-2 text-right text-white">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  {invoice.taxAmount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-gray-400">Tax</td>
                      <td className="px-4 py-2 text-right text-white">{formatCurrency(invoice.taxAmount)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-white/10">
                    <td colSpan={3} className="px-4 py-2 text-right text-white font-medium">Total</td>
                    <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(invoice.totalAmount)}</td>
                  </tr>
                  {invoice.paidAmount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-green-400">Paid</td>
                      <td className="px-4 py-2 text-right text-green-400">-{formatCurrency(invoice.paidAmount)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-white/10 bg-white/5">
                    <td colSpan={3} className="px-4 py-3 text-right text-white font-semibold">Balance Due</td>
                    <td className="px-4 py-3 text-right text-white font-semibold text-lg">{formatCurrency(invoice.balanceDue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payments */}
            {invoice.payments.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-medium">Payments</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-400">
                          {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'completed'
                          ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                          : 'bg-gray-400/10 text-gray-400 border border-gray-400/30'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-white font-medium mb-2">Notes</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-white font-medium mb-4">Invoice Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-400">Billing Type</dt>
                  <dd className="text-white capitalize">{invoice.billingType.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Issue Date</dt>
                  <dd className="text-white">{new Date(invoice.issueDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Due Date</dt>
                  <dd className="text-white">{new Date(invoice.dueDate).toLocaleDateString()}</dd>
                </div>
                {invoice.paymentTerms && (
                  <div>
                    <dt className="text-sm text-gray-400">Payment Terms</dt>
                    <dd className="text-white">{invoice.paymentTerms}</dd>
                  </div>
                )}
                {invoice.ledesFormat && (
                  <div>
                    <dt className="text-sm text-gray-400">Format</dt>
                    <dd className="text-white">LEDES</dd>
                  </div>
                )}
                {invoice.aiPaymentProbability && (
                  <div>
                    <dt className="text-sm text-gray-400">Payment Probability</dt>
                    <dd className="text-white">{invoice.aiPaymentProbability}%</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Client Info */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-white font-medium mb-4">Client</h3>
              <p className="text-white">{invoice.client.displayName}</p>
              {invoice.client.email && (
                <p className="text-sm text-gray-400">{invoice.client.email}</p>
              )}
            </div>

            {/* Actions */}
            {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-white font-medium mb-4">Actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/finance/billing/${invoice.id}/payment`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Record Payment
                  </Link>
                  <button
                    onClick={() => {/* TODO: Send reminder */}}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Send Reminder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
