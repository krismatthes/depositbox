// Security utilities for the housing depositums box system
import { User } from '@/lib/auth-context'
import { inputValidator } from './input-validation'
import { secureStorage } from './secure-storage'

interface SecurityConfig {
  MAX_NEST_PER_USER: number
  MAX_RENT_AGREEMENTS_PER_TENANT: number
  MAX_CONVERSATIONS_PER_CONTRACT: number
  RATE_LIMIT_MESSAGES_PER_HOUR: number
  RATE_LIMIT_INVITATIONS_PER_DAY: number
}

const SECURITY_CONFIG: SecurityConfig = {
  MAX_NEST_PER_USER: 5, // Max Depositums Box escrows per landlord
  MAX_RENT_AGREEMENTS_PER_TENANT: 1, // Tenants can only have 1 active rent agreement
  MAX_CONVERSATIONS_PER_CONTRACT: 1, // One conversation per contract
  RATE_LIMIT_MESSAGES_PER_HOUR: 100, // Max messages per user per hour
  RATE_LIMIT_INVITATIONS_PER_DAY: 2 // Max invitations per day
}

// Rate limiting storage keys
const RATE_LIMIT_PREFIX = 'rate_limit_'

export function validateUserAccess(user: User | null): boolean {
  if (!user) return false
  if (!user.id || !user.email || !user.role) return false
  return true
}

export function canCreateNestEscrow(userId: string): { allowed: boolean; reason?: string } {
  if (typeof window === 'undefined') return { allowed: false, reason: 'Server-side check required' }

  try {
    const existingEscrows = secureStorage.getItem('escrows') || []
    const userEscrows = existingEscrows.filter((escrow: any) => escrow.landlordId === userId)
    
    if (userEscrows.length >= SECURITY_CONFIG.MAX_NEST_PER_USER) {
      return { 
        allowed: false, 
        reason: `Du kan maksimalt have ${SECURITY_CONFIG.MAX_NEST_PER_USER} aktive Depositums Box escrows` 
      }
    }

    return { allowed: true }
  } catch {
    return { allowed: false, reason: 'Fejl ved validering' }
  }
}

export function canCreateRentAgreement(userId: string, userRole: string): { allowed: boolean; reason?: string } {
  if (typeof window === 'undefined') return { allowed: false, reason: 'Server-side check required' }

  try {
    const existingAgreements = secureStorage.getItem('rent_agreements') || []
    
    if (userRole === 'TENANT') {
      const activeAgreements = existingAgreements.filter((agreement: any) => 
        agreement.tenantId === userId && agreement.isActive
      )
      
      if (activeAgreements.length >= SECURITY_CONFIG.MAX_RENT_AGREEMENTS_PER_TENANT) {
        return { 
          allowed: false, 
          reason: 'Du har allerede en aktiv husleje aftale. Slet den først.' 
        }
      }
    }

    return { allowed: true }
  } catch {
    return { allowed: false, reason: 'Fejl ved validering' }
  }
}

export function validateConversationAccess(conversationId: string, userId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const participants = secureStorage.getItem('chat_participants') || []
    return participants.some((p: any) => 
      p.conversation_id === conversationId && p.user_id === userId
    )
  } catch {
    return false
  }
}

export function validateContractAccess(contractId: string, userId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const contracts = secureStorage.getItem('contracts') || []
    const contract = contracts.find((c: any) => c.id === contractId)
    
    if (!contract) return false
    
    // Check if user is landlord (creator) or tenant
    return contract.landlordId === userId || 
           contract.tenantId === userId ||
           (contract.tenants && contract.tenants.some((t: any) => t.userId === userId))
  } catch {
    return false
  }
}

export function checkRateLimit(action: string, userId: string, limit: number, windowHours: number = 1): boolean {
  if (typeof window === 'undefined') return false

  const key = `${RATE_LIMIT_PREFIX}${action}_${userId}`
  const now = Date.now()
  const windowMs = windowHours * 60 * 60 * 1000

  try {
    const actions: number[] = secureStorage.getItem(key) || []
    
    // Remove old actions outside window
    const validActions = actions.filter(timestamp => now - timestamp < windowMs)
    
    if (validActions.length >= limit) {
      return false // Rate limit exceeded
    }

    // Add current action and save
    validActions.push(now)
    secureStorage.setItem(key, validActions)
    return true
  } catch {
    return false
  }
}

export function canSendMessage(userId: string): { allowed: boolean; reason?: string } {
  const allowed = checkRateLimit('message', userId, SECURITY_CONFIG.RATE_LIMIT_MESSAGES_PER_HOUR)
  return allowed 
    ? { allowed: true }
    : { allowed: false, reason: `Du har sendt for mange beskeder. Prøv igen om en time.` }
}

export function canSendInvitation(userId: string): { allowed: boolean; reason?: string } {
  const allowed = checkRateLimit('invitation', userId, SECURITY_CONFIG.RATE_LIMIT_INVITATIONS_PER_DAY, 24)
  return allowed 
    ? { allowed: true }
    : { allowed: false, reason: `Du kan maksimalt sende 2 invitationer per dag. Prøv igen i morgen.` }
}

export function validateEmailFormat(email: string): boolean {
  const validation = inputValidator.validate(email, 'EMAIL', { required: true })
  return validation.isValid
}

export function sanitizeInput(input: string): string {
  const validation = inputValidator.validate(input, 'NAME', { required: false })
  return validation.sanitized || input.trim().slice(0, 1000)
}

export function validatePropertyAddress(address: string): boolean {
  const validation = inputValidator.validate(address, 'ADDRESS', { required: true })
  return validation.isValid
}

export function validatePhoneNumber(phone: string): boolean {
  const validation = inputValidator.validate(phone, 'PHONE', { required: true })
  return validation.isValid
}

// Prevent XSS by escaping HTML
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Generate secure tokens for invitations
export function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Password strength indicator
export function getPasswordStrength(password: string): {
  score: number
  level: 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []
  
  if (password.length >= 8) score += 10
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10
  
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15
  
  if (!/(.)\1{2,}/.test(password)) score += 10
  if (!/123456|qwerty|password|admin/i.test(password)) score += 15
  
  // Provide feedback
  if (password.length < 12) feedback.push('Brug mindst 12 tegn')
  if (!/[A-Z]/.test(password)) feedback.push('Tilføj store bogstaver')
  if (!/[a-z]/.test(password)) feedback.push('Tilføj små bogstaver')
  if (!/[0-9]/.test(password)) feedback.push('Tilføj tal')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) feedback.push('Tilføj specialtegn')
  
  let level: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 30) level = 'weak'
  else if (score < 60) level = 'fair'
  else if (score < 80) level = 'good'
  else level = 'strong'
  
  return { score, level, feedback }
}

// Security event logging
export function logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    severity,
    details: typeof details === 'object' ? JSON.stringify(details) : details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }
  
  console.log(`🔒 Security Event [${severity.toUpperCase()}]:`, logEntry)
  
  // In production, send to security monitoring service
  if (severity === 'high' || severity === 'critical') {
    console.error(`🚨 Critical Security Event:`, logEntry)
  }
}

// Check if running in secure context
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true // Server-side
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

// Validate Danish CPR number
export function validateDanishCPR(cpr: string): boolean {
  const validation = inputValidator.validate(cpr, 'CPR', { required: true })
  return validation.isValid
}

// Browser fingerprinting for additional security
export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server'
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'no-canvas'
  
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('Browser fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return hash.toString(16)
}

export { SECURITY_CONFIG }