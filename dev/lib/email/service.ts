/**
 * Email Service with Branding Support
 * Sends emails using organization-specific branding
 */

import { prisma } from '@/lib/db'
import * as templates from './templates'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Get branding config for an organization
 */
export async function getOrganizationBranding(
  organizationId: string | null
): Promise<templates.BrandingConfig> {
  const defaultBranding: templates.BrandingConfig = {
    companyName: 'Frith AI',
    logoUrl: null,
    primaryColor: '#3B82F6',
    supportEmail: 'support@frithai.com',
  }

  if (!organizationId) {
    return defaultBranding
  }

  try {
    const branding = await prisma.customBranding.findUnique({
      where: { organizationId },
    })

    if (!branding) {
      return defaultBranding
    }

    return {
      companyName: branding.companyName || defaultBranding.companyName,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor || defaultBranding.primaryColor,
      supportEmail: branding.supportEmail || defaultBranding.supportEmail,
    }
  } catch (error) {
    console.error('Error fetching branding:', error)
    return defaultBranding
  }
}

/**
 * Get user's primary organization for branding
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    return membership?.organizationId || null
  } catch (error) {
    console.error('Error fetching user organization:', error)
    return null
  }
}

/**
 * Send email using configured provider
 */
async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options

  // Use environment-configured email provider
  const provider = process.env.EMAIL_PROVIDER || 'console'

  if (provider === 'console' || process.env.NODE_ENV === 'development') {
    console.log('📧 Email sent (dev mode):')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Preview: ${text?.substring(0, 100)}...`)
    return true
  }

  if (provider === 'sendgrid') {
    return sendViaSendGrid(options)
  }

  if (provider === 'ses') {
    return sendViaSES(options)
  }

  if (provider === 'resend') {
    return sendViaResend(options)
  }

  console.warn('No email provider configured')
  return false
}

async function sendViaSendGrid(options: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@frithai.com' },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text || '' },
          { type: 'text/html', value: options.html },
        ],
      }),
    })
    return response.ok
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

async function sendViaSES(options: SendEmailOptions): Promise<boolean> {
  // AWS SES implementation would go here
  console.log('SES email sending not implemented')
  return false
}

async function sendViaResend(options: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@frithai.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Resend error:', error)
    return false
  }
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  name: string
): Promise<boolean> {
  const orgId = await getUserOrganizationId(userId)
  const branding = await getOrganizationBranding(orgId)
  const { subject, html, text } = templates.welcomeEmail(name, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string,
  organizationId?: string
): Promise<boolean> {
  const branding = await getOrganizationBranding(organizationId || null)
  const { subject, html, text } = templates.verificationEmail(name, verificationUrl, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
  organizationId?: string
): Promise<boolean> {
  const branding = await getOrganizationBranding(organizationId || null)
  const { subject, html, text } = templates.passwordResetEmail(name, resetUrl, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send organization invitation email
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  inviteUrl: string,
  organizationId: string
): Promise<boolean> {
  const branding = await getOrganizationBranding(organizationId)
  const { subject, html, text } = templates.invitationEmail(
    inviterName,
    organizationName,
    inviteUrl,
    branding
  )
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send usage alert email
 */
export async function sendUsageAlertEmail(
  userId: string,
  email: string,
  name: string,
  usagePercent: number,
  planName: string
): Promise<boolean> {
  const orgId = await getUserOrganizationId(userId)
  const branding = await getOrganizationBranding(orgId)
  const { subject, html, text } = templates.usageAlertEmail(name, usagePercent, planName, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send tool run completion email
 */
export async function sendToolRunCompleteEmail(
  userId: string,
  email: string,
  name: string,
  toolName: string,
  resultUrl: string
): Promise<boolean> {
  const orgId = await getUserOrganizationId(userId)
  const branding = await getOrganizationBranding(orgId)
  const { subject, html, text } = templates.toolRunCompleteEmail(name, toolName, resultUrl, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send security alert email
 */
export async function sendSecurityAlertEmail(
  userId: string,
  email: string,
  name: string,
  alertType: string,
  details: string
): Promise<boolean> {
  const orgId = await getUserOrganizationId(userId)
  const branding = await getOrganizationBranding(orgId)
  const { subject, html, text } = templates.securityAlertEmail(name, alertType, details, branding)
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  userId: string,
  email: string,
  name: string,
  invoiceNumber: string,
  amount: string,
  invoiceUrl: string
): Promise<boolean> {
  const orgId = await getUserOrganizationId(userId)
  const branding = await getOrganizationBranding(orgId)
  const { subject, html, text } = templates.invoiceEmail(name, invoiceNumber, amount, invoiceUrl, branding)
  return sendEmail({ to: email, subject, html, text })
}
