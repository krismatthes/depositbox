// Data reuse system for consistent user experience
import { User } from '@/lib/auth-context'

export interface PropertyInfo {
  id: string
  address: string
  postalCode?: string
  city?: string
  type?: string
  rent?: number
  deposit?: number
  lastUsed: string
}

export interface ContactInfo {
  id: string
  name: string
  email: string
  phone?: string
  role: 'tenant' | 'landlord'
  lastUsed: string
}

export interface SavedFormData {
  properties: PropertyInfo[]
  contacts: ContactInfo[]
  userPreferences: {
    preferredPaymentMethod?: string
    defaultNotifications?: boolean
    reminderDays?: number
  }
}

const STORAGE_KEY_PREFIX = 'reusable_data_'

export function getSavedData(userId: string): SavedFormData {
  if (typeof window === 'undefined') {
    return { properties: [], contacts: [], userPreferences: {} }
  }

  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading saved data:', error)
  }

  return { properties: [], contacts: [], userPreferences: {} }
}

export function saveFormData(userId: string, data: Partial<SavedFormData>) {
  if (typeof window === 'undefined') return

  try {
    const existing = getSavedData(userId)
    const updated = { ...existing, ...data }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving form data:', error)
  }
}

export function addProperty(userId: string, property: Omit<PropertyInfo, 'id' | 'lastUsed'>) {
  const savedData = getSavedData(userId)
  const existingIndex = savedData.properties.findIndex(p => 
    p.address.toLowerCase().trim() === property.address.toLowerCase().trim()
  )

  const newProperty: PropertyInfo = {
    ...property,
    id: existingIndex >= 0 ? savedData.properties[existingIndex].id : `prop-${Date.now()}`,
    lastUsed: new Date().toISOString()
  }

  if (existingIndex >= 0) {
    savedData.properties[existingIndex] = newProperty
  } else {
    savedData.properties.push(newProperty)
  }

  // Keep only last 10 properties, sorted by most recently used
  savedData.properties = savedData.properties
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 10)

  saveFormData(userId, savedData)
}

export function addContact(userId: string, contact: Omit<ContactInfo, 'id' | 'lastUsed'>) {
  const savedData = getSavedData(userId)
  const existingIndex = savedData.contacts.findIndex(c => 
    c.email.toLowerCase() === contact.email.toLowerCase()
  )

  const newContact: ContactInfo = {
    ...contact,
    id: existingIndex >= 0 ? savedData.contacts[existingIndex].id : `contact-${Date.now()}`,
    lastUsed: new Date().toISOString()
  }

  if (existingIndex >= 0) {
    savedData.contacts[existingIndex] = newContact
  } else {
    savedData.contacts.push(newContact)
  }

  // Keep only last 20 contacts, sorted by most recently used
  savedData.contacts = savedData.contacts
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 20)

  saveFormData(userId, savedData)
}

export function getRecentProperties(userId: string, limit: number = 5): PropertyInfo[] {
  const data = getSavedData(userId)
  return data.properties
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, limit)
}

export function getRecentContacts(userId: string, role?: 'tenant' | 'landlord', limit: number = 10): ContactInfo[] {
  const data = getSavedData(userId)
  let contacts = data.contacts

  if (role) {
    contacts = contacts.filter(c => c.role === role)
  }

  return contacts
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, limit)
}

export function updateLastUsed(userId: string, type: 'property' | 'contact', id: string) {
  const data = getSavedData(userId)
  
  if (type === 'property') {
    const property = data.properties.find(p => p.id === id)
    if (property) {
      property.lastUsed = new Date().toISOString()
    }
  } else if (type === 'contact') {
    const contact = data.contacts.find(c => c.id === id)
    if (contact) {
      contact.lastUsed = new Date().toISOString()
    }
  }

  saveFormData(userId, data)
}

// Auto-populate form data based on user history
export function getFormSuggestions(userId: string, userRole?: string) {
  const data = getSavedData(userId)
  const recentProperties = getRecentProperties(userId, 3)
  const recentContacts = getRecentContacts(userId, undefined, 5)

  // Get most common values
  const suggestions = {
    properties: recentProperties,
    contacts: recentContacts,
    commonRent: getMostCommonValue(data.properties, 'rent'),
    commonDeposit: getMostCommonValue(data.properties, 'deposit'),
    commonPropertyType: getMostCommonValue(data.properties, 'type'),
    userPreferences: data.userPreferences
  }

  return suggestions
}

function getMostCommonValue<T>(items: any[], field: keyof T): any {
  const values = items.map(item => item[field]).filter(Boolean)
  if (values.length === 0) return undefined

  const frequency: { [key: string]: number } = {}
  values.forEach(value => {
    const key = String(value)
    frequency[key] = (frequency[key] || 0) + 1
  })

  const mostCommon = Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  )

  // Return original type (number, string, etc.)
  const original = values.find(v => String(v) === mostCommon)
  return original
}

// Extract data from various sources and save for reuse
export function extractAndSaveFromContract(userId: string, contractData: any) {
  if (contractData.propertyAddress) {
    addProperty(userId, {
      address: contractData.propertyAddress,
      rent: contractData.monthlyRent,
      deposit: contractData.depositAmount,
      type: contractData.propertyType
    })
  }

  if (contractData.tenantEmail && contractData.tenantName) {
    addContact(userId, {
      name: contractData.tenantName,
      email: contractData.tenantEmail,
      phone: contractData.tenantPhone,
      role: 'tenant'
    })
  }

  if (contractData.landlordEmail && contractData.landlordName) {
    addContact(userId, {
      name: contractData.landlordName,
      email: contractData.landlordEmail,
      phone: contractData.landlordPhone,
      role: 'landlord'
    })
  }
}

export function extractAndSaveFromNestEscrow(userId: string, escrowData: any) {
  if (escrowData.propertyAddress) {
    addProperty(userId, {
      address: escrowData.propertyAddress,
      rent: escrowData.firstMonthRent,
      deposit: escrowData.depositAmount,
      type: escrowData.propertyType
    })
  }

  if (escrowData.tenantEmail && escrowData.tenantName) {
    addContact(userId, {
      name: escrowData.tenantName,
      email: escrowData.tenantEmail,
      role: 'tenant'
    })
  }

  if (escrowData.landlordEmail) {
    addContact(userId, {
      name: escrowData.landlordName || 'Udlejer',
      email: escrowData.landlordEmail,
      role: 'landlord'
    })
  }
}

export function extractAndSaveFromRentPayment(userId: string, paymentData: any) {
  if (paymentData.propertyAddress) {
    addProperty(userId, {
      address: paymentData.propertyAddress,
      rent: paymentData.monthlyRent / 100 // Convert from øre
    })
  }

  if (paymentData.counterpartEmail && paymentData.counterpartName) {
    const role = paymentData.inviterRole === 'TENANT' ? 'landlord' : 'tenant'
    addContact(userId, {
      name: paymentData.counterpartName,
      email: paymentData.counterpartEmail,
      phone: paymentData.counterpartPhone,
      role
    })
  }
}