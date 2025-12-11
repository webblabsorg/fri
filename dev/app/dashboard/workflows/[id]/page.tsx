'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Play, Save, Trash2, GripVertical, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

interface WorkflowStep {
  id?: string
  order: number
  toolId: string
  name: string
  config: {
    input: string
    [key: string]: any
  }
  waitForPrevious: boolean
  continueOnError: boolean
}

interface Workflow {
  id: string
  name: string
  description: string | null
  status: string
  steps: WorkflowStep[]
  runs: any[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

// Mock available tools - in real implementation, fetch from API
const AVAILABLE_TOOLS = [
  { id: 'legal-email-drafter', name: 'Legal Email Drafter', description: 'Draft professional legal emails' },
  { id: 'contract-analyzer', name: 'Contract Analyzer', description: 'Analyze contracts for key terms' },
  { id: 'legal-research', name: 'Legal Research Assistant', description: 'Research legal topics' },
  { id: 'document-summarizer', name: 'Document Summarizer', description: 'Summarize long documents' },
]

export default function WorkflowBuilderPage({ params }: PageProps) {
  const router = useRouter()
  const [workflowId, setWorkflowId] = useState<string>('')
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [showAddStepDialog, setShowAddStepDialog] = useState(false)
  const [newStep, setNewStep] = useState<Partial<WorkflowStep>>({
    toolId: '',
    name: '',
    config: { input: '' },
    waitForPrevious: true,
    continueOnError: false,
  })

  useEffect(() => {
    params.then(p => {
      setWorkflowId(p.id)
      fetchWorkflow(p.id)
    })
  }, [params])

  const fetchWorkflow = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workflows/${id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflow(data.workflow)
      } else if (response.status === 404) {
        toast.error('Workflow not found')
        router.push('/dashboard/workflows')
      }
    } catch (error) {
      console.error('Failed to fetch workflow:', error)
      toast.error('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWorkflow = async () => {
    if (!workflow) return

    setSaving(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          steps: workflow.steps.map((step, index) => ({
            ...step,
            order: index + 1,
          })),
        }),
      })

      if (response.ok) {
        toast.success('Workflow saved successfully')
        await fetchWorkflow(workflowId)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save workflow')
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
      toast.error('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const handleExecuteWorkflow = async () => {
    if (!workflow) return

    setExecuting(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: 'Test execution' }),
      })

      if (response.ok) {
        toast.success('Workflow execution started')
        await fetchWorkflow(workflowId)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to execute workflow')
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      toast.error('Failed to execute workflow')
    } finally {
      setExecuting(false)
    }
  }

  const handleAddStep = () => {
    if (!newStep.toolId || !newStep.name) {
      toast.error('Please select a tool and provide a step name')
      return
    }

    if (!workflow) return

    const step: WorkflowStep = {
      order: workflow.steps.length + 1,
      toolId: newStep.toolId,
      name: newStep.name,
      config: newStep.config || { input: '' },
      waitForPrevious: newStep.waitForPrevious ?? true,
      continueOnError: newStep.continueOnError ?? false,
    }

    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, step],
    })

    setNewStep({
      toolId: '',
      name: '',
      config: { input: '' },
      waitForPrevious: true,
      continueOnError: false,
    })
    setShowAddStepDialog(false)
  }

  const handleRemoveStep = (index: number) => {
    if (!workflow) return

    const updatedSteps = workflow.steps.filter((_, i) => i !== index)
    setWorkflow({
      ...workflow,
      steps: updatedSteps.map((step, i) => ({ ...step, order: i + 1 })),
    })
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!workflow) return

    const steps = [...workflow.steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= steps.length) return

    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]]

    setWorkflow({
      ...workflow,
      steps: steps.map((step, i) => ({ ...step, order: i + 1 })),
    })
  }

  const handleUpdateStep = (index: number, updates: Partial<WorkflowStep>) => {
    if (!workflow) return

    const updatedSteps = workflow.steps.map((step, i) =>
      i === index ? { ...step, ...updates } : step
    )

    setWorkflow({
      ...workflow,
      steps: updatedSteps,
    })
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading workflow...</div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="container py-12">
        <div className="text-center">Workflow not found</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/dashboard/workflows" className="hover:text-blue-600">
            Workflows
          </Link>
          <span>/</span>
          <span>{workflow.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-600">{workflow.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Badge className={workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {workflow.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {workflow.steps.length} steps
              </span>
              <span className="text-sm text-gray-500">
                {workflow.runs.length} runs
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleSaveWorkflow} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            {workflow.status === 'active' && (
              <Button onClick={handleExecuteWorkflow} disabled={executing}>
                <Play className="w-4 h-4 mr-2" />
                {executing ? 'Running...' : 'Run Workflow'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workflow Steps */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Workflow Steps</h2>
            <Dialog open={showAddStepDialog} onOpenChange={setShowAddStepDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Workflow Step</DialogTitle>
                  <DialogDescription>
                    Add a new step to your workflow
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tool">Tool</Label>
                    <Select value={newStep.toolId} onValueChange={(value) => setNewStep({ ...newStep, toolId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_TOOLS.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>
                            <div>
                              <div className="font-medium">{tool.name}</div>
                              <div className="text-xs text-gray-500">{tool.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="stepName">Step Name</Label>
                    <Input
                      id="stepName"
                      placeholder="Enter step name"
                      value={newStep.name}
                      onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="stepInput">Input Template</Label>
                    <Textarea
                      id="stepInput"
                      placeholder="Enter input template (use {{initial_input}} or {{step1.output}})"
                      value={newStep.config?.input || ''}
                      onChange={(e) => setNewStep({ 
                        ...newStep, 
                        config: { ...newStep.config, input: e.target.value }
                      })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="waitForPrevious"
                      checked={newStep.waitForPrevious}
                      onCheckedChange={(checked) => setNewStep({ ...newStep, waitForPrevious: checked })}
                    />
                    <Label htmlFor="waitForPrevious">Wait for previous step</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="continueOnError"
                      checked={newStep.continueOnError}
                      onCheckedChange={(checked) => setNewStep({ ...newStep, continueOnError: checked })}
                    />
                    <Label htmlFor="continueOnError">Continue on error</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddStepDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStep}>
                    Add Step
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {workflow.steps.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">No Steps Yet</h3>
              <p className="text-gray-600 mb-6">
                Add your first step to start building your workflow
              </p>
              <Button onClick={() => setShowAddStepDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Step
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={index}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                            {step.order}
                          </div>
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{step.name}</h4>
                            <Badge variant="secondary">{step.toolId}</Badge>
                            {step.waitForPrevious && (
                              <Badge variant="outline" className="text-xs">Wait</Badge>
                            )}
                            {step.continueOnError && (
                              <Badge variant="outline" className="text-xs">Continue on Error</Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Input:</strong> {step.config.input || 'No input configured'}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Step name"
                              value={step.name}
                              onChange={(e) => handleUpdateStep(index, { name: e.target.value })}
                              className="text-sm"
                            />
                            <Textarea
                              placeholder="Input template"
                              value={step.config.input}
                              onChange={(e) => handleUpdateStep(index, { 
                                config: { ...step.config, input: e.target.value }
                              })}
                              className="text-sm min-h-[60px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStep(index, 'down')}
                          disabled={index === workflow.steps.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {index < workflow.steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Workflow Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workflowName">Name</Label>
                <Input
                  id="workflowName"
                  value={workflow.name}
                  onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="workflowDescription">Description</Label>
                <Textarea
                  id="workflowDescription"
                  value={workflow.description || ''}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="workflowStatus">Status</Label>
                <Select 
                  value={workflow.status} 
                  onValueChange={(value) => setWorkflow({ ...workflow, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Recent Runs */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Recent Runs</h3>
            {workflow.runs.length === 0 ? (
              <p className="text-gray-600 text-sm">No runs yet</p>
            ) : (
              <div className="space-y-2">
                {workflow.runs.slice(0, 5).map((run, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span>Run #{index + 1}</span>
                      <Badge variant="outline">{run.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Help */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Template Variables</h3>
            <div className="text-sm space-y-2">
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{initial_input}}'}</code>
                <p className="text-gray-600">Initial workflow input</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{step1.output}}'}</code>
                <p className="text-gray-600">Output from step 1</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{step2.field}}'}</code>
                <p className="text-gray-600">Specific field from step 2</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
