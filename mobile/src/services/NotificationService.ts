/**
 * Push Notification Service for Mobile App
 */

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export interface NotificationData {
  type: 'tool_complete' | 'usage_alert' | 'security_alert' | 'general'
  title: string
  body: string
  data?: Record<string, any>
}

class NotificationService {
  private pushToken: string | null = null

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices')
      return false
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied')
      return false
    }

    // Get push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      })
      this.pushToken = token.data
      console.log('Push token:', this.pushToken)

      // Store token locally
      await AsyncStorage.setItem('pushToken', this.pushToken)

      // Register token with backend
      await this.registerTokenWithBackend()

      return true
    } catch (error) {
      console.error('Error getting push token:', error)
      return false
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(): Promise<void> {
    if (!this.pushToken) return

    try {
      const authToken = await AsyncStorage.getItem('authToken')
      if (!authToken) return

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/mobile/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceId: await this.getDeviceId(),
          platform: Platform.OS,
          pushToken: this.pushToken,
          model: Device.modelName,
          osVersion: Device.osVersion,
          appVersion: '1.0.0',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to register device')
      }

      console.log('Device registered successfully')
    } catch (error) {
      console.error('Error registering device:', error)
    }
  }

  /**
   * Get unique device identifier
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await AsyncStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null,
    })

    return notificationId
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<{
    enabled: boolean
    toolComplete: boolean
    usageAlerts: boolean
    securityAlerts: boolean
  }> {
    const settings = await AsyncStorage.getItem('notificationSettings')
    if (settings) {
      return JSON.parse(settings)
    }

    // Default settings
    return {
      enabled: true,
      toolComplete: true,
      usageAlerts: true,
      securityAlerts: true,
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: {
    enabled: boolean
    toolComplete: boolean
    usageAlerts: boolean
    securityAlerts: boolean
  }): Promise<void> {
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings))

    // Update backend preferences
    try {
      const authToken = await AsyncStorage.getItem('authToken')
      if (!authToken) return

      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/mobile/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  /**
   * Handle notification received while app is running
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void): void {
    Notifications.addNotificationReceivedListener(callback)
  }

  /**
   * Handle notification tap
   */
  onNotificationTap(callback: (response: Notifications.NotificationResponse) => void): void {
    Notifications.addNotificationResponseReceivedListener(callback)
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync()
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count)
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0)
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken
  }
}

export default new NotificationService()
