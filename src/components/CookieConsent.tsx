'use client'

import React, { useState, useEffect } from 'react'
import { gdprCompliance, ConsentType, ProcessingPurpose } from '@/lib/gdpr-compliance'
import { secureStorage } from '@/lib/secure-storage'

interface CookieConsentProps {
  onConsentChange?: (consents: Record<ConsentType, boolean>) => void
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    [ConsentType.ESSENTIAL]: true, // Always required
    [ConsentType.ANALYTICS]: false,
    [ConsentType.MARKETING]: false,
    [ConsentType.FUNCTIONAL]: false,
    [ConsentType.THIRD_PARTY]: false
  })

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = gdprCompliance.getCookieConsent()
    if (!existingConsent) {
      setIsVisible(true)
    } else {
      setConsents(existingConsent)
    }
  }, [])

  const handleConsentChange = (type: ConsentType, granted: boolean) => {
    if (type === ConsentType.ESSENTIAL) return // Essential cookies are always required
    
    setConsents(prev => ({
      ...prev,
      [type]: granted
    }))
  }

  const handleAcceptAll = () => {
    const allConsents = {
      [ConsentType.ESSENTIAL]: true,
      [ConsentType.ANALYTICS]: true,
      [ConsentType.MARKETING]: true,
      [ConsentType.FUNCTIONAL]: true,
      [ConsentType.THIRD_PARTY]: true
    }
    
    saveConsents(allConsents)
  }

  const handleAcceptSelected = () => {
    saveConsents(consents)
  }

  const handleRejectAll = () => {
    const essentialOnly = {
      [ConsentType.ESSENTIAL]: true,
      [ConsentType.ANALYTICS]: false,
      [ConsentType.MARKETING]: false,
      [ConsentType.FUNCTIONAL]: false,
      [ConsentType.THIRD_PARTY]: false
    }
    
    saveConsents(essentialOnly)
  }

  const saveConsents = (finalConsents: Record<ConsentType, boolean>) => {
    // Record each consent type
    Object.entries(finalConsents).forEach(([type, granted]) => {
      const purposes = getProcessingPurposes(type as ConsentType)
      gdprCompliance.recordConsent({
        userId: 'anonymous', // For anonymous users
        consentType: type as ConsentType,
        granted,
        lawfulBasis: granted ? 'consent' : 'none',
        purpose: purposes
      })
    })

    // Save cookie consent
    gdprCompliance.setCookieConsent(finalConsents)
    
    setConsents(finalConsents)
    setIsVisible(false)
    
    if (onConsentChange) {
      onConsentChange(finalConsents)
    }
  }

  const getProcessingPurposes = (type: ConsentType): ProcessingPurpose[] => {
    switch (type) {
      case ConsentType.ESSENTIAL:
        return [ProcessingPurpose.SERVICE_DELIVERY, ProcessingPurpose.LEGAL_COMPLIANCE]
      case ConsentType.ANALYTICS:
        return [ProcessingPurpose.ANALYTICS]
      case ConsentType.MARKETING:
        return [ProcessingPurpose.MARKETING, ProcessingPurpose.COMMUNICATION]
      case ConsentType.FUNCTIONAL:
        return [ProcessingPurpose.SERVICE_DELIVERY]
      case ConsentType.THIRD_PARTY:
        return [ProcessingPurpose.SERVICE_DELIVERY, ProcessingPurpose.ANALYTICS]
      default:
        return []
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white max-w-4xl w-full mx-4 mb-4 rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🍪 Cookie og Privatlivspolitik
            </h2>
            <div className="text-sm text-gray-500">
              GDPR Compliant
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Vi bruger cookies og lignende teknologier for at forbedre din oplevelse på BoligDeposit. 
              Du kan vælge hvilke typer cookies du vil acceptere.
            </p>
            
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                {showDetails ? 'Skjul detaljer' : 'Vis detaljer om cookies'}
              </button>
            </div>

            {showDetails && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Nødvendige Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Disse cookies er nødvendige for at hjemmesiden fungerer korrekt. 
                      De kan ikke deaktiveres.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      Påkrævet
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Analyse Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Hjælper os med at forstå hvordan du bruger hjemmesiden, 
                      så vi kan forbedre din oplevelse.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consents[ConsentType.ANALYTICS]}
                        onChange={(e) => handleConsentChange(ConsentType.ANALYTICS, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Bruges til at vise dig relevante annoncer og markedsføring 
                      baseret på dine interesser.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consents[ConsentType.MARKETING]}
                        onChange={(e) => handleConsentChange(ConsentType.MARKETING, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Funktionalitets Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Gør det muligt at tilbyde forbedrede funktioner og personalisering, 
                      som chatbots og brugerindstillinger.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consents[ConsentType.FUNCTIONAL]}
                        onChange={(e) => handleConsentChange(ConsentType.FUNCTIONAL, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Third Party Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Tredjeparts Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Cookies fra eksterne tjenester som MitID integration, 
                      betalingsgateway og kortkortintegrationer.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consents[ConsentType.THIRD_PARTY]}
                        onChange={(e) => handleConsentChange(ConsentType.THIRD_PARTY, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Afvis alle
            </button>
            <button
              onClick={handleAcceptSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Accepter valgte
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Accepter alle
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Du kan til enhver tid ændre dine cookie-indstillinger i sidens bund. 
              Læs mere i vores{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                privatlivspolitik
              </a>
              {' '}og{' '}
              <a href="/cookie-policy" className="text-blue-600 hover:underline">
                cookie politik
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}