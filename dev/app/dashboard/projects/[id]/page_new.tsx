'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Download, Trash2, Eye, Calendar, User, FileIcon, MoreVertical } from 'lucide-react'
import CollaborationPanel from '@/components/collaboration/CollaborationPanel'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

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

interface ProjectDocument {
  id: string
  name: string
  description: string | null
  originalFileName: string
  mimeType: string
  sizeBytes: number
  status: string
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  versions?: {
    versionNumber: number
    createdAt: string
  }[]
  _count?: {
    versions: number
  }
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
  const { currentWorkspace } = useOrganization()
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '' })
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [uploadingFile, setUploadingFile] = useState(false)

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

  const fetchDocuments = async () => {
    if (!projectId) return
    
    setDocumentsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectId) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Document uploaded successfully')
        await fetchDocuments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploadingFile(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Document deleted successfully')
        await fetchDocuments()
      } else {
        toast.error('Failed to delete document')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('text')) return '📃'
    return '📁'
  }

  // Fetch documents when tab changes to documents
  useEffect(() => {
    if (activeTab === 'documents' && projectId) {
      fetchDocuments()
    }
  }, [activeTab, projectId])

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
                <Button variant="outline" onClick={() => setShowCollaboration(!showCollaboration)}>
                  {showCollaboration ? 'Hide' : 'Show'} Collaboration
                </Button>
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
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1"
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
                  <option value="on_hold">On Hold</option>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tool-runs">Tool Runs</TabsTrigger>
          <TabsTrigger value="comments">Notes & Comments</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <div className={`mt-6 ${showCollaboration ? 'grid grid-cols-3 gap-6' : ''}`}>
          <div className={showCollaboration ? 'col-span-2' : ''}>
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Privacy:</span>
                      <span className="ml-2">{project.privacy}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="ml-2">{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Tool Runs:</span>
                      <span className="ml-2">{project.totalRuns}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <p className="text-gray-600">Recent project activity will appear here.</p>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <Button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : 'Upload Document'}
                    </Button>
                  </div>
                </div>

                {documentsLoading ? (
                  <div className="text-center py-8">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Upload documents to share and collaborate on with your team
                    </p>
                    <Button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First Document
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{getFileIcon(doc.mimeType)}</div>
                            <div>
                              <h4 className="font-medium">{doc.name}</h4>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                <span>{formatFileSize(doc.sizeBytes)}</span>
                                <span>{doc._count?.versions || 0} versions</span>
                                <span>by {doc.creator.name}</span>
                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
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
            </TabsContent>

            {/* Tool Runs Tab */}
            <TabsContent value="tool-runs">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tool Runs</h3>
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
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Notes & Comments</h3>
                <p className="text-gray-600">Project comments and notes will appear here.</p>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tasks</h3>
                <p className="text-gray-600">Project tasks and to-dos will appear here.</p>
              </Card>
            </TabsContent>
          </div>

          {/* Collaboration Panel */}
          {showCollaboration && currentWorkspace && (
            <div className="col-span-1">
              <CollaborationPanel
                targetType="project"
                targetId={projectId}
                workspaceId={currentWorkspace.id}
              />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
