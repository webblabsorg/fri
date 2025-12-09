'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SaveAsTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string, category: string) => Promise<void>
  toolId: string
}

const CATEGORIES = [
  'Contracts',
  'Litigation',
  'Corporate',
  'Employment',
  'Real Estate',
  'Intellectual Property',
  'Family Law',
  'Criminal',
  'Estate Planning',
  'General',
]

export function SaveAsTemplateModal({
  isOpen,
  onClose,
  onSave,
  toolId,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave(name.trim(), description.trim(), category)
      
      // Reset and close
      setName('')
      setDescription('')
      setCategory('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Save as Template</h2>
        <p className="text-gray-600 mb-6">
          Save your current inputs as a reusable template
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div>
            <Label htmlFor="template-name" className="block text-sm font-medium mb-2">
              Template Name *
            </Label>
            <Input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Employment Contract"
              className="w-full"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="template-description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </Label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this template..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="template-category" className="block text-sm font-medium mb-2">
              Category (Optional)
            </Label>
            <select
              id="template-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
