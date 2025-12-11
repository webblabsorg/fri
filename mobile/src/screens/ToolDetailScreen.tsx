import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function ToolDetailScreen({ route, navigation }: any) {
  const { tool } = route.params
  const { getToken } = useAuth()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function runTool() {
    if (!input.trim()) return
    setLoading(true)
    setOutput('')

    try {
      const token = await getToken()
      const response = await fetch('https://api.frithai.com/v1/tools/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, input: { text: input }, model: 'sonnet' }),
      })

      if (response.ok) {
        const data = await response.json()
        setOutput(data.output)
      } else {
        setOutput('Error running tool. Please try again.')
      }
    } catch (error) {
      setOutput('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.toolName}>{tool.name}</Text>
      <Text style={styles.toolCategory}>{tool.category}</Text>
      <Text style={styles.toolDescription}>{tool.description}</Text>

      <Text style={styles.label}>Input</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter your text here..."
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <TouchableOpacity style={[styles.runButton, loading && styles.runButtonDisabled]} onPress={runTool} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.runButtonText}>Run Tool</Text>}
      </TouchableOpacity>

      {output ? (
        <>
          <Text style={styles.label}>Output</Text>
          <View style={styles.outputContainer}>
            <Text style={styles.outputText}>{output}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  toolName: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  toolCategory: { fontSize: 14, color: '#3B82F6', marginTop: 4 },
  toolDescription: { fontSize: 16, color: '#6B7280', marginTop: 12, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  textInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 16, minHeight: 120, marginBottom: 16 },
  runButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  runButtonDisabled: { opacity: 0.7 },
  runButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  outputContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  outputText: { fontSize: 16, color: '#111827', lineHeight: 24 },
})
