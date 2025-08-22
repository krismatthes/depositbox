'use client'

import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            GDPR Information for BoligDeposit
          </h1>
          
          <div className="prose max-w-none">
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-green-800">100% GDPR Compliant</span>
              </div>
              <p className="text-sm text-green-800">
                BoligDeposit overholder fuldt ud EU's General Data Protection Regulation (GDPR) 
                og dansk databeskyttelseslov. Vi beskytter dine personoplysninger med højeste sikkerhed.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Dine rettigheder under GDPR</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Right to Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ret til information (Art. 13-14)
                </h3>
                <p className="text-blue-800 text-sm">
                  Du har ret til at vide, hvordan og hvorfor vi behandler dine personoplysninger.
                </p>
              </div>

              {/* Right to Access */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ret til indsigt (Art. 15)
                </h3>
                <p className="text-green-800 text-sm">
                  Du kan anmode om en kopi af alle dine personoplysninger, vi har registreret.
                </p>
              </div>

              {/* Right to Rectification */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Ret til berigtigelse (Art. 16)
                </h3>
                <p className="text-yellow-800 text-sm">
                  Du kan få rettet forkerte eller ufuldstændige personoplysninger.
                </p>
              </div>

              {/* Right to Erasure */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Ret til sletning (Art. 17)
                </h3>
                <p className="text-red-800 text-sm">
                  Du kan få slettet dine personoplysninger under visse betingelser.
                </p>
              </div>

              {/* Right to Restriction */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Ret til begrænsning (Art. 18)
                </h3>
                <p className="text-purple-800 text-sm">
                  Du kan få begrænset behandlingen af dine personoplysninger.
                </p>
              </div>

              {/* Right to Data Portability */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Ret til dataportabilitet (Art. 20)
                </h3>
                <p className="text-indigo-800 text-sm">
                  Du kan få dine data i et struktureret, maskinlæsbart format.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Hvordan udøver du dine rettigheder?</h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">📧 Kontakt vores databeskyttelsesansvarlige</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">E-mail anmodning:</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Send din anmodning til:
                  </p>
                  <a href="mailto:privacy@boligdeposit.dk" className="text-blue-600 hover:text-blue-700 font-medium">
                    privacy@boligdeposit.dk
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    Vi svarer inden for 30 dage
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Nødvendige oplysninger:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Dit fulde navn</li>
                    <li>• Registreret e-mailadresse</li>
                    <li>• Hvilken rettighed du vil udøve</li>
                    <li>• Evt. specifikke oplysninger</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Vores sikkerhedsforanstaltninger</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-medium text-blue-900 mb-1">End-to-end kryptering</h4>
                <p className="text-xs text-blue-800">AES-256 kryptering af alle følsomme data</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-medium text-green-900 mb-1">Sikre servere</h4>
                <p className="text-xs text-green-800">Hosting i EU med højeste sikkerhedsstandarder</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h4 className="font-medium text-purple-900 mb-1">Audit logs</h4>
                <p className="text-xs text-purple-800">Fuldstændig sporbarhed af alle datahandlinger</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Databehandling og lovlig basis</h2>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Datatype</th>
                    <th className="border border-gray-300 p-3 text-left">Lovlig basis</th>
                    <th className="border border-gray-300 p-3 text-left">Formål</th>
                    <th className="border border-gray-300 p-3 text-left">Opbevaring</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Kontaktoplysninger</td>
                    <td className="border border-gray-300 p-3">Kontraktopfyldelse</td>
                    <td className="border border-gray-300 p-3">Levering af escrow-service</td>
                    <td className="border border-gray-300 p-3">7 år</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Finansielle data</td>
                    <td className="border border-gray-300 p-3">Juridisk forpligtelse</td>
                    <td className="border border-gray-300 p-3">Regnskab og skat</td>
                    <td className="border border-gray-300 p-3">5 år</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">CPR-nummer</td>
                    <td className="border border-gray-300 p-3">Eksplicit samtykke</td>
                    <td className="border border-gray-300 p-3">Identifikation og verifikation</td>
                    <td className="border border-gray-300 p-3">Indtil formålet ophører</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Brugsstatistikker</td>
                    <td className="border border-gray-300 p-3">Samtykke</td>
                    <td className="border border-gray-300 p-3">Forbedring af service</td>
                    <td className="border border-gray-300 p-3">13 måneder</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Klageadgang</h2>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">Datatilsynet</h3>
              <p className="text-orange-800 text-sm mb-3">
                Hvis du er utilfreds med vores håndtering af dine personoplysninger, 
                kan du klage til Datatilsynet:
              </p>
              <div className="text-sm text-orange-800">
                <p><strong>E-mail:</strong> dt@datatilsynet.dk</p>
                <p><strong>Telefon:</strong> +45 33 19 32 00</p>
                <p><strong>Adresse:</strong> Borgergade 28, 5., 1300 København K</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Automatiseret beslutningstagning</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                BoligDeposit anvender <strong>ikke</strong> automatiseret beslutningstagning eller 
                profilering, der har juridiske konsekvenser for dig. Alle vigtige beslutninger 
                træffes af mennesker eller kræver din eksplicitte godkendelse.
              </p>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 mt-8">
              <h3 className="font-medium mb-4">Kontakt databeskyttelse</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>E-mail:</strong> privacy@boligdeposit.dk</p>
                  <p><strong>Support:</strong> support@boligdeposit.dk</p>
                  <p><strong>Telefon:</strong> +45 XX XX XX XX</p>
                </div>
                <div>
                  <p><strong>Post:</strong></p>
                  <p>BoligDeposit ApS<br />
                  Att: Databeskyttelse<br />
                  [Adresse]</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Vi besvarer henvendelser vedrørende databeskyttelse inden for 30 dage.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}