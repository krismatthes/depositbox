// Security Headers and HTTPS Enforcement
import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
export const SECURITY_HEADERS = {
  // Strict Transport Security - Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Type Options - Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Frame Options - Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy - Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy - Comprehensive XSS protection
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.mitid.dk https://preprod.mitid.dk",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Permissions Policy - Control browser features
  'Permissions-Policy': [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', '),
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Cache Control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  
  // Server identification (security through obscurity)
  'Server': 'BoligDeposit-Secure'
} as const

// CORS configuration
export const CORS_CONFIG = {
  allowedOrigins: [
    'https://boligdeposit.dk',
    'https://www.boligdeposit.dk',
    'https://api.boligdeposit.dk',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3005'] : [])
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  credentials: true,
  maxAge: 86400 // 24 hours
}

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: {
    default: 100, // Default rate limit
    auth: 5, // Login attempts
    api: 1000, // API calls
    upload: 10, // File uploads
    sensitive: 3 // Sensitive operations
  },
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}

// Security middleware for Next.js
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`, 301)
  }
  
  // HSTS preload for supported browsers
  if (request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', SECURITY_HEADERS['Strict-Transport-Security'])
  }
  
  return response
}

// CORS middleware
export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = NextResponse.next()
  
  // Check if origin is allowed
  if (origin && CORS_CONFIG.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
  
  if (CORS_CONFIG.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

// Rate limiting implementation
class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  isAllowed(identifier: string, limit: number = RATE_LIMIT_CONFIG.max.default): boolean {
    const now = Date.now()
    const key = identifier
    const windowMs = RATE_LIMIT_CONFIG.windowMs
    
    const record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= limit) {
      return false
    }
    
    record.count++
    return true
  }
  
  getRemainingRequests(identifier: string, limit: number = RATE_LIMIT_CONFIG.max.default): number {
    const record = this.store.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return limit
    }
    return Math.max(0, limit - record.count)
  }
  
  getResetTime(identifier: string): number {
    const record = this.store.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return Date.now() + RATE_LIMIT_CONFIG.windowMs
    }
    return record.resetTime
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Create singleton rate limiter
export const rateLimiter = new RateLimiter()

// Rate limiting middleware
export function rateLimitMiddleware(request: NextRequest, limit?: number) {
  const identifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const response = NextResponse.next()
  
  const effectiveLimit = limit || RATE_LIMIT_CONFIG.max.default
  
  if (!rateLimiter.isAllowed(identifier, effectiveLimit)) {
    response.headers.set('X-RateLimit-Limit', effectiveLimit.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', rateLimiter.getResetTime(identifier).toString())
    
    return new NextResponse(JSON.stringify({ 
      error: RATE_LIMIT_CONFIG.message,
      code: 'RATE_LIMIT_EXCEEDED'
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(response.headers.entries())
      }
    })
  }
  
  response.headers.set('X-RateLimit-Limit', effectiveLimit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(identifier, effectiveLimit).toString())
  response.headers.set('X-RateLimit-Reset', rateLimiter.getResetTime(identifier).toString())
  
  return response
}

// Content Security Policy nonce generation
export function generateCSPNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')
}

// Update CSP with nonce
export function updateCSPWithNonce(nonce: string): string {
  return SECURITY_HEADERS['Content-Security-Policy']
    .replace("'unsafe-inline'", `'nonce-${nonce}'`)
}

// Security audit function
export function auditSecurityHeaders(headers: Headers): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100
  
  // Check required security headers
  const requiredHeaders = [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Content-Security-Policy'
  ]
  
  for (const header of requiredHeaders) {
    if (!headers.get(header)) {
      issues.push(`Missing ${header} header`)
      score -= 20
    }
  }
  
  // Check CSP strength
  const csp = headers.get('Content-Security-Policy')
  if (csp) {
    if (csp.includes("'unsafe-eval'")) {
      issues.push('CSP allows unsafe-eval')
      score -= 10
    }
    if (csp.includes("'unsafe-inline'") && !csp.includes("'nonce-")) {
      issues.push('CSP allows unsafe-inline without nonces')
      score -= 10
    }
    if (!csp.includes('upgrade-insecure-requests')) {
      recommendations.push('Consider adding upgrade-insecure-requests to CSP')
    }
  }
  
  // Check HSTS
  const hsts = headers.get('Strict-Transport-Security')
  if (hsts && !hsts.includes('preload')) {
    recommendations.push('Consider adding preload to HSTS header')
  }
  
  return { score: Math.max(0, score), issues, recommendations }
}

// IP-based security
export function getClientIP(request: NextRequest): string {
  return request.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

// Suspicious activity detection
export function detectSuspiciousActivity(request: NextRequest): {
  suspicious: boolean
  reasons: string[]
  riskScore: number
} {
  const reasons: string[] = []
  let riskScore = 0
  
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check for automated tools
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget']
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    reasons.push('Automated tool detected')
    riskScore += 30
  }
  
  // Check for missing common headers
  if (!userAgent) {
    reasons.push('Missing User-Agent header')
    riskScore += 20
  }
  
  if (!request.headers.get('accept')) {
    reasons.push('Missing Accept header')
    riskScore += 10
  }
  
  // Check for suspicious referrers
  if (referer && !referer.includes(request.headers.get('host') || '')) {
    reasons.push('External referrer')
    riskScore += 5
  }
  
  // Check request patterns
  const url = request.nextUrl.pathname
  const suspiciousPatterns = ['/admin', '/api', '/.env', '/config', '/backup']
  if (suspiciousPatterns.some(pattern => url.includes(pattern))) {
    reasons.push('Accessing sensitive path')
    riskScore += 15
  }
  
  return {
    suspicious: riskScore >= 50,
    reasons,
    riskScore
  }
}

// Cleanup function to run periodically
export function cleanupRateLimit(): void {
  rateLimiter.cleanup()
}

// Setup periodic cleanup (run every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}