'use client'

import React, { useState } from 'react'
import Navigation from '@/components/Navigation'
import { gdprCompliance, ConsentType } from '@/lib/gdpr-compliance'

export default function CookiePolicyPage() {
  const [consents, setConsents] = useState(() => {
    return gdprCompliance.getCookieConsent() || {
      [ConsentType.ESSENTIAL]: true,
      [ConsentType.ANALYTICS]: false,
      [ConsentType.MARKETING]: false,
      [ConsentType.FUNCTIONAL]: false,
      [ConsentType.THIRD_PARTY]: false
    }
  })

  const handleConsentChange = (type: ConsentType, granted: boolean) => {
    if (type === ConsentType.ESSENTIAL) return // Essential cookies cannot be disabled
    
    const newConsents = {
      ...consents,
      [type]: granted
    }
    
    setConsents(newConsents)
    gdprCompliance.setCookieConsent(newConsents)
    
    // Record the consent change
    gdprCompliance.recordConsent({
      userId: 'anonymous',
      consentType: type,
      granted,
      lawfulBasis: granted ? 'consent' : 'none',
      purpose: []
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Cookie Politik for BoligDeposit
          </h1>
          
          <div className="prose max-w-none">
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Sidste opdatering:</strong> {new Date().toLocaleDateString('da-DK')}
              </p>
              <p className="text-sm text-blue-800">
                Du kan ændre dine cookie-indstillinger nedenfor.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Hvad er cookies?</h2>
            <p className="mb-4">
              Cookies er små tekstfiler, der gemmes på din computer eller mobile enhed, 
              når du besøger en hjemmeside. De hjælper hjemmesiden med at huske dine 
              handlinger og præferencer over tid.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Hvordan bruger vi cookies?</h2>
            <p className="mb-6">
              Vi bruger cookies til forskellige formål for at forbedre din oplevelse 
              på BoligDeposit og sikre, at vores tjeneste fungerer optimalt.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Cookie-kategorier og dine valg</h2>
            
            {/* Essential Cookies */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🔒 Nødvendige Cookies</h3>
                  <p className="text-gray-600 mt-2">
                    Disse cookies er afgørende for hjemmesidens basale funktioner og kan ikke deaktiveres.
                  </p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Altid aktiv
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Eksempler på nødvendige cookies:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li><strong>session_token:</strong> Holder dig logget ind</li>
                  <li><strong>csrf_token:</strong> Beskytter mod sikkerhedstrusler</li>
                  <li><strong>cookie_consent:</strong> Husker dine cookie-valg</li>
                  <li><strong>language_preference:</strong> Husker dit sprogvalg</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600">
                <strong>Opbevaringstid:</strong> Session cookies slettes når du lukker browseren. 
                Permanente cookies opbevares i op til 1 år.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">📊 Analyse Cookies</h3>
                  <p className="text-gray-600 mt-2">
                    Hjælper os med at forstå, hvordan du bruger hjemmesiden, så vi kan forbedre den.
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={consents[ConsentType.ANALYTICS]}
                    onChange={(e) => handleConsentChange(ConsentType.ANALYTICS, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tillad</span>
                </label>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Hvad vi måler:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>Antal besøgende og sidevisninger</li>
                  <li>Hvor lang tid du tilbringer på siden</li>
                  <li>Hvilke sider der er mest populære</li>
                  <li>Tekniske fejl og ydeevne</li>
                  <li>Brugeradfærd (anonymiseret)</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600">
                <strong>Opbevaringstid:</strong> 13 måneder<br />
                <strong>Tredjepart:</strong> Google Analytics (anonymiseret)
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🎯 Marketing Cookies</h3>
                  <p className="text-gray-600 mt-2">
                    Bruges til at vise dig relevante annoncer og markedsføring på andre hjemmesider.
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={consents[ConsentType.MARKETING]}
                    onChange={(e) => handleConsentChange(ConsentType.MARKETING, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tillad</span>
                </label>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Markedsføringsaktiviteter:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>Retargeting på sociale medier</li>
                  <li>Målrettet reklame</li>
                  <li>Konverteringsmåling</li>
                  <li>E-mail markedsføring personalisering</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600">
                <strong>Opbevaringstid:</strong> 6 måneder<br />
                <strong>Tredjepart:</strong> Facebook Pixel, Google Ads, LinkedIn
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">⚙️ Funktionalitets Cookies</h3>
                  <p className="text-gray-600 mt-2">
                    Giver forbedrede funktioner og personalisering af din oplevelse.
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={consents[ConsentType.FUNCTIONAL]}
                    onChange={(e) => handleConsentChange(ConsentType.FUNCTIONAL, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tillad</span>
                </label>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Funktioner:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>Chat-widget og kundeservice</li>
                  <li>Brugerindstillinger og præferencer</li>
                  <li>Favoritter og gemte søgninger</li>
                  <li>Automatisk udfyldning af formularer</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600">
                <strong>Opbevaringstid:</strong> 6 måneder<br />
                <strong>Tredjepart:</strong> Intercom, Zendesk
              </p>
            </div>

            {/* Third Party Cookies */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🔗 Tredjeparts Cookies</h3>
                  <p className="text-gray-600 mt-2">
                    Cookies fra eksterne tjenester, der er integreret i vores platform.
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={consents[ConsentType.THIRD_PARTY]}
                    onChange={(e) => handleConsentChange(ConsentType.THIRD_PARTY, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tillad</span>
                </label>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Tredjepartstjenester:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li><strong>MitID:</strong> Brugerverifikation og login</li>
                  <li><strong>Betalingsgateway:</strong> Sikker håndtering af betalinger</li>
                  <li><strong>Google Maps:</strong> Kortvisning og adressesøgning</li>
                  <li><strong>reCAPTCHA:</strong> Spam-beskyttelse</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600">
                <strong>Opbevaringstid:</strong> Varierer efter tjeneste<br />
                <strong>Note:</strong> Disse tjenester har deres egne privatlivspolitikker
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Sådan administrerer du cookies</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">BoligDeposit Cookie-indstillinger</h3>
              <p className="text-blue-800 text-sm mb-3">
                Du kan ændre dine cookie-præferencer på denne side eller via cookie-banneret.
              </p>
              <p className="text-blue-800 text-sm">
                Dine nuværende indstillinger gemmes automatisk.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-3">Browser-indstillinger</h3>
              <p className="text-sm text-gray-700 mb-3">
                Du kan også administrere cookies direkte i din browser:
              </p>
              <ul className="list-disc pl-6 text-sm text-gray-700">
                <li><strong>Chrome:</strong> Indstillinger → Avanceret → Beskyttelse af personlige oplysninger og sikkerhed → Cookies</li>
                <li><strong>Firefox:</strong> Indstillinger → Beskyttelse af personlige oplysninger og sikkerhed → Cookies og websitedata</li>
                <li><strong>Safari:</strong> Indstillinger → Beskyttelse af personlige oplysninger → Administrer websitedata</li>
                <li><strong>Edge:</strong> Indstillinger → Cookies og webstedsrettigheder → Cookies og gemte data</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Opdateringer til cookie-politikken</h2>
            <p className="mb-4">
              Vi kan opdatere denne cookie-politik fra tid til anden for at afspejle ændringer 
              i vores praksis eller af andre juridiske eller regulatoriske årsager.
            </p>

            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 mt-8">
              <h3 className="font-medium mb-4">Har du spørgsmål om cookies?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Kontakt os på <strong>privacy@boligdeposit.dk</strong> hvis du har spørgsmål 
                om vores brug af cookies eller denne politik.
              </p>
              <p className="text-sm text-gray-600">
                Læs også vores{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">
                  privatlivspolitik
                </a>
                {' '}for mere information om, hvordan vi beskytter dine data.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}