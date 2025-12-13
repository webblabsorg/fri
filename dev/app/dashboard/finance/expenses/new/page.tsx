'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  Upload,
  Calendar,
  DollarSign,
  Car,
  AlertCircle,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface Matter {
  id: string
  name: string
  client: { displayName: string }
}

interface Vendor {
  id: string
  name: string
}

const EXPENSE_CATEGORIES = [
  { value: 'court_fees', label: 'Court Fees' },
  { value: 'filing_fees', label: 'Filing Fees' },
  { value: 'expert_witness', label: 'Expert Witness' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'mileage', label: 'Mileage' },
  { value: 'postage', label: 'Postage & Shipping' },
  { value: 'copies', label: 'Copies & Printing' },
  { value: 'supplies', label: 'Office Supplies' },
  { value: 'research', label: 'Legal Research' },
  { value: 'deposition', label: 'Deposition Costs' },
  { value: 'process_server', label: 'Process Server' },
  { value: 'other', label: 'Other' },
]

export default function NewExpensePage() {
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [matters, setMatters] = useState<Matter[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [policyWarnings, setPolicyWarnings] = useState<string[]>([])

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    taxAmount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    matterId: '',
    vendorId: '',
    isBillable: true,
    markupPercent: '',
    paymentMethod: 'firm_card',
    isMileage: false,
    mileageDistance: '',
    mileageStart: '',
    mileageEnd: '',
  })
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasPotentialDuplicates: boolean
    duplicates: Array<{ id: string; expenseNumber: string; description: string; amount: number; similarity: number }>
  } | null>(null)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadMatters()
      loadVendors()
    }
  }, [currentOrganization?.id])

  const loadMatters = async () => {
    try {
      const res = await fetch(`/api/matters?organizationId=${currentOrganization?.id}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setMatters(data.matters || [])
      }
    } catch (error) {
      console.error('Error loading matters:', error)
    }
  }

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

  const checkForDuplicates = async () => {
    if (!currentOrganization?.id || !formData.description || (!formData.amount && !formData.isMileage)) {
      return
    }

    setIsCheckingDuplicate(true)
    try {
      const amount = formData.isMileage
        ? parseFloat(formData.mileageDistance || '0') * 0.67
        : parseFloat(formData.amount || '0')

      const res = await fetch('/api/expenses/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          description: formData.description,
          amount,
          expenseDate: formData.expenseDate,
          vendorId: formData.vendorId || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDuplicateWarning(data)
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error)
    } finally {
      setIsCheckingDuplicate(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return

    setIsSubmitting(true)
    setPolicyWarnings([])

    try {
      const payload = {
        organizationId: currentOrganization.id,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        description: formData.description,
        amount: formData.isMileage ? undefined : parseFloat(formData.amount),
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        expenseDate: formData.expenseDate,
        matterId: formData.matterId || undefined,
        vendorId: formData.vendorId || undefined,
        isBillable: formData.isBillable,
        markupPercent: formData.markupPercent ? parseFloat(formData.markupPercent) : undefined,
        paymentMethod: formData.paymentMethod,
        isMileage: formData.isMileage,
        mileageDistance: formData.mileageDistance ? parseFloat(formData.mileageDistance) : undefined,
        mileageRate: formData.isMileage ? 0.67 : undefined,
        mileageStart: formData.mileageStart || undefined,
        mileageEnd: formData.mileageEnd || undefined,
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create expense')
      }

      if (data.policyWarnings && data.policyWarnings.length > 0) {
        setPolicyWarnings(data.policyWarnings)
        toast.warning('Expense created with policy warnings')
      } else {
        toast.success('Expense created successfully')
      }

      router.push(`/dashboard/finance/expenses/${data.expense.id}`)
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error((error as Error).message || 'Failed to create expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      isMileage: category === 'mileage',
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/finance/expenses"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New Expense</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a new expense
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        {policyWarnings.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Policy Warnings</h3>
                <ul className="mt-1 list-inside list-disc text-sm text-yellow-700">
                  {policyWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Expense Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onBlur={checkForDuplicates}
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="Describe the expense..."
                />
              </div>

              {duplicateWarning?.hasPotentialDuplicates && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-800 dark:text-orange-300">Potential Duplicate Detected</h3>
                      <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                        Similar expenses found. Please verify this is not a duplicate submission.
                      </p>
                      <div className="mt-2 space-y-2">
                        {duplicateWarning.duplicates.slice(0, 3).map((dup) => (
                          <div key={dup.id} className="flex items-center justify-between text-sm">
                            <span className="text-orange-700 dark:text-orange-400">
                              {dup.expenseNumber}: {dup.description.slice(0, 40)}...
                            </span>
                            <span className="font-medium text-orange-800 dark:text-orange-300">
                              ${dup.amount.toFixed(2)} ({dup.similarity}% match)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.isMileage ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="h-4 w-4" />
                    Mileage Expense (IRS rate: $0.67/mile)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Distance (miles) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.mileageDistance}
                        onChange={(e) => setFormData({ ...formData, mileageDistance: e.target.value })}
                        required
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Calculated Amount
                      </label>
                      <div className="mt-1 rounded-lg border border-border bg-muted px-3 py-2 text-foreground">
                        ${(parseFloat(formData.mileageDistance || '0') * 0.67).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Start Location
                      </label>
                      <input
                        type="text"
                        value={formData.mileageStart}
                        onChange={(e) => setFormData({ ...formData, mileageStart: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                        placeholder="e.g., Office"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        End Location
                      </label>
                      <input
                        type="text"
                        value={formData.mileageEnd}
                        onChange={(e) => setFormData({ ...formData, mileageEnd: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                        placeholder="e.g., Courthouse"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Amount *
                    </label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Tax Amount
                    </label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.taxAmount}
                        onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Expense Date *
                </label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Billing & Assignment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Matter
                </label>
                <select
                  value={formData.matterId}
                  onChange={(e) => setFormData({ ...formData, matterId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">No matter (general expense)</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.name} - {matter.client.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Vendor
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">No vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isBillable}
                    onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Billable to client</span>
                </label>
              </div>

              {formData.isBillable && (
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Markup Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.markupPercent}
                    onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    placeholder="e.g., 10 for 10%"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="firm_card">Firm Credit Card</option>
                  <option value="personal">Personal (Reimbursable)</option>
                  <option value="cash">Cash</option>
                  <option value="vendor_invoice">Vendor Invoice</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/finance/expenses"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
