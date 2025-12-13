'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  DollarSign,
  CreditCard,
  Building,
  Banknote,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Invoice {
  id: string
  invoiceNumber: string
  balanceDue: number
  currency: string
  client: {
    id: string
    displayName: string
  }
}

export default function RecordPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const { currentOrganization } = useOrganization()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: 'check',
    paymentDate: new Date().toISOString().split('T')[0],
    checkNumber: '',
    bankName: '',
    referenceNumber: '',
    notes: '',
  })

  useEffect(() => {
    if (invoiceId && currentOrganization?.id) {
      loadInvoice()
    }
  }, [invoiceId, currentOrganization?.id])

  const loadInvoice = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/billing/invoices/${invoiceId}?organizationId=${currentOrganization.id}`
      )
      if (!res.ok) throw new Error('Failed to load invoice')
      const data = await res.json()
      setInvoice(data.invoice)
      setFormData((prev) => ({ ...prev, amount: Number(data.invoice.balanceDue) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id || !invoice) return

    if (formData.amount <= 0) {
      setError('Payment amount must be greater than 0')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          invoiceId: invoice.id,
          clientId: invoice.client.id,
          amount: formData.amount,
          currency: invoice.currency,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          checkNumber: formData.checkNumber || undefined,
          bankName: formData.bankName || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to record payment')
      }

      router.push(`/dashboard/finance/billing/${invoiceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
    }).format(amount)
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />
      case 'ach':
      case 'wire':
        return <Building className="h-5 w-5" />
      default:
        return <Banknote className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Invoice not found'}</p>
          <Link href="/dashboard/finance/billing" className="text-white hover:underline">
            ← Back to Billing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/finance/billing" className="hover:text-white">Billing</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/dashboard/finance/billing/${invoiceId}`} className="hover:text-white">
            {invoice.invoiceNumber}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Record Payment</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Record Payment</h1>
        <p className="mt-1 text-sm text-gray-400">
          Record a payment for invoice {invoice.invoiceNumber}
        </p>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Invoice Summary */}
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Invoice</p>
              <p className="text-white font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-gray-400">{invoice.client.displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance Due</p>
              <p className="text-2xl font-semibold text-white">{formatCurrency(invoice.balanceDue)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Amount */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Payment Amount</h3>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                max={invoice.balanceDue}
                className="w-full pl-10 pr-4 py-3 bg-black border border-white/20 rounded-lg text-white text-xl focus:outline-none focus:border-white/40"
                required
              />
            </div>
            {formData.amount < invoice.balanceDue && formData.amount > 0 && (
              <p className="mt-2 text-sm text-yellow-400">
                Partial payment. Remaining balance: {formatCurrency(invoice.balanceDue - formData.amount)}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'check', label: 'Check' },
                { value: 'ach', label: 'ACH Transfer' },
                { value: 'wire', label: 'Wire Transfer' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'cash', label: 'Cash' },
                { value: 'trust', label: 'Trust Account' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    formData.paymentMethod === method.value
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {getPaymentMethodIcon(method.value)}
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                />
              </div>
              {formData.paymentMethod === 'check' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Check Number</label>
                  <input
                    type="text"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                    placeholder="e.g., 1234"
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              )}
              {['ach', 'wire'].includes(formData.paymentMethod) && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., Chase Bank"
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="Transaction or confirmation number"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this payment"
                  rows={2}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/dashboard/finance/billing/${invoiceId}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || formData.amount <= 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
