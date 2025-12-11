import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const timestamp = new Date().toISOString()
  const checks: Record<string, any> = {}

  try {
    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = { status: 'ok', message: 'Connected' }
    } catch (error) {
      checks.database = { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Connection failed' 
      }
    }

    // Storage health check
    try {
      // Basic check - if BLOB_READ_WRITE_TOKEN is configured
      const hasStorage = !!process.env.BLOB_READ_WRITE_TOKEN
      checks.storage = { 
        status: hasStorage ? 'ok' : 'warning', 
        message: hasStorage ? 'Configured' : 'Not configured' 
      }
    } catch (error) {
      checks.storage = { status: 'error', message: 'Check failed' }
    }

    // AI API health check
    try {
      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
      const hasGoogleKey = !!process.env.GOOGLE_AI_API_KEY
      checks.ai_apis = { 
        status: (hasAnthropicKey || hasGoogleKey) ? 'ok' : 'warning',
        message: `Anthropic: ${hasAnthropicKey ? 'configured' : 'missing'}, Google: ${hasGoogleKey ? 'configured' : 'missing'}`
      }
    } catch (error) {
      checks.ai_apis = { status: 'error', message: 'Check failed' }
    }

    // Phase 7 integrations check
    try {
      const hasClioConfig = !!(process.env.CLIO_CLIENT_ID && process.env.CLIO_CLIENT_SECRET)
      const hasZapierConfig = !!(process.env.ZAPIER_CLIENT_ID && process.env.ZAPIER_CLIENT_SECRET)
      
      checks.integrations = {
        status: 'ok',
        clio: hasClioConfig ? 'configured' : 'not configured',
        zapier: hasZapierConfig ? 'configured' : 'not configured'
      }
    } catch (error) {
      checks.integrations = { status: 'error', message: 'Check failed' }
    }

    // Overall status determination
    const hasErrors = Object.values(checks).some((check: any) => check.status === 'error')
    const overallStatus = hasErrors ? 'degraded' : 'healthy'

    return NextResponse.json({
      status: overallStatus,
      timestamp,
      phase: 'Phase 7 - Advanced AI Features & Integrations',
      version: '7.0.0',
      features: {
        document_management: 'enabled',
        workflow_engine: 'enabled',
        scheduling_system: 'enabled',
        bulk_processing: 'enabled',
        clio_integration: 'enabled',
        zapier_integration: 'enabled',
        word_addin: 'enabled'
      },
      checks,
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      memory_usage: process.memoryUsage ? process.memoryUsage() : null,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp,
      phase: 'Phase 7 - Advanced AI Features & Integrations',
      version: '7.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks
    }, { status: 500 })
  }
}
