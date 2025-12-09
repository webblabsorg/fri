import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import WelcomePage from '@/app/welcome/page'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: ({ userName }: { userName: string }) => (
    <div data-testid="onboarding-wizard">
      Onboarding Wizard for {userName}
    </div>
  ),
}))

global.fetch = jest.fn()

describe('WelcomePage', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<WelcomePage />)

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })
  })

  describe('User with incomplete onboarding', () => {
    it('should render OnboardingWizard for user who has not completed onboarding', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            onboardingCompleted: false,
          },
        }),
      })

      render(<WelcomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument()
      })

      expect(screen.getByText(/Onboarding Wizard for John Doe/i)).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should pass empty string if user has no name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            email: 'john@example.com',
            onboardingCompleted: false,
            name: null,
          },
        }),
      })

      render(<WelcomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument()
      })
    })
  })

  describe('User with completed onboarding', () => {
    it('should redirect to dashboard if onboarding is already completed', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
            onboardingCompleted: true,
          },
        }),
      })

      render(<WelcomePage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated user', () => {
    it('should redirect to signin when session is invalid (not ok response)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      })

      render(<WelcomePage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/signin')
      })

      expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument()
    })

    it('should redirect to signin when session check throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<WelcomePage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/signin')
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Session check API call', () => {
    it('should call session API on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            name: 'Test User',
            onboardingCompleted: false,
          },
        }),
      })

      render(<WelcomePage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session')
      })
    })
  })
})
