import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

/**
 * Launch Controls API
 * Manages launch day settings like beta badge removal and open signups
 */

interface LaunchSettings {
  betaBadgeRemoved: boolean
  openSignups: boolean
  launchDate: string | null
  launchAnnounced: boolean
  maintenanceMode: boolean
}

// GET - Retrieve current launch settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getLaunchSettings()

    return NextResponse.json({
      settings,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching launch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launch settings' },
      { status: 500 }
    )
  }
}

// POST - Update launch settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, value } = body

    let result: any = {}

    switch (action) {
      case 'remove_beta_badge':
        result = await updateSetting('betaBadgeRemoved', true)
        break

      case 'restore_beta_badge':
        result = await updateSetting('betaBadgeRemoved', false)
        break

      case 'enable_open_signups':
        result = await updateSetting('openSignups', true)
        break

      case 'disable_open_signups':
        result = await updateSetting('openSignups', false)
        break

      case 'set_launch_date':
        result = await updateSetting('launchDate', value)
        break

      case 'announce_launch':
        result = await updateSetting('launchAnnounced', true)
        break

      case 'enable_maintenance':
        result = await updateSetting('maintenanceMode', true)
        break

      case 'disable_maintenance':
        result = await updateSetting('maintenanceMode', false)
        break

      case 'go_live':
        // Full launch: remove beta badge, enable open signups, announce
        await updateSetting('betaBadgeRemoved', true)
        await updateSetting('openSignups', true)
        await updateSetting('launchAnnounced', true)
        await updateSetting('launchDate', new Date().toISOString())
        result = { goLive: true, launchDate: new Date().toISOString() }
        
        // Log the launch event
        await logLaunchEvent('PUBLIC_LAUNCH', (session.user as any).id)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log the action
    await logLaunchEvent(action.toUpperCase(), (session.user as any).id)

    const settings = await getLaunchSettings()

    return NextResponse.json({
      success: true,
      action,
      result,
      settings,
    })
  } catch (error) {
    console.error('Error updating launch settings:', error)
    return NextResponse.json(
      { error: 'Failed to update launch settings' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getLaunchSettings(): Promise<LaunchSettings> {
  try {
    // Try to get settings from database
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['betaBadgeRemoved', 'openSignups', 'launchDate', 'launchAnnounced', 'maintenanceMode'],
        },
      },
    })

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    return {
      betaBadgeRemoved: settingsMap.betaBadgeRemoved === 'true',
      openSignups: settingsMap.openSignups === 'true',
      launchDate: settingsMap.launchDate || null,
      launchAnnounced: settingsMap.launchAnnounced === 'true',
      maintenanceMode: settingsMap.maintenanceMode === 'true',
    }
  } catch {
    // Fallback to environment variables
    return {
      betaBadgeRemoved: process.env.LAUNCH_BETA_BADGE_REMOVED === 'true',
      openSignups: process.env.LAUNCH_OPEN_SIGNUPS === 'true',
      launchDate: process.env.LAUNCH_DATE || null,
      launchAnnounced: process.env.LAUNCH_ANNOUNCED === 'true',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    }
  }
}

async function updateSetting(key: string, value: any): Promise<{ key: string; value: string }> {
  const stringValue = String(value)
  
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: stringValue, updatedAt: new Date() },
    create: { key, value: stringValue },
  })

  return { key, value: stringValue }
}

async function logLaunchEvent(action: string, userId: string): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        eventType: `LAUNCH_${action}`,
        eventData: { action, timestamp: new Date().toISOString() },
        ipAddress: 'system',
      },
    })
  } catch (error) {
    console.error('Failed to log launch event:', error)
  }
}
