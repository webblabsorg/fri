import { NextResponse } from 'next/server'
import { getLaunchSettings } from '@/lib/launch-settings'

/**
 * Public Launch Settings API
 * Returns non-sensitive launch configuration for client-side use
 */
export async function GET() {
  try {
    const settings = await getLaunchSettings()

    // Only expose non-sensitive settings to the public
    return NextResponse.json({
      openSignups: settings.openSignups,
      betaBadgeRemoved: settings.betaBadgeRemoved,
      launchAnnounced: settings.launchAnnounced,
      maintenanceMode: settings.maintenanceMode,
    })
  } catch (error) {
    console.error('Error fetching public launch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launch settings' },
      { status: 500 }
    )
  }
}
