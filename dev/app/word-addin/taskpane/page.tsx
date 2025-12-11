'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, FileText, Download, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ToolConfig {
  id: string
  name: string
  description: string
  category: string
}

// Mock tools for the demo - in real implementation, fetch from API
const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: 'legal-email-drafter',
    name: 'Legal Email Drafter',
    description: 'Draft professional legal emails',
    category: 'Communication'
  },
  {
    id: 'contract-analyzer',
    name: 'Contract Analyzer',
    description: 'Analyze contracts for key terms and risks',
    category: 'Analysis'
  },
  {
    id: 'legal-research',
    name: 'Legal Research Assistant',
    description: 'Research legal topics and precedents',
    category: 'Research'
  }
]

export default function WordAddinTaskPane() {
  const [isOfficeReady, setIsOfficeReady] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedTool, setSelectedTool] = useState('')
  const [additionalInput, setAdditionalInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Initialize Office.js
    if (typeof window !== 'undefined' && (window as any).Office) {
      (window as any).Office.onReady((info: any) => {
        if (info.host === (window as any).Office.HostType.Word) {
          setIsOfficeReady(true)
        }
      })
    } else {
      // For development/testing outside of Word
      if (process.env.NODE_ENV !== 'production') {
        setIsOfficeReady(true)
      }
    }
  }, [])

  const getSelectedText = async () => {
    if (!isOfficeReady) {
      toast.error('Office.js not ready')
      return
    }

    try {
      if (typeof window !== 'undefined' && (window as any).Word) {
        await (window as any).Word.run(async (context: any) => {
          const selection = context.document.getSelection()
          selection.load('text')
          await context.sync()
          
          const text = selection.text.trim()
          if (text) {
            setSelectedText(text)
            toast.success('Text captured from selection')
          } else {
            toast.error('No text selected in document')
          }
        })
      } else if (process.env.NODE_ENV !== 'production') {
        // Fallback for development
        setSelectedText('Sample selected text from Word document')
        toast.success('Text captured (demo mode)')
      } else {
        toast.error('Word host is not available in this environment')
      }
    } catch (error) {
      console.error('Error getting selected text:', error)
      toast.error('Failed to get selected text')
    }
  }

  const runTool = async () => {
    if (!selectedTool) {
      toast.error('Please select a tool')
      return
    }

    if (!selectedText && !additionalInput) {
      toast.error('Please select text or provide input')
      return
    }

    setIsRunning(true)
    setError('')
    setOutput('')

    try {
      // In a real implementation, this would call your API
      const response = await fetch('/api/tools/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: selectedTool,
          input: selectedText || additionalInput,
          additionalContext: additionalInput && selectedText ? additionalInput : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOutput(data.output)
        toast.success('Tool executed successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to run tool')
        toast.error('Tool execution failed')
      }
    } catch (error) {
      console.error('Error running tool:', error)
      if (process.env.NODE_ENV !== 'production') {
        // For demo purposes, show mock output
        setOutput(`Mock output from ${AVAILABLE_TOOLS.find(t => t.id === selectedTool)?.name}:\n\nThis is a sample AI-generated response based on your input. In a real implementation, this would be the actual output from the selected tool processing your text.`)
        toast.success('Tool executed (demo mode)')
      } else {
        setError('Failed to run tool. Please try again or contact support.')
        toast.error('Tool execution failed')
      }
    } finally {
      setIsRunning(false)
    }
  }

  const insertIntoDocument = async () => {
    if (!output) {
      toast.error('No output to insert')
      return
    }

    try {
      if (typeof window !== 'undefined' && (window as any).Word) {
        await (window as any).Word.run(async (context: any) => {
          const selection = context.document.getSelection()
          selection.insertText(output, (window as any).Word.InsertLocation.after)
          await context.sync()
          toast.success('Output inserted into document')
        })
      } else if (process.env.NODE_ENV !== 'production') {
        // Fallback for development
        navigator.clipboard.writeText(output)
        toast.success('Output copied to clipboard (demo mode)')
      } else {
        toast.error('Word host is not available in this environment')
      }
    } catch (error) {
      console.error('Error inserting text:', error)
      toast.error('Failed to insert text into document')
    }
  }

  const copyToClipboard = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      toast.success('Output copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  if (!isOfficeReady) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading Frith AI...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">Frith AI</h1>
        <p className="text-sm text-gray-600">AI-powered legal document assistant</p>
      </div>

      {/* Input Section */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Input</h2>
        
        <div className="space-y-3">
          <Button 
            onClick={getSelectedText} 
            variant="outline" 
            className="w-full"
            disabled={isRunning}
          >
            <FileText className="w-4 h-4 mr-2" />
            Get Selected Text
          </Button>

          {selectedText && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-1">Selected Text:</p>
              <p className="text-sm">{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
            <Textarea
              placeholder="Provide additional context or instructions..."
              value={additionalInput}
              onChange={(e) => setAdditionalInput(e.target.value)}
              className="min-h-20"
              disabled={isRunning}
            />
          </div>
        </div>
      </Card>

      {/* Tool Selection */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Select Tool</h2>
        
        <Select value={selectedTool} onValueChange={setSelectedTool} disabled={isRunning}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an AI tool..." />
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

        {selectedTool && (
          <div className="mt-3">
            <Badge variant="secondary">
              {AVAILABLE_TOOLS.find(t => t.id === selectedTool)?.category}
            </Badge>
          </div>
        )}
      </Card>

      {/* Run Tool */}
      <Button 
        onClick={runTool} 
        className="w-full" 
        disabled={isRunning || !selectedTool}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Run Tool
          </>
        )}
      </Button>

      {/* Output Section */}
      {(output || error) && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Output</h2>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {output && (
            <>
              <div className="p-3 bg-gray-50 rounded-md mb-3 max-h-60 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{output}</pre>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={insertIntoDocument} 
                  size="sm" 
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Insert
                </Button>
                <Button 
                  onClick={copyToClipboard} 
                  variant="outline" 
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>Frith AI Word Add-in v1.0</p>
        <p>Need help? Visit our <a href="#" className="text-blue-600 hover:underline">support page</a></p>
      </div>
    </div>
  )
}
