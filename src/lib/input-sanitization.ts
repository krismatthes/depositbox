// Omfattende input sanitization og validation
// Note: isomorphic-dompurify can be heavy on serverless - using lighter alternative
import { z } from 'zod'
import crypto from 'crypto'

// Lightweight HTML sanitizer for Vercel (alternative to DOMPurify)
function sanitizeHTMLLightweight(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframes
    .replace(/<object[^>]*>.*?<\/object>/gis, '') // Remove objects
    .replace(/<embed[^>]*>/gi, '') // Remove embeds
    .replace(/<link[^>]*>/gi, '') // Remove link tags
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/vbscript:/gi, '') // Remove vbscript: urls
    .trim()
}

// Sikre input schemas
export const secureInputSchemas = {
  email: z.string()
    .email('Ugyldig email format')
    .max(254) // RFC standard
    .transform(val => val.toLowerCase().trim()),
    
  password: z.string()
    .min(12, 'Adgangskode skal være mindst 12 tegn') // Øget fra 8
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
           'Adgangskode skal indeholde store og små bogstaver, tal og specialtegn'),
           
  name: z.string()
    .min(1, 'Navn er påkrævet')
    .max(100)
    .regex(/^[a-zA-ZæøåÆØÅ\s'-]+$/, 'Navn må kun indeholde bogstaver, mellemrum, apostrof og bindestreg'),
    
  address: z.string()
    .min(5, 'Adresse skal være mindst 5 tegn')
    .max(200)
    .regex(/^[a-zA-ZæøåÆØÅ0-9\s.,'-]+$/, 'Ugyldig adresse format'),
    
  amount: z.number()
    .min(0, 'Beløb kan ikke være negativt')
    .max(10000000, 'Beløb er for stort') // 100.000 DKK max
    .finite('Beløb skal være et gyldigt tal'),
    
  phoneNumber: z.string()
    .regex(/^(\+45)?[2-9]\d{7}$/, 'Ugyldigt dansk telefonnummer')
    .optional()
}

// HTML sanitization for user-generated content (Vercel-compatible)
export function sanitizeHTML(input: string): string {
  // Use lightweight sanitizer for Vercel compatibility
  let sanitized = sanitizeHTMLLightweight(input)
  
  // Only allow very basic HTML tags
  const allowedTagsRegex = /<(?!\/?(?:b|i|em|strong|br)\b)[^>]+>/gi
  sanitized = sanitized.replace(allowedTagsRegex, '')
  
  return sanitized.substring(0, 1000) // Limit length
}

// Tekst sanitization for databaser
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Normaliser whitespace
    .replace(/[<>"\\']/g, '') // Fjern potentielt farlige tegn
    .substring(0, 1000) // Begræns længde
}

// SQL injection beskyttelse (selvom vi bruger Neo4j)
export function sanitizeForQuery(input: string): string {
  return input
    .replace(/[;"'\\]/g, '') // Fjern query-breaking karakterer
    .trim()
}

// Validér og rens user input med detaljeret fejlrapportering
export function validateAndSanitizeInput<T>(
  input: unknown, 
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(input)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Ugyldig input format'] }
  }
}

// CSRF token validation
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  
  // Simple timing-safe comparison
  const tokenBuffer = Buffer.from(token, 'utf8')
  const sessionBuffer = Buffer.from(sessionToken, 'utf8')
  
  if (tokenBuffer.length !== sessionBuffer.length) return false
  
  return crypto.timingSafeEqual(tokenBuffer, sessionBuffer)
}

// Rate limiting per IP
const rateLimitMap = new Map<string, { requests: number; resetTime: number }>()

export function checkRateLimit(
  ip: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 min
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  
  let record = rateLimitMap.get(ip)
  
  // Reset hvis vindue er forbi
  if (!record || record.resetTime < windowStart) {
    record = { requests: 0, resetTime: now + windowMs }
    rateLimitMap.set(ip, record)
  }
  
  // Tjek om limit er nået
  if (record.requests >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: record.resetTime 
    }
  }
  
  // Incrementer tæller
  record.requests++
  rateLimitMap.set(ip, record)
  
  return { 
    allowed: true, 
    remaining: maxRequests - record.requests, 
    resetTime: record.resetTime 
  }
}

// Rens gammel rate limit data (kør periodisk)
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (record.resetTime < now) {
      rateLimitMap.delete(ip)
    }
  }
}

import crypto from 'crypto'