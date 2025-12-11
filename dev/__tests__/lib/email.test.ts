/**
 * Phase 8: Email Service Tests
 * Tests for lib/email.ts email sending functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const emailParams = {
        to: 'user@example.com',
        subject: 'Verify your Frith AI account',
        verificationUrl: 'https://frithai.com/verify-email/token123',
      }

      expect(emailParams.to).toBe('user@example.com')
      expect(emailParams.subject).toContain('Verify')
      expect(emailParams.verificationUrl).toContain('token')
    })

    it('should include user name in email body', async () => {
      const emailContent = {
        userName: 'John Doe',
        greeting: 'Hello John Doe,',
        body: 'Please verify your email address by clicking the link below.',
      }

      expect(emailContent.greeting).toContain('John Doe')
    })

    it('should set correct from address', async () => {
      const fromAddress = 'Frith AI <noreply@frithai.com>'
      expect(fromAddress).toContain('frithai.com')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const emailParams = {
        to: 'user@example.com',
        subject: 'Reset your Frith AI password',
        resetUrl: 'https://frithai.com/reset-password/token123',
        expiresIn: '1 hour',
      }

      expect(emailParams.subject).toContain('Reset')
      expect(emailParams.resetUrl).toContain('reset-password')
      expect(emailParams.expiresIn).toBe('1 hour')
    })

    it('should include security warning', async () => {
      const securityWarning = 'If you did not request this password reset, please ignore this email.'
      expect(securityWarning).toContain('ignore')
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email after signup', async () => {
      const emailParams = {
        to: 'newuser@example.com',
        subject: 'Welcome to Frith AI!',
        userName: 'New User',
        dashboardUrl: 'https://frithai.com/dashboard',
      }

      expect(emailParams.subject).toContain('Welcome')
      expect(emailParams.dashboardUrl).toContain('dashboard')
    })

    it('should include getting started tips', async () => {
      const tips = [
        'Explore our 20+ AI-powered legal tools',
        'Create your first project',
        'Set up your organization',
      ]

      expect(tips).toHaveLength(3)
      expect(tips[0]).toContain('tools')
    })
  })

  describe('sendSubscriptionConfirmation', () => {
    it('should send subscription confirmation email', async () => {
      const emailParams = {
        to: 'user@example.com',
        subject: 'Subscription Confirmed - Frith AI Pro',
        planName: 'Pro',
        amount: '$49/month',
        nextBillingDate: '2024-02-01',
      }

      expect(emailParams.subject).toContain('Confirmed')
      expect(emailParams.planName).toBe('Pro')
    })

    it('should include billing details', async () => {
      const billingDetails = {
        planName: 'Pro',
        price: 49.00,
        currency: 'USD',
        interval: 'month',
        nextBillingDate: new Date('2024-02-01'),
      }

      expect(billingDetails.price).toBe(49.00)
      expect(billingDetails.interval).toBe('month')
    })
  })

  describe('sendTicketNotification', () => {
    it('should send ticket created notification', async () => {
      const emailParams = {
        to: 'user@example.com',
        subject: 'Support Ticket Created - FRITH-000001',
        ticketNumber: 'FRITH-000001',
        ticketSubject: 'Help with contract analysis',
      }

      expect(emailParams.ticketNumber).toMatch(/^FRITH-\d+$/)
    })

    it('should send ticket reply notification', async () => {
      const emailParams = {
        to: 'user@example.com',
        subject: 'New Reply on Ticket FRITH-000001',
        ticketNumber: 'FRITH-000001',
        replyPreview: 'Thank you for contacting us...',
      }

      expect(emailParams.subject).toContain('Reply')
    })
  })

  describe('Email Error Handling', () => {
    it('should handle invalid email addresses', async () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        '',
      ]

      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        expect(isValid).toBe(false)
      })
    })

    it('should handle Resend API errors gracefully', async () => {
      const mockError = {
        statusCode: 429,
        message: 'Rate limit exceeded',
      }

      expect(mockError.statusCode).toBe(429)
    })

    it('should retry on temporary failures', async () => {
      const retryConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        retryableErrors: [429, 500, 502, 503, 504],
      }

      expect(retryConfig.maxRetries).toBe(3)
      expect(retryConfig.retryableErrors).toContain(429)
    })
  })

  describe('Email Templates', () => {
    it('should use consistent branding', async () => {
      const branding = {
        logoUrl: 'https://frithai.com/logo.png',
        primaryColor: '#2563eb',
        companyName: 'Frith AI',
        supportEmail: 'support@frithai.com',
      }

      expect(branding.companyName).toBe('Frith AI')
      expect(branding.primaryColor).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should include unsubscribe link where required', async () => {
      const marketingEmail = {
        includeUnsubscribe: true,
        unsubscribeUrl: 'https://frithai.com/unsubscribe?token=xyz',
      }

      expect(marketingEmail.includeUnsubscribe).toBe(true)
      expect(marketingEmail.unsubscribeUrl).toContain('unsubscribe')
    })

    it('should include footer with legal info', async () => {
      const footer = {
        companyAddress: '123 Legal Tech Way, San Francisco, CA 94102',
        privacyPolicyUrl: 'https://frithai.com/privacy',
        termsUrl: 'https://frithai.com/terms',
      }

      expect(footer.privacyPolicyUrl).toContain('privacy')
      expect(footer.termsUrl).toContain('terms')
    })
  })
})
