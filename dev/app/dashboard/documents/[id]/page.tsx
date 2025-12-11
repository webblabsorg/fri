'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Download, Eye, FileText, Calendar, User, GitBranch } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentVersion {
  id: string
  versionNumber: number
  storageKey: string
  mimeType: string
  sizeBytes: number
  changelog: string | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
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
  project: {
    id: string
    name: string
  }
  creator: {
    id: string
    name: string
    email: string
  }
  versions: DocumentVersion[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DocumentViewerPage({ params }: PageProps) {
  const router = useRouter()
  const [documentId, setDocumentId] = useState<string>('')
  const [document, setDocument] = useState<ProjectDocument | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [documentContent, setDocumentContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    params.then(p => {
      setDocumentId(p.id)
      fetchDocument(p.id)
    })
  }, [params])

  const fetchDocument = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
        // Set the latest version as default
        if (data.document.versions.length > 0) {
          const latestVersion = data.document.versions[0].versionNumber
          setSelectedVersion(latestVersion)
          await fetchDocumentContent(data.document.versions[0])
        }
      } else if (response.status === 404) {
        toast.error('Document not found')
        router.back()
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
      toast.error('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentContent = async (version: DocumentVersion) => {
    setContentLoading(true)
    try {
      // For now, we'll just show metadata. In a real implementation,
      // you would fetch the actual file content from storage and process it
      if (version.mimeType === 'application/pdf') {
        setDocumentContent('PDF viewer would be rendered here using PDF.js')
      } else if (version.mimeType.includes('word') || version.mimeType.includes('document')) {
        setDocumentContent('Word document viewer would be rendered here using Mammoth.js')
      } else if (version.mimeType.includes('text')) {
        setDocumentContent('Text content would be displayed here')
      } else {
        setDocumentContent('Preview not available for this file type')
      }
    } catch (error) {
      console.error('Failed to fetch document content:', error)
      setDocumentContent('Error loading document content')
    } finally {
      setContentLoading(false)
    }
  }

  const handleVersionChange = async (versionNumber: string) => {
    const version = document?.versions.find(v => v.versionNumber === parseInt(versionNumber))
    if (version) {
      setSelectedVersion(parseInt(versionNumber))
      await fetchDocumentContent(version)
    }
  }

  const handleDownload = async () => {
    if (!document || !selectedVersion) return

    const version = document.versions.find(v => v.versionNumber === selectedVersion)
    if (!version) return

    try {
      // In a real implementation, you would create a signed URL for download
      toast.success('Download started')
    } catch (error) {
      console.error('Failed to download document:', error)
      toast.error('Failed to download document')
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

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading document...</div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container py-12">
        <div className="text-center">Document not found</div>
      </div>
    )
  }

  const currentVersion = document.versions.find(v => v.versionNumber === selectedVersion)

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href={`/dashboard/projects/${document.project.id}`} className="hover:text-blue-600">
            {document.project.name}
          </Link>
          <span>/</span>
          <span>Documents</span>
          <span>/</span>
          <span>{document.name}</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{getFileIcon(document.mimeType)}</div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{document.name}</h1>
              {document.description && (
                <p className="text-gray-600 mb-2">{document.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {document.creator.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
                <span>{formatFileSize(document.sizeBytes)}</span>
                <Badge variant="secondary">
                  {document.versions.length} version{document.versions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Version Selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="text-sm font-medium">Version:</span>
          </div>
          <Select value={selectedVersion?.toString()} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {document.versions.map((version) => (
                <SelectItem key={version.id} value={version.versionNumber.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>v{version.versionNumber}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentVersion && currentVersion.changelog && (
            <div className="text-sm text-gray-600">
              <strong>Changes:</strong> {currentVersion.changelog}
            </div>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Document Preview</h2>
            </div>
            
            {contentLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading document content...</div>
              </div>
            ) : (
              <div className="min-h-96 border rounded-lg p-6 bg-gray-50">
                {document.mimeType === 'application/pdf' ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-semibold mb-2">PDF Viewer</h3>
                    <p className="text-gray-600 mb-4">
                      PDF.js integration would render the PDF here
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      Download to View
                    </Button>
                  </div>
                ) : document.mimeType.includes('word') || document.mimeType.includes('document') ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold mb-2">Word Document</h3>
                    <p className="text-gray-600 mb-4">
                      Mammoth.js integration would render the document here
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      Download to View
                    </Button>
                  </div>
                ) : document.mimeType.includes('text') ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📃</div>
                    <h3 className="text-lg font-semibold mb-2">Text Document</h3>
                    <p className="text-gray-600 mb-4">
                      Text content would be displayed here
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      Download to View
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                    <p className="text-gray-600 mb-4">
                      This file type cannot be previewed in the browser
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Version History */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Version History</h3>
              <div className="space-y-3">
                {document.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      selectedVersion === version.versionNumber ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleVersionChange(version.versionNumber.toString())}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">v{version.versionNumber}</span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(version.sizeBytes)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>by {version.creator.name}</div>
                      <div>{new Date(version.createdAt).toLocaleDateString()}</div>
                      {version.changelog && (
                        <div className="mt-1 text-gray-500">{version.changelog}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Document Info */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Document Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Original Name:</span>
                  <div className="font-medium">{document.originalFileName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className="font-medium">{document.mimeType}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary">{document.status}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Created By:</span>
                  <div className="font-medium">{document.creator.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <div className="font-medium">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Current Version
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Compare Versions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
