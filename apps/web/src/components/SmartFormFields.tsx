'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getRecentProperties, getRecentContacts, PropertyInfo, ContactInfo, updateLastUsed } from '@/lib/dataReuse'

interface SmartPropertyFieldProps {
  value: string
  onChange: (value: string, propertyInfo?: PropertyInfo) => void
  placeholder?: string
  label?: string
  required?: boolean
  showSuggestions?: boolean
}

export function SmartPropertyField({ 
  value, 
  onChange, 
  placeholder = "Indtast ejendomsadresse", 
  label = "Ejendomsadresse",
  required = true,
  showSuggestions = true
}: SmartPropertyFieldProps) {
  const { user } = useAuth()
  const [recentProperties, setRecentProperties] = useState<PropertyInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user && showSuggestions) {
      const recent = getRecentProperties(user.id, 5)
      setRecentProperties(recent)
    }
  }, [user, showSuggestions])

  const handlePropertySelect = (property: PropertyInfo) => {
    onChange(property.address, property)
    if (user) {
      updateLastUsed(user.id, 'property', property.id)
    }
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required={required}
        />
        
        {showDropdown && recentProperties.length > 0 && !value && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-slate-500 border-b">Tidligere anvendte adresser:</div>
            {recentProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => handlePropertySelect(property)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
              >
                <div className="font-medium">{property.address}</div>
                {(property.rent || property.type) && (
                  <div className="text-xs text-slate-500">
                    {property.type && `${property.type}`}
                    {property.rent && ` • ${property.rent.toLocaleString()} DKK/md`}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SmartContactFieldProps {
  nameValue: string
  emailValue: string
  phoneValue?: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string, contactInfo?: ContactInfo) => void
  onPhoneChange?: (value: string) => void
  role?: 'tenant' | 'landlord'
  nameLabel?: string
  emailLabel?: string
  phoneLabel?: string
  required?: boolean
  showSuggestions?: boolean
}

export function SmartContactFields({ 
  nameValue, 
  emailValue, 
  phoneValue,
  onNameChange, 
  onEmailChange, 
  onPhoneChange,
  role,
  nameLabel = "Fulde navn",
  emailLabel = "Email",
  phoneLabel = "Telefonnummer",
  required = true,
  showSuggestions = true
}: SmartContactFieldProps) {
  const { user } = useAuth()
  const [recentContacts, setRecentContacts] = useState<ContactInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user && showSuggestions) {
      const recent = getRecentContacts(user.id, role, 5)
      setRecentContacts(recent)
    }
  }, [user, role, showSuggestions])

  const handleContactSelect = (contact: ContactInfo) => {
    onNameChange(contact.name)
    onEmailChange(contact.email, contact)
    if (onPhoneChange && contact.phone) {
      onPhoneChange(contact.phone)
    }
    if (user) {
      updateLastUsed(user.id, 'contact', contact.id)
    }
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {nameLabel} {required && '*'}
        </label>
        <div className="relative">
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Peter Larsen"
            required={required}
          />
          
          {showDropdown && recentContacts.length > 0 && !nameValue && !emailValue && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 text-xs text-slate-500 border-b">
                Tidligere kontakter{role && ` (${role === 'tenant' ? 'lejere' : 'udlejere'})`}:
              </div>
              {recentContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleContactSelect(contact)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                >
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-xs text-slate-500">
                    {contact.email}
                    {contact.phone && ` • ${contact.phone}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {emailLabel} {required && '*'}
        </label>
        <input
          type="email"
          value={emailValue}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="peter@example.com"
          required={required}
        />
      </div>

      {onPhoneChange && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {phoneLabel}
          </label>
          <input
            type="tel"
            value={phoneValue || ''}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+45 12 34 56 78"
          />
        </div>
      )}
    </div>
  )
}

interface SmartRentFieldProps {
  value: string | number
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  showSuggestions?: boolean
}

export function SmartRentField({ 
  value, 
  onChange, 
  label = "Månedlig husleje (DKK)",
  placeholder = "15000",
  required = true,
  showSuggestions = true
}: SmartRentFieldProps) {
  const { user } = useAuth()
  const [commonRents, setCommonRents] = useState<number[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user && showSuggestions) {
      const recentProperties = getRecentProperties(user.id, 10)
      const rents = recentProperties
        .map(p => p.rent)
        .filter(Boolean)
        .filter((rent, index, self) => self.indexOf(rent) === index) // unique values
        .sort((a, b) => b - a) // highest first
        .slice(0, 5)
      setCommonRents(rents)
    }
  }, [user, showSuggestions])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required={required}
        />
        
        {showDropdown && commonRents.length > 0 && !value && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
            <div className="p-2 text-xs text-slate-500 border-b">Tidligere anvendte huslejer:</div>
            {commonRents.map((rent) => (
              <button
                key={rent}
                type="button"
                onClick={() => {
                  onChange(rent.toString())
                  setShowDropdown(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
              >
                {rent.toLocaleString()} DKK/md
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Smart deposit field that suggests based on rent (typically 3 months rent in Denmark)
interface SmartDepositFieldProps {
  value: string | number
  rentValue?: string | number
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function SmartDepositField({ 
  value, 
  rentValue,
  onChange, 
  label = "Depositum (DKK)",
  placeholder = "45000",
  required = true
}: SmartDepositFieldProps) {
  const suggestedDeposit = rentValue ? Number(rentValue) * 3 : null

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && '*'}
        </label>
        {suggestedDeposit && !value && (
          <button
            type="button"
            onClick={() => onChange(suggestedDeposit.toString())}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Foreslå: {suggestedDeposit.toLocaleString()} DKK (3 mdr.)
          </button>
        )}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}