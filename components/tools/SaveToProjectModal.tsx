'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Project {
  id: string
  name: string
  description?: string
}

interface SaveToProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (projectId: string) => Promise<void>
  toolRunId?: string
}

export function SaveToProjectModal({ isOpen, onClose, onSave }: SaveToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      })

      if (response.ok) {
        const newProject = await response.json()
        await onSave(newProject.id)
        onClose()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveToExisting = async () => {
    if (!selectedProjectId) return

    setIsSaving(true)
    try {
      await onSave(selectedProjectId)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to save to project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedProjectId('')
    setIsCreatingNew(false)
    setNewProjectName('')
    setNewProjectDescription('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">Save to Project</h2>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading projects...</div>
        ) : (
          <>
            {!isCreatingNew ? (
              <>
                {/* Select Existing Project */}
                <div className="mb-6">
                  <Label htmlFor="project-select">Select Project</Label>
                  <select
                    id="project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="mt-2 w-full p-2 border rounded-md"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSaveToExisting}
                    disabled={!selectedProjectId || isSaving}
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save to Selected Project'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full"
                  >
                    Create New Project
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Create New Project */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-description">Description (Optional)</Label>
                    <textarea
                      id="project-description"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Enter project description"
                      className="mt-2 w-full min-h-[80px] p-3 border rounded-md"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || isSaving}
                    className="w-full"
                  >
                    {isSaving ? 'Creating...' : 'Create and Save'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingNew(false)}
                    className="w-full"
                  >
                    Back to Projects
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        <Button variant="ghost" onClick={onClose} className="w-full mt-4">
          Cancel
        </Button>
      </div>
    </div>
  )
}
