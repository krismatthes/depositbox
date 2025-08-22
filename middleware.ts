// Enhanced security middleware for Next.js (Vercel Edge Runtime compatible)
import { NextRequest, NextResponse } from 'next/server'

// Lightweight rate limiting for Edge Runtime (no Map persistence)
function checkRateLimit(request: NextRequest): NextResponse | null {
  // In Edge Runtime, we can't persist state between requests
  // Use headers to do basic protection
  const authAttempts = request.headers.get('x-auth-attempts') || '0'
  const pathname = request.nextUrl.pathname
  
  // Basic protection for auth endpoints
  if (pathname.includes('/auth/') && parseInt(authAttempts) > 5) {
    return NextResponse.json(
      { error: 'For mange forsøg. Prøv igen senere.' },
      { status: 429 }
    )
  }
  
  return null
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 1. Security headers (always safe)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.dataforsyningen.dk https://*.neo4j.io",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 2. Basic rate limiting check
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  // 3. Block obvious malicious patterns
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /sqlmap/i, /nmap/i, /nikto/i, /burp/i, /acunetix/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // 4. Log sensitive endpoint access (Vercel logs)
  if (request.nextUrl.pathname.includes('/admin/') || 
      request.nextUrl.pathname.includes('/api/nest/escrows/')) {
    console.log(`Sensitive access: ${request.method} ${request.nextUrl.pathname}`)
  }
  
  return response
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}