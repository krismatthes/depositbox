// Sikker fejlhåndtering der ikke afslører følsom information
import { NextResponse } from 'next/server'

// Generiske fejlmeddelelser der ikke afslører systemdetaljer
export const SECURE_ERROR_MESSAGES = {
  // Authentication fejl
  INVALID_CREDENTIALS: 'Ugyldige loginoplysninger',
  ACCOUNT_LOCKED: 'Kontoen er midlertidigt låst',
  EMAIL_NOT_VERIFIED: 'Email skal verificeres før login',
  TWO_FACTOR_REQUIRED: 'Totrins-godkendelse påkrævet',
  
  // Registration fejl
  REGISTRATION_FAILED: 'Registrering mislykkedes. Prøv igen',
  EMAIL_INVALID_FORMAT: 'Ugyldig email format',
  PASSWORD_REQUIREMENTS: 'Adgangskoden opfylder ikke sikkerhedskravene',
  
  // Session fejl
  SESSION_EXPIRED: 'Din session er udløbet. Log venligst ind igen',
  UNAUTHORIZED: 'Du har ikke tilladelse til denne handling',
  INVALID_SESSION: 'Ugyldig session. Log venligst ind igen',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'For mange forsøg. Prøv igen senere',
  API_RATE_LIMIT: 'API rate limit nået. Vent venligst',
  
  // Validering
  INVALID_INPUT: 'Ugyldig input. Kontroller dine oplysninger',
  REQUIRED_FIELDS_MISSING: 'Påkrævede felter mangler',
  DATA_VALIDATION_FAILED: 'Data validering mislykkedes',
  
  // System fejl
  INTERNAL_ERROR: 'Der opstod en fejl. Prøv igen senere',
  SERVICE_UNAVAILABLE: 'Tjenesten er midlertidigt utilgængelig',
  MAINTENANCE_MODE: 'Systemet er under vedligeholdelse',
  
  // Escrow specifikke
  ESCROW_NOT_FOUND: 'Deponeringen blev ikke fundet',
  INSUFFICIENT_PERMISSIONS: 'Utilstrækkelige tilladelser',
  INVALID_AMOUNT: 'Ugyldigt beløb angivet',
  
} as const

// Fejl kategorier for logging
export enum ErrorCategory {
  AUTHENTICATION = 'auth',
  VALIDATION = 'validation',
  AUTHORIZATION = 'authz',
  RATE_LIMIT = 'rate_limit',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business',
  SECURITY = 'security'
}

// Sikker fejl klasse
export class SecureError extends Error {
  public readonly category: ErrorCategory
  public readonly userMessage: string
  public readonly statusCode: number
  public readonly logDetails: Record<string, any>

  constructor(
    category: ErrorCategory,
    userMessage: string,
    statusCode: number = 500,
    logDetails: Record<string, any> = {}
  ) {
    super(userMessage)
    this.category = category
    this.userMessage = userMessage
    this.statusCode = statusCode
    this.logDetails = logDetails
    this.name = 'SecureError'
  }
}

// Sikker fejl logger der filtrerer følsomme data
export function logSecureError(
  error: Error | SecureError,
  context: {
    userId?: string
    ip?: string
    userAgent?: string
    endpoint?: string
    method?: string
  } = {}
): void {
  const timestamp = new Date().toISOString()
  
  // Base log entry
  const logEntry = {
    timestamp,
    message: error.message,
    stack: error.stack,
    context: {
      // Filtrér følsomme data
      userId: context.userId ? anonymizeUserId(context.userId) : undefined,
      ip: context.ip ? anonymizeIP(context.ip) : undefined,
      userAgent: context.userAgent ? anonymizeUserAgent(context.userAgent) : undefined,
      endpoint: context.endpoint,
      method: context.method
    }
  }
  
  // Tilføj ekstra detaljer hvis det er en SecureError
  if (error instanceof SecureError) {
    Object.assign(logEntry, {
      category: error.category,
      statusCode: error.statusCode,
      logDetails: sanitizeLogDetails(error.logDetails)
    })
  }
  
  // Log baseret på alvorlighed
  if (error instanceof SecureError && error.category === ErrorCategory.SECURITY) {
    console.error('🚨 SECURITY ALERT:', logEntry)
    // I produktion: send til security monitoring system
  } else {
    console.error('Application error:', logEntry)
  }
}

// Generer sikker API response
export function createSecureErrorResponse(
  error: Error | SecureError,
  context: {
    userId?: string
    ip?: string
    userAgent?: string
    endpoint?: string
    method?: string
  } = {}
): NextResponse {
  // Log fejlen sikkert
  logSecureError(error, context)
  
  // Bestem response baseret på fejltype
  if (error instanceof SecureError) {
    return NextResponse.json(
      { 
        error: error.userMessage,
        code: error.category,
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    )
  }
  
  // For ukendte fejl, returner generisk meddelelse
  return NextResponse.json(
    { 
      error: SECURE_ERROR_MESSAGES.INTERNAL_ERROR,
      code: ErrorCategory.SYSTEM,
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  )
}

// Helper funktioner til anonymisering
function anonymizeUserId(userId: string): string {
  if (userId.length <= 8) return userId.substring(0, 4) + '****'
  return userId.substring(0, 6) + '****' + userId.substring(userId.length - 2)
}

function anonymizeIP(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***.***`
  }
  return 'anonymized-ip'
}

function anonymizeUserAgent(userAgent: string): string {
  // Behold browser type men fjern specifikke versioner
  return userAgent
    .replace(/\d+\.\d+\.\d+/g, 'X.X.X')
    .substring(0, 100) + '...'
}

function sanitizeLogDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details }
  
  // Fjern følsomme felter
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn']
  
  function recursiveSanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj
    
    const result: any = Array.isArray(obj) ? [] : {}
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()
      
      // Tjek om nøglen indeholder følsomme ord
      const isSensitive = sensitiveFields.some(field => lowerKey.includes(field))
      
      if (isSensitive) {
        result[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        result[key] = recursiveSanitize(value)
      } else {
        result[key] = value
      }
    }
    
    return result
  }
  
  return recursiveSanitize(sanitized)
}

// Common error factories
export const createAuthError = (message: string = SECURE_ERROR_MESSAGES.INVALID_CREDENTIALS) =>
  new SecureError(ErrorCategory.AUTHENTICATION, message, 401)

export const createValidationError = (message: string = SECURE_ERROR_MESSAGES.INVALID_INPUT) =>
  new SecureError(ErrorCategory.VALIDATION, message, 400)

export const createAuthorizationError = (message: string = SECURE_ERROR_MESSAGES.UNAUTHORIZED) =>
  new SecureError(ErrorCategory.AUTHORIZATION, message, 403)

export const createRateLimitError = (message: string = SECURE_ERROR_MESSAGES.TOO_MANY_REQUESTS) =>
  new SecureError(ErrorCategory.RATE_LIMIT, message, 429)

export const createSecurityError = (message: string, logDetails: Record<string, any> = {}) =>
  new SecureError(ErrorCategory.SECURITY, SECURE_ERROR_MESSAGES.UNAUTHORIZED, 403, logDetails)