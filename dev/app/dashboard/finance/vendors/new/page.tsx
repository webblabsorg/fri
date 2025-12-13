'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

const VENDOR_TYPES = [
  { value: 'expert_witness', label: 'Expert Witness' },
  { value: 'court_reporter', label: 'Court Reporter' },
  { value: 'process_server', label: 'Process Server' },
  { value: 'investigator', label: 'Investigator' },
  { value: 'translator', label: 'Translator/Interpreter' },
  { value: 'legal_research', label: 'Legal Research' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'technology', label: 'Technology/Software' },
  { value: 'courier', label: 'Courier/Delivery' },
  { value: 'printing', label: 'Printing/Copying' },
  { value: 'other', label: 'Other' },
]

export default function NewVendorPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    vendorType: '',
    email: '',
    phone: '',
    website: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    taxId: '',
    taxIdType: 'EIN',
    is1099Eligible: false,
    paymentTerms: 'Net 30',
    preferredPaymentMethod: 'check',
    isPreferred: false,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          ...formData,
          taxId: formData.taxId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create vendor')
      }

      toast.success('Vendor created successfully')
      router.push(`/dashboard/finance/vendors/${data.vendor.id}`)
    } catch (error) {
      console.error('Error creating vendor:', error)
      toast.error((error as Error).message || 'Failed to create vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance/vendors" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Add Vendor</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create a new vendor record</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="e.g., Legal Research Services Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Vendor Type *</label>
                <select
                  value={formData.vendorType}
                  onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">Select type</option>
                  {VENDOR_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Address Line 1</label>
                <input
                  type="text"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Address Line 2</label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Tax & Payment</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is1099Eligible}
                    onChange={(e) => setFormData({ ...formData, is1099Eligible: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">1099 Eligible</span>
                </label>
              </div>

              {formData.is1099Eligible && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Tax ID Type</label>
                    <select
                      value={formData.taxIdType}
                      onChange={(e) => setFormData({ ...formData, taxIdType: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    >
                      <option value="EIN">EIN</option>
                      <option value="SSN">SSN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Tax ID</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="Upon Receipt">Upon Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Preferred Payment Method</label>
                  <select
                    value={formData.preferredPaymentMethod}
                    onChange={(e) => setFormData({ ...formData, preferredPaymentMethod: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="check">Check</option>
                    <option value="ach">ACH</option>
                    <option value="wire">Wire Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPreferred}
                    onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Preferred Vendor</span>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
              placeholder="Additional notes about this vendor..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/finance/vendors"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
