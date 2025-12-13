'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, DollarSign, Calendar } from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface Vendor {
  id: string
  name: string
}

interface LineItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
  accountCode: string
}

export default function NewVendorBillPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentOrganization } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])

  const [formData, setFormData] = useState({
    vendorId: searchParams.get('vendorId') || '',
    invoiceNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: '1', unitPrice: '', accountCode: '' },
  ])

  useEffect(() => {
    if (currentOrganization?.id) {
      loadVendors()
    }
  }, [currentOrganization?.id])

  const loadVendors = async () => {
    try {
      const res = await fetch(`/api/vendors?organizationId=${currentOrganization?.id}&isActive=true&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    }
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: '', quantity: '1', unitPrice: '', accountCode: '' },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unitPrice) || 0
      return sum + qty * price
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return

    const validLineItems = lineItems.filter(
      (item) => item.description && item.unitPrice
    )

    if (validLineItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/vendor-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          vendorId: formData.vendorId,
          invoiceNumber: formData.invoiceNumber || undefined,
          billDate: formData.billDate,
          dueDate: formData.dueDate,
          description: formData.description || undefined,
          lineItems: validLineItems.map((item) => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice),
            accountCode: item.accountCode || undefined,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create vendor bill')
      }

      toast.success('Vendor bill created successfully')
      router.push(`/dashboard/finance/vendor-bills/${data.bill.id}`)
    } catch (error) {
      console.error('Error creating vendor bill:', error)
      toast.error((error as Error).message || 'Failed to create vendor bill')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance/vendor-bills" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New Vendor Bill</h1>
            <p className="mt-1 text-sm text-muted-foreground">Record a new vendor invoice</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Bill Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Vendor *</label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    placeholder="Vendor's invoice #"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Bill Date *</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={formData.billDate}
                      onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                      required
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Due Date *</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="Optional description..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Add Line
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Description *
                      </label>
                    )}
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Qty
                      </label>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Unit Price *
                      </label>
                    )}
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Amount
                      </label>
                    )}
                    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                      ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {index === 0 && <div className="h-5" />}
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-border pt-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/finance/vendor-bills"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
