// Email service using Resend
// Install with: npm install resend

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend API
 * In development, logs email content to console
 * In production, sends via Resend if properly configured
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Log email intent in all environments
  console.log('📧 Sending email:', {
    to: options.to,
    subject: options.subject,
    environment: process.env.NODE_ENV,
  })

  // In development, just log and return success
  if (isDevelopment) {
    console.log('Email content preview (development mode):')
    console.log(options.html.substring(0, 500) + '...')
    return true
  }

  // Production: Validate environment variables
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    return false
  }

  if (!fromEmail) {
    console.error('RESEND_FROM_EMAIL not configured')
    return false
  }

  // Production: Send email via Resend
  try {
    // Dynamic import to avoid build-time errors if resend package is missing
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Resend API error:', error)
      return false
    }

    console.log('✅ Email sent successfully:', data)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function getVerificationEmailTemplate(
  name: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Legal AI Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Frith AI, ${name}!</h2>
            <p>Thank you for signing up. Please verify your email address to activate your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #1a1a1a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #1a1a1a;">${verificationUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
            <p>© 2025 Frith AI. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/terms" style="color: #999;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPasswordResetEmailTemplate(
  name: string,
  resetUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Legal AI Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #1a1a1a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #1a1a1a;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
            <p>© 2025 Frith AI. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/terms" style="color: #999;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getWelcomeEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Legal AI Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Frith AI! 🎉</h2>
            <p>Hi ${name},</p>
            <p>Your account is now active! You now have access to 240+ AI-powered legal tools.</p>
            
            <h3 style="color: #1a1a1a;">Get Started:</h3>
            <ul style="line-height: 2;">
              <li><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="color: #1a1a1a;">Explore the tool catalog</a></li>
              <li><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/tools/legal-research" style="color: #1a1a1a;">Run your first legal research</a></li>
              <li><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings" style="color: #1a1a1a;">Customize your profile</a></li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                 style="background: #1a1a1a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Need help? Check out our <a href="${process.env.NEXT_PUBLIC_SITE_URL}/help" style="color: #1a1a1a;">Help Center</a> or reply to this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
            <p>© 2025 Frith AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
