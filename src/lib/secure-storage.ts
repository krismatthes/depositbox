// Secure storage utility to replace unsafe localStorage usage
import { encryptData, decryptData, generateSecureToken } from './crypto'

// Storage encryption key - in production this should be from secure environment
const STORAGE_KEY = typeof window !== 'undefined' ? 
  sessionStorage.getItem('__storage_key') || (() => {
    const key = generateSecureToken(32)
    sessionStorage.setItem('__storage_key', key)
    return key
  })() : 'server-key'

interface SecureStorageOptions {
  expiry?: number // Expiry time in milliseconds
  encrypt?: boolean // Whether to encrypt the data
}

interface StoredData<T> {
  data: T
  timestamp: number
  expiry?: number
  encrypted: boolean
}

class SecureStorage {
  private prefix = '__secure_'

  // Store data securely
  setItem<T>(key: string, value: T, options: SecureStorageOptions = {}): void {
    if (typeof window === 'undefined') return

    try {
      const storedData: StoredData<T> = {
        data: value,
        timestamp: Date.now(),
        expiry: options.expiry,
        encrypted: options.encrypt ?? true
      }

      let serialized = JSON.stringify(storedData)
      
      if (options.encrypt !== false) {
        serialized = encryptData(serialized, STORAGE_KEY)
      }

      sessionStorage.setItem(this.prefix + key, serialized)
    } catch (error) {
      console.error('Secure storage error:', error)
    }
  }

  // Retrieve data securely
  getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = sessionStorage.getItem(this.prefix + key)
      if (!stored) return null

      let parsedData: StoredData<T>

      // Try to decrypt first, fallback to plain JSON if not encrypted
      try {
        const decrypted = decryptData(stored, STORAGE_KEY)
        parsedData = JSON.parse(decrypted)
      } catch {
        parsedData = JSON.parse(stored)
      }

      // Check expiry
      if (parsedData.expiry && Date.now() > parsedData.timestamp + parsedData.expiry) {
        this.removeItem(key)
        return null
      }

      return parsedData.data
    } catch (error) {
      console.error('Secure storage retrieval error:', error)
      return null
    }
  }

  // Remove item
  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(this.prefix + key)
  }

  // Clear all secure storage
  clear(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key)
      }
    })
  }

  // Store with automatic expiry (for session data)
  setSessionItem<T>(key: string, value: T, expireMinutes: number = 30): void {
    this.setItem(key, value, {
      expiry: expireMinutes * 60 * 1000,
      encrypt: true
    })
  }

  // Store temporary data (5 minutes default)
  setTempItem<T>(key: string, value: T, expireMinutes: number = 5): void {
    this.setItem(key, value, {
      expiry: expireMinutes * 60 * 1000,
      encrypt: true
    })
  }

  // Check if item exists and is not expired
  hasItem(key: string): boolean {
    return this.getItem(key) !== null
  }

  // Get all secure storage keys (for debugging/cleanup)
  getKeys(): string[] {
    if (typeof window === 'undefined') return []
    
    return Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''))
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage()

// Utility functions for common patterns
export const storeUserSession = (user: any, token: string) => {
  secureStorage.setSessionItem('user', user, 30) // 30 minutes
  secureStorage.setSessionItem('auth_token', token, 30)
}

export const getUserSession = () => {
  const user = secureStorage.getItem('user')
  const token = secureStorage.getItem('auth_token')
  return { user, token }
}

export const clearUserSession = () => {
  secureStorage.removeItem('user')
  secureStorage.removeItem('auth_token')
  secureStorage.removeItem('csrf_token')
}

// Migration utility to move data from localStorage to secure storage
export const migrateFromLocalStorage = () => {
  if (typeof window === 'undefined') return

  const keysToMigrate = [
    'user', 'auth_token', 'created_contracts', 'escrows', 
    'handoverReports', 'roomie_agreements', 'budget_data'
  ]

  keysToMigrate.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        secureStorage.setSessionItem(key, parsed)
        localStorage.removeItem(key) // Remove from localStorage
      } catch (error) {
        console.warn(`Failed to migrate ${key}:`, error)
      }
    }
  })

  console.log('🔒 Data migrated from localStorage to secure storage')
}