'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react'

interface Account {
  id: string
  accountNumber: string
  accountName: string
  accountType: string
  normalBalance: string
  currency: string
  isActive: boolean
  description?: string
  parentId?: string
  children?: Account[]
  depth?: number
}

interface AccountTemplate {
  key: string
  name: string
  description: string
}

interface ChartOfAccountsPageProps {
  organizationId: string
}

export default function ChartOfAccountsPage({ organizationId }: ChartOfAccountsPageProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showAISuggestModal, setShowAISuggestModal] = useState(false)
  const [templates] = useState<AccountTemplate[]>([
    { key: 'litigation', name: 'Litigation & Trial Practice', description: 'For civil litigation, trials, and dispute resolution' },
    { key: 'corporate', name: 'Corporate & Business Law', description: 'For transactional, M&A, and business advisory' },
    { key: 'solo', name: 'Solo Practitioner', description: 'Simplified chart for solo practices' },
    { key: 'family', name: 'Family Law', description: 'For divorce, custody, and family matters' },
    { key: 'realEstate', name: 'Real Estate Law', description: 'For closings, title work, and property transactions' },
    { key: 'criminal', name: 'Criminal Defense', description: 'For criminal defense and DUI practices' },
    { key: 'immigration', name: 'Immigration Law', description: 'For visa, naturalization, and immigration matters' },
    { key: 'intellectualProperty', name: 'Intellectual Property', description: 'For patents, trademarks, and IP litigation' },
    { key: 'bankruptcy', name: 'Bankruptcy & Restructuring', description: 'For Chapter 7, 11, 13 and creditor work' },
    { key: 'personalInjury', name: 'Personal Injury / Contingency', description: 'For PI, med mal, and contingency practices' },
    { key: 'estatePlanning', name: 'Estate Planning & Probate', description: 'For wills, trusts, and probate administration' },
  ])

  useEffect(() => {
    fetchAccounts()
  }, [organizationId])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/finance/accounts?organizationId=${organizationId}&includeHierarchy=true`
      )
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedAccounts(newExpanded)
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <Wallet className="w-4 h-4" />
      case 'liability':
        return <Scale className="w-4 h-4" />
      case 'equity':
        return <Building2 className="w-4 h-4" />
      case 'revenue':
        return <TrendingUp className="w-4 h-4" />
      case 'expense':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'text-white/80'
      case 'liability':
        return 'text-white/70'
      case 'equity':
        return 'text-white/90'
      case 'revenue':
        return 'text-white/85'
      case 'expense':
        return 'text-white/75'
      default:
        return 'text-white/60'
    }
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || account.accountType === filterType
    return matchesSearch && matchesType
  })

  const accountsByType = {
    asset: filteredAccounts.filter((a) => a.accountType === 'asset'),
    liability: filteredAccounts.filter((a) => a.accountType === 'liability'),
    equity: filteredAccounts.filter((a) => a.accountType === 'equity'),
    revenue: filteredAccounts.filter((a) => a.accountType === 'revenue'),
    expense: filteredAccounts.filter((a) => a.accountType === 'expense'),
  }

  const initializeFromTemplate = async (templateKey: string) => {
    try {
      const response = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          template: templateKey,
        }),
      })
      if (response.ok) {
        setShowTemplateModal(false)
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error initializing from template:', error)
    }
  }

  const renderAccountRow = (account: Account, depth = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedAccounts.has(account.id)

    return (
      <div key={account.id}>
        <div
          className={`flex items-center py-3 px-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
            !account.isActive ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(account.id)}
                className="p-1 hover:bg-white/10 rounded mr-2"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            <span className={`mr-3 ${getAccountTypeColor(account.accountType)}`}>
              {getAccountTypeIcon(account.accountType)}
            </span>
            <span className="font-mono text-sm text-white/70 mr-4 w-20">
              {account.accountNumber}
            </span>
            <span className="text-white font-medium truncate">{account.accountName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-white/50 w-20">
              {account.accountType}
            </span>
            <span className="text-xs text-white/50 w-16">
              {account.normalBalance}
            </span>
            <span className="text-xs text-white/50 w-12">{account.currency}</span>
            <button className="p-2 hover:bg-white/10 rounded">
              <MoreVertical className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {account.children!.map((child) => renderAccountRow(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading accounts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Chart of Accounts</h1>
            <p className="text-sm text-white/60 mt-1">
              Manage your organization&apos;s financial accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAISuggestModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Suggest</span>
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
          >
            <option value="all">All Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-5 gap-4">
        {Object.entries(accountsByType).map(([type, accts]) => (
          <div
            key={type}
            className="p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={getAccountTypeColor(type)}>
                {getAccountTypeIcon(type)}
              </span>
              <span className="text-sm text-white/60 capitalize">{type}</span>
            </div>
            <div className="text-2xl font-semibold text-white">{accts.length}</div>
            <div className="text-xs text-white/40">accounts</div>
          </div>
        ))}
      </div>

      {/* Accounts Table */}
      <div className="px-6 py-4">
        <div className="border border-white/10 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center py-3 px-4 bg-white/5 border-b border-white/10 text-sm text-white/60">
            <div className="flex-1">Account</div>
            <div className="w-20">Type</div>
            <div className="w-16">Balance</div>
            <div className="w-12">Currency</div>
            <div className="w-10"></div>
          </div>

          {/* Account Rows */}
          {filteredAccounts.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No accounts found</p>
              <p className="text-sm mt-2">
                Create your first account or initialize from a template
              </p>
            </div>
          ) : (
            filteredAccounts
              .filter((a) => !a.parentId)
              .map((account) => renderAccountRow(account))
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                Initialize from Template
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Choose a pre-configured chart of accounts for your practice area
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-3">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => initializeFromTemplate(template.key)}
                    className="p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-sm text-white/60 mt-1">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          organizationId={organizationId}
          accounts={accounts}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchAccounts()
          }}
        />
      )}

      {/* AI Suggest Modal */}
      {showAISuggestModal && (
        <AISuggestModal
          organizationId={organizationId}
          onClose={() => setShowAISuggestModal(false)}
          onApply={(templateKey) => {
            setShowAISuggestModal(false)
            initializeFromTemplate(templateKey)
          }}
        />
      )}
    </div>
  )
}

// Create Account Modal Component
function CreateAccountModal({
  organizationId,
  accounts,
  onClose,
  onCreated,
}: {
  organizationId: string
  accounts: Account[]
  onClose: () => void
  onCreated: () => void
}) {
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'asset',
    normalBalance: 'debit',
    currency: 'USD',
    parentId: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...formData,
          parentId: formData.parentId || undefined,
        }),
      })

      if (response.ok) {
        onCreated()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create account')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-white/20 rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create Account</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                placeholder="e.g., 1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Account Name</label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) =>
                setFormData({ ...formData, accountName: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
              placeholder="e.g., Cash - Operating"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountType: e.target.value,
                    normalBalance:
                      e.target.value === 'asset' || e.target.value === 'expense'
                        ? 'debit'
                        : 'credit',
                  })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Normal Balance
              </label>
              <select
                value={formData.normalBalance}
                onChange={(e) =>
                  setFormData({ ...formData, normalBalance: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">
              Parent Account (Optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            >
              <option value="">None (Top Level)</option>
              {accounts
                .filter((a) => a.accountType === formData.accountType)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} - {a.accountName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 resize-none"
              rows={2}
              placeholder="Account description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// AI Suggest Modal Component
function AISuggestModal({
  organizationId,
  onClose,
  onApply,
}: {
  organizationId: string
  onClose: () => void
  onApply: (templateKey: string) => void
}) {
  const [formData, setFormData] = useState({
    firmSize: 'small',
    jurisdiction: '',
    practiceAreas: [] as string[],
  })
  const [suggestion, setSuggestion] = useState<{
    template: string
    templateName: string
    confidence: number
    reasoning: string
    additionalAccounts: Array<{
      accountNumber: string
      accountName: string
      accountType: string
      normalBalance: string
      reason: string
    }>
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const practiceAreaOptions = [
    'Litigation',
    'Corporate',
    'Family Law',
    'Real Estate',
    'Criminal Defense',
    'Immigration',
    'Intellectual Property',
    'Bankruptcy',
    'Personal Injury',
    'Estate Planning',
    'Employment Law',
    'Tax Law',
  ]

  const handleGetSuggestion = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/finance/ai/suggest-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestion(data)
      }
    } catch (error) {
      console.error('Error getting suggestion:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePracticeArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...prev.practiceAreas, area],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              AI Account Structure Suggestion
            </h2>
          </div>
          <p className="text-sm text-white/60 mt-1">
            Let AI recommend the best chart of accounts for your firm
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!suggestion ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Firm Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['solo', 'small', 'mid', 'large'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormData({ ...formData, firmSize: size })}
                      className={`px-4 py-2 border rounded-lg capitalize transition-colors ${
                        formData.firmSize === size
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/20 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Primary Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) =>
                    setFormData({ ...formData, jurisdiction: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                  placeholder="e.g., California, New York, Texas"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Practice Areas (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {practiceAreaOptions.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => togglePracticeArea(area)}
                      className={`px-3 py-1.5 border rounded-full text-sm transition-colors ${
                        formData.practiceAreas.includes(area)
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/20 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGetSuggestion}
                disabled={loading || !formData.jurisdiction || formData.practiceAreas.length === 0}
                className="w-full py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get AI Recommendation
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">
                    {suggestion.templateName}
                  </h3>
                  <span className="text-sm text-white/60">
                    {suggestion.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-white/60">{suggestion.reasoning}</p>
              </div>

              {suggestion.additionalAccounts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">
                    Additional Recommended Accounts
                  </h4>
                  <div className="space-y-2">
                    {suggestion.additionalAccounts.map((account, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white/70">
                            {account.accountNumber}
                          </span>
                          <span className="text-white">{account.accountName}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {account.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSuggestion(null)}
                  className="flex-1 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => onApply(suggestion.template)}
                  className="flex-1 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                >
                  Apply Template
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
