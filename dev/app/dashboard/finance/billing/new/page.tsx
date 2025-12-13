'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Client {
  id: string
  displayName: string
  email?: string
}

interface Matter {
  id: string
  name: string
  matterNumber: string
}

interface LineItem {
  itemType: 'time_entry' | 'expense' | 'fixed_fee' | 'adjustment' | 'credit'
  description: string
  quantity: number
  rate: number
  serviceDate?: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { currentOrganization } = useOrganization()

  const [clients, setClients] = useState<Client[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientId: '',
    matterId: '',
    billingType: 'hourly' as 'hourly' | 'fixed_fee' | 'contingency' | 'hybrid',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    currency: 'USD',
    notes: '',
    ledesFormat: false,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemType: 'time_entry', description: '', quantity: 1, rate: 0 },
  ])

  useEffect(() => {
    if (currentOrganization?.id) {
      loadClients()
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (formData.clientId && currentOrganization?.id) {
      loadMatters(formData.clientId)
    }
  }, [formData.clientId, currentOrganization?.id])

  const loadClients = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clients?organizationId=${currentOrganization.id}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMatters = async (clientId: string) => {
    if (!currentOrganization?.id) return
    try {
      const res = await fetch(
        `/api/matters?organizationId=${currentOrganization.id}&clientId=${clientId}`
      )
      if (res.ok) {
        const data = await res.json()
        setMatters(data.matters || [])
      }
    } catch (err) {
      console.error('Error loading matters:', err)
    }
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { itemType: 'time_entry', description: '', quantity: 1, rate: 0 },
    ])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return

    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

    if (lineItems.some(item => !item.description || item.rate <= 0)) {
      setError('Please fill in all line items with valid descriptions and rates')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          ...formData,
          lineItems,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invoice')
      }

      const data = await res.json()
      router.push(`/dashboard/finance/billing/${data.invoice.id}`)
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount)
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
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/finance/billing" className="hover:text-white">Billing</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">New Invoice</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-400">
          Create a new invoice for a client
        </p>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client & Matter */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Client & Matter</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value, matterId: '' })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Matter</label>
                <select
                  value={formData.matterId}
                  onChange={(e) => setFormData({ ...formData, matterId: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  disabled={!formData.clientId}
                >
                  <option value="">Select a matter (optional)</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.matterNumber} - {matter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Billing Type *</label>
                <select
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value as typeof formData.billingType })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed_fee">Fixed Fee</option>
                  <option value="contingency">Contingency</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Issue Date *</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  <option value="Upon Receipt">Upon Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ledesFormat}
                    onChange={(e) => setFormData({ ...formData, ledesFormat: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-black"
                  />
                  <span className="text-sm text-gray-400">LEDES Format</span>
                </label>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-2">
                    <select
                      value={item.itemType}
                      onChange={(e) => updateLineItem(index, 'itemType', e.target.value)}
                      className="w-full px-2 py-2 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40"
                    >
                      <option value="time_entry">Time</option>
                      <option value="expense">Expense</option>
                      <option value="fixed_fee">Fixed Fee</option>
                      <option value="adjustment">Adjustment</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-medium mb-4">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes to appear on the invoice..."
              rows={3}
              className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/finance/billing"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
