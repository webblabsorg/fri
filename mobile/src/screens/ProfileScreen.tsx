import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
      </View>
      <Text style={styles.name}>{user?.name || 'User'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Account Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  email: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  section: { width: '100%', marginTop: 32 },
  menuItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8 },
  menuText: { fontSize: 16, color: '#111827' },
  logoutButton: { marginTop: 32, padding: 16, width: '100%' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600', textAlign: 'center' },
})
