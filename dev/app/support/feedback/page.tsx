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
import { AlertCircle, ChevronLeft, MessageSquare, CheckCircle2 } from 'lucide-react'

interface Feedback {
  id: string
  type: string
  subject: string
  message: string
  rating: number | null
  status: string
  createdAt: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([])

  // Form fields
  const [type, setType] = useState('general')
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)

  useEffect(() => {
    if (showHistory) {
      fetchFeedbackHistory()
    }
  }, [showHistory])

  const fetchFeedbackHistory = async () => {
    try {
      const response = await fetch('/api/support/feedback')
      if (response.ok) {
        const data = await response.json()
        setFeedbackHistory(data.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback history:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validation
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category: category || undefined,
          subject,
          message,
          rating,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      // Success
      setSuccessMessage('Thank you for your feedback! We appreciate your input.')
      
      // Reset form
      setType('general')
      setCategory('')
      setSubject('')
      setMessage('')
      setRating(null)
      
      // Refresh history if shown
      if (showHistory) {
        fetchFeedbackHistory()
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      setError(error.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            Give Feedback
          </h1>
          <p className="text-muted-foreground">
            Help us improve Frith AI by sharing your thoughts, suggestions, or reporting issues.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Share Your Feedback</CardTitle>
              <CardDescription>
                Your feedback helps us build better features and improve your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Feedback Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category (optional) */}
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  placeholder="e.g., Dashboard, Tools, Billing"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please provide details about your feedback, feature request, or issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              {/* Rating (optional) */}
              <div className="space-y-2">
                <Label>Overall Experience (Optional)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-colors ${
                        rating === value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  1 = Poor, 5 = Excellent
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* View History */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full"
          >
            {showHistory ? 'Hide' : 'View'} My Feedback History
          </Button>

          {showHistory && (
            <div className="mt-4 space-y-4">
              {feedbackHistory.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No feedback history found.
                  </CardContent>
                </Card>
              ) : (
                feedbackHistory.map((fb) => (
                  <Card key={fb.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {fb.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {fb.status}
                            </span>
                            {fb.rating && (
                              <span className="text-xs">⭐ {fb.rating}/5</span>
                            )}
                          </div>
                          <CardTitle className="text-base">{fb.subject}</CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            Submitted {new Date(fb.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {fb.message}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
