import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useAuth } from '../context/AuthContext'

interface Run {
  id: string
  toolName: string
  status: string
  createdAt: string
  tokensUsed: number
}

export default function HistoryScreen() {
  const { getToken } = useAuth()
  const [runs, setRuns] = useState<Run[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const token = await getToken()
      const response = await fetch('https://api.frithai.com/v1/runs?pageSize=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setRuns(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchHistory()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={runs}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.runCard}>
            <View style={styles.runHeader}>
              <Text style={styles.toolName}>{item.toolName}</Text>
              <Text style={[styles.status, item.status === 'completed' ? styles.statusSuccess : styles.statusError]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()} • {item.tokensUsed} tokens</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No history yet</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  runCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  runHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  status: { fontSize: 12, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusSuccess: { backgroundColor: '#D1FAE5', color: '#065F46' },
  statusError: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 32 },
})
