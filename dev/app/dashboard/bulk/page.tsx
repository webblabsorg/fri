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
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Upload, Download, FileArchive, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface BulkJob {
  id: string
  name: string
  toolId: string
  status: string
  totalFiles: number
  processedFiles: number
  successfulFiles: number
  failedFiles: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  errorMsg?: string
  files: Array<{
    id: string
    fileName: string
    status: string
    errorMsg?: string
  }>
}

// Mock available tools
const AVAILABLE_TOOLS = [
  { id: 'legal-email-drafter', name: 'Legal Email Drafter', description: 'Draft professional legal emails' },
  { id: 'contract-analyzer', name: 'Contract Analyzer', description: 'Analyze contracts for key terms' },
  { id: 'document-summarizer', name: 'Document Summarizer', description: 'Summarize documents' },
  { id: 'legal-research', name: 'Legal Research Assistant', description: 'Research legal topics' },
]

export default function BulkProcessingPage() {
  const router = useRouter()
  const { currentWorkspace, currentOrganization } = useOrganization()
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    toolId: '',
    config: { input: '' },
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBulkJobs()
    
    // Refresh jobs every 10 seconds to show progress updates
    const interval = setInterval(fetchBulkJobs, 10000)
    return () => clearInterval(interval)
  }, [currentWorkspace, currentOrganization])

  const fetchBulkJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentWorkspace?.id) {
        params.set('workspaceId', currentWorkspace.id)
      }
      if (currentOrganization?.id) {
        params.set('organizationId', currentOrganization.id)
      }

      const response = await fetch(`/api/bulk?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBulkJobs(data.bulkJobs)
      }
    } catch (error) {
      console.error('Failed to fetch bulk jobs:', error)
      toast.error('Failed to load bulk jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
        toast.error('Please select a ZIP file')
        return
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('File size must be less than 100MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleCreateJob = async () => {
    if (!newJob.name.trim()) {
      toast.error('Job name is required')
      return
    }

    if (!newJob.toolId) {
      toast.error('Please select a tool')
      return
    }

    if (!selectedFile) {
      toast.error('Please select a ZIP file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('zipFile', selectedFile)
      formData.append('name', newJob.name)
      formData.append('toolId', newJob.toolId)
      formData.append('config', JSON.stringify(newJob.config))
      if (currentWorkspace?.id) {
        formData.append('workspaceId', currentWorkspace.id)
      }
      if (currentOrganization?.id) {
        formData.append('organizationId', currentOrganization.id)
      }

      const response = await fetch('/api/bulk', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Bulk job created successfully')
        setShowCreateDialog(false)
        setNewJob({
          name: '',
          description: '',
          toolId: '',
          config: { input: '' },
        })
        setSelectedFile(null)
        await fetchBulkJobs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create bulk job')
      }
    } catch (error) {
      console.error('Failed to create bulk job:', error)
      toast.error('Failed to create bulk job')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadResults = async (jobId: string, jobName: string) => {
    try {
      const response = await fetch(`/api/bulk/${jobId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${jobName}-results.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Download started')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to download results')
      }
    } catch (error) {
      console.error('Failed to download results:', error)
      toast.error('Failed to download results')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const calculateProgress = (job: BulkJob) => {
    if (job.totalFiles === 0) return 0
    return Math.round((job.processedFiles / job.totalFiles) * 100)
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading bulk jobs...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bulk Processing</h1>
          <p className="text-gray-600 mt-2">
            Process multiple files at once by uploading ZIP archives
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bulk Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bulk Processing Job</DialogTitle>
              <DialogDescription>
                Upload a ZIP file containing multiple documents to process with an AI tool
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="jobName">Job Name</Label>
                <Input
                  id="jobName"
                  placeholder="Enter job name"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="tool">Tool</Label>
                <Select value={newJob.toolId} onValueChange={(value) => setNewJob({ ...newJob, toolId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tool to apply to all files" />
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
                <Label htmlFor="zipFile">ZIP File</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="zipFile"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('zipFile')?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFile ? selectedFile.name : 'Select ZIP File'}
                  </Button>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="config">Tool Configuration (Optional)</Label>
                <Textarea
                  id="config"
                  placeholder="Additional instructions or configuration for the tool"
                  value={newJob.config.input}
                  onChange={(e) => setNewJob({ 
                    ...newJob, 
                    config: { ...newJob.config, input: e.target.value }
                  })}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Upload a ZIP file containing text documents</li>
                  <li>2. Select an AI tool to apply to each file</li>
                  <li>3. The system extracts and processes each file individually</li>
                  <li>4. Download a ZIP with all the results when complete</li>
                </ol>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateJob} disabled={uploading}>
                {uploading ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Jobs List */}
      {bulkJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">No Bulk Jobs Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first bulk processing job to handle multiple files at once
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Job
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {bulkJobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{job.name}</h3>
                    <Badge className={getStatusColor(job.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status}
                      </div>
                    </Badge>
                    <Badge variant="outline">{job.toolId}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Total Files:</span>
                      <div className="text-lg font-semibold text-gray-900">{job.totalFiles}</div>
                    </div>
                    <div>
                      <span className="font-medium">Processed:</span>
                      <div className="text-lg font-semibold text-blue-600">{job.processedFiles}</div>
                    </div>
                    <div>
                      <span className="font-medium">Successful:</span>
                      <div className="text-lg font-semibold text-green-600">{job.successfulFiles}</div>
                    </div>
                    <div>
                      <span className="font-medium">Failed:</span>
                      <div className="text-lg font-semibold text-red-600">{job.failedFiles}</div>
                    </div>
                  </div>

                  {(job.status === 'processing' || job.status === 'completed') && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(job)}%</span>
                      </div>
                      <Progress value={calculateProgress(job)} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                    {job.startedAt && (
                      <span>Started: {new Date(job.startedAt).toLocaleDateString()}</span>
                    )}
                    {job.completedAt && (
                      <span>Completed: {new Date(job.completedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {job.errorMsg && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{job.errorMsg}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {job.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResults(job.id, job.name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/bulk/${job.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {/* File Status Summary */}
              {job.files.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">File Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {job.files.slice(0, 6).map((file) => (
                      <div key={file.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          file.status === 'completed' ? 'bg-green-500' :
                          file.status === 'failed' ? 'bg-red-500' :
                          file.status === 'processing' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="truncate">{file.fileName}</span>
                      </div>
                    ))}
                    {job.files.length > 6 && (
                      <div className="text-sm text-gray-500">
                        +{job.files.length - 6} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
