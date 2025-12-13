'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface Vendor {
  id: string
  vendorNumber: string
  name: string
  vendorType: string
  email: string | null
  phone: string | null
  website: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string
  taxId: string | null
  taxIdType: string | null
  is1099Eligible: boolean
  paymentTerms: string | null
  preferredPaymentMethod: string | null
  rating: number | null
  totalPaid: number
  totalInvoices: number
  avgPaymentDays: number | null
  isPreferred: boolean
  isActive: boolean
  notes: string | null
  createdAt: string
  _count: { expenses: number; bills: number; payments: number }
  expenses: any[]
  bills: any[]
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id && id) {
      loadVendor()
    }
  }, [currentOrganization?.id, id])

  const loadVendor = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/vendors/${id}?organizationId=${currentOrganization?.id}`)
      if (!res.ok) throw new Error('Failed to fetch vendor')
      const data = await res.json()
      setVendor({
        ...data.vendor,
        totalPaid: Number(data.vendor.totalPaid),
        rating: data.vendor.rating ? Number(data.vendor.rating) : null,
      })
    } catch (error) {
      console.error('Error loading vendor:', error)
      toast.error('Failed to load vendor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!vendor || !currentOrganization?.id) return
    if (!confirm('Are you sure you want to deactivate this vendor?')) return

    setIsDeactivating(true)
    try {
      const res = await fetch(`/api/vendors/${vendor.id}?organizationId=${currentOrganization.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to deactivate vendor')
      }
      toast.success('Vendor deactivated')
      router.push('/dashboard/finance/vendors')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsDeactivating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading vendor...</div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Vendor not found</h2>
          <Link href="/dashboard/finance/vendors" className="mt-4 text-primary hover:underline">
            Back to vendors
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/finance/vendors" className="rounded-lg p-2 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{vendor.name}</h1>
                {vendor.isPreferred && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    <Star className="h-3 w-3" />
                    Preferred
                  </span>
                )}
                {vendor.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {vendor.vendorNumber} • {vendor.vendorType.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendor.isActive && (
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Deactivate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Contact Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {vendor.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {vendor.website}
                      </a>
                    </div>
                  </div>
                )}
                {(vendor.address1 || vendor.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-foreground">
                        {vendor.address1}
                        {vendor.address2 && <><br />{vendor.address2}</>}
                        {vendor.city && <><br />{vendor.city}, {vendor.state} {vendor.postalCode}</>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Payment & Tax Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Payment Terms</dt>
                  <dd className="mt-1 font-medium">{vendor.paymentTerms || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Preferred Payment Method</dt>
                  <dd className="mt-1 font-medium capitalize">{vendor.preferredPaymentMethod || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">1099 Eligible</dt>
                  <dd className="mt-1 font-medium">{vendor.is1099Eligible ? 'Yes' : 'No'}</dd>
                </div>
                {vendor.is1099Eligible && vendor.taxId && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Tax ID ({vendor.taxIdType})</dt>
                    <dd className="mt-1 font-medium">***-**-{vendor.taxId.slice(-4)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {vendor.bills && vendor.bills.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Recent Bills</h2>
                <div className="space-y-3">
                  {vendor.bills.slice(0, 5).map((bill: any) => (
                    <Link
                      key={bill.id}
                      href={`/dashboard/finance/vendor-bills/${bill.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{bill.billNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(bill.billDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(bill.totalAmount).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{bill.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {vendor.notes && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Notes</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Statistics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${vendor.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bills</p>
                    <p className="text-xl font-semibold">{vendor._count.bills}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-xl font-semibold">{vendor._count.expenses}</p>
                  </div>
                </div>
                {vendor.avgPaymentDays && (
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Payment Days</p>
                    <p className="text-xl font-semibold">{vendor.avgPaymentDays} days</p>
                  </div>
                )}
                {vendor.rating && (
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${star <= vendor.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 font-medium">{vendor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/finance/vendor-bills/new?vendorId=${vendor.id}`}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  Create Bill
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
