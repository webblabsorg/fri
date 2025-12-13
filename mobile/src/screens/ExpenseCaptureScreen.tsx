import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { offlineExpenseService, GpsCoordinate } from '../services/OfflineExpenseService'
import { useAuth } from '../context/AuthContext'

interface ExpenseCaptureScreenProps {
  organizationId: string
  onExpenseSaved?: () => void
}

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'court_fees', label: 'Court Fees' },
  { value: 'filing_fees', label: 'Filing Fees' },
  { value: 'expert_witness', label: 'Expert Witness' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other' },
]

export default function ExpenseCaptureScreen({ organizationId, onExpenseSaved }: ExpenseCaptureScreenProps) {
  const { getToken, user } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [isBillable, setIsBillable] = useState(true)
  const [isMileage, setIsMileage] = useState(false)
  const [mileageDistance, setMileageDistance] = useState('')
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  // Mileage trip tracking
  const [isTripActive, setIsTripActive] = useState(false)
  const [tripStart, setTripStart] = useState<GpsCoordinate | null>(null)
  const [tripEnd, setTripEnd] = useState<GpsCoordinate | null>(null)
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null)

  useEffect(() => {
    initializeService()
    loadPendingCount()
    checkOnlineStatus()
    setIsTripActive(offlineExpenseService.isTripInProgress())
  }, [])

  const initializeService = async () => {
    // Configure the service with auth token and API URL
    const token = await getToken()
    if (token) {
      offlineExpenseService.setAuthToken(token)
    }
    // Use environment variable or default to production API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://app.frithai.com'
    offlineExpenseService.setApiBaseUrl(apiUrl)
  }

  const loadPendingCount = async () => {
    const count = await offlineExpenseService.getPendingCount()
    setPendingCount(count)
  }

  const checkOnlineStatus = async () => {
    const online = await offlineExpenseService.isOnline()
    setIsOnline(online)
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to capture receipts.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri)
    }
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed to select receipts.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri)
    }
  }

  const handleStartTrip = async () => {
    const coord = await offlineExpenseService.startMileageTrip()
    if (coord) {
      setTripStart(coord)
      setIsTripActive(true)
      Alert.alert('Trip Started', 'GPS tracking has begun. Drive to your destination and tap "End Trip".')
    } else {
      Alert.alert('Location Error', 'Could not get your current location. Please enable location services.')
    }
  }

  const handleEndTrip = async () => {
    const tripData = await offlineExpenseService.endMileageTrip()
    if (tripData) {
      setTripEnd(tripData.endCoordinate)
      setCalculatedDistance(tripData.distanceMiles)
      setMileageDistance(tripData.distanceMiles.toString())
      setIsTripActive(false)
      Alert.alert(
        'Trip Ended',
        `Distance: ${tripData.distanceMiles.toFixed(2)} miles\nDuration: ${tripData.durationMinutes} minutes`
      )
    } else {
      Alert.alert('Location Error', 'Could not get your current location.')
    }
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.')
      return
    }

    if (!isMileage && !amount.trim()) {
      Alert.alert('Error', 'Please enter an amount.')
      return
    }

    if (isMileage && !mileageDistance.trim()) {
      Alert.alert('Error', 'Please enter mileage distance or use GPS tracking.')
      return
    }

    setIsSubmitting(true)

    try {
      let savedReceiptUri: string | undefined
      if (receiptUri) {
        savedReceiptUri = await offlineExpenseService.saveReceiptLocally(
          receiptUri,
          `temp_${Date.now()}`
        )
      }

      await offlineExpenseService.addExpenseToQueue({
        organizationId,
        description: description.trim(),
        amount: isMileage ? 0 : parseFloat(amount),
        currency: 'USD',
        category,
        expenseDate: new Date().toISOString(),
        isBillable,
        isMileage,
        mileageDistance: isMileage ? parseFloat(mileageDistance) : undefined,
        mileageStart: tripStart ? `${tripStart.latitude},${tripStart.longitude}` : undefined,
        mileageEnd: tripEnd ? `${tripEnd.latitude},${tripEnd.longitude}` : undefined,
        startCoordinate: tripStart || undefined,
        endCoordinate: tripEnd || undefined,
        receiptUri: savedReceiptUri,
        receiptPending: !!savedReceiptUri,
      })

      // Reset form
      setDescription('')
      setAmount('')
      setCategory('other')
      setIsBillable(true)
      setIsMileage(false)
      setMileageDistance('')
      setReceiptUri(null)
      setTripStart(null)
      setTripEnd(null)
      setCalculatedDistance(null)

      await loadPendingCount()

      Alert.alert(
        'Expense Saved',
        isOnline
          ? 'Expense saved and will sync automatically.'
          : 'Expense saved offline. It will sync when you have internet connection.'
      )

      onExpenseSaved?.()
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense. Please try again.')
      console.error('Failed to save expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSync = async () => {
    setIsSubmitting(true)
    try {
      const result = await offlineExpenseService.syncAll()
      await loadPendingCount()

      if (result.success) {
        Alert.alert('Sync Complete', `${result.synced} expense(s) synced successfully.`)
      } else {
        Alert.alert(
          'Sync Partial',
          `Synced: ${result.synced}, Failed: ${result.failed}\n${result.errors.map((e) => e.error).join('\n')}`
        )
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync expenses.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture Expense</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          {pendingCount > 0 && (
            <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
              <Text style={styles.syncButtonText}>Sync ({pendingCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expense Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !isMileage && styles.toggleActive]}
          onPress={() => setIsMileage(false)}
        >
          <Text style={[styles.toggleText, !isMileage && styles.toggleTextActive]}>Regular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isMileage && styles.toggleActive]}
          onPress={() => setIsMileage(true)}
        >
          <Text style={[styles.toggleText, isMileage && styles.toggleTextActive]}>Mileage</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter expense description"
          placeholderTextColor="#666"
        />
      </View>

      {/* Amount or Mileage */}
      {isMileage ? (
        <View style={styles.field}>
          <Text style={styles.label}>Mileage (miles) *</Text>
          <View style={styles.mileageRow}>
            <TextInput
              style={[styles.input, styles.mileageInput]}
              value={mileageDistance}
              onChangeText={setMileageDistance}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
            {!isTripActive ? (
              <TouchableOpacity style={styles.gpsButton} onPress={handleStartTrip}>
                <Text style={styles.gpsButtonText}>Start Trip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.gpsButton, styles.gpsButtonActive]} onPress={handleEndTrip}>
                <Text style={styles.gpsButtonText}>End Trip</Text>
              </TouchableOpacity>
            )}
          </View>
          {calculatedDistance !== null && (
            <Text style={styles.gpsInfo}>GPS calculated: {calculatedDistance.toFixed(2)} miles</Text>
          )}
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Amount (USD) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
        </View>
      )}

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryChip, category === cat.value && styles.categoryChipActive]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={[styles.categoryText, category === cat.value && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Billable Toggle */}
      <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsBillable(!isBillable)}>
        <View style={[styles.checkbox, isBillable && styles.checkboxChecked]}>
          {isBillable && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Billable to client</Text>
      </TouchableOpacity>

      {/* Receipt */}
      <View style={styles.field}>
        <Text style={styles.label}>Receipt</Text>
        {receiptUri ? (
          <View style={styles.receiptPreview}>
            <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
            <TouchableOpacity style={styles.removeReceipt} onPress={() => setReceiptUri(null)}>
              <Text style={styles.removeReceiptText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.receiptButtons}>
            <TouchableOpacity style={styles.receiptButton} onPress={handleTakePhoto}>
              <Text style={styles.receiptButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.receiptButton} onPress={handlePickImage}>
              <Text style={styles.receiptButtonText}>🖼️ Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Save Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  online: {
    backgroundColor: '#4ade80',
  },
  offline: {
    backgroundColor: '#f87171',
  },
  statusText: {
    color: '#888',
    fontSize: 14,
  },
  syncButton: {
    marginLeft: 'auto',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  mileageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mileageInput: {
    flex: 1,
  },
  gpsButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  gpsButtonActive: {
    backgroundColor: '#dc2626',
  },
  gpsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  gpsInfo: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 6,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#000',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#333',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  checkmark: {
    color: '#000',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  receiptButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  receiptButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  receiptPreview: {
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeReceipt: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeReceiptText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
