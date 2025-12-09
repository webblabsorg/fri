import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('OnboardingWizard', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Step 1 - Welcome', () => {
    it('should render welcome screen with user name', () => {
      render(<OnboardingWizard userName="John Doe" />)

      expect(screen.getByText(/Welcome to Frith, John Doe!/i)).toBeInTheDocument()
      expect(screen.getByText(/Let's Get Started/i)).toBeInTheDocument()
    })

    it('should render without user name', () => {
      render(<OnboardingWizard />)

      expect(screen.getByText(/Welcome to Frith!/i)).toBeInTheDocument()
    })

    it('should move to step 2 when clicking get started', () => {
      render(<OnboardingWizard />)

      const button = screen.getByText(/Let's Get Started/i)
      fireEvent.click(button)

      expect(screen.getByText(/What best describes your role\?/i)).toBeInTheDocument()
    })

    it('should show skip option', () => {
      render(<OnboardingWizard />)

      expect(screen.getByText(/Skip for now/i)).toBeInTheDocument()
    })
  })

  describe('Step 2 - Role Selection', () => {
    beforeEach(() => {
      render(<OnboardingWizard />)
      // Navigate to step 2
      fireEvent.click(screen.getByText(/Let's Get Started/i))
    })

    it('should display all role options', () => {
      expect(screen.getByText('Solo Practitioner')).toBeInTheDocument()
      expect(screen.getByText('Associate')).toBeInTheDocument()
      expect(screen.getByText('Partner')).toBeInTheDocument()
      expect(screen.getByText('In-House Counsel')).toBeInTheDocument()
      expect(screen.getByText('Law Student')).toBeInTheDocument()
      expect(screen.getByText('Paralegal')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('should allow selecting a role', () => {
      const roleButton = screen.getByText('Solo Practitioner').closest('button')
      fireEvent.click(roleButton!)

      expect(roleButton).toHaveClass('border-blue-500')
    })

    it('should disable continue button when no role selected', () => {
      const continueButton = screen.getByText(/Continue/i)
      expect(continueButton).toBeDisabled()
    })

    it('should enable continue button when role selected', () => {
      const roleButton = screen.getByText('Associate').closest('button')
      fireEvent.click(roleButton!)

      const continueButton = screen.getByText(/Continue/i)
      expect(continueButton).not.toBeDisabled()
    })

    it('should navigate to step 3 when continue clicked', () => {
      const roleButton = screen.getByText('Partner').closest('button')
      fireEvent.click(roleButton!)

      const continueButton = screen.getByText(/Continue/i)
      fireEvent.click(continueButton)

      expect(screen.getByText(/What are your practice areas\?/i)).toBeInTheDocument()
    })

    it('should allow going back to step 1', () => {
      const backButton = screen.getByText(/Back/i)
      fireEvent.click(backButton)

      expect(screen.getByText(/Welcome to Frith/i)).toBeInTheDocument()
    })
  })

  describe('Step 3 - Practice Areas', () => {
    beforeEach(() => {
      render(<OnboardingWizard />)
      // Navigate to step 3
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      fireEvent.click(screen.getByText('Solo Practitioner').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
    })

    it('should display practice area options', () => {
      expect(screen.getByText('Litigation')).toBeInTheDocument()
      expect(screen.getByText('Corporate Law')).toBeInTheDocument()
      expect(screen.getByText('Real Estate')).toBeInTheDocument()
      expect(screen.getByText('Employment Law')).toBeInTheDocument()
      expect(screen.getByText('Intellectual Property')).toBeInTheDocument()
      expect(screen.getByText('Family Law')).toBeInTheDocument()
    })

    it('should allow selecting multiple practice areas', () => {
      const litigationButton = screen.getByText('Litigation').closest('button')
      const corporateButton = screen.getByText('Corporate Law').closest('button')

      fireEvent.click(litigationButton!)
      fireEvent.click(corporateButton!)

      expect(litigationButton).toHaveClass('border-blue-500')
      expect(corporateButton).toHaveClass('border-blue-500')
      expect(screen.getByText(/2 areas? selected/i)).toBeInTheDocument()
    })

    it('should allow deselecting practice areas', () => {
      const litigationButton = screen.getByText('Litigation').closest('button')

      fireEvent.click(litigationButton!)
      expect(litigationButton).toHaveClass('border-blue-500')

      fireEvent.click(litigationButton!)
      expect(litigationButton).not.toHaveClass('border-blue-500')
    })

    it('should disable continue when no areas selected', () => {
      const continueButton = screen.getByText(/Continue/i)
      expect(continueButton).toBeDisabled()
    })

    it('should enable continue when areas selected', () => {
      const litigationButton = screen.getByText('Litigation').closest('button')
      fireEvent.click(litigationButton!)

      const continueButton = screen.getByText(/Continue/i)
      expect(continueButton).not.toBeDisabled()
    })

    it('should navigate to step 4 when continue clicked', () => {
      const litigationButton = screen.getByText('Litigation').closest('button')
      fireEvent.click(litigationButton!)

      const continueButton = screen.getByText(/Continue/i)
      fireEvent.click(continueButton)

      expect(screen.getByText(/You're all set!/i)).toBeInTheDocument()
    })

    it('should allow going back to step 2', () => {
      const backButton = screen.getByText(/Back/i)
      fireEvent.click(backButton)

      expect(screen.getByText(/What best describes your role\?/i)).toBeInTheDocument()
    })
  })

  describe('Step 4 - Completion', () => {
    beforeEach(() => {
      render(<OnboardingWizard userName="Jane Doe" />)
      // Navigate to step 4
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      fireEvent.click(screen.getByText('Associate').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      fireEvent.click(screen.getByText('Litigation').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
    })

    it('should display completion screen', () => {
      expect(screen.getByText(/You're all set!/i)).toBeInTheDocument()
      expect(screen.getByText(/Your Profile/i)).toBeInTheDocument()
    })

    it('should show selected role and practice areas', () => {
      expect(screen.getByText('Associate')).toBeInTheDocument()
      expect(screen.getByText('Litigation')).toBeInTheDocument()
    })

    it('should show benefits section', () => {
      expect(screen.getByText('Personalized Tools')).toBeInTheDocument()
      expect(screen.getByText('Quick Access')).toBeInTheDocument()
      expect(screen.getByText('Track Progress')).toBeInTheDocument()
    })

    it('should allow going back to step 3', () => {
      const backButton = screen.getByText(/Back/i)
      fireEvent.click(backButton)

      expect(screen.getByText(/What are your practice areas\?/i)).toBeInTheDocument()
    })
  })

  describe('Completion Flow', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    })

    it('should submit selections and redirect on complete', async () => {
      render(<OnboardingWizard />)

      // Navigate through all steps
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      fireEvent.click(screen.getByText('Solo Practitioner').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      fireEvent.click(screen.getByText('Litigation').closest('button')!)
      fireEvent.click(screen.getByText('Corporate Law').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))

      // Complete onboarding
      const completeButton = screen.getByText(/Go to Dashboard/i)
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'solo',
            practiceAreas: ['litigation', 'corporate'],
          }),
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle API errors on completion', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      })

      render(<OnboardingWizard />)

      // Navigate through steps
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      fireEvent.click(screen.getByText('Associate').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      fireEvent.click(screen.getByText('Litigation').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))

      // Try to complete
      const completeButton = screen.getByText(/Go to Dashboard/i)
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should disable complete button while submitting', async () => {
      let resolvePromise: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      ;(global.fetch as jest.Mock).mockReturnValue(fetchPromise)

      render(<OnboardingWizard />)

      // Navigate to completion
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      fireEvent.click(screen.getByText('Partner').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      fireEvent.click(screen.getByText('Litigation').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))

      // Click complete
      const completeButton = screen.getByText(/Go to Dashboard/i)
      fireEvent.click(completeButton)

      // Button should be disabled
      await waitFor(() => {
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument()
      })

      // Resolve
      resolvePromise!({ ok: true, json: async () => ({ success: true }) })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Skip Flow', () => {
    it('should skip onboarding and redirect', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<OnboardingWizard />)

      const skipButton = screen.getByText(/Skip for now/i)
      fireEvent.click(skipButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skipped: true }),
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle skip errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to skip onboarding' }),
      })

      render(<OnboardingWizard />)

      const skipButton = screen.getByText(/Skip for now/i)
      fireEvent.click(skipButton)

      // Wait for the API call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skipped: true }),
        })
      })

      // Error is set in state but component shows generic error or stays on current screen
      expect(mockPush).not.toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Progress Tracking', () => {
    it('should show correct progress for each step', () => {
      render(<OnboardingWizard />)

      // Step 1
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()

      // Go to step 2
      fireEvent.click(screen.getByText(/Let's Get Started/i))
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()

      // Go to step 3
      fireEvent.click(screen.getByText('Solo Practitioner').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument()

      // Go to step 4
      fireEvent.click(screen.getByText('Litigation').closest('button')!)
      fireEvent.click(screen.getByText(/Continue/i))
      expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument()
    })
  })
})
