'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Play, Edit, Trash2, GitBranch, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface Workflow {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  steps: WorkflowStep[]
  _count: {
    runs: number
  }
}

interface WorkflowStep {
  id: string
  order: number
  toolId: string
  name: string
  config: any
}

export default function WorkflowsPage() {
  const router = useRouter()
  const { currentWorkspace, currentOrganization } = useOrganization()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchWorkflows()
  }, [currentWorkspace, currentOrganization])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentWorkspace?.id) {
        params.set('workspaceId', currentWorkspace.id)
      }
      if (currentOrganization?.id) {
        params.set('organizationId', currentOrganization.id)
      }

      const response = await fetch(`/api/workflows?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows)
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
      toast.error('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) {
      toast.error('Workflow name is required')
      return
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          description: newWorkflow.description || null,
          workspaceId: currentWorkspace?.id,
          organizationId: currentOrganization?.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Workflow created successfully')
        setShowCreateDialog(false)
        setNewWorkflow({ name: '', description: '' })
        await fetchWorkflows()
        router.push(`/dashboard/workflows/${data.workflow.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create workflow')
      }
    } catch (error) {
      console.error('Failed to create workflow:', error)
      toast.error('Failed to create workflow')
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: '' }),
      })

      if (response.ok) {
        toast.success('Workflow execution started')
        await fetchWorkflows()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to execute workflow')
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      toast.error('Failed to execute workflow')
    }
  }

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Workflow deleted successfully')
        await fetchWorkflows()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete workflow')
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast.error('Failed to delete workflow')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'draft':
        return <Clock className="w-4 h-4" />
      case 'archived':
        return <XCircle className="w-4 h-4" />
      default:
        return <GitBranch className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading workflows...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-gray-600 mt-2">
            Automate your AI workflows by chaining tools together
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Create a new workflow to automate your AI tool processes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  placeholder="Enter workflow name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this workflow does"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold mb-2">No Workflows Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first workflow to automate AI tool processes
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(workflow.status)}
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {workflow.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{workflow.name}</h3>
                {workflow.description && (
                  <p className="text-gray-600 text-sm">{workflow.description}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{workflow.steps.length} steps</span>
                <span>{workflow._count.runs} runs</span>
                <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
              </div>
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Workflow
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
