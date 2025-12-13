import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import * as Location from 'expo-location'
import NetInfo from '@react-native-community/netinfo'

// ============================================================================
// OFFLINE EXPENSE SERVICE
// Handles offline-first expense capture with GPS and background sync
// ============================================================================

const OFFLINE_QUEUE_KEY = 'frith:offline_expenses'
const PENDING_RECEIPTS_KEY = 'frith:pending_receipts'
const SYNC_STATUS_KEY = 'frith:sync_status'

export interface GpsCoordinate {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
}

export interface OfflineExpense {
  id: string
  organizationId: string
  description: string
  amount: number
  currency: string
  category: string
  expenseDate: string
  isBillable: boolean
  isMileage: boolean
  mileageDistance?: number
  mileageStart?: string
  mileageEnd?: string
  startCoordinate?: GpsCoordinate
  endCoordinate?: GpsCoordinate
  receiptUri?: string
  receiptPending?: boolean
  vendorName?: string
  matterId?: string
  notes?: string
  createdAt: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  syncError?: string
  retryCount: number
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

class OfflineExpenseService {
  private apiBaseUrl: string
  private authToken: string | null = null
  private isSyncing = false

  constructor(apiBaseUrl: string = '') {
    this.apiBaseUrl = apiBaseUrl
  }

  setApiBaseUrl(url: string) {
    this.apiBaseUrl = url
  }

  setAuthToken(token: string | null) {
    this.authToken = token
  }

  // ============================================================================
  // GPS / Location
  // ============================================================================

  async requestLocationPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === 'granted'
  }

  async getCurrentLocation(): Promise<GpsCoordinate | null> {
    try {
      const hasPermission = await this.requestLocationPermission()
      if (!hasPermission) return null

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      }
    } catch (error) {
      console.error('Failed to get location:', error)
      return null
    }
  }

  calculateDistanceMiles(start: GpsCoordinate, end: GpsCoordinate): number {
    const R = 3959 // Earth's radius in miles
    const lat1 = (start.latitude * Math.PI) / 180
    const lat2 = (end.latitude * Math.PI) / 180
    const deltaLat = ((end.latitude - start.latitude) * Math.PI) / 180
    const deltaLon = ((end.longitude - start.longitude) * Math.PI) / 180

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 100) / 100
  }

  // ============================================================================
  // Offline Queue Management
  // ============================================================================

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getOfflineQueue(): Promise<OfflineExpense[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get offline queue:', error)
      return []
    }
  }

  async saveOfflineQueue(queue: OfflineExpense[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  async addExpenseToQueue(expense: Omit<OfflineExpense, 'id' | 'createdAt' | 'syncStatus' | 'retryCount'>): Promise<OfflineExpense> {
    const newExpense: OfflineExpense = {
      ...expense,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    }

    const queue = await this.getOfflineQueue()
    queue.push(newExpense)
    await this.saveOfflineQueue(queue)

    // Try to sync immediately if online
    this.trySyncInBackground()

    return newExpense
  }

  async updateExpenseInQueue(id: string, updates: Partial<OfflineExpense>): Promise<void> {
    const queue = await this.getOfflineQueue()
    const index = queue.findIndex((e) => e.id === id)
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates }
      await this.saveOfflineQueue(queue)
    }
  }

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getOfflineQueue()
    const filtered = queue.filter((e) => e.id !== id)
    await this.saveOfflineQueue(filtered)
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getOfflineQueue()
    return queue.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'failed').length
  }

  // ============================================================================
  // Receipt Storage
  // ============================================================================

  async saveReceiptLocally(uri: string, expenseId: string): Promise<string> {
    try {
      const directory = `${FileSystem.documentDirectory}receipts/`
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true })

      const extension = uri.split('.').pop() || 'jpg'
      const filename = `${expenseId}.${extension}`
      const localUri = `${directory}${filename}`

      await FileSystem.copyAsync({ from: uri, to: localUri })

      return localUri
    } catch (error) {
      console.error('Failed to save receipt locally:', error)
      throw error
    }
  }

  async deleteLocalReceipt(localUri: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(localUri)
      if (info.exists) {
        await FileSystem.deleteAsync(localUri)
      }
    } catch (error) {
      console.error('Failed to delete local receipt:', error)
    }
  }

  // ============================================================================
  // Network & Sync
  // ============================================================================

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch()
    return state.isConnected === true
  }

  async trySyncInBackground(): Promise<void> {
    if (this.isSyncing) return

    const online = await this.isOnline()
    if (!online) return

    // Don't await - run in background
    this.syncAll().catch((err) => console.error('Background sync failed:', err))
  }

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: [{ id: '', error: 'Sync already in progress' }] }
    }

    this.isSyncing = true
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const online = await this.isOnline()
      if (!online) {
        return { success: false, synced: 0, failed: 0, errors: [{ id: '', error: 'No network connection' }] }
      }

      const queue = await this.getOfflineQueue()
      const pending = queue.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'failed')

      for (const expense of pending) {
        try {
          await this.syncExpense(expense)
          result.synced++
        } catch (error) {
          result.failed++
          result.errors.push({ id: expense.id, error: (error as Error).message })
        }
      }

      result.success = result.failed === 0
    } finally {
      this.isSyncing = false
    }

    return result
  }

  private async syncExpense(expense: OfflineExpense): Promise<void> {
    await this.updateExpenseInQueue(expense.id, { syncStatus: 'syncing' })

    try {
      // First create the expense
      const expenseResponse = await fetch(`${this.apiBaseUrl}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${this.authToken}`,
        },
        body: JSON.stringify({
          organizationId: expense.organizationId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          expenseDate: expense.expenseDate,
          isBillable: expense.isBillable,
          isMileage: expense.isMileage,
          mileageDistance: expense.mileageDistance,
          mileageStart: expense.mileageStart,
          mileageEnd: expense.mileageEnd,
          matterId: expense.matterId,
          vendorName: expense.vendorName,
        }),
      })

      if (!expenseResponse.ok) {
        const errorData = await expenseResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${expenseResponse.status}`)
      }

      const { expense: createdExpense } = await expenseResponse.json()

      // Upload receipt if present
      if (expense.receiptUri && expense.receiptPending) {
        await this.uploadReceipt(createdExpense.id, expense.organizationId, expense.receiptUri)
        await this.deleteLocalReceipt(expense.receiptUri)
      }

      // Mark as synced and remove from queue
      await this.removeFromQueue(expense.id)
    } catch (error) {
      const retryCount = expense.retryCount + 1
      const maxRetries = 3

      if (retryCount >= maxRetries) {
        await this.updateExpenseInQueue(expense.id, {
          syncStatus: 'failed',
          syncError: (error as Error).message,
          retryCount,
        })
      } else {
        await this.updateExpenseInQueue(expense.id, {
          syncStatus: 'pending',
          syncError: (error as Error).message,
          retryCount,
        })
      }

      throw error
    }
  }

  private async uploadReceipt(expenseId: string, organizationId: string, localUri: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(localUri)
    if (!fileInfo.exists) {
      console.warn('Receipt file not found:', localUri)
      return
    }

    const formData = new FormData()
    formData.append('organizationId', organizationId)
    formData.append('expenseId', expenseId)
    formData.append('file', {
      uri: localUri,
      type: 'image/jpeg',
      name: `receipt_${expenseId}.jpg`,
    } as any)

    const response = await fetch(`${this.apiBaseUrl}/api/expenses/upload-receipt`, {
      method: 'POST',
      headers: {
        Cookie: `session=${this.authToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Receipt upload failed: HTTP ${response.status}`)
    }
  }

  // ============================================================================
  // Mileage Trip Tracking
  // ============================================================================

  private tripStartCoordinate: GpsCoordinate | null = null
  private tripStartTime: number | null = null

  async startMileageTrip(): Promise<GpsCoordinate | null> {
    const coord = await this.getCurrentLocation()
    if (coord) {
      this.tripStartCoordinate = coord
      this.tripStartTime = Date.now()
    }
    return coord
  }

  async endMileageTrip(): Promise<{
    startCoordinate: GpsCoordinate
    endCoordinate: GpsCoordinate
    distanceMiles: number
    durationMinutes: number
  } | null> {
    if (!this.tripStartCoordinate || !this.tripStartTime) {
      return null
    }

    const endCoordinate = await this.getCurrentLocation()
    if (!endCoordinate) {
      return null
    }

    const distanceMiles = this.calculateDistanceMiles(this.tripStartCoordinate, endCoordinate)
    const durationMinutes = Math.round((Date.now() - this.tripStartTime) / 60000)

    const result = {
      startCoordinate: this.tripStartCoordinate,
      endCoordinate,
      distanceMiles,
      durationMinutes,
    }

    // Reset trip state
    this.tripStartCoordinate = null
    this.tripStartTime = null

    return result
  }

  isTripInProgress(): boolean {
    return this.tripStartCoordinate !== null
  }

  // ============================================================================
  // Sync Status
  // ============================================================================

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(SYNC_STATUS_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        return new Date(parsed.lastSync)
      }
    } catch (error) {
      console.error('Failed to get sync status:', error)
    }
    return null
  }

  async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({ lastSync: new Date().toISOString() })
      )
    } catch (error) {
      console.error('Failed to update sync status:', error)
    }
  }
}

export const offlineExpenseService = new OfflineExpenseService()
export default offlineExpenseService
