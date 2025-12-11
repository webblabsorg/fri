'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Clock, Play, Pause, Trash2, Mail, Calendar } from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface ScheduledJob {
  id: string
  name: string
  description: string | null
  type: string
  toolId?: string
  workflowId?: string
  frequency?: string
  cronExpression?: string
  timezone: string
  enabled: boolean
  nextRunAt: string
  lastRunAt?: string
  lastStatus?: string
  emailResults: boolean
  emailTo: string[]
}

// Mock available tools and workflows
const AVAILABLE_TOOLS = [
  { id: 'legal-email-drafter', name: 'Legal Email Drafter' },
  { id: 'contract-analyzer', name: 'Contract Analyzer' },
  { id: 'legal-research', name: 'Legal Research Assistant' },
]

const AVAILABLE_WORKFLOWS = [
  { id: 'workflow-1', name: 'Contract Review Workflow' },
  { id: 'workflow-2', name: 'Email Response Workflow' },
]

export default function SchedulesPage() {
  const router = useRouter()
  const { currentWorkspace, currentOrganization } = useOrganization()
  const [schedules, setSchedules] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    type: 'tool',
    toolId: '',
    workflowId: '',
    frequency: 'daily',
    cronExpression: '',
    timezone: 'UTC',
    config: { input: '' },
    emailResults: false,
    emailTo: '',
  })

  useEffect(() => {
    fetchSchedules()
  }, [currentWorkspace, currentOrganization])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentWorkspace?.id) {
        params.set('workspaceId', currentWorkspace.id)
      }
      if (currentOrganization?.id) {
        params.set('organizationId', currentOrganization.id)
      }

      const response = await fetch(`/api/schedules?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!newSchedule.name.trim()) {
      toast.error('Schedule name is required')
      return
    }

    if (newSchedule.type === 'tool' && !newSchedule.toolId) {
      toast.error('Please select a tool')
      return
    }

    if (newSchedule.type === 'workflow' && !newSchedule.workflowId) {
      toast.error('Please select a workflow')
      return
    }

    try {
      const emailToArray = newSchedule.emailTo
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSchedule.name,
          description: newSchedule.description || null,
          type: newSchedule.type,
          toolId: newSchedule.type === 'tool' ? newSchedule.toolId : null,
          workflowId: newSchedule.type === 'workflow' ? newSchedule.workflowId : null,
          frequency: newSchedule.frequency,
          cronExpression: newSchedule.cronExpression || null,
          timezone: newSchedule.timezone,
          config: newSchedule.config,
          emailResults: newSchedule.emailResults,
          emailTo: emailToArray,
          workspaceId: currentWorkspace?.id,
          organizationId: currentOrganization?.id,
        }),
      })

      if (response.ok) {
        toast.success('Schedule created successfully')
        setShowCreateDialog(false)
        setNewSchedule({
          name: '',
          description: '',
          type: 'tool',
          toolId: '',
          workflowId: '',
          frequency: 'daily',
          cronExpression: '',
          timezone: 'UTC',
          config: { input: '' },
          emailResults: false,
          emailTo: '',
        })
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Failed to create schedule:', error)
      toast.error('Failed to create schedule')
    }
  }

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      })

      if (response.ok) {
        toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'}`)
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update schedule')
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      toast.error('Failed to update schedule')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string, scheduleName: string) => {
    if (!confirm(`Are you sure you want to delete "${scheduleName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Schedule deleted successfully')
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete schedule')
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatNextRun = (nextRunAt: string) => {
    const date = new Date(nextRunAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else if (diffMs > 0) {
      return 'soon'
    } else {
      return 'overdue'
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading schedules...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Jobs</h1>
          <p className="text-gray-600 mt-2">
            Automate your workflows with scheduled tool and workflow executions
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Scheduled Job</DialogTitle>
              <DialogDescription>
                Schedule a tool or workflow to run automatically
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter job name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newSchedule.type} onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this job does"
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                />
              </div>

              {newSchedule.type === 'tool' && (
                <div>
                  <Label htmlFor="tool">Tool</Label>
                  <Select value={newSchedule.toolId} onValueChange={(value) => setNewSchedule({ ...newSchedule, toolId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tool" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TOOLS.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newSchedule.type === 'workflow' && (
                <div>
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select value={newSchedule.workflowId} onValueChange={(value) => setNewSchedule({ ...newSchedule, workflowId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_WORKFLOWS.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={newSchedule.timezone} onValueChange={(value) => setNewSchedule({ ...newSchedule, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="input">Input (Optional)</Label>
                <Textarea
                  id="input"
                  placeholder="Input for the tool or workflow"
                  value={newSchedule.config.input}
                  onChange={(e) => setNewSchedule({ 
                    ...newSchedule, 
                    config: { ...newSchedule.config, input: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailResults"
                    checked={newSchedule.emailResults}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, emailResults: checked })}
                  />
                  <Label htmlFor="emailResults">Email results</Label>
                </div>

                {newSchedule.emailResults && (
                  <div>
                    <Label htmlFor="emailTo">Email addresses (comma-separated)</Label>
                    <Input
                      id="emailTo"
                      placeholder="user@example.com, admin@example.com"
                      value={newSchedule.emailTo}
                      onChange={(e) => setNewSchedule({ ...newSchedule, emailTo: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h3 className="text-xl font-semibold mb-2">No Scheduled Jobs</h3>
          <p className="text-gray-600 mb-6">
            Create your first scheduled job to automate tool and workflow executions
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Schedule
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{schedule.name}</h3>
                    <Badge variant="secondary">{schedule.type}</Badge>
                    {schedule.lastStatus && (
                      <Badge className={getStatusColor(schedule.lastStatus)}>
                        {schedule.lastStatus}
                      </Badge>
                    )}
                    {schedule.emailResults && (
                      <Badge variant="outline">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Badge>
                    )}
                  </div>

                  {schedule.description && (
                    <p className="text-gray-600 mb-3">{schedule.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{schedule.frequency || 'Custom'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Next run: {formatNextRun(schedule.nextRunAt)}</span>
                    </div>
                    {schedule.lastRunAt && (
                      <span>Last run: {new Date(schedule.lastRunAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
