/**
 * Encryption utilities for sensitive data
 * 
 * Uses AES-256-GCM for encryption with a key derived from environment variable.
 * For production, consider using a Key Management Service (AWS KMS, Azure Key Vault, etc.)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment
 * In production, this should come from a secure key management service
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TRUST_ACCOUNT_ENCRYPTION_KEY
  
  if (!key) {
    // In development, use a default key (NOT for production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Crypto] Using default encryption key - NOT SECURE FOR PRODUCTION')
      return crypto.scryptSync('dev-default-key-not-for-production', 'salt', 32)
    }
    throw new Error('TRUST_ACCOUNT_ENCRYPTION_KEY environment variable is required')
  }
  
  // Derive a 32-byte key from the provided key using scrypt
  return crypto.scryptSync(key, 'frith-trust-salt', 32)
}

/**
 * Encrypt sensitive data
 * Returns a base64-encoded string containing IV + encrypted data + auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext
  
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'base64'),
    authTag,
  ])
  
  return combined.toString('base64')
}

/**
 * Decrypt sensitive data
 * Expects a base64-encoded string containing IV + encrypted data + auth tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData
  
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Mask sensitive data for display (show only last 4 characters)
 */
export function mask(value: string, showLast = 4): string {
  if (!value || value.length <= showLast) {
    return '••••'
  }
  return '••••' + value.slice(-showLast)
}

/**
 * Check if a value appears to be encrypted (base64 with expected length)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  
  try {
    const decoded = Buffer.from(value, 'base64')
    // Minimum length: IV (16) + some data (1) + auth tag (16) = 33 bytes
    return decoded.length >= 33 && value.length > 44
  } catch {
    return false
  }
}

/**
 * Encrypt if not already encrypted
 */
export function encryptIfNeeded(value: string): string {
  if (!value) return value
  if (isEncrypted(value)) return value
  return encrypt(value)
}

/**
 * Decrypt if encrypted, otherwise return as-is
 */
export function decryptIfNeeded(value: string): string {
  if (!value) return value
  if (!isEncrypted(value)) return value
  return decrypt(value)
}

/**
 * Hash sensitive data (one-way, for comparison purposes)
 */
export function hash(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
}
