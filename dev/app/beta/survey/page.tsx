'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function BetaSurveyPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')
  
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Survey responses
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [satisfaction, setSatisfaction] = useState<string>('')
  const [favoriteFeature, setFavoriteFeature] = useState('')
  const [improvements, setImprovements] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'survey',
          category: 'beta_nps',
          subject: 'Beta Survey Response',
          message: JSON.stringify({
            userId,
            npsScore,
            satisfaction,
            favoriteFeature,
            improvements,
            wouldRecommend,
          }),
          rating: npsScore,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your feedback is incredibly valuable to us. We'll use it to make Frith AI even better.
              </p>
              <Button asChild>
                <a href="/dashboard">Return to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Beta Feedback Survey</h1>
          <p className="text-gray-600 mt-2">
            Help us improve Frith AI - this takes about 2 minutes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Experience</CardTitle>
            <CardDescription>
              We'd love to hear how your first week with Frith AI has been
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* NPS Score */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  How likely are you to recommend Frith AI to a colleague?
                </Label>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Not likely</span>
                  <span className="text-sm text-gray-500">Very likely</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNpsScore(score)}
                      className={`w-10 h-10 rounded-lg border-2 font-semibold transition-colors ${
                        npsScore === score
                          ? score >= 9
                            ? 'bg-green-500 border-green-500 text-white'
                            : score >= 7
                            ? 'bg-yellow-500 border-yellow-500 text-white'
                            : 'bg-red-500 border-red-500 text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overall Satisfaction */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  How satisfied are you with Frith AI overall?
                </Label>
                <RadioGroup value={satisfaction} onValueChange={setSatisfaction}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_satisfied" id="very_satisfied" />
                    <Label htmlFor="very_satisfied">Very Satisfied</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="satisfied" id="satisfied" />
                    <Label htmlFor="satisfied">Satisfied</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral">Neutral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dissatisfied" id="dissatisfied" />
                    <Label htmlFor="dissatisfied">Dissatisfied</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_dissatisfied" id="very_dissatisfied" />
                    <Label htmlFor="very_dissatisfied">Very Dissatisfied</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Favorite Feature */}
              <div className="space-y-3">
                <Label htmlFor="favorite" className="text-base font-semibold">
                  What's your favorite feature or tool so far?
                </Label>
                <Textarea
                  id="favorite"
                  value={favoriteFeature}
                  onChange={(e) => setFavoriteFeature(e.target.value)}
                  placeholder="Tell us what you love about Frith AI..."
                  rows={3}
                />
              </div>

              {/* Improvements */}
              <div className="space-y-3">
                <Label htmlFor="improvements" className="text-base font-semibold">
                  What could we improve?
                </Label>
                <Textarea
                  id="improvements"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Any bugs, missing features, or suggestions..."
                  rows={3}
                />
              </div>

              {/* Would Recommend */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Would you recommend Frith AI to other legal professionals?
                </Label>
                <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="definitely" id="definitely" />
                    <Label htmlFor="definitely">Definitely</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="probably" id="probably" />
                    <Label htmlFor="probably">Probably</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_sure" id="not_sure" />
                    <Label htmlFor="not_sure">Not Sure</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="probably_not" id="probably_not" />
                    <Label htmlFor="probably_not">Probably Not</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting || npsScore === null}
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
