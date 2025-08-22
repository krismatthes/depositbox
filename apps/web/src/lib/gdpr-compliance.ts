// GDPR Compliance Framework
import { secureStorage } from './secure-storage'
import { anonymizePersonalData, hashSensitiveData, generateAuditHash } from './crypto'

// GDPR Configuration
export const GDPR_CONFIG = {
  DATA_RETENTION_DAYS: 2555, // 7 years for financial data
  ANONYMIZATION_AFTER_DAYS: 90, // Anonymize after 90 days of inactivity
  CONSENT_EXPIRY_DAYS: 365, // Consent expires after 1 year
  COOKIE_EXPIRY_DAYS: 30,
  PROCESSING_LAWFUL_BASIS: {
    CONTRACT: 'contract', // For lease contracts and escrow
    CONSENT: 'consent', // For marketing and analytics
    LEGAL_OBLIGATION: 'legal_obligation', // For tax and regulatory requirements
    LEGITIMATE_INTEREST: 'legitimate_interest' // For fraud prevention
  }
} as const

// Data Processing Categories
export enum DataCategory {
  PERSONAL_BASIC = 'personal_basic', // Name, email, phone
  FINANCIAL = 'financial', // Income, bank details, deposits
  SPECIAL_CATEGORY = 'special_category', // CPR numbers (biometric data equivalent)
  BEHAVIORAL = 'behavioral', // Usage analytics, preferences
  TECHNICAL = 'technical', // IP addresses, cookies, device info
  COMMUNICATION = 'communication' // Messages, chat logs
}

// Consent Types
export enum ConsentType {
  ESSENTIAL = 'essential', // Required for service operation
  ANALYTICS = 'analytics', // Usage tracking and analytics
  MARKETING = 'marketing', // Marketing communications
  FUNCTIONAL = 'functional', // Enhanced features
  THIRD_PARTY = 'third_party' // Third-party integrations
}

// Data Processing Purpose
export enum ProcessingPurpose {
  SERVICE_DELIVERY = 'service_delivery',
  FRAUD_PREVENTION = 'fraud_prevention',
  LEGAL_COMPLIANCE = 'legal_compliance',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  COMMUNICATION = 'communication'
}

interface ConsentRecord {
  userId: string
  consentType: ConsentType
  granted: boolean
  timestamp: Date
  lawfulBasis: string
  purpose: ProcessingPurpose[]
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  consentString?: string // For cookie consent
}

interface DataProcessingRecord {
  id: string
  userId: string
  dataCategory: DataCategory
  purpose: ProcessingPurpose
  lawfulBasis: string
  processingDate: Date
  dataRetentionUntil: Date
  isAnonymized: boolean
  auditHash: string
}

interface DataSubjectRequest {
  id: string
  userId: string
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  requestDate: Date
  completionDeadline: Date
  completedDate?: Date
  requestDetails: string
  responseData?: string
  rejectionReason?: string
}

class GDPRCompliance {
  private consentStore = 'gdpr_consent'
  private processingStore = 'gdpr_processing'
  private requestStore = 'gdpr_requests'
  private auditStore = 'gdpr_audit'

  // Consent Management
  recordConsent(consent: Omit<ConsentRecord, 'timestamp' | 'expiresAt'>): void {
    const record: ConsentRecord = {
      ...consent,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + GDPR_CONFIG.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    }

    const existingConsents = this.getConsents(consent.userId)
    const updatedConsents = existingConsents.filter(c => c.consentType !== consent.consentType)
    updatedConsents.push(record)

    secureStorage.setItem(`${this.consentStore}_${consent.userId}`, updatedConsents)
    this.auditLog('CONSENT_RECORDED', consent.userId, record)
  }

  getConsents(userId: string): ConsentRecord[] {
    return secureStorage.getItem(`${this.consentStore}_${userId}`) || []
  }

  hasValidConsent(userId: string, consentType: ConsentType): boolean {
    const consents = this.getConsents(userId)
    const consent = consents.find(c => c.consentType === consentType)
    
    if (!consent || !consent.granted) return false
    if (new Date() > consent.expiresAt) return false
    
    return true
  }

  // Data Processing Records
  recordDataProcessing(processing: Omit<DataProcessingRecord, 'id' | 'processingDate' | 'auditHash'>): void {
    const record: DataProcessingRecord = {
      ...processing,
      id: crypto.randomUUID(),
      processingDate: new Date(),
      auditHash: generateAuditHash(JSON.stringify(processing))
    }

    const existingRecords = secureStorage.getItem(`${this.processingStore}_${processing.userId}`) || []
    existingRecords.push(record)
    secureStorage.setItem(`${this.processingStore}_${processing.userId}`, existingRecords)
    
    this.auditLog('DATA_PROCESSED', processing.userId, record)
  }

  getProcessingRecords(userId: string): DataProcessingRecord[] {
    return secureStorage.getItem(`${this.processingStore}_${userId}`) || []
  }

  // Data Subject Rights
  submitDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestDate' | 'completionDeadline' | 'status'>): string {
    const requestId = crypto.randomUUID()
    const requestRecord: DataSubjectRequest = {
      ...request,
      id: requestId,
      requestDate: new Date(),
      completionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'pending'
    }

    const existingRequests = secureStorage.getItem(this.requestStore) || []
    existingRequests.push(requestRecord)
    secureStorage.setItem(this.requestStore, existingRequests)

    this.auditLog('DATA_SUBJECT_REQUEST', request.userId, requestRecord)
    return requestId
  }

  // Right to Access - Article 15
  generateDataExport(userId: string): any {
    const userData = {
      personalData: this.getPersonalData(userId),
      processingRecords: this.getProcessingRecords(userId),
      consents: this.getConsents(userId),
      communicationHistory: this.getCommunicationHistory(userId),
      financialData: this.getFinancialData(userId)
    }

    this.auditLog('DATA_ACCESS_REQUEST', userId, { exportGenerated: true })
    return userData
  }

  // Right to Erasure - Article 17
  async eraseUserData(userId: string, reason: string): Promise<boolean> {
    try {
      // Check if erasure is legally permissible
      if (!this.canEraseData(userId)) {
        return false
      }

      // Remove all user data
      this.removePersonalData(userId)
      this.removeProcessingRecords(userId)
      this.removeConsents(userId)
      this.removeCommunicationHistory(userId)
      
      // Keep anonymized records for legal compliance
      this.createAnonymizedRecord(userId, reason)
      
      this.auditLog('DATA_ERASED', userId, { reason, timestamp: new Date() })
      return true
    } catch (error) {
      this.auditLog('DATA_ERASURE_ERROR', userId, { error: error.toString() })
      return false
    }
  }

  // Right to Data Portability - Article 20
  generatePortabilityExport(userId: string): any {
    const portableData = {
      profile: this.getPersonalData(userId),
      preferences: this.getUserPreferences(userId),
      documents: this.getUserDocuments(userId),
      contracts: this.getUserContracts(userId)
    }

    this.auditLog('DATA_PORTABILITY_REQUEST', userId, { exportGenerated: true })
    return portableData
  }

  // Data Anonymization
  anonymizeInactiveUsers(): void {
    const cutoffDate = new Date(Date.now() - GDPR_CONFIG.ANONYMIZATION_AFTER_DAYS * 24 * 60 * 60 * 1000)
    
    // This would iterate through all users in a real database
    // For now, this is a placeholder for the anonymization process
    this.auditLog('ANONYMIZATION_PROCESS', 'SYSTEM', { cutoffDate, timestamp: new Date() })
  }

  // Cookie Consent Management
  setCookieConsent(consentData: any): void {
    const consentString = this.generateConsentString(consentData)
    document.cookie = `gdpr_consent=${consentString}; path=/; max-age=${GDPR_CONFIG.COOKIE_EXPIRY_DAYS * 24 * 60 * 60}; secure; samesite=strict`
    
    secureStorage.setTempItem('cookie_consent', consentData)
  }

  getCookieConsent(): any {
    return secureStorage.getItem('cookie_consent')
  }

  // Privacy Policy Tracking
  recordPrivacyPolicyAcceptance(userId: string, version: string): void {
    const record = {
      userId,
      policyVersion: version,
      acceptedAt: new Date(),
      ipAddress: this.getClientIP()
    }

    secureStorage.setItem(`privacy_policy_${userId}`, record)
    this.auditLog('PRIVACY_POLICY_ACCEPTED', userId, record)
  }

  // Data Breach Notification
  recordDataBreach(breachDetails: any): void {
    const breachRecord = {
      id: crypto.randomUUID(),
      ...breachDetails,
      reportedAt: new Date(),
      status: 'reported'
    }

    const breaches = secureStorage.getItem('data_breaches') || []
    breaches.push(breachRecord)
    secureStorage.setItem('data_breaches', breaches)

    // Automatically notify if high risk
    if (breachDetails.riskLevel === 'high') {
      this.notifyDataSubjects(breachRecord)
    }
  }

  // Audit Logging
  private auditLog(action: string, userId: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details: JSON.stringify(details),
      hash: generateAuditHash(`${action}${userId}${JSON.stringify(details)}`)
    }

    const existingLogs = secureStorage.getItem(this.auditStore) || []
    existingLogs.push(logEntry)
    secureStorage.setItem(this.auditStore, existingLogs)
  }

  // Helper methods (placeholders for actual data operations)
  private getPersonalData(userId: string): any {
    return secureStorage.getItem(`user_data_${userId}`)
  }

  private getFinancialData(userId: string): any {
    return secureStorage.getItem(`financial_data_${userId}`)
  }

  private getCommunicationHistory(userId: string): any {
    return secureStorage.getItem(`communication_${userId}`)
  }

  private getUserPreferences(userId: string): any {
    return secureStorage.getItem(`preferences_${userId}`)
  }

  private getUserDocuments(userId: string): any {
    return secureStorage.getItem(`documents_${userId}`)
  }

  private getUserContracts(userId: string): any {
    return secureStorage.getItem(`contracts_${userId}`)
  }

  private canEraseData(userId: string): boolean {
    // Check if user has active contracts or legal obligations
    const contracts = this.getUserContracts(userId)
    const hasActiveContracts = contracts && contracts.some((c: any) => c.status === 'ACTIVE')
    
    return !hasActiveContracts
  }

  private removePersonalData(userId: string): void {
    secureStorage.removeItem(`user_data_${userId}`)
    secureStorage.removeItem(`preferences_${userId}`)
  }

  private removeProcessingRecords(userId: string): void {
    secureStorage.removeItem(`${this.processingStore}_${userId}`)
  }

  private removeConsents(userId: string): void {
    secureStorage.removeItem(`${this.consentStore}_${userId}`)
  }

  private removeCommunicationHistory(userId: string): void {
    secureStorage.removeItem(`communication_${userId}`)
  }

  private createAnonymizedRecord(userId: string, reason: string): void {
    const anonymizedRecord = {
      originalUserId: hashSensitiveData(userId),
      erasureDate: new Date(),
      reason,
      retainedForCompliance: true
    }
    
    const anonymizedRecords = secureStorage.getItem('anonymized_users') || []
    anonymizedRecords.push(anonymizedRecord)
    secureStorage.setItem('anonymized_users', anonymizedRecords)
  }

  private generateConsentString(consentData: any): string {
    return btoa(JSON.stringify(consentData))
  }

  private getClientIP(): string {
    // This would be implemented with actual IP detection in production
    return 'unknown'
  }

  private notifyDataSubjects(breachRecord: any): void {
    // This would send actual notifications in production
    console.log('🚨 Data breach notification required:', breachRecord)
  }
}

// Create singleton instance
export const gdprCompliance = new GDPRCompliance()

// Utility functions for easy GDPR compliance
export const recordUserConsent = (userId: string, type: ConsentType, granted: boolean, lawfulBasis: string, purposes: ProcessingPurpose[]) => {
  gdprCompliance.recordConsent({
    userId,
    consentType: type,
    granted,
    lawfulBasis,
    purpose: purposes
  })
}

export const checkUserConsent = (userId: string, type: ConsentType): boolean => {
  return gdprCompliance.hasValidConsent(userId, type)
}

export const logDataProcessing = (userId: string, category: DataCategory, purpose: ProcessingPurpose, lawfulBasis: string) => {
  gdprCompliance.recordDataProcessing({
    userId,
    dataCategory: category,
    purpose,
    lawfulBasis,
    dataRetentionUntil: new Date(Date.now() + GDPR_CONFIG.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    isAnonymized: false
  })
}

export const handleDataSubjectRequest = (userId: string, type: DataSubjectRequest['type'], details: string): string => {
  return gdprCompliance.submitDataSubjectRequest({
    userId,
    type,
    requestDetails: details
  })
}