/**
 * Settings Screen - Notification preferences and app settings
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import NotificationService from '../services/NotificationService'

interface NotificationSettings {
  enabled: boolean
  toolComplete: boolean
  usageAlerts: boolean
  securityAlerts: boolean
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    toolComplete: true,
    usageAlerts: true,
    securityAlerts: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = await NotificationService.getSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    
    // If disabling all notifications, disable individual types too
    if (key === 'enabled' && !value) {
      newSettings.toolComplete = false
      newSettings.usageAlerts = false
      newSettings.securityAlerts = false
    }
    
    setSettings(newSettings)
    
    try {
      await NotificationService.updateSettings(newSettings)
    } catch (error) {
      console.error('Error updating settings:', error)
      Alert.alert('Error', 'Failed to update notification settings')
    }
  }

  const clearBadge = async () => {
    try {
      await NotificationService.clearBadge()
      Alert.alert('Success', 'Badge cleared')
    } catch (error) {
      console.error('Error clearing badge:', error)
    }
  }

  const testNotification = async () => {
    try {
      await NotificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from Frith AI',
        { type: 'test' }
      )
      Alert.alert('Success', 'Test notification scheduled')
    } catch (error) {
      console.error('Error sending test notification:', error)
      Alert.alert('Error', 'Failed to send test notification')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications from Frith AI
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.enabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={[styles.settingRow, !settings.enabled && styles.disabledRow]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                Tool Completion
              </Text>
              <Text style={[styles.settingDescription, !settings.enabled && styles.disabledText]}>
                Notify when tool runs complete
              </Text>
            </View>
            <Switch
              value={settings.toolComplete}
              onValueChange={(value) => updateSetting('toolComplete', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.toolComplete ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={[styles.settingRow, !settings.enabled && styles.disabledRow]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                Usage Alerts
              </Text>
              <Text style={[styles.settingDescription, !settings.enabled && styles.disabledText]}>
                Notify about usage limits and billing
              </Text>
            </View>
            <Switch
              value={settings.usageAlerts}
              onValueChange={(value) => updateSetting('usageAlerts', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.usageAlerts ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={[styles.settingRow, !settings.enabled && styles.disabledRow]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                Security Alerts
              </Text>
              <Text style={[styles.settingDescription, !settings.enabled && styles.disabledText]}>
                Notify about security events
              </Text>
            </View>
            <Switch
              value={settings.securityAlerts}
              onValueChange={(value) => updateSetting('securityAlerts', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.securityAlerts ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={clearBadge}>
            <Text style={styles.actionButtonText}>Clear Badge</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={testNotification}>
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>1</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledRow: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  actionButton: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
})
