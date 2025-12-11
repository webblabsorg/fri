/**
 * Push Notification Service
 * Handles sending push notifications via FCM (Firebase Cloud Messaging) and APNs
 */

import { prisma } from '@/lib/db'

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
  sound?: string
  imageUrl?: string
}

export interface SendResult {
  success: boolean
  deviceId: string
  error?: string
}

/**
 * Send push notification to a specific device
 */
export async function sendToDevice(
  deviceId: string,
  payload: PushNotificationPayload
): Promise<SendResult> {
  try {
    const device = await prisma.mobileDevice.findUnique({
      where: { id: deviceId },
    })

    if (!device || !device.pushEnabled || !device.pushToken) {
      return { success: false, deviceId, error: 'Device not found, push disabled, or no token' }
    }

    let result: SendResult

    if (device.platform === 'ios') {
      result = await sendAPNS(device.pushToken, payload)
    } else if (device.platform === 'android') {
      result = await sendFCM(device.pushToken, payload)
    } else {
      return { success: false, deviceId, error: 'Unsupported platform' }
    }

    // Update last notification time
    await prisma.mobileDevice.update({
      where: { id: deviceId },
      data: { lastActiveAt: new Date() },
    })

    // Create notification record
    await prisma.pushNotification.create({
      data: {
        deviceId,
        userId: device.userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        status: result.success ? 'sent' : 'failed',
        sentAt: result.success ? new Date() : null,
        errorMsg: result.error,
      },
    })

    return { ...result, deviceId }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, deviceId, error: 'Internal error' }
  }
}

/**
 * Send push notification to all devices for a user
 */
export async function sendToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<SendResult[]> {
  const devices = await prisma.mobileDevice.findMany({
    where: {
      userId,
      pushEnabled: true,
    },
  })

  const results = await Promise.all(
    devices.map(device => sendToDevice(device.id, payload))
  )

  return results
}

/**
 * Send push notification to all users in an organization
 */
export async function sendToOrganization(
  organizationId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  })

  let sent = 0
  let failed = 0

  for (const member of members) {
    const results = await sendToUser(member.userId, payload)
    for (const result of results) {
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }
  }

  return { sent, failed }
}

/**
 * Send notification via Firebase Cloud Messaging (Android)
 */
async function sendFCM(
  pushToken: string,
  payload: PushNotificationPayload
): Promise<SendResult> {
  const fcmServerKey = process.env.FCM_SERVER_KEY

  if (!fcmServerKey) {
    console.warn('FCM_SERVER_KEY not configured')
    return { success: false, deviceId: '', error: 'FCM not configured' }
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: pushToken,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: payload.sound || 'default',
          image: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
        },
      }),
    })

    const result = await response.json()

    if (result.success === 1) {
      return { success: true, deviceId: '' }
    } else {
      return { success: false, deviceId: '', error: result.results?.[0]?.error || 'FCM error' }
    }
  } catch (error) {
    console.error('FCM send error:', error)
    return { success: false, deviceId: '', error: 'FCM request failed' }
  }
}

/**
 * Send notification via Apple Push Notification Service (iOS)
 */
async function sendAPNS(
  pushToken: string,
  payload: PushNotificationPayload
): Promise<SendResult> {
  const apnsKeyId = process.env.APNS_KEY_ID
  const apnsTeamId = process.env.APNS_TEAM_ID
  const apnsBundleId = process.env.APNS_BUNDLE_ID
  const apnsKey = process.env.APNS_KEY

  if (!apnsKeyId || !apnsTeamId || !apnsBundleId || !apnsKey) {
    console.warn('APNs not fully configured')
    return { success: false, deviceId: '', error: 'APNs not configured' }
  }

  try {
    // Generate JWT for APNs authentication
    const jwt = await generateAPNSJWT(apnsKeyId, apnsTeamId, apnsKey)

    const isProduction = process.env.NODE_ENV === 'production'
    const apnsHost = isProduction
      ? 'api.push.apple.com'
      : 'api.sandbox.push.apple.com'

    const response = await fetch(
      `https://${apnsHost}/3/device/${pushToken}`,
      {
        method: 'POST',
        headers: {
          'authorization': `bearer ${jwt}`,
          'apns-topic': apnsBundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
        },
        body: JSON.stringify({
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: payload.badge,
            sound: payload.sound || 'default',
          },
          ...payload.data,
        }),
      }
    )

    if (response.ok) {
      return { success: true, deviceId: '' }
    } else {
      const error = await response.json()
      return { success: false, deviceId: '', error: error.reason || 'APNs error' }
    }
  } catch (error) {
    console.error('APNs send error:', error)
    return { success: false, deviceId: '', error: 'APNs request failed' }
  }
}

/**
 * Generate JWT for APNs authentication
 * Note: In production, use a proper JWT library like jose
 */
async function generateAPNSJWT(
  keyId: string,
  teamId: string,
  privateKey: string
): Promise<string> {
  // This is a simplified implementation
  // In production, use a proper JWT library
  const header = {
    alg: 'ES256',
    kid: keyId,
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: teamId,
    iat: now,
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))

  // Note: Actual signing would require crypto operations with the private key
  // This is a placeholder - use jose or similar library in production
  const signature = 'placeholder_signature'

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Register a device for push notifications
 */
export async function registerDevice(
  userId: string,
  deviceId: string,
  platform: 'ios' | 'android',
  pushToken: string,
  deviceModel?: string,
  appVersion?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const device = await prisma.mobileDevice.upsert({
      where: { deviceId },
      update: {
        pushToken,
        pushEnabled: true,
        lastActiveAt: new Date(),
        appVersion,
      },
      create: {
        userId,
        deviceId,
        platform,
        pushToken,
        pushEnabled: true,
        model: deviceModel,
        appVersion,
      },
    })

    return { success: true, id: device.id }
  } catch (error) {
    console.error('Error registering device:', error)
    return { success: false, error: 'Failed to register device' }
  }
}

/**
 * Unregister a device from push notifications
 */
export async function unregisterDevice(deviceId: string): Promise<boolean> {
  try {
    await prisma.mobileDevice.update({
      where: { deviceId },
      data: { pushEnabled: false },
    })
    return true
  } catch (error) {
    console.error('Error unregistering device:', error)
    return false
  }
}
