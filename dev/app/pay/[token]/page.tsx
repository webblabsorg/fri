'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface InvoiceData {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  currency: string
  notes: string | null
  termsAndConditions: string | null
  organization: {
    name: string
    logoUrl: string | null
  }
  client: {
    displayName: string
    email: string | null
  }
  lineItems: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  paymentMethods: {
    stripe: boolean
    lawpay: boolean
    paypal: boolean
  }
}

export default function PublicInvoicePage() {
  const params = useParams()
  const token = params.token as string
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/pay/${token}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Invoice not found')
        }
        const data = await res.json()
        setInvoice(data.invoice)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [token])

  const handlePayment = async (processor: 'stripe' | 'lawpay' | 'paypal') => {
    if (!invoice) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/pay/${token}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processor }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Payment failed')
      }
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600">{error || 'This invoice link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid' || invoice.balanceDue <= 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-black text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{invoice.organization.name}</h1>
                <p className="text-gray-300 mt-1">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isPaid
                      ? 'bg-green-500 text-white'
                      : invoice.status === 'overdue'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-black'
                  }`}
                >
                  {isPaid ? 'PAID' : invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Bill To</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">{invoice.client.displayName}</p>
                {invoice.client.email && (
                  <p className="text-gray-600">{invoice.client.email}</p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Issue Date: </span>
                  <span className="text-gray-900">{formatDate(invoice.issueDate)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Due Date: </span>
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 border-b">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Qty</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Rate</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="py-3 text-right text-gray-900 font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t text-xl font-bold">
                  <span className="text-gray-900">Balance Due</span>
                  <span className="text-gray-900">{formatCurrency(invoice.balanceDue, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!isPaid && invoice.balanceDue > 0 && (
            <div className="p-6 border-t">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pay Now</h3>
              <div className="flex flex-wrap gap-3">
                {invoice.paymentMethods.stripe && (
                  <button
                    onClick={() => handlePayment('stripe')}
                    disabled={processing}
                    className="flex-1 min-w-[140px] bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? 'Processing...' : 'Pay with Card'}
                  </button>
                )}
                {invoice.paymentMethods.lawpay && (
                  <button
                    onClick={() => handlePayment('lawpay')}
                    disabled={processing}
                    className="flex-1 min-w-[140px] bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? 'Processing...' : 'Pay with LawPay'}
                  </button>
                )}
                {invoice.paymentMethods.paypal && (
                  <button
                    onClick={() => handlePayment('paypal')}
                    disabled={processing}
                    className="flex-1 min-w-[140px] bg-yellow-500 text-black py-3 px-6 rounded-lg font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? 'Processing...' : 'Pay with PayPal'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="p-6 border-t">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.termsAndConditions && (
            <div className="p-6 border-t bg-gray-50">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Terms & Conditions</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.termsAndConditions}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Powered by Frith Legal Technology</p>
        </div>
      </div>
    </div>
  )
}
