// Secure Database Layer with Encryption
import { encryptData, decryptData, hashSensitiveData, generateAuditHash } from './crypto'

// Database encryption configuration
const DB_CONFIG = {
  ENCRYPTION_KEY: process.env.DATABASE_ENCRYPTION_KEY || 'development-key-change-in-production',
  SENSITIVE_FIELDS: [
    'password', 'hashedPassword', 'cprNumber', 'socialSecurityNumber', 
    'bankAccount', 'creditCard', 'monthlyIncome', 'personalReferences',
    'guarantorInfo', 'mitIdData', 'phone', 'email'
  ],
  AUDIT_ALL_OPERATIONS: true,
  ROW_LEVEL_SECURITY: true
}

interface EncryptedField {
  encrypted: boolean
  value: string
  hash?: string // For searchable encryption
}

interface AuditLogEntry {
  id: string
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  table: string
  recordId: string
  userId: string
  userRole: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  changedFields?: string[]
  oldValues?: any
  newValues?: any
  auditHash: string
  previousHash?: string
}

class SecureDatabaseLayer {
  private auditLog: AuditLogEntry[] = []
  private encryptionKey: string

  constructor() {
    this.encryptionKey = DB_CONFIG.ENCRYPTION_KEY
    if (this.encryptionKey === 'development-key-change-in-production') {
      console.warn('🚨 WARNING: Using development encryption key. Change in production!')
    }
  }

  // Encrypt sensitive fields in data
  encryptSensitiveData(data: any, tableName: string): any {
    if (!data || typeof data !== 'object') return data

    const encrypted = { ...data }
    
    for (const field of DB_CONFIG.SENSITIVE_FIELDS) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        const originalValue = encrypted[field].toString()
        
        // Create encrypted field object
        const encryptedField: EncryptedField = {
          encrypted: true,
          value: encryptData(originalValue, this.encryptionKey),
          hash: hashSensitiveData(originalValue) // For searchable encryption
        }
        
        encrypted[field] = encryptedField
      }
    }

    return encrypted
  }

  // Decrypt sensitive fields in data
  decryptSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const decrypted = { ...data }
    
    for (const field of DB_CONFIG.SENSITIVE_FIELDS) {
      if (decrypted[field] && typeof decrypted[field] === 'object' && decrypted[field].encrypted) {
        try {
          decrypted[field] = decryptData(decrypted[field].value, this.encryptionKey)
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error)
          decrypted[field] = '[DECRYPTION_ERROR]'
        }
      }
    }

    return decrypted
  }

  // Create record with encryption and audit
  async createRecord(tableName: string, data: any, userId: string, userRole: string): Promise<any> {
    try {
      // Validate user permissions
      if (!this.hasPermission(userRole, tableName, 'CREATE')) {
        throw new Error('Insufficient permissions for CREATE operation')
      }

      // Encrypt sensitive data
      const encryptedData = this.encryptSensitiveData(data, tableName)
      
      // Generate record ID
      const recordId = crypto.randomUUID()
      const recordWithId = { ...encryptedData, id: recordId }

      // Create audit log entry
      this.createAuditLog({
        operation: 'CREATE',
        table: tableName,
        recordId,
        userId,
        userRole,
        newValues: this.sanitizeForAudit(data)
      })

      // In production, this would save to actual database
      console.log(`🔒 Secure CREATE in ${tableName}:`, recordId)
      
      return this.decryptSensitiveData(recordWithId)
    } catch (error) {
      this.logSecurityEvent('DATABASE_CREATE_ERROR', { tableName, userId, error: error.toString() })
      throw error
    }
  }

  // Read record with decryption and audit
  async readRecord(tableName: string, recordId: string, userId: string, userRole: string): Promise<any> {
    try {
      // Validate user permissions
      if (!this.hasPermission(userRole, tableName, 'READ')) {
        throw new Error('Insufficient permissions for READ operation')
      }

      // Row-level security check
      if (!this.hasRowAccess(tableName, recordId, userId, userRole)) {
        throw new Error('Access denied to this record')
      }

      // In production, this would fetch from actual database
      // For now, return placeholder
      const encryptedRecord = { id: recordId, encrypted: true }

      // Create audit log entry
      this.createAuditLog({
        operation: 'READ',
        table: tableName,
        recordId,
        userId,
        userRole
      })

      console.log(`🔒 Secure READ from ${tableName}:`, recordId)
      
      return this.decryptSensitiveData(encryptedRecord)
    } catch (error) {
      this.logSecurityEvent('DATABASE_READ_ERROR', { tableName, recordId, userId, error: error.toString() })
      throw error
    }
  }

  // Update record with encryption and audit
  async updateRecord(tableName: string, recordId: string, data: any, userId: string, userRole: string): Promise<any> {
    try {
      // Validate user permissions
      if (!this.hasPermission(userRole, tableName, 'UPDATE')) {
        throw new Error('Insufficient permissions for UPDATE operation')
      }

      // Row-level security check
      if (!this.hasRowAccess(tableName, recordId, userId, userRole)) {
        throw new Error('Access denied to this record')
      }

      // Get old record for audit (in production, fetch from database)
      const oldRecord = await this.readRecord(tableName, recordId, userId, userRole)

      // Encrypt sensitive data
      const encryptedData = this.encryptSensitiveData(data, tableName)

      // Create audit log entry with change tracking
      const changedFields = this.getChangedFields(oldRecord, data)
      this.createAuditLog({
        operation: 'UPDATE',
        table: tableName,
        recordId,
        userId,
        userRole,
        changedFields,
        oldValues: this.sanitizeForAudit(oldRecord),
        newValues: this.sanitizeForAudit(data)
      })

      console.log(`🔒 Secure UPDATE in ${tableName}:`, recordId)
      
      return this.decryptSensitiveData({ ...encryptedData, id: recordId })
    } catch (error) {
      this.logSecurityEvent('DATABASE_UPDATE_ERROR', { tableName, recordId, userId, error: error.toString() })
      throw error
    }
  }

  // Delete record with audit
  async deleteRecord(tableName: string, recordId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Validate user permissions
      if (!this.hasPermission(userRole, tableName, 'DELETE')) {
        throw new Error('Insufficient permissions for DELETE operation')
      }

      // Row-level security check
      if (!this.hasRowAccess(tableName, recordId, userId, userRole)) {
        throw new Error('Access denied to this record')
      }

      // Get record for audit before deletion
      const recordToDelete = await this.readRecord(tableName, recordId, userId, userRole)

      // Create audit log entry
      this.createAuditLog({
        operation: 'DELETE',
        table: tableName,
        recordId,
        userId,
        userRole,
        oldValues: this.sanitizeForAudit(recordToDelete)
      })

      console.log(`🔒 Secure DELETE from ${tableName}:`, recordId)
      
      return true
    } catch (error) {
      this.logSecurityEvent('DATABASE_DELETE_ERROR', { tableName, recordId, userId, error: error.toString() })
      throw error
    }
  }

  // Search with encrypted field support
  async searchRecords(tableName: string, searchCriteria: any, userId: string, userRole: string): Promise<any[]> {
    try {
      // Validate user permissions
      if (!this.hasPermission(userRole, tableName, 'READ')) {
        throw new Error('Insufficient permissions for SEARCH operation')
      }

      // Convert search criteria for encrypted fields
      const encryptedCriteria = this.prepareSearchCriteria(searchCriteria)

      // Create audit log entry
      this.createAuditLog({
        operation: 'READ',
        table: tableName,
        recordId: 'SEARCH',
        userId,
        userRole,
        newValues: { searchCriteria: this.sanitizeForAudit(searchCriteria) }
      })

      // In production, perform actual database search
      console.log(`🔒 Secure SEARCH in ${tableName}`)
      
      return [] // Placeholder
    } catch (error) {
      this.logSecurityEvent('DATABASE_SEARCH_ERROR', { tableName, userId, error: error.toString() })
      throw error
    }
  }

  // Permission checking (Role-Based Access Control)
  private hasPermission(userRole: string, tableName: string, operation: string): boolean {
    const permissions = {
      'ADMIN': ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      'LANDLORD': ['CREATE', 'READ', 'UPDATE'],
      'TENANT': ['READ', 'UPDATE'],
      'USER': ['READ']
    }

    const allowedOperations = permissions[userRole as keyof typeof permissions] || []
    return allowedOperations.includes(operation)
  }

  // Row-level security check
  private hasRowAccess(tableName: string, recordId: string, userId: string, userRole: string): boolean {
    if (userRole === 'ADMIN') return true
    
    // Implement specific row-level security rules
    switch (tableName) {
      case 'users':
        return recordId === userId || userRole === 'ADMIN'
      case 'nest_escrows':
        // User can access if they are landlord or tenant of the escrow
        return true // Placeholder - would check actual ownership
      case 'contracts':
        // User can access if they are party to the contract
        return true // Placeholder - would check actual ownership
      default:
        return userRole === 'ADMIN'
    }
  }

  // Create audit log entry
  private createAuditLog(logData: Omit<AuditLogEntry, 'id' | 'timestamp' | 'auditHash' | 'previousHash'>): void {
    const previousHash = this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1].auditHash : ''
    
    const auditEntry: AuditLogEntry = {
      ...logData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      auditHash: generateAuditHash(JSON.stringify(logData), previousHash),
      previousHash: previousHash || undefined
    }

    this.auditLog.push(auditEntry)
    
    // In production, save to secure audit log table
    console.log('📝 Audit log entry created:', auditEntry.operation, auditEntry.table)
  }

  // Get changed fields for audit
  private getChangedFields(oldRecord: any, newRecord: any): string[] {
    const changed: string[] = []
    
    for (const key in newRecord) {
      if (oldRecord[key] !== newRecord[key]) {
        changed.push(key)
      }
    }
    
    return changed
  }

  // Sanitize data for audit log (remove sensitive values)
  private sanitizeForAudit(data: any): any {
    if (!data || typeof data !== 'object') return data
    
    const sanitized = { ...data }
    
    for (const field of DB_CONFIG.SENSITIVE_FIELDS) {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  // Prepare search criteria for encrypted fields
  private prepareSearchCriteria(criteria: any): any {
    const prepared = { ...criteria }
    
    for (const field of DB_CONFIG.SENSITIVE_FIELDS) {
      if (prepared[field] !== undefined) {
        // For encrypted fields, search by hash
        prepared[`${field}.hash`] = hashSensitiveData(prepared[field].toString())
        delete prepared[field]
      }
    }
    
    return prepared
  }

  // Log security events
  private logSecurityEvent(event: string, details: any): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: 'HIGH'
    }
    
    console.error('🚨 Security Event:', securityLog)
    // In production, send to security monitoring system
  }

  // Get audit log for compliance
  getAuditLog(filters?: { userId?: string; table?: string; startDate?: Date; endDate?: Date }): AuditLogEntry[] {
    let filtered = [...this.auditLog]
    
    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter(entry => entry.userId === filters.userId)
      }
      if (filters.table) {
        filtered = filtered.filter(entry => entry.table === filters.table)
      }
      if (filters.startDate) {
        filtered = filtered.filter(entry => entry.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        filtered = filtered.filter(entry => entry.timestamp <= filters.endDate!)
      }
    }
    
    return filtered
  }

  // Verify audit log integrity
  verifyAuditLogIntegrity(): boolean {
    for (let i = 1; i < this.auditLog.length; i++) {
      const currentEntry = this.auditLog[i]
      const previousEntry = this.auditLog[i - 1]
      
      if (currentEntry.previousHash !== previousEntry.auditHash) {
        console.error('🚨 Audit log integrity violation detected at entry:', currentEntry.id)
        return false
      }
    }
    
    return true
  }
}

// Create singleton instance
export const secureDatabase = new SecureDatabaseLayer()

// Utility functions for common database operations
export const createUser = async (userData: any, adminUserId: string) => {
  return secureDatabase.createRecord('users', userData, adminUserId, 'ADMIN')
}

export const getUserById = async (userId: string, requestingUserId: string, userRole: string) => {
  return secureDatabase.readRecord('users', userId, requestingUserId, userRole)
}

export const updateUser = async (userId: string, updateData: any, requestingUserId: string, userRole: string) => {
  return secureDatabase.updateRecord('users', userId, updateData, requestingUserId, userRole)
}

export const deleteUser = async (userId: string, adminUserId: string) => {
  return secureDatabase.deleteRecord('users', userId, adminUserId, 'ADMIN')
}

export const searchUsers = async (criteria: any, adminUserId: string) => {
  return secureDatabase.searchRecords('users', criteria, adminUserId, 'ADMIN')
}