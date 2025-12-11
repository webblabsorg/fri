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

export function getBetaInvitationTemplate(
  name: string | undefined,
  inviteUrl: string
): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited to Frith AI Beta - Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Legal AI Platform</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin: 20px 0; color: white;">
            <h2 style="color: white; margin-top: 0;">🎉 You're Invited to the Beta!</h2>
            <p style="color: rgba(255,255,255,0.9);">${greeting}</p>
            <p style="color: rgba(255,255,255,0.9);">You've been selected to join the exclusive Frith AI beta program. As a beta user, you'll get:</p>
            
            <ul style="color: rgba(255,255,255,0.9);">
              <li><strong>Free Professional Plan</strong> for 3 months ($99/month value)</li>
              <li><strong>Early Adopter Badge</strong> on your profile</li>
              <li><strong>Direct Access</strong> to our founding team</li>
              <li><strong>Priority Support</strong> with &lt;4 hour response time</li>
              <li><strong>Shape the Product</strong> - your feedback directly influences development</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a1a1a; margin-top: 0;">What is Frith AI?</h3>
            <p>Frith AI is a comprehensive legal AI platform designed specifically for legal professionals. With 20+ AI-powered tools, you can:</p>
            
            <ul>
              <li>Draft professional legal documents in seconds</li>
              <li>Conduct legal research with AI assistance</li>
              <li>Analyze contracts and identify key clauses</li>
              <li>Generate client communications effortlessly</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background: #1a1a1a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              This invitation expires in 7 days.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
            <p>Questions? Reply to this email or reach out to beta@frithai.com</p>
            <p>© 2025 Frith AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendBetaInvitationEmail(
  email: string,
  name: string | undefined,
  token: string
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/invite/${token}`
  
  return sendEmail({
    to: email,
    subject: "🎉 You're Invited to Frith AI Beta!",
    html: getBetaInvitationTemplate(name, inviteUrl),
  })
}

export function getBetaSurveyTemplate(
  name: string,
  surveyUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>How's Your Frith AI Experience? - Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Beta Feedback</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${name}, how's it going?</h2>
            <p>You've been using Frith AI for a week now, and we'd love to hear your thoughts!</p>
            
            <p>Your feedback is incredibly valuable to us. It takes just 2 minutes to complete our quick survey:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${surveyUrl}" 
                 style="background: #1a1a1a; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
                Take the Survey
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              As a thank you, all survey respondents will be entered into a drawing for a free year of Professional plan!
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

export async function sendBetaSurveyEmail(
  email: string,
  name: string,
  userId: string
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const surveyUrl = `${siteUrl}/beta/survey?user=${userId}`
  
  return sendEmail({
    to: email,
    subject: "How's your Frith AI experience? (2 min survey)",
    html: getBetaSurveyTemplate(name, surveyUrl),
  })
}

export function getTicketConfirmationTemplate(
  name: string,
  ticketNumber: string,
  subject: string,
  ticketUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Support Ticket Received - Frith AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Support</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Support Ticket Received</h2>
            <p>Hi ${name},</p>
            <p>Thank you for contacting Frith AI support. We've received your request and will respond within 24 hours.</p>
            
            <div style="background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a1a1a;">
              <p style="margin: 0; font-weight: bold;">Ticket ID: ${ticketNumber}</p>
              <p style="margin: 10px 0 0 0; color: #666;">Subject: ${subject}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketUrl}" 
                 style="background: #1a1a1a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View or Update Ticket
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You can view your ticket and add additional information at any time using the link above.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              In the meantime, you might find answers in our <a href="${process.env.NEXT_PUBLIC_SITE_URL}/help" style="color: #1a1a1a;">Help Center</a>.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
            <p>© 2025 Frith AI. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/help" style="color: #999;">Help Center</a> | 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/status" style="color: #999;">Status Page</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

// ============================================================================
// LAUNCH EMAIL TEMPLATES
// ============================================================================

export function getLaunchAnnouncementTemplate(name: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://frith.ai'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Frith AI is Now Live! 🚀</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">🚀 Frith AI is Live!</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="color: white; margin: 0 0 10px 0;">The Wait is Over</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">
              AI-powered legal tools are now available to everyone
            </p>
          </div>
          
          <div style="padding: 20px 0;">
            <p>Hi ${name || 'there'},</p>
            <p>
              We're thrilled to announce that <strong>Frith AI is now publicly available!</strong> 
              After months of development and beta testing with legal professionals like you, 
              we're ready to help transform how you work.
            </p>
            
            <h3 style="color: #1a1a1a;">What's Available:</h3>
            <ul style="padding-left: 20px;">
              <li><strong>20+ AI Legal Tools</strong> - From contract drafting to legal research</li>
              <li><strong>Secure & Confidential</strong> - Enterprise-grade security for your data</li>
              <li><strong>Team Collaboration</strong> - Work together with your colleagues</li>
              <li><strong>Flexible Pricing</strong> - Plans for solo practitioners to large firms</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/signup" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Get Started Free
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              As a thank you for your interest, use code <strong>LAUNCH25</strong> for 25% off your first 3 months.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0; border-top: 1px solid #eee;">
            <p>© 2025 Frith AI. All rights reserved.</p>
            <p>
              <a href="${siteUrl}/unsubscribe" style="color: #999;">Unsubscribe</a> | 
              <a href="${siteUrl}/privacy" style="color: #999;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getWaitlistInviteTemplate(name: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://frith.ai'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Frith AI Access is Ready!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a1a; margin: 0;">Frith AI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Your Access is Ready</p>
          </div>
          
          <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="color: #166534; margin: 0 0 10px 0;">🎉 You're In!</h2>
            <p style="color: #166534; margin: 0;">
              Your spot on the waitlist has been activated
            </p>
          </div>
          
          <div style="padding: 20px 0;">
            <p>Hi ${name || 'there'},</p>
            <p>
              Great news! You signed up for our waitlist, and we're excited to let you know that 
              <strong>Frith AI is now live</strong> and your access is ready.
            </p>
            
            <p>
              As one of our early supporters, you get priority access and a special discount:
            </p>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">
                🏷️ Use code WAITLIST30 for 30% off your first 3 months
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/signup" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Create Your Account
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0; border-top: 1px solid #eee;">
            <p>© 2025 Frith AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendLaunchAnnouncementEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: '🚀 Frith AI is Now Live!',
    html: getLaunchAnnouncementTemplate(name || ''),
  })
}

export async function sendWaitlistInviteEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your Frith AI Access is Ready! 🎉',
    html: getWaitlistInviteTemplate(name || ''),
  })
}
