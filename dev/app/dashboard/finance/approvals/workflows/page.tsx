'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface ApprovalLevel {
  id: string
  levelNumber: number
  name: string
  minAmount: number | null
  maxAmount: number | null
  approverRole: string | null
  requireAll: boolean
  autoApprove: boolean
}

interface ApprovalWorkflow {
  id: string
  name: string
  description: string | null
  entityType: string
  isActive: boolean
  levels: ApprovalLevel[]
}

export default function ApprovalWorkflowsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    entityType: 'expense',
    levels: [
      { levelNumber: 1, name: 'Manager Approval', minAmount: 0, maxAmount: null, approverRole: 'admin', requireAll: false, autoApprove: false },
    ],
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadWorkflows()
    }
  }, [currentOrganization?.id])

  const loadWorkflows = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/approval-workflows?organizationId=${currentOrganization.id}`)
      if (!res.ok) throw new Error('Failed to fetch workflows')
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!currentOrganization?.id || !newWorkflow.name) return
    try {
      const res = await fetch('/api/approval-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          ...newWorkflow,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create workflow')
      }
      toast.success('Workflow created')
      setShowCreateModal(false)
      setNewWorkflow({
        name: '',
        description: '',
        entityType: 'expense',
        levels: [
          { levelNumber: 1, name: 'Manager Approval', minAmount: 0, maxAmount: null, approverRole: 'admin', requireAll: false, autoApprove: false },
        ],
      })
      loadWorkflows()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const addLevel = () => {
    setNewWorkflow((prev) => ({
      ...prev,
      levels: [
        ...prev.levels,
        {
          levelNumber: prev.levels.length + 1,
          name: `Level ${prev.levels.length + 1} Approval`,
          minAmount: 0,
          maxAmount: null,
          approverRole: 'admin',
          requireAll: false,
          autoApprove: false,
        },
      ],
    }))
  }

  const removeLevel = (index: number) => {
    if (newWorkflow.levels.length <= 1) return
    setNewWorkflow((prev) => ({
      ...prev,
      levels: prev.levels
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, levelNumber: i + 1 })),
    }))
  }

  const updateLevel = (index: number, field: string, value: any) => {
    setNewWorkflow((prev) => ({
      ...prev,
      levels: prev.levels.map((l, i) =>
        i === index ? { ...l, [field]: value } : l
      ),
    }))
  }

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'expense':
        return 'Expenses'
      case 'vendor_bill':
        return 'Vendor Bills'
      case 'invoice':
        return 'Invoices'
      default:
        return entityType
    }
  }

  if (orgLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading workflows...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/finance/approvals" className="rounded-lg p-2 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Approval Workflows</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure multi-level approval rules
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </div>
      </div>

      <div className="p-6">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-medium">No workflows configured</h2>
            <p className="mt-2 text-muted-foreground">
              Create approval workflows to require sign-off on expenses, bills, and invoices.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{workflow.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getEntityLabel(workflow.entityType)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      workflow.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {workflow.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{workflow.description}</p>
                )}
                <div className="mt-4 space-y-2">
                  {workflow.levels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {level.levelNumber}
                      </span>
                      <span>{level.name}</span>
                      {level.minAmount !== null && (
                        <span className="text-muted-foreground">
                          (≥${level.minAmount})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Create Approval Workflow</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="e.g., Expense Approval"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Description</label>
                <input
                  type="text"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Applies To</label>
                <select
                  value={newWorkflow.entityType}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, entityType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="expense">Expenses</option>
                  <option value="vendor_bill">Vendor Bills</option>
                  <option value="invoice">Invoices</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Approval Levels</label>
                  <button
                    onClick={addLevel}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Level
                  </button>
                </div>
                <div className="mt-2 space-y-3">
                  {newWorkflow.levels.map((level, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Level {level.levelNumber}</span>
                        {newWorkflow.levels.length > 1 && (
                          <button
                            onClick={() => removeLevel(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 grid gap-2">
                        <input
                          type="text"
                          value={level.name}
                          onChange={(e) => updateLevel(index, 'name', e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-foreground focus:outline-none"
                          placeholder="Level name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Min Amount</label>
                            <input
                              type="number"
                              value={level.minAmount || ''}
                              onChange={(e) => updateLevel(index, 'minAmount', e.target.value ? Number(e.target.value) : null)}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-foreground focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Max Amount</label>
                            <input
                              type="number"
                              value={level.maxAmount || ''}
                              onChange={(e) => updateLevel(index, 'maxAmount', e.target.value ? Number(e.target.value) : null)}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-foreground focus:outline-none"
                              placeholder="No limit"
                            />
                          </div>
                        </div>
                        <select
                          value={level.approverRole || ''}
                          onChange={(e) => updateLevel(index, 'approverRole', e.target.value || null)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-foreground focus:outline-none"
                        >
                          <option value="admin">Admins</option>
                          <option value="owner">Owners Only</option>
                          <option value="">Any Member</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflow.name}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
