import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { useAuth } from '../context/AuthContext'

interface Tool {
  id: string
  name: string
  description: string
  category: string
}

export default function ToolsScreen({ navigation }: any) {
  const { getToken } = useAuth()
  const [tools, setTools] = useState<Tool[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTools()
  }, [])

  async function fetchTools() {
    try {
      const token = await getToken()
      const response = await fetch('https://api.frithai.com/v1/tools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTools(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search tools..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredTools}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('ToolDetail', { tool: item })}
          >
            <Text style={styles.toolName}>{item.name}</Text>
            <Text style={styles.toolCategory}>{item.category}</Text>
            <Text style={styles.toolDescription} numberOfLines={2}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No tools found'}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  toolCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  toolName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  toolCategory: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  toolDescription: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 32 },
})
