// Comprehensive Input Validation and XSS Protection
// Using built-in XSS protection instead of external dependencies

// Validation rules configuration
const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    maxLength: 254,
    minLength: 5
  },
  PASSWORD: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: [
      /(.)\1{2,}/, // No repeated characters (3+)
      /123456/, // Sequential numbers
      /qwerty/i, // Common keyboard patterns
      /password/i, // Common words
      /admin/i,
      /login/i
    ]
  },
  NAME: {
    pattern: /^[a-zA-ZæøåÆØÅ\s'-]{1,50}$/,
    minLength: 1,
    maxLength: 50,
    forbiddenWords: ['admin', 'system', 'null', 'undefined']
  },
  PHONE: {
    pattern: /^(\+45)?[0-9]{8}$/,
    cleanup: /[^\d+]/g
  },
  CPR: {
    pattern: /^[0-9]{6}-?[0-9]{4}$/,
    cleanup: /[^\d-]/g
  },
  ADDRESS: {
    minLength: 10,
    maxLength: 200,
    pattern: /^[a-zA-ZæøåÆØÅ0-9\s,.-]{10,200}$/
  },
  AMOUNT: {
    min: 0,
    max: 1000000000, // 1 billion øre = 10 million DKK
    pattern: /^[0-9]+$/
  },
  URL: {
    pattern: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?$/,
    maxLength: 2048
  }
} as const

// XSS Protection patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<meta\b[^<]*>/gi,
  /<link\b[^<]*>/gi
]

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /('|\'|;|--|\s\*|\s%|^\*|^%)/gi,
  /((\d+)\s*(=|<|>|!|<=|>=)\s*(\d+))/gi,
  /(\bOR\b|\bAND\b)\s+(\d+)\s*(=|<|>|!|<=|>=)\s*(\d+)/gi
]

// Validation result interface
interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: string
  warnings?: string[]
}

// Enhanced validation class
class InputValidator {
  // Main validation method
  validate(input: any, type: keyof typeof VALIDATION_RULES, options?: {
    required?: boolean
    customPattern?: RegExp
    customValidator?: (value: any) => string[]
    allowHtml?: boolean
    maxLength?: number
    minLength?: number
  }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Check if required
    if (options?.required && (input === null || input === undefined || input === '')) {
      result.isValid = false
      result.errors.push('Dette felt er påkrævet')
      return result
    }

    // Skip validation if empty and not required
    if (!input || input === '') {
      result.sanitized = ''
      return result
    }

    // Convert to string for validation
    const stringInput = String(input)

    // XSS Protection
    if (!options?.allowHtml) {
      const xssCheck = this.checkForXSS(stringInput)
      if (!xssCheck.isValid) {
        result.isValid = false
        result.errors.push(...xssCheck.errors)
        return result
      }
    }

    // SQL Injection Protection
    const sqlCheck = this.checkForSQLInjection(stringInput)
    if (!sqlCheck.isValid) {
      result.isValid = false
      result.errors.push(...sqlCheck.errors)
      return result
    }

    // Type-specific validation
    const typeValidation = this.validateByType(stringInput, type, options)
    result.isValid = result.isValid && typeValidation.isValid
    result.errors.push(...typeValidation.errors)
    result.warnings?.push(...(typeValidation.warnings || []))

    // Sanitize input
    result.sanitized = this.sanitizeInput(stringInput, type, options)

    return result
  }

  // XSS Detection
  private checkForXSS(input: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }

    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        result.isValid = false
        result.errors.push('Potentiel XSS angreb detekteret')
        break
      }
    }

    // Check for encoded XSS attempts
    const decoded = this.decodeHtml(input)
    if (decoded !== input) {
      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(decoded)) {
          result.isValid = false
          result.errors.push('Encoded XSS angreb detekteret')
          break
        }
      }
    }

    return result
  }

  // SQL Injection Detection
  private checkForSQLInjection(input: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }

    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        result.isValid = false
        result.errors.push('Potentiel SQL injection detekteret')
        break
      }
    }

    return result
  }

  // Type-specific validation
  private validateByType(input: string, type: keyof typeof VALIDATION_RULES, options?: any): ValidationResult {
    const rules = VALIDATION_RULES[type]
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    switch (type) {
      case 'EMAIL':
        return this.validateEmail(input)
      case 'PASSWORD':
        return this.validatePassword(input)
      case 'NAME':
        return this.validateName(input)
      case 'PHONE':
        return this.validatePhone(input)
      case 'CPR':
        return this.validateCPR(input)
      case 'ADDRESS':
        return this.validateAddress(input)
      case 'AMOUNT':
        return this.validateAmount(input)
      case 'URL':
        return this.validateURL(input)
      default:
        return result
    }
  }

  // Email validation
  private validateEmail(email: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.EMAIL

    if (email.length < rules.minLength) {
      result.isValid = false
      result.errors.push(`Email skal være mindst ${rules.minLength} tegn`)
    }

    if (email.length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`Email må maksimalt være ${rules.maxLength} tegn`)
    }

    if (!rules.pattern.test(email)) {
      result.isValid = false
      result.errors.push('Ugyldig email format')
    }

    // Check for disposable email domains
    const disposableDomains = ['10minutemail.com', 'guerrillamail.com', 'tempmail.org']
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain && disposableDomains.includes(domain)) {
      result.warnings?.push('Disposable email domain detekteret')
    }

    return result
  }

  // Password validation
  private validatePassword(password: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.PASSWORD

    if (password.length < rules.minLength) {
      result.isValid = false
      result.errors.push(`Password skal være mindst ${rules.minLength} tegn`)
    }

    if (password.length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`Password må maksimalt være ${rules.maxLength} tegn`)
    }

    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false
      result.errors.push('Password skal indeholde store bogstaver')
    }

    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false
      result.errors.push('Password skal indeholde små bogstaver')
    }

    if (rules.requireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false
      result.errors.push('Password skal indeholde tal')
    }

    if (rules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.isValid = false
      result.errors.push('Password skal indeholde specialtegn')
    }

    // Check forbidden patterns
    for (const pattern of rules.forbiddenPatterns) {
      if (pattern.test(password)) {
        result.isValid = false
        result.errors.push('Password indeholder forbudte mønstre')
        break
      }
    }

    return result
  }

  // Name validation
  private validateName(name: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.NAME

    if (name.length < rules.minLength) {
      result.isValid = false
      result.errors.push(`Navn skal være mindst ${rules.minLength} tegn`)
    }

    if (name.length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`Navn må maksimalt være ${rules.maxLength} tegn`)
    }

    if (!rules.pattern.test(name)) {
      result.isValid = false
      result.errors.push('Navn indeholder ugyldige tegn')
    }

    // Check forbidden words
    const lowerName = name.toLowerCase()
    for (const word of rules.forbiddenWords) {
      if (lowerName.includes(word)) {
        result.isValid = false
        result.errors.push('Navn indeholder forbudte ord')
        break
      }
    }

    return result
  }

  // Phone validation
  private validatePhone(phone: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.PHONE

    // Clean the phone number
    const cleaned = phone.replace(rules.cleanup, '')

    if (!rules.pattern.test(cleaned)) {
      result.isValid = false
      result.errors.push('Ugyldigt telefonnummer format')
    }

    return result
  }

  // CPR validation
  private validateCPR(cpr: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.CPR

    // Clean the CPR number
    const cleaned = cpr.replace(rules.cleanup, '')

    if (!rules.pattern.test(cleaned)) {
      result.isValid = false
      result.errors.push('Ugyldigt CPR nummer format')
      return result
    }

    // Additional CPR validation logic
    if (cleaned.length === 10) {
      const day = parseInt(cleaned.substring(0, 2))
      const month = parseInt(cleaned.substring(2, 4))
      const year = parseInt(cleaned.substring(4, 6))

      if (day < 1 || day > 31) {
        result.isValid = false
        result.errors.push('Ugyldig dag i CPR nummer')
      }

      if (month < 1 || month > 12) {
        result.isValid = false
        result.errors.push('Ugyldig måned i CPR nummer')
      }
    }

    return result
  }

  // Address validation
  private validateAddress(address: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.ADDRESS

    if (address.length < rules.minLength) {
      result.isValid = false
      result.errors.push(`Adresse skal være mindst ${rules.minLength} tegn`)
    }

    if (address.length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`Adresse må maksimalt være ${rules.maxLength} tegn`)
    }

    if (!rules.pattern.test(address)) {
      result.isValid = false
      result.errors.push('Adresse indeholder ugyldige tegn')
    }

    return result
  }

  // Amount validation
  private validateAmount(amount: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.AMOUNT

    if (!rules.pattern.test(amount)) {
      result.isValid = false
      result.errors.push('Beløb må kun indeholde tal')
      return result
    }

    const numericAmount = parseInt(amount)

    if (numericAmount < rules.min) {
      result.isValid = false
      result.errors.push(`Beløb skal være mindst ${rules.min}`)
    }

    if (numericAmount > rules.max) {
      result.isValid = false
      result.errors.push(`Beløb må maksimalt være ${rules.max}`)
    }

    return result
  }

  // URL validation
  private validateURL(url: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] }
    const rules = VALIDATION_RULES.URL

    if (url.length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`URL må maksimalt være ${rules.maxLength} tegn`)
    }

    if (!rules.pattern.test(url)) {
      result.isValid = false
      result.errors.push('Ugyldig URL format')
    }

    // Additional security checks for URLs
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      result.warnings?.push('URL bør bruge HTTPS')
    }

    return result
  }

  // Input sanitization
  private sanitizeInput(input: string, type: keyof typeof VALIDATION_RULES, options?: any): string {
    let sanitized = input

    // Basic HTML sanitization
    if (!options?.allowHtml) {
      sanitized = this.sanitizeHtml(sanitized)
    }

    // Type-specific sanitization
    switch (type) {
      case 'EMAIL':
        sanitized = sanitized.toLowerCase().trim()
        break
      case 'NAME':
        sanitized = sanitized.trim().replace(/\s+/g, ' ')
        break
      case 'PHONE':
        sanitized = sanitized.replace(VALIDATION_RULES.PHONE.cleanup, '')
        break
      case 'CPR':
        sanitized = sanitized.replace(VALIDATION_RULES.CPR.cleanup, '')
        break
      case 'ADDRESS':
        sanitized = sanitized.trim().replace(/\s+/g, ' ')
        break
      case 'AMOUNT':
        sanitized = sanitized.replace(/[^\d]/g, '')
        break
      default:
        sanitized = sanitized.trim()
    }

    return sanitized
  }

  // HTML decode utility
  private decodeHtml(html: string): string {
    if (typeof window === 'undefined') {
      // Server-side HTML decoding
      return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    }
    
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  // Built-in HTML sanitization
  private sanitizeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&/g, '&amp;')
  }

  // Batch validation for forms
  validateForm(formData: Record<string, any>, validationSchema: Record<string, {
    type: keyof typeof VALIDATION_RULES
    required?: boolean
    options?: any
  }>): { isValid: boolean; errors: Record<string, string[]>; sanitized: Record<string, any> } {
    const errors: Record<string, string[]> = {}
    const sanitized: Record<string, any> = {}
    let isValid = true

    for (const [field, schema] of Object.entries(validationSchema)) {
      const validation = this.validate(formData[field], schema.type, {
        required: schema.required,
        ...schema.options
      })

      if (!validation.isValid) {
        errors[field] = validation.errors
        isValid = false
      }

      sanitized[field] = validation.sanitized
    }

    return { isValid, errors, sanitized }
  }
}

// Create singleton instance
export const inputValidator = new InputValidator()

// Utility functions for common validations
export const validateEmail = (email: string, required: boolean = true) => 
  inputValidator.validate(email, 'EMAIL', { required })

export const validatePassword = (password: string, required: boolean = true) => 
  inputValidator.validate(password, 'PASSWORD', { required })

export const validateName = (name: string, required: boolean = true) => 
  inputValidator.validate(name, 'NAME', { required })

export const validatePhone = (phone: string, required: boolean = false) => 
  inputValidator.validate(phone, 'PHONE', { required })

export const validateCPR = (cpr: string, required: boolean = false) => 
  inputValidator.validate(cpr, 'CPR', { required })

export const validateAddress = (address: string, required: boolean = true) => 
  inputValidator.validate(address, 'ADDRESS', { required })

export const validateAmount = (amount: string | number, required: boolean = true) => 
  inputValidator.validate(amount, 'AMOUNT', { required })

export const validateURL = (url: string, required: boolean = false) => 
  inputValidator.validate(url, 'URL', { required })

// Safe HTML sanitization for user content
export const sanitizeHtml = (html: string, allowBasicTags: boolean = false): string => {
  if (allowBasicTags) {
    // Allow basic formatting tags but escape all attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
  }
  
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&/g, '&amp;')
}

export default inputValidator