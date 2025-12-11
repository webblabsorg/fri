/**
 * Email Templates with Branding Support
 * All templates support organization-specific branding
 */

export interface BrandingConfig {
  companyName: string
  logoUrl: string | null
  primaryColor: string
  supportEmail: string
}

const defaultBranding: BrandingConfig = {
  companyName: 'Frith AI',
  logoUrl: null,
  primaryColor: '#3B82F6',
  supportEmail: 'support@frithai.com',
}

/**
 * Base email layout with branding
 */
function baseLayout(content: string, branding: BrandingConfig = defaultBranding): string {
  const { companyName, logoUrl, primaryColor, supportEmail } = branding

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { max-height: 48px; margin-bottom: 16px; }
    .brand-name { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
    .content { color: #374151; line-height: 1.6; }
    .button { display: inline-block; background: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo">` : ''}
        <div class="brand-name">${companyName}</div>
      </div>
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Welcome email for new users
 */
export function welcomeEmail(
  userName: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Welcome to ${branding.companyName}!</h2>
    <p>Hi ${userName},</p>
    <p>Thank you for joining ${branding.companyName}. We're excited to have you on board!</p>
    <p>With your account, you can:</p>
    <ul>
      <li>Access AI-powered legal research tools</li>
      <li>Draft and review contracts</li>
      <li>Analyze case law and statutes</li>
      <li>And much more...</li>
    </ul>
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Get Started</a>
    </p>
    <p>If you have any questions, our support team is here to help.</p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `Welcome to ${branding.companyName}!`,
    html: baseLayout(content, branding),
    text: `Welcome to ${branding.companyName}!\n\nHi ${userName},\n\nThank you for joining. Get started at ${process.env.NEXTAUTH_URL}/dashboard`,
  }
}

/**
 * Email verification email
 */
export function verificationEmail(
  userName: string,
  verificationUrl: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${userName},</p>
    <p>Please verify your email address to complete your ${branding.companyName} account setup.</p>
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email</a>
    </p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account with ${branding.companyName}, you can safely ignore this email.</p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `Verify your ${branding.companyName} email`,
    html: baseLayout(content, branding),
    text: `Verify your email at: ${verificationUrl}`,
  }
}

/**
 * Password reset email
 */
export function passwordResetEmail(
  userName: string,
  resetUrl: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to reset your ${branding.companyName} password.</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `Reset your ${branding.companyName} password`,
    html: baseLayout(content, branding),
    text: `Reset your password at: ${resetUrl}`,
  }
}

/**
 * Organization invitation email
 */
export function invitationEmail(
  inviterName: string,
  organizationName: string,
  inviteUrl: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>You're Invited!</h2>
    <p>Hi there,</p>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on ${branding.companyName}.</p>
    <p style="text-align: center;">
      <a href="${inviteUrl}" class="button">Accept Invitation</a>
    </p>
    <p>This invitation will expire in 7 days.</p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `You're invited to join ${organizationName} on ${branding.companyName}`,
    html: baseLayout(content, branding),
    text: `${inviterName} invited you to join ${organizationName}. Accept at: ${inviteUrl}`,
  }
}

/**
 * Usage alert email
 */
export function usageAlertEmail(
  userName: string,
  usagePercent: number,
  planName: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Usage Alert</h2>
    <p>Hi ${userName},</p>
    <p>You've used <strong>${usagePercent}%</strong> of your monthly allowance on your ${planName} plan.</p>
    <p>To avoid service interruption, consider upgrading your plan or managing your usage.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/settings/billing" class="button">Manage Subscription</a>
    </p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `Usage Alert: ${usagePercent}% of your ${planName} plan used`,
    html: baseLayout(content, branding),
    text: `You've used ${usagePercent}% of your monthly allowance. Manage at: ${process.env.NEXTAUTH_URL}/settings/billing`,
  }
}

/**
 * Tool run completion email
 */
export function toolRunCompleteEmail(
  userName: string,
  toolName: string,
  resultUrl: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Your Tool Run is Complete</h2>
    <p>Hi ${userName},</p>
    <p>Your <strong>${toolName}</strong> run has completed successfully.</p>
    <p style="text-align: center;">
      <a href="${resultUrl}" class="button">View Results</a>
    </p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `${toolName} completed - ${branding.companyName}`,
    html: baseLayout(content, branding),
    text: `Your ${toolName} run is complete. View results at: ${resultUrl}`,
  }
}

/**
 * Security alert email
 */
export function securityAlertEmail(
  userName: string,
  alertType: string,
  details: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Security Alert</h2>
    <p>Hi ${userName},</p>
    <p>We detected a security event on your ${branding.companyName} account:</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
      <strong>${alertType}</strong>
      <p style="margin: 8px 0 0 0;">${details}</p>
    </div>
    <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/settings/security" class="button">Review Security Settings</a>
    </p>
    <p>Best regards,<br>The ${branding.companyName} Security Team</p>
  `

  return {
    subject: `Security Alert: ${alertType} - ${branding.companyName}`,
    html: baseLayout(content, branding),
    text: `Security Alert: ${alertType}\n\n${details}\n\nReview at: ${process.env.NEXTAUTH_URL}/settings/security`,
  }
}

/**
 * Invoice email
 */
export function invoiceEmail(
  userName: string,
  invoiceNumber: string,
  amount: string,
  invoiceUrl: string,
  branding: BrandingConfig = defaultBranding
): { subject: string; html: string; text: string } {
  const content = `
    <h2>Invoice #${invoiceNumber}</h2>
    <p>Hi ${userName},</p>
    <p>Your invoice for ${branding.companyName} is ready.</p>
    <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">
      <div style="font-size: 32px; font-weight: bold; color: #111827;">${amount}</div>
      <div style="color: #6b7280;">Invoice #${invoiceNumber}</div>
    </div>
    <p style="text-align: center;">
      <a href="${invoiceUrl}" class="button">View Invoice</a>
    </p>
    <p>Thank you for your business!</p>
    <p>Best regards,<br>The ${branding.companyName} Team</p>
  `

  return {
    subject: `Invoice #${invoiceNumber} from ${branding.companyName}`,
    html: baseLayout(content, branding),
    text: `Invoice #${invoiceNumber} for ${amount}. View at: ${invoiceUrl}`,
  }
}
