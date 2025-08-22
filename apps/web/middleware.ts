// Next.js Security Middleware Integration
import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware, corsMiddleware, rateLimitMiddleware, detectSuspiciousActivity, getClientIP } from './src/lib/security-headers'

// Define protected routes
const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/nest',
  '/profile',
  '/tenant',
  '/api/auth/protected'
]

const API_ROUTES = ['/api']
const AUTH_ROUTES = ['/api/auth/login', '/api/auth/register']
const ADMIN_ROUTES = ['/admin', '/api/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get client IP for logging and rate limiting
  const clientIP = getClientIP(request)
  
  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Suspicious activity detection
  const suspiciousCheck = detectSuspiciousActivity(request)
  if (suspiciousCheck.suspicious && suspiciousCheck.riskScore > 75) {
    console.error(`🚨 Suspicious activity blocked: ${clientIP} - ${suspiciousCheck.reasons.join(', ')}`)
    return new NextResponse('Access Denied', { status: 403 })
  }

  // Apply security headers to all responses
  let response = securityMiddleware(request)
  
  // Apply CORS for API routes
  if (pathname.startsWith('/api/')) {
    response = corsMiddleware(request)
  }

  // Apply rate limiting based on route type
  if (pathname.startsWith('/api/auth/')) {
    // Strict rate limiting for auth endpoints
    const rateLimitResponse = rateLimitMiddleware(request, 5) // 5 requests per 15 min
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }
  } else if (pathname.startsWith('/api/')) {
    // Standard rate limiting for API
    const rateLimitResponse = rateLimitMiddleware(request, 100) // 100 requests per 15 min
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }
  } else if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    // Very strict rate limiting for admin routes
    const rateLimitResponse = rateLimitMiddleware(request, 20) // 20 requests per 15 min
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }
  }

  // Authentication check for protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const sessionToken = request.cookies.get('session_token')?.value
    const authHeader = request.headers.get('authorization')
    
    if (!sessionToken && !authHeader) {
      // Redirect to login for web routes
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      // Return 401 for API routes
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // Log security events
  if (suspiciousCheck.riskScore > 30) {
    console.warn(`⚠️ Medium risk activity: ${clientIP} - Score: ${suspiciousCheck.riskScore} - ${pathname}`)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes that handle their own security
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, robots.txt, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}