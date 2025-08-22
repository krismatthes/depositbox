'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { hashPassword, verifyPassword, generateSessionToken, generateCSRFToken, validateCSRFToken } from './crypto'
import { secureStorage, storeUserSession, getUserSession, clearUserSession, migrateFromLocalStorage } from './secure-storage'
import { validateUserAccess, validateEmailFormat, sanitizeInput } from './security'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  mitIdVerified: boolean
  profileCompleteness: number
  lastLoginAt?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, csrfToken?: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
  csrfToken: string
  validateSession: () => boolean
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>
  enable2FA: () => Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }>
  verify2FA: (token: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Rate limiting storage
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>()

// Security validation functions
const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 12) errors.push('Password skal være mindst 12 tegn')
  if (!/[A-Z]/.test(password)) errors.push('Password skal indeholde store bogstaver')
  if (!/[a-z]/.test(password)) errors.push('Password skal indeholde små bogstaver')
  if (!/[0-9]/.test(password)) errors.push('Password skal indeholde tal')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password skal indeholde specialtegn')
  if (/(.)\1{2,}/.test(password)) errors.push('Password må ikke have gentagne tegn')
  
  // Check against common passwords
  const commonPasswords = ['password123', '123456789', 'qwerty123', 'admin123', 'welcome123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('Password er for almindeligt')
  }
  
  return { valid: errors.length === 0, errors }
}

const checkRateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now })
    return true
  }
  
  if (now - record.lastAttempt > windowMs) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now })
    return true
  }
  
  if (record.attempts >= maxAttempts) {
    return false
  }
  
  record.attempts++
  record.lastAttempt = now
  return true
}

// Mock user database - in production this would be a real database with encrypted passwords
const mockUsers = new Map<string, any>()

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Migrate existing localStorage data to secure storage
      migrateFromLocalStorage()
      
      // Generate CSRF token
      const newCsrfToken = generateCSRFToken()
      setCsrfToken(newCsrfToken)
      secureStorage.setSessionItem('csrf_token', newCsrfToken)
      
      // Check for existing session
      const { user: sessionUser, token } = getUserSession()
      
      if (sessionUser && token && validateSession()) {
        setUser(sessionUser)
        
        // Update last login
        sessionUser.lastLoginAt = new Date().toISOString()
        storeUserSession(sessionUser, token)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      clearUserSession()
    } finally {
      setLoading(false)
    }
  }

  const validateSession = (): boolean => {
    const { user: sessionUser, token } = getUserSession()
    
    if (!sessionUser || !token) return false
    
    // Additional session validation can be added here
    if (!validateUserAccess(sessionUser)) return false
    
    return true
  }

  const login = async (email: string, password: string, providedCsrfToken?: string): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      // CSRF validation
      const storedCsrfToken = secureStorage.getItem('csrf_token')
      if (!providedCsrfToken || !storedCsrfToken || !validateCSRFToken(providedCsrfToken, storedCsrfToken)) {
        return { success: false, error: 'Invalid security token. Please refresh the page.' }
      }

      // Input validation
      if (!validateEmailFormat(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      email = sanitizeInput(email).toLowerCase()
      
      // Rate limiting
      if (!checkRateLimit(`login_${email}`, 5, 15 * 60 * 1000)) {
        return { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' }
      }

      // Check if user exists in mock database
      const userData = mockUsers.get(email)
      if (!userData) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify password
      const passwordValid = await verifyPassword(password, userData.hashedPassword)
      if (!passwordValid) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Check if account is locked or requires verification
      if (!userData.emailVerified) {
        return { success: false, error: 'Please verify your email before logging in', requiresVerification: true }
      }

      // Generate session tokens
      const { accessToken } = generateSessionToken()
      
      // Create user session
      const userSession: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        createdAt: userData.createdAt,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified,
        identityVerified: userData.identityVerified,
        mitIdVerified: userData.mitIdVerified,
        profileCompleteness: userData.profileCompleteness,
        lastLoginAt: new Date().toISOString()
      }

      // Store session securely
      storeUserSession(userSession, accessToken)
      setUser(userSession)

      // Generate new CSRF token for next request
      const newCsrfToken = generateCSRFToken()
      setCsrfToken(newCsrfToken)
      secureStorage.setSessionItem('csrf_token', newCsrfToken)

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Input validation
      if (!validateEmailFormat(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.errors.join(', ') }
      }

      email = sanitizeInput(email).toLowerCase()
      firstName = sanitizeInput(firstName)
      lastName = sanitizeInput(lastName)

      // Rate limiting for registration
      if (!checkRateLimit(`register_${email}`, 3, 60 * 60 * 1000)) {
        return { success: false, error: 'Too many registration attempts. Please try again later.' }
      }

      // Check if user already exists
      if (mockUsers.has(email)) {
        return { success: false, error: 'User already exists with this email' }
      }

      // Hash password securely
      const hashedPassword = await hashPassword(password)

      // Create user record
      const userId = crypto.randomUUID()
      const userData = {
        id: userId,
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'TENANT',
        createdAt: new Date().toISOString(),
        emailVerified: false, // Require email verification
        phoneVerified: false,
        identityVerified: false,
        mitIdVerified: false,
        profileCompleteness: 25 // Base completion for having basic info
      }

      // Store in mock database
      mockUsers.set(email, userData)

      // TODO: Send email verification
      console.log('🔒 User registered successfully. Email verification required.')

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'An error occurred during registration' }
    }
  }

  const logout = () => {
    clearUserSession()
    setUser(null)
    
    // Generate new CSRF token
    const newCsrfToken = generateCSRFToken()
    setCsrfToken(newCsrfToken)
    secureStorage.setSessionItem('csrf_token', newCsrfToken)
  }

  const refreshUser = async () => {
    if (!validateSession()) {
      logout()
      return
    }

    const { user: sessionUser } = getUserSession()
    if (sessionUser) {
      setUser(sessionUser)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' }

      const userData = mockUsers.get(user.email)
      if (!userData) return { success: false, error: 'User not found' }

      // Verify current password
      const currentPasswordValid = await verifyPassword(currentPassword, userData.hashedPassword)
      if (!currentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Validate new password
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.errors.join(', ') }
      }

      // Hash new password
      const newHashedPassword = await hashPassword(newPassword)
      userData.hashedPassword = newHashedPassword
      
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: 'An error occurred changing password' }
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!validateEmailFormat(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      // Rate limiting
      if (!checkRateLimit(`reset_${email}`, 3, 60 * 60 * 1000)) {
        return { success: false, error: 'Too many reset attempts. Please try again later.' }
      }

      // TODO: Implement password reset email
      console.log('🔒 Password reset email would be sent to:', email)
      
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'An error occurred requesting password reset' }
    }
  }

  const verifyEmail = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // TODO: Implement email verification logic
      console.log('🔒 Email verification token:', token)
      return { success: true }
    } catch (error) {
      console.error('Email verification error:', error)
      return { success: false, error: 'An error occurred verifying email' }
    }
  }

  const enable2FA = async (): Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' }
      
      // TODO: Implement 2FA setup with TOTP
      const secret = generateCSRFToken() // Placeholder
      return { success: true, secret, qrCode: 'placeholder-qr-code' }
    } catch (error) {
      console.error('2FA setup error:', error)
      return { success: false, error: 'An error occurred setting up 2FA' }
    }
  }

  const verify2FA = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // TODO: Implement 2FA verification
      console.log('🔒 2FA token verification:', token)
      return { success: true }
    } catch (error) {
      console.error('2FA verification error:', error)
      return { success: false, error: 'An error occurred verifying 2FA token' }
    }
  }

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading,
    csrfToken,
    validateSession,
    changePassword,
    requestPasswordReset,
    verifyEmail,
    enable2FA,
    verify2FA
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSecureAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider')
  }
  return context
}