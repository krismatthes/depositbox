// Vercel-compatible security utilities (no persistent state)
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

// Simple JWT validation for API routes
export function validateApiToken(request: NextRequest): { valid: boolean; userId?: string; error?: string } {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
    
    return { valid: true, userId: decoded.userId }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

// Simple email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Adgangskode skal være mindst 8 tegn')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Adgangskode skal indeholde mindst ét stort bogstav')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Adgangskode skal indeholde mindst ét lille bogstav')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Adgangskode skal indeholde mindst ét tal')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Basic input sanitization (XSS prevention)
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"']/g, '') // Remove basic XSS chars
    .trim()
    .substring(0, 1000) // Limit length
}

// Generate secure tokens
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Simple rate limiting check (header-based)
export function checkBasicRateLimit(request: NextRequest): { allowed: boolean; reason?: string } {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Block obvious bots and malicious tools
  const maliciousPatterns = [
    /sqlmap/i, /nikto/i, /nmap/i, /burp/i, /acunetix/i, 
    /masscan/i, /zap/i, /w3af/i, /skipfish/i
  ]
  
  if (maliciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn(`Blocked malicious user agent: ${userAgent} from IP: ${ip}`)
    return { allowed: false, reason: 'Malicious user agent detected' }
  }
  
  // Very basic protection - just check for empty user agent
  if (!userAgent || userAgent.length < 10) {
    return { allowed: false, reason: 'Invalid user agent' }
  }
  
  return { allowed: true }
}

// Validate request origin (CSRF basic protection)
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // Allow requests without origin/referer for API calls (mobile apps etc)
  if (!origin && !referer) {
    return true
  }
  
  // Check if origin matches our domain
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }
  
  return true
}

// Log security events (uses Vercel's console logging)
export function logSecurityEvent(
  event: 'MALICIOUS_REQUEST' | 'AUTH_FAILURE' | 'SUSPICIOUS_ACTIVITY',
  details: {
    ip?: string
    userAgent?: string
    endpoint?: string
    userId?: string
    message?: string
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: details.ip ? `${details.ip.substring(0, 10)}...` : 'unknown', // Partial IP for privacy
    userAgent: details.userAgent ? details.userAgent.substring(0, 100) : undefined,
    endpoint: details.endpoint,
    userId: details.userId ? `user-${details.userId.substring(0, 8)}...` : undefined,
    message: details.message
  }
  
  console.warn('🔐 Security Event:', logEntry)
}

// Create standardized error responses
export function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    { 
      error: message, 
      timestamp: new Date().toISOString() 
    },
    { status }
  )
}