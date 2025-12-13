'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Save,
  X,
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
  currency: string
  isActive: boolean
}

export default function EditTrustAccountPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string
  const { currentOrganization } = useOrganization()
  
  const [account, setAccount] = useState<TrustAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    accountName: '',
    bankName: '',
    jurisdiction: '',
    accountType: 'IOLTA',
    isActive: true,
  })

  useEffect(() => {
    if (accountId && currentOrganization?.id) {
      loadAccount()
    }
  }, [accountId, currentOrganization?.id])

  const loadAccount = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/trust/accounts/${accountId}?organizationId=${currentOrganization.id}`
      )
      if (!res.ok) throw new Error('Failed to load account')
      const data = await res.json()
      setAccount(data.account)
      setFormData({
        accountName: data.account.accountName,
        bankName: data.account.bankName,
        jurisdiction: data.account.jurisdiction,
        accountType: data.account.accountType,
        isActive: data.account.isActive,
      })
    } catch (err) {
      console.error('Error loading account:', err)
      setError(err instanceof Error ? err.message : 'Failed to load account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id) return
    
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const res = await fetch(`/api/trust/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          ...formData,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update account')
      }
      
      setSuccessMessage('Account updated successfully')
      setTimeout(() => {
        router.push(`/dashboard/finance/trust/${accountId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to update account')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !account) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
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
              <Link href={`/dashboard/finance/trust/${accountId}`} className="hover:text-white">
                {account?.accountName}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Edit</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Edit Trust Account</h1>
            <p className="mt-1 text-sm text-gray-400">
              Update account details and settings
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Jurisdiction
              </label>
              <input
                type="text"
                value={formData.jurisdiction}
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                placeholder="e.g., California, New York"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="IOLTA">IOLTA</option>
                <option value="IOLA">IOLA</option>
                <option value="client_trust">Client Trust</option>
                <option value="escrow">Escrow</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-white focus:ring-white"
              />
              <label htmlFor="isActive" className="text-sm text-gray-400">
                Account is active
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/dashboard/finance/trust/${accountId}`}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
