import { prisma } from '@/lib/db'

/**
 * Launch Settings Server Helper
 * Centralized access to launch configuration for server-side code
 */

export interface LaunchSettings {
  betaBadgeRemoved: boolean
  openSignups: boolean
  launchDate: string | null
  launchAnnounced: boolean
  maintenanceMode: boolean
}

const DEFAULT_SETTINGS: LaunchSettings = {
  betaBadgeRemoved: false,
  openSignups: false,
  launchDate: null,
  launchAnnounced: false,
  maintenanceMode: false,
}

/**
 * Get launch settings from database with env var fallback
 * Safe to use from API routes and server components
 */
export async function getLaunchSettings(): Promise<LaunchSettings> {
  try {
    // Try to get settings from database first
    const dbSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['betaBadgeRemoved', 'openSignups', 'launchDate', 'launchAnnounced', 'maintenanceMode'],
        },
      },
    })

    const settingsMap = dbSettings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    // If we have DB settings, use them
    if (dbSettings.length > 0) {
      return {
        betaBadgeRemoved: settingsMap.betaBadgeRemoved === 'true',
        openSignups: settingsMap.openSignups === 'true',
        launchDate: settingsMap.launchDate || null,
        launchAnnounced: settingsMap.launchAnnounced === 'true',
        maintenanceMode: settingsMap.maintenanceMode === 'true',
      }
    }

    // Fallback to environment variables
    return {
      betaBadgeRemoved: process.env.LAUNCH_BETA_BADGE_REMOVED === 'true',
      openSignups: process.env.LAUNCH_OPEN_SIGNUPS === 'true',
      launchDate: process.env.LAUNCH_DATE || null,
      launchAnnounced: process.env.LAUNCH_ANNOUNCED === 'true',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    }
  } catch (error) {
    console.error('Error fetching launch settings:', error)
    // Return safe defaults on error
    return DEFAULT_SETTINGS
  }
}

/**
 * Update a single launch setting
 */
export async function updateLaunchSetting(key: keyof LaunchSettings, value: string | boolean): Promise<void> {
  const stringValue = String(value)
  
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: stringValue, updatedAt: new Date() },
    create: { key, value: stringValue },
  })
}

/**
 * Check if public signups are allowed
 */
export async function isSignupAllowed(): Promise<boolean> {
  const settings = await getLaunchSettings()
  return settings.openSignups
}

/**
 * Check if the platform is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getLaunchSettings()
  return settings.maintenanceMode
}

/**
 * Check if the platform has launched
 */
export async function hasLaunched(): Promise<boolean> {
  const settings = await getLaunchSettings()
  return settings.launchAnnounced
}

/**
 * Check if beta badge should be shown
 */
export async function shouldShowBetaBadge(): Promise<boolean> {
  const settings = await getLaunchSettings()
  return !settings.betaBadgeRemoved
}
