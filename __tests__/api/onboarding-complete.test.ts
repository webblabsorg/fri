/**
 * Onboarding Completion API Tests
 * 
 * Note: These tests may be skipped in CI due to Next.js environment setup.
 * They verify the onboarding completion business logic.
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/onboarding/complete/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

describe('Onboarding Completion API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    onboardingCompleted: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/onboarding/complete', () => {
    describe('Successful completion', () => {
      it('should complete onboarding with role and practice areas', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          onboardingCompleted: true,
          onboardingRole: 'associate',
          onboardingPracticeAreas: ['litigation', 'corporate'],
        })

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'associate',
            practiceAreas: ['litigation', 'corporate'],
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe('Onboarding completed successfully')
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            onboardingCompleted: true,
            onboardingRole: 'associate',
            onboardingPracticeAreas: ['litigation', 'corporate'],
          },
        })
      })

      it('should handle skipped onboarding', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          onboardingCompleted: true,
          onboardingRole: null,
          onboardingPracticeAreas: null,
        })

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            skipped: true,
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe('Onboarding skipped')
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            onboardingCompleted: true,
            onboardingRole: null,
            onboardingPracticeAreas: null,
          },
        })
      })

      it('should complete with only role (no practice areas)', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          onboardingCompleted: true,
          onboardingRole: 'solo',
          onboardingPracticeAreas: undefined,
        })

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'solo',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })

    describe('Authentication', () => {
      it('should return 401 when no session cookie', async () => {
        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'associate',
            practiceAreas: ['litigation'],
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })

      it('should return 401 when session is invalid', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=invalid-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'partner',
            practiceAreas: ['corporate'],
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Invalid session')
      })
    })

    describe('Error handling', () => {
      it('should handle database errors', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockRejectedValue(
          new Error('Database connection error')
        )

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'associate',
            practiceAreas: ['litigation'],
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to complete onboarding')
      })

      it('should log errors to console', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockRejectedValue(
          new Error('Test error')
        )

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'solo',
          }),
        })

        await POST(request)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Onboarding completion error:',
          expect.any(Error)
        )

        consoleErrorSpy.mockRestore()
      })
    })

    describe('Data validation', () => {
      it('should accept empty practice areas array', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          onboardingCompleted: true,
        })

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            role: 'student',
            practiceAreas: [],
          }),
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should accept undefined role and practice areas when skipped', async () => {
        ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          onboardingCompleted: true,
        })

        const request = new NextRequest('http://localhost:3000/api/onboarding/complete', {
          method: 'POST',
          headers: {
            cookie: 'session=valid-session-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            skipped: true,
            role: 'associate', // Should be ignored when skipped
            practiceAreas: ['litigation'], // Should be ignored when skipped
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            onboardingCompleted: true,
            onboardingRole: null,
            onboardingPracticeAreas: null,
          },
        })
      })
    })
  })
})
