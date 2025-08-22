// Secure cryptographic utilities using Node.js built-in crypto
import crypto from 'crypto'
// Note: Argon2 requires native binaries - falls back to bcryptjs on Vercel
import bcrypt from 'bcryptjs' // Vercel-compatible alternative

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_SALT_ROUNDS: 12,
  JWT_SECRET_LENGTH: 64,
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_DERIVATION_ITERATIONS: 100000,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

// Password hashing using bcryptjs (Vercel-compatible)
export async function hashPassword(password: string): Promise<string> {
  try {
    // Use bcryptjs for Vercel compatibility - no native binaries needed
    const saltRounds = SECURITY_CONFIG.PASSWORD_SALT_ROUNDS
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    throw new Error('Password hashing failed')
  }
}

// Password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Support both old PBKDF2 hashes and new bcrypt hashes
    if (hashedPassword.includes(':')) {
      // Legacy PBKDF2 hash - migrate to bcrypt on next login
      return verifyLegacyPassword(password, hashedPassword)
    }
    
    // New bcrypt hash
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error.message)
    return false
  }
}

// Support for legacy PBKDF2 hashes (gradual migration)
async function verifyLegacyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = hashedPassword.split(':')
    crypto.pbkdf2(password, salt, SECURITY_CONFIG.KEY_DERIVATION_ITERATIONS, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err)
      else resolve(hash === derivedKey.toString('hex'))
    })
  })
}

// Secure random token generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate secure JWT secret
export function generateJWTSecret(): string {
  return crypto.randomBytes(SECURITY_CONFIG.JWT_SECRET_LENGTH).toString('base64')
}

// Encrypt sensitive data for storage
export function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

// Decrypt sensitive data
export function decryptData(encryptedData: string, key: string): string {
  const [ivHex, encrypted] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Secure session token generation
export function generateSessionToken(): {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
} {
  const accessToken = generateSecureToken(32)
  const refreshToken = generateSecureToken(64)
  const expiresAt = new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT_MS)
  const refreshExpiresAt = new Date(Date.now() + SECURITY_CONFIG.REFRESH_TOKEN_TIMEOUT_MS)
  
  return {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt
  }
}

// Hash sensitive data for comparison (one-way)
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64')
}

// Validate CSRF token timing-safe comparison
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false
  }
  
  // Timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token, 'base64')
  const expectedBuffer = Buffer.from(expectedToken, 'base64')
  
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
}

// Data anonymization for GDPR compliance
export function anonymizePersonalData(data: string): string {
  // Replace with asterisks, keeping first and last character
  if (data.length <= 2) return '***'
  return data[0] + '*'.repeat(data.length - 2) + data[data.length - 1]
}

// Generate secure audit log hash
export function generateAuditHash(data: string, previousHash: string = ''): string {
  const timestamp = Date.now().toString()
  const combined = `${previousHash}${data}${timestamp}`
  return crypto.createHash('sha256').update(combined).digest('hex')
}

export { SECURITY_CONFIG }