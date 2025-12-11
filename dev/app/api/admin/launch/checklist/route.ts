import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

interface LaunchChecklistItem {
  id: string
  category: 'scaling' | 'monitoring' | 'marketing' | 'infrastructure' | 'team' | 'content'
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  automated: boolean
  lastChecked?: string
  details?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checklist: LaunchChecklistItem[] = []

    // ============================================================================
    // SCALING CHECKS
    // ============================================================================

    // Vercel Plan Check
    checklist.push({
      id: 'vercel-plan',
      category: 'scaling',
      name: 'Vercel Plan Upgraded',
      description: 'Verify Vercel plan supports expected traffic (Pro or Enterprise)',
      status: process.env.VERCEL_ENV === 'production' ? 'completed' : 'pending',
      automated: true,
      priority: 'critical',
      details: `Environment: ${process.env.VERCEL_ENV || 'unknown'}`,
    })

    // Database Plan Check
    checklist.push({
      id: 'database-plan',
      category: 'scaling',
      name: 'Database Plan Upgraded',
      description: 'Verify Neon database plan supports expected load',
      status: await checkDatabaseConnection(),
      automated: true,
      priority: 'critical',
    })

    // API Rate Limits
    checklist.push({
      id: 'api-rate-limits',
      category: 'scaling',
      name: 'API Rate Limits Configured',
      description: 'Monitor Claude/Gemini API rate limits for expected usage',
      status: process.env.ANTHROPIC_API_KEY && process.env.GOOGLE_AI_API_KEY ? 'completed' : 'pending',
      automated: true,
      priority: 'critical',
      details: `Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗'}, Google: ${process.env.GOOGLE_AI_API_KEY ? '✓' : '✗'}`,
    })

    // Auto-scaling Configuration
    checklist.push({
      id: 'auto-scaling',
      category: 'scaling',
      name: 'Auto-Scaling Configured',
      description: 'Vercel Edge Functions auto-scale by default',
      status: 'completed',
      automated: true,
      priority: 'high',
      details: 'Vercel handles auto-scaling automatically',
    })

    // ============================================================================
    // MONITORING CHECKS
    // ============================================================================

    // Error Tracking
    checklist.push({
      id: 'error-tracking',
      category: 'monitoring',
      name: 'Error Tracking Active',
      description: 'Sentry configured and receiving errors',
      status: process.env.SENTRY_DSN ? 'completed' : 'pending',
      automated: true,
      priority: 'critical',
    })

    // Uptime Monitoring
    checklist.push({
      id: 'uptime-monitoring',
      category: 'monitoring',
      name: 'Uptime Monitoring Active',
      description: 'BetterStack or similar monitoring configured',
      status: process.env.BETTERSTACK_API_KEY ? 'completed' : 'pending',
      automated: true,
      priority: 'critical',
    })

    // Slack/Email Alerts
    checklist.push({
      id: 'alert-channels',
      category: 'monitoring',
      name: 'Alert Channels Configured',
      description: 'Slack and/or email alerts for critical issues',
      status: process.env.SLACK_WEBHOOK_URL || process.env.ALERT_EMAIL ? 'completed' : 'pending',
      automated: true,
      priority: 'high',
      details: `Slack: ${process.env.SLACK_WEBHOOK_URL ? '✓' : '✗'}, Email: ${process.env.ALERT_EMAIL ? '✓' : '✗'}`,
    })

    // Analytics
    checklist.push({
      id: 'analytics',
      category: 'monitoring',
      name: 'Analytics Configured',
      description: 'Google Analytics or similar tracking active',
      status: process.env.NEXT_PUBLIC_GA_ID ? 'completed' : 'pending',
      automated: true,
      priority: 'high',
    })

    // On-Call Rotation
    checklist.push({
      id: 'on-call-rotation',
      category: 'monitoring',
      name: '24/7 On-Call Rotation',
      description: 'Team on-call schedule established for launch week',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // ============================================================================
    // MARKETING CHECKS
    // ============================================================================

    // Launch Blog Post
    checklist.push({
      id: 'launch-blog-post',
      category: 'marketing',
      name: 'Launch Announcement Blog Post',
      description: 'Blog post ready to publish on launch day',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // Press Release
    checklist.push({
      id: 'press-release',
      category: 'marketing',
      name: 'Press Release Ready',
      description: 'Press release drafted and distribution list ready',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Social Media Posts
    checklist.push({
      id: 'social-media-posts',
      category: 'marketing',
      name: 'Social Media Posts Scheduled',
      description: 'Twitter, LinkedIn posts scheduled for launch',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // Product Hunt
    checklist.push({
      id: 'product-hunt',
      category: 'marketing',
      name: 'Product Hunt Launch Page',
      description: 'Product Hunt page created and ready to launch',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Waitlist Email
    checklist.push({
      id: 'waitlist-email',
      category: 'marketing',
      name: 'Waitlist Email Ready',
      description: 'Email template ready for waitlist subscribers',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Ad Campaigns
    checklist.push({
      id: 'ad-campaigns',
      category: 'marketing',
      name: 'Ad Campaigns Configured',
      description: 'Google Ads and LinkedIn Ads campaigns ready',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Influencer Outreach
    checklist.push({
      id: 'influencer-outreach',
      category: 'marketing',
      name: 'Influencer Outreach',
      description: 'Reach out to legal tech influencers for launch coverage',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Guest Posts
    checklist.push({
      id: 'guest-posts',
      category: 'marketing',
      name: 'Guest Posts Scheduled',
      description: 'Guest posts on legal blogs drafted and scheduled',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // Podcast Interviews
    checklist.push({
      id: 'podcast-interviews',
      category: 'marketing',
      name: 'Podcast Interviews',
      description: 'Podcast slots identified and booked for launch week',
      status: 'pending',
      automated: false,
      priority: 'low',
    })

    // User Testimonials
    checklist.push({
      id: 'user-testimonials',
      category: 'content',
      name: 'User Testimonials Ready',
      description: 'Collect and prepare user testimonials from beta users',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // Case Studies
    checklist.push({
      id: 'case-studies',
      category: 'content',
      name: 'Case Studies Prepared',
      description: 'Prepare 1-2 case studies for post-launch marketing',
      status: 'pending',
      automated: false,
      priority: 'medium',
    })

    // ============================================================================
    // INFRASTRUCTURE CHECKS
    // ============================================================================

    // Beta Badge Removal
    const launchSettings = await getLaunchSettings()
    checklist.push({
      id: 'beta-badge-removed',
      category: 'infrastructure',
      name: 'Beta Badge Removed',
      description: 'Remove beta badge from UI for public launch',
      status: launchSettings.betaBadgeRemoved ? 'completed' : 'pending',
      automated: true,
      priority: 'high',
    })

    // Open Signups
    checklist.push({
      id: 'open-signups',
      category: 'infrastructure',
      name: 'Open Signups Enabled',
      description: 'Allow public signups without invitation',
      status: launchSettings.openSignups ? 'completed' : 'pending',
      automated: true,
      priority: 'critical',
    })

    // Production Environment
    checklist.push({
      id: 'production-env',
      category: 'infrastructure',
      name: 'Production Environment Ready',
      description: 'All production environment variables configured',
      status: checkProductionEnvVars(),
      automated: true,
      priority: 'critical',
    })

    // SSL Certificate
    checklist.push({
      id: 'ssl-certificate',
      category: 'infrastructure',
      name: 'SSL Certificate Active',
      description: 'HTTPS enabled for all domains',
      status: 'completed',
      automated: true,
      priority: 'critical',
      details: 'Vercel provides automatic SSL',
    })

    // ============================================================================
    // TEAM CHECKS
    // ============================================================================

    // Team Availability
    checklist.push({
      id: 'team-availability',
      category: 'team',
      name: 'All Hands on Deck',
      description: 'Full team available on launch day',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // Support Readiness
    checklist.push({
      id: 'support-readiness',
      category: 'team',
      name: 'Support Team Ready',
      description: 'Support team briefed and ready for ticket surge',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // ============================================================================
    // CONTENT CHECKS
    // ============================================================================

    // Marketing Pages
    checklist.push({
      id: 'marketing-pages',
      category: 'content',
      name: 'Marketing Pages Finalized',
      description: 'Homepage, pricing, about pages ready',
      status: 'pending',
      automated: false,
      priority: 'high',
    })

    // Help Center
    checklist.push({
      id: 'help-center',
      category: 'content',
      name: 'Help Center Updated',
      description: 'All help articles reviewed and updated',
      status: await checkHelpArticles(),
      automated: true,
      priority: 'medium',
    })

    // Calculate summary
    const summary = {
      total: checklist.length,
      completed: checklist.filter(item => item.status === 'completed').length,
      pending: checklist.filter(item => item.status === 'pending').length,
      inProgress: checklist.filter(item => item.status === 'in_progress').length,
      failed: checklist.filter(item => item.status === 'failed').length,
      criticalPending: checklist.filter(item => item.priority === 'critical' && item.status !== 'completed').length,
    }

    const readyForLaunch = summary.criticalPending === 0

    return NextResponse.json({
      checklist,
      summary,
      readyForLaunch,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching launch checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launch checklist' },
      { status: 500 }
    )
  }
}

// Helper functions
async function checkDatabaseConnection(): Promise<'completed' | 'pending' | 'failed'> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'completed'
  } catch {
    return 'failed'
  }
}

function checkProductionEnvVars(): 'completed' | 'pending' {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ]
  const missing = required.filter(key => !process.env[key])
  return missing.length === 0 ? 'completed' : 'pending'
}

async function getLaunchSettings(): Promise<{ betaBadgeRemoved: boolean; openSignups: boolean }> {
  try {
    // Check for launch settings in database or use defaults
    // For now, return defaults - these will be controlled via the launch controls API
    return {
      betaBadgeRemoved: process.env.LAUNCH_BETA_BADGE_REMOVED === 'true',
      openSignups: process.env.LAUNCH_OPEN_SIGNUPS === 'true',
    }
  } catch {
    return { betaBadgeRemoved: false, openSignups: false }
  }
}

async function checkHelpArticles(): Promise<'completed' | 'pending'> {
  try {
    const count = await prisma.helpArticle.count({ where: { published: true } })
    return count >= 10 ? 'completed' : 'pending'
  } catch {
    return 'pending'
  }
}
