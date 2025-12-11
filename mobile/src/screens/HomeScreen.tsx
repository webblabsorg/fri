import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useAuth } from '../context/AuthContext'

interface Stats {
  toolsRun: number
  tokensUsed: number
  savedTime: string
}

export default function HomeScreen({ navigation }: any) {
  const { user, getToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const token = await getToken()
      const response = await fetch('https://api.frithai.com/v1/usage?period=month', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({ toolsRun: data.runsCount, tokensUsed: data.tokensUsed, savedTime: '12h' })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.toolsRun || 0}</Text>
          <Text style={styles.statLabel}>Tools Run</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.tokensUsed?.toLocaleString() || 0}</Text>
          <Text style={styles.statLabel}>Tokens Used</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.savedTime || '0h'}</Text>
          <Text style={styles.statLabel}>Time Saved</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Tools')}>
        <Text style={styles.actionText}>Browse Tools</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('History')}>
        <Text style={styles.actionText}>View History</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 16, color: '#6B7280' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  actionButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, marginBottom: 12 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
})
