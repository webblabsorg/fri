'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, ChevronLeft, Upload, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  subscriptionTier: string
}

export default function SubmitTicketPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('medium')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (!data.user) {
        router.push('/signin?redirect=/support/submit-ticket')
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file size (max 10MB per file)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError('Files must be smaller than 10MB')
      return
    }

    // Max 5 files total
    if (attachments.length + files.length > 5) {
      setError('Maximum 5 files allowed')
      return
    }

    setAttachments([...attachments, ...files])
    setError('')
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!subject.trim() || !category || !message.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (message.length < 50) {
      setError('Please provide a more detailed description (at least 50 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload attachments if any (mock for now)
      let attachmentData: any[] = []
      if (attachments.length > 0) {
        // In production, upload to storage service
        attachmentData = attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: `mock://uploads/${file.name}`, // Mock URL for dev
        }))
      }

      // Create ticket
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          priority,
          message,
          attachments: attachmentData.length > 0 ? attachmentData : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit ticket')
      }

      const data = await response.json()
      
      // Redirect to ticket detail
      router.push(`/support/tickets/${data.ticket.id}`)
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      setError(error.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/support/my-tickets" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to My Tickets
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit a Support Ticket</h1>
          <p className="text-muted-foreground">
            We'll respond within 24 hours. For immediate help, check our{' '}
            <Link href="/help" className="text-primary hover:underline">Help Center</Link>.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help us assist you quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account & Login</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="tool_feedback">Tool Feedback</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                      <SelectItem value="high">High - Blocking my work</SelectItem>
                      <SelectItem value="urgent">Urgent - System down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue in detail. Include steps to reproduce if it's a bug."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} / 50 characters minimum
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">
                  Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files or click to browse
                  </p>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf,.txt,.docx,.csv"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('attachments')?.click()}
                  >
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max 10MB per file, up to 5 files
                  </p>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Info */}
              <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground mb-2">System Information (auto-captured)</p>
                <p>Plan: {user?.subscriptionTier}</p>
                <p>Browser: {navigator.userAgent.split(' ').slice(-1)[0]}</p>
                <p>OS: {navigator.platform}</p>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/support/my-tickets')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
