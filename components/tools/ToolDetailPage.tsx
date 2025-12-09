'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ToolConfig } from '@/lib/tools/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface ToolDetailPageProps {
  tool: ToolConfig
  userTier: 'free' | 'starter' | 'pro' | 'advanced'
}

export function ToolDetailPage({ tool, userTier }: ToolDetailPageProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canUseTool = checkToolAccess(tool.requiredTier, userTier)
  const aiModel = tool.aiModel[userTier]

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRunTool = async () => {
    setIsRunning(true)
    setError(null)
    setOutput(null)

    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.slug,
          toolType: tool.category,
          context: formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Tool execution failed')
      }

      const data = await response.json()
      setOutput(data.content)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  if (!canUseTool) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Upgrade Required</h2>
          <p className="text-gray-600 mb-6">
            This tool requires a {capitalize(tool.requiredTier)} plan or higher.
          </p>
          <Button onClick={() => router.push('/pricing')}>
            View Pricing Plans
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{tool.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            <p className="text-gray-600">{tool.description}</p>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            {tool.category}
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">
            AI Model: {aiModel}
          </span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
            {tool.estimatedTime}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Input</h2>

            <div className="space-y-6">
              {tool.inputFields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.type === 'text' && (
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="mt-2"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="mt-2 w-full min-h-[150px] p-3 border rounded-md"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="mt-2 w-full p-2 border rounded-md"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.helpText && (
                    <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}

              <Button
                onClick={handleRunTool}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? 'Running Tool...' : `Run ${tool.name}`}
              </Button>
            </div>
          </Card>

          {/* Output */}
          {(output || error) && (
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Output</h2>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {output && (
                <div>
                  <div className="prose max-w-none p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {output}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      Export DOCX
                    </Button>
                    <Button variant="outline" size="sm">
                      Save to Project
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* About */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">About This Tool</h3>
            <p className="text-sm text-gray-600 mb-4">
              {tool.longDescription}
            </p>
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Complexity:</span>
                <span className="font-medium">{capitalize(tool.complexity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Time:</span>
                <span className="font-medium">{tool.estimatedTime}</span>
              </div>
            </div>
          </Card>

          {/* Sample Prompts */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Sample Prompts</h3>
            <ul className="space-y-2">
              {tool.samplePrompts.map((prompt, idx) => (
                <li key={idx} className="text-sm text-gray-600 border-l-2 border-blue-500 pl-3">
                  {prompt}
                </li>
              ))}
            </ul>
          </Card>

          {/* Use Cases */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Common Use Cases</h3>
            <ul className="space-y-2">
              {tool.useCases.map((useCase, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {useCase}
                </li>
              ))}
            </ul>
          </Card>

          {/* Related Tools */}
          {tool.relatedTools.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Related Tools</h3>
              <div className="space-y-2">
                {tool.relatedTools.map((toolSlug, idx) => (
                  <a
                    key={idx}
                    href={`/dashboard/tools/${toolSlug}`}
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    {formatToolName(toolSlug)} →
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function checkToolAccess(requiredTier: string, userTier: string): boolean {
  const tierOrder = ['free', 'starter', 'pro', 'advanced']
  const requiredIndex = tierOrder.indexOf(requiredTier)
  const userIndex = tierOrder.indexOf(userTier)
  return userIndex >= requiredIndex
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

function formatToolName(slug: string): string {
  return slug.split('-').map(capitalize).join(' ')
}
