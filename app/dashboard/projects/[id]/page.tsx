'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ToolRun {
  id: string
  toolId: string
  inputText: string
  outputText: string | null
  status: string
  aiModelUsed: string
  tokensUsed: number | null
  cost: number | null
  createdAt: string
  completedAt: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  privacy: string
  createdAt: string
  updatedAt: string
  totalRuns: number
  runs: ToolRun[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '' })
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    params.then(p => {
      setProjectId(p.id)
      fetchProject(p.id)
    })
  }, [params])

  const fetchProject = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setEditForm({
          name: data.project.name,
          description: data.project.description || '',
          status: data.project.status,
        })
      } else if (response.status === 404) {
        router.push('/dashboard/projects')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        await fetchProject(projectId)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDelete = async () => {
    if (!projectId || !confirm('Are you sure you want to archive this project?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/projects')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const filteredRuns = project?.runs.filter(run => {
    if (filterStatus === 'all') return true
    return run.status === filterStatus
  }) || []

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-12">
        <div className="text-center">Project not found</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/dashboard/projects" className="hover:text-blue-600">Projects</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>

        {!isEditing ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600">{project.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  Archive
                </Button>
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <span className={`px-3 py-1 rounded-full ${getStatusBadgeColor(project.status)}`}>
                {project.status}
              </span>
              <span className="text-gray-600">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="text-gray-600">
                {project.totalRuns} tool runs
              </span>
            </div>
          </>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdate}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tool Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Tool Runs</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Runs ({project.runs.length})</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        {filteredRuns.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">No Tool Runs Yet</h3>
            <p className="text-gray-600 mb-6">
              Tool runs saved to this project will appear here
            </p>
            <Button onClick={() => router.push('/dashboard/tools')}>
              Browse Tools
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRuns.map((run) => (
              <Card key={run.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Tool Run</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(run.status)}`}>
                        {run.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {run.aiModelUsed}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Input:</strong> {run.inputText.substring(0, 200)}
                      {run.inputText.length > 200 && '...'}
                    </div>

                    {run.outputText && (
                      <div className="text-sm text-gray-600">
                        <strong>Output:</strong> {run.outputText.substring(0, 200)}
                        {run.outputText.length > 200 && '...'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex gap-4">
                    {run.tokensUsed && <span>{run.tokensUsed.toLocaleString()} tokens</span>}
                    {run.cost && <span>${run.cost.toFixed(4)}</span>}
                  </div>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
