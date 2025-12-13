'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Plus,
  X,
  Search,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Client {
  id: string
  displayName: string
  email: string | null
}

interface Matter {
  id: string
  name: string
  matterNumber: string | null
}

interface TrustAccount {
  id: string
  accountName: string
}

export default function NewLedgerPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string
  const { currentOrganization } = useOrganization()
  
  const [account, setAccount] = useState<TrustAccount | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  
  const [formData, setFormData] = useState({
    clientId: '',
    matterId: '',
    ledgerName: '',
  })

  useEffect(() => {
    if (accountId && currentOrganization?.id) {
      loadData()
    }
  }, [accountId, currentOrganization?.id])

  useEffect(() => {
    if (formData.clientId) {
      loadMatters(formData.clientId)
    } else {
      setMatters([])
      setFormData(prev => ({ ...prev, matterId: '' }))
    }
  }, [formData.clientId])

  const loadData = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const [accountRes, clientsRes] = await Promise.all([
        fetch(`/api/trust/accounts/${accountId}?organizationId=${currentOrganization.id}`),
        fetch(`/api/clients?organizationId=${currentOrganization.id}`),
      ])
      
      if (!accountRes.ok) throw new Error('Failed to load account')
      const accountData = await accountRes.json()
      setAccount(accountData.account)
      
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization?.id || !formData.clientId || !formData.ledgerName) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/trust/accounts/${accountId}/ledgers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          matterId: formData.matterId || undefined,
          ledgerName: formData.ledgerName,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create ledger')
      }
      
      const data = await res.json()
      router.push(`/dashboard/finance/trust/${accountId}/ledgers/${data.ledger.id}`)
    } catch (err) {
      console.error('Error creating ledger:', err)
      setError(err instanceof Error ? err.message : 'Failed to create ledger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.displayName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
  )

  const selectedClient = clients.find(c => c.id === formData.clientId)

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
              <span className="text-white">New Ledger</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Create Client Ledger</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new client ledger for trust fund tracking
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Client *
              </label>
              {selectedClient ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/5">
                  <div>
                    <p className="text-white font-medium">{selectedClient.displayName}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-gray-400">{selectedClient.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, clientId: '', matterId: '' })}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search clients..."
                      className="w-full rounded-lg border border-white/20 bg-white/5 pl-10 pr-4 py-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No clients found
                      </div>
                    ) : (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, clientId: client.id })
                            setClientSearch('')
                          }}
                          className="w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0"
                        >
                          <p className="text-white">{client.displayName}</p>
                          {client.email && (
                            <p className="text-sm text-gray-400">{client.email}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {formData.clientId && matters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Matter (Optional)
                </label>
                <select
                  value={formData.matterId}
                  onChange={(e) => setFormData({ ...formData, matterId: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="">No specific matter</option>
                  {matters.map(matter => (
                    <option key={matter.id} value={matter.id}>
                      {matter.name} {matter.matterNumber && `(${matter.matterNumber})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ledger Name *
              </label>
              <input
                type="text"
                value={formData.ledgerName}
                onChange={(e) => setFormData({ ...formData, ledgerName: e.target.value })}
                placeholder="e.g., Settlement Funds, Retainer Deposit"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                A descriptive name for this client&apos;s trust ledger
              </p>
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
              disabled={isSubmitting || !formData.clientId || !formData.ledgerName}
              className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
