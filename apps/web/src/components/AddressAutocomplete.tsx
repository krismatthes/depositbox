'use client'

import { useState, useEffect, useRef } from 'react'

interface Address {
  tekst: string
  adresse: {
    id: string
    status: number
    darstatus: number
    vejnavn: string
    husnr: string
    etage?: string
    dør?: string
    supplerendebynavn?: string
    postnr: string
    postnrnavn: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  name?: string
  id?: string
  required?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Indtast adresse...",
  className = "",
  name,
  id,
  required = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Address[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=8`
      )
      const data = await response.json()
      setSuggestions(data)
      setIsOpen(data.length > 0)
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    searchAddresses(newValue)
  }

  const handleSuggestionClick = (address: Address) => {
    onChange(address.tekst)
    setIsOpen(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          required={required}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30 ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {/* Location Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((address, index) => (
            <button
              key={`${address.adresse.id}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(address)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-slate-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-medium truncate">
                    {address.adresse.vejnavn} {address.adresse.husnr}
                    {address.adresse.etage && `, ${address.adresse.etage}`}
                    {address.adresse.dør && ` ${address.adresse.dør}`}
                  </p>
                  <p className="text-slate-500 text-sm truncate">
                    {address.adresse.postnr} {address.adresse.postnrnavn}
                    {address.adresse.supplerendebynavn && `, ${address.adresse.supplerendebynavn}`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>🇩🇰 Skriv mindst 3 bogstaver for at søge danske adresser</span>
      </p>
    </div>
  )
}