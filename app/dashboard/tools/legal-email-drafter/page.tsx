'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LegalEmailDrafterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    purpose: '',
    recipient: '',
    tone: 'professional',
    keyPoints: '',
    context: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'EMAIL_DRAFTER',
          toolId: 'legal-email-drafter', // This should match a tool slug in DB
          context: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email')
      }

      setResult(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    alert('Email copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/tools')}
            className="mb-4"
          >
            ← Back to Tools
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Legal Email Drafter</h1>
          <p className="text-gray-600 mt-2">
            Generate professional legal emails powered by AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
              <CardDescription>
                Fill in the details and we will draft a professional email for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    placeholder="e.g., Request for contract review"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    placeholder="e.g., Client, Opposing Counsel, Judge"
                    value={formData.recipient}
                    onChange={(e) =>
                      setFormData({ ...formData, recipient: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) =>
                      setFormData({ ...formData, tone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="professional">Professional</option>
                    <option value="formal">Formal</option>
                    <option value="friendly">Friendly</option>
                    <option value="assertive">Assertive</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="keyPoints">Key Points</Label>
                  <textarea
                    id="keyPoints"
                    placeholder="List the main points to include in the email"
                    value={formData.keyPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, keyPoints: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="context">Additional Context</Label>
                  <textarea
                    id="context"
                    placeholder="Any additional background or context"
                    value={formData.context}
                    onChange={(e) =>
                      setFormData({ ...formData, context: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Generating...' : 'Generate Email'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Email</CardTitle>
              <CardDescription>
                Your AI-generated legal email will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px] whitespace-pre-wrap">
                    {result}
                  </div>
                  <Button onClick={handleCopy} variant="outline" className="w-full">
                    📋 Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  <div className="text-6xl mb-4">✉️</div>
                  <p>Fill in the form and click Generate to see your email</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Be specific about the purpose and desired outcome</li>
              <li>Include all relevant facts and context</li>
              <li>Choose the appropriate tone for your recipient</li>
              <li>List key points in order of importance</li>
              <li>Review and customize the generated email before sending</li>
              <li>Always add case-specific details and verify accuracy</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
