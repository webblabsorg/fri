'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const ROLES = [
  { id: 'solo', name: 'Solo Practitioner', icon: '👤', description: 'Individual attorney or small practice' },
  { id: 'associate', name: 'Associate', icon: '⚖️', description: 'Associate at a law firm' },
  { id: 'partner', name: 'Partner', icon: '🏛️', description: 'Partner or senior attorney' },
  { id: 'in-house', name: 'In-House Counsel', icon: '🏢', description: 'Corporate legal department' },
  { id: 'student', name: 'Law Student', icon: '🎓', description: 'Currently in law school' },
  { id: 'paralegal', name: 'Paralegal', icon: '📋', description: 'Legal support professional' },
  { id: 'other', name: 'Other', icon: '✨', description: 'Other legal professional' },
]

const PRACTICE_AREAS = [
  { id: 'litigation', name: 'Litigation', icon: '⚔️' },
  { id: 'corporate', name: 'Corporate Law', icon: '🏢' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { id: 'employment', name: 'Employment Law', icon: '👔' },
  { id: 'intellectual-property', name: 'Intellectual Property', icon: '💡' },
  { id: 'family', name: 'Family Law', icon: '👨‍👩‍👧‍👦' },
  { id: 'criminal', name: 'Criminal Law', icon: '🔨' },
  { id: 'estate-planning', name: 'Estate Planning', icon: '📜' },
  { id: 'tax', name: 'Tax Law', icon: '💰' },
  { id: 'immigration', name: 'Immigration', icon: '✈️' },
  { id: 'contracts', name: 'Contract Law', icon: '📄' },
  { id: 'general', name: 'General Practice', icon: '⚖️' },
]

interface OnboardingWizardProps {
  userName?: string
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedPracticeAreas, setSelectedPracticeAreas] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 4

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
  }

  const togglePracticeArea = (areaId: string) => {
    setSelectedPracticeAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSkip = async () => {
    // Mark onboarding as completed without saving preferences
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError('Failed to skip onboarding')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          practiceAreas: selectedPracticeAreas,
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to complete onboarding')
      }
    } catch (err) {
      setError('An error occurred while saving your preferences')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Frith{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let's get you set up with the perfect AI tools for your legal practice.
              This will only take a minute.
            </p>
            <div className="pt-6">
              <Button onClick={handleNext} size="lg" className="px-8">
                Let's Get Started →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What best describes your role?
              </h2>
              <p className="text-gray-600">
                This helps us recommend the most relevant tools for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-6 rounded-lg border-2 text-left transition-all hover:border-blue-500 hover:shadow-md ${
                    selectedRole === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{role.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {role.name}
                      </h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    {selectedRole === role.id && (
                      <span className="text-blue-600 text-xl">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedRole}
                className="flex-1"
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What are your practice areas?
              </h2>
              <p className="text-gray-600">
                Select all that apply (you can always change this later)
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRACTICE_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => togglePracticeArea(area.id)}
                  className={`p-4 rounded-lg border-2 text-center transition-all hover:border-blue-500 hover:shadow-sm ${
                    selectedPracticeAreas.includes(area.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{area.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {area.name}
                  </div>
                  {selectedPracticeAreas.includes(area.id) && (
                    <div className="text-blue-600 text-lg mt-1">✓</div>
                  )}
                </button>
              ))}
            </div>

            {selectedPracticeAreas.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                {selectedPracticeAreas.length} area
                {selectedPracticeAreas.length !== 1 ? 's' : ''} selected
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedPracticeAreas.length === 0}
                className="flex-1"
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're all set!
              </h2>
              <p className="text-gray-600 mb-6">
                Based on your selections, we've personalized your experience
              </p>
            </div>

            {/* Summary Card */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Your Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Role</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">
                      {ROLES.find(r => r.id === selectedRole)?.icon}
                    </span>
                    <span className="font-medium">
                      {ROLES.find(r => r.id === selectedRole)?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Practice Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPracticeAreas.map(areaId => {
                      const area = PRACTICE_AREAS.find(a => a.id === areaId)
                      return (
                        <span
                          key={areaId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm border border-blue-200"
                        >
                          <span>{area?.icon}</span>
                          <span>{area?.name}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold mb-1">Personalized Tools</h4>
                <p className="text-sm text-gray-600">
                  See tools relevant to your practice
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold mb-1">Quick Access</h4>
                <p className="text-sm text-gray-600">
                  Favorites and recommendations ready
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-semibold mb-1">Track Progress</h4>
                <p className="text-sm text-gray-600">
                  Monitor your AI tool usage
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                ← Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Go to Dashboard →'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
