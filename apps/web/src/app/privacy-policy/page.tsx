'use client'

import React from 'react'
import Navigation from '@/components/Navigation'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privatlivspolitik for BoligDeposit
          </h1>
          
          <div className="prose max-w-none">
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Sidste opdatering:</strong> {new Date().toLocaleDateString('da-DK')}
              </p>
              <p className="text-sm text-blue-800">
                <strong>GDPR Compliant:</strong> Denne politik overholder EU's General Data Protection Regulation
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Dataansvarlig</h2>
            <p>
              BoligDeposit er dataansvarlig for behandlingen af dine personoplysninger.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <p><strong>Kontaktoplysninger:</strong></p>
              <p>E-mail: privacy@boligdeposit.dk</p>
              <p>Telefon: +45 XX XX XX XX</p>
              <p>Adresse: [Adresse]</p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Hvilke personoplysninger indsamler vi?</h2>
            <h3 className="text-lg font-medium mb-3">Grundlæggende oplysninger:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Navn (fornavn og efternavn)</li>
              <li>E-mailadresse</li>
              <li>Telefonnummer</li>
              <li>CPR-nummer (kun for verifikation)</li>
              <li>Adresse</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">Finansielle oplysninger:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Månedlig indkomst</li>
              <li>Bankkontoplysninger (til depositum)</li>
              <li>Betalingshistorik</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">Tekniske oplysninger:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP-adresse</li>
              <li>Browser-information</li>
              <li>Cookies og lignende teknologier</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Hvorfor behandler vi dine oplysninger?</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">Kontraktopfyldelse (Art. 6, stk. 1, litra b)</h3>
                <p>For at levere escrow-tjenester og administrere lejekontrakter.</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium">Juridisk forpligtelse (Art. 6, stk. 1, litra c)</h3>
                <p>For at overholde lovgivning om hvidvask og skatteindberetning.</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-medium">Berettiget interesse (Art. 6, stk. 1, litra f)</h3>
                <p>For svindelforebyggelse og sikkerhedsforanstaltninger.</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium">Samtykke (Art. 6, stk. 1, litra a)</h3>
                <p>For marketing, analyse og forbedring af tjenester.</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Særlige kategorier af personoplysninger</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                <strong>CPR-numre:</strong> Vi behandler CPR-numre udelukkende til identifikation og verifikation. 
                Dette sker på grundlag af dit eksplicitte samtykke og er nødvendigt for at levere vores tjeneste sikkert.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Hvem deler vi dine oplysninger med?</h2>
            <h3 className="text-lg font-medium mb-3">Databehandlere:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>MitID:</strong> For brugerverifikation</li>
              <li><strong>Betalingsgateway:</strong> For håndtering af betalinger</li>
              <li><strong>Hosting-udbyder:</strong> For sikker opbevaring af data</li>
              <li><strong>E-mail-tjeneste:</strong> For kommunikation</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">Myndigheder:</h3>
            <p className="mb-4">
              Vi kan dele oplysninger med relevante myndigheder, når det er lovpligtigt, 
              herunder skattemyndighederne og hvidvaskenheden.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Dine rettigheder</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Ret til indsigt (Art. 15)</h3>
                <p className="text-blue-800 text-sm">Du kan anmode om en kopi af alle dine personoplysninger.</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Ret til berigtigelse (Art. 16)</h3>
                <p className="text-green-800 text-sm">Du kan få rettet forkerte eller ufuldstændige oplysninger.</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">Ret til sletning (Art. 17)</h3>
                <p className="text-red-800 text-sm">Du kan få slettet dine oplysninger under visse betingelser.</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Ret til dataportabilitet (Art. 20)</h3>
                <p className="text-purple-800 text-sm">Du kan få dine data i et struktureret, maskinlæsbart format.</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Sådan udøver du dine rettigheder:</h3>
              <p>Send en e-mail til <strong>privacy@boligdeposit.dk</strong> med din anmodning.</p>
              <p className="text-sm text-gray-600 mt-2">
                Vi svarer senest inden for 30 dage og kan anmode om yderligere identifikation.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Opbevaring af data</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Datatype</th>
                    <th className="border border-gray-300 p-3 text-left">Opbevaringsperiode</th>
                    <th className="border border-gray-300 p-3 text-left">Grund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Kontraktdata</td>
                    <td className="border border-gray-300 p-3">7 år efter kontraktens ophør</td>
                    <td className="border border-gray-300 p-3">Juridisk forpligtelse</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Finansielle data</td>
                    <td className="border border-gray-300 p-3">5 år</td>
                    <td className="border border-gray-300 p-3">Regnskabslovgivning</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Kommunikation</td>
                    <td className="border border-gray-300 p-3">3 år</td>
                    <td className="border border-gray-300 p-3">Dokumentation</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Cookies/analyse</td>
                    <td className="border border-gray-300 p-3">13 måneder</td>
                    <td className="border border-gray-300 p-3">Samtykke</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Sikkerhed</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">🔒 Vores sikkerhedsforanstaltninger:</h3>
              <ul className="list-disc pl-6 text-green-800">
                <li>End-to-end kryptering af alle data</li>
                <li>Regelmæssige sikkerhedsaudit</li>
                <li>To-faktor autentificering</li>
                <li>HTTPS/TLS kryptering</li>
                <li>Begrænsede adgangsrettigheder</li>
                <li>Automatisk sikkerhedsovervågning</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Cookies og sporing</h2>
            <p className="mb-4">
              Vi bruger cookies til at forbedre din oplevelse. Du kan læse mere i vores{' '}
              <a href="/cookie-policy" className="text-blue-600 hover:underline">
                cookie politik
              </a>
              {' '}og ændre dine indstillinger til enhver tid.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Internationale overførsler</h2>
            <p className="mb-4">
              Dine data opbevares primært i EU. Hvis vi overfører data til tredjelande, 
              sker det kun til lande med tilstrækkelig beskyttelse eller med passende 
              sikkerhedsforanstaltninger.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Klager</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p>
                Du har ret til at klage til Datatilsynet, hvis du mener, 
                at vi behandler dine personoplysninger i strid med gældende ret.
              </p>
              <p className="mt-2">
                <strong>Datatilsynet:</strong> dt@datatilsynet.dk | +45 33 19 32 00
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Ændringer til denne politik</h2>
            <p>
              Vi kan opdatere denne privatlivspolitik fra tid til anden. 
              Væsentlige ændringer vil blive kommunikeret via e-mail eller på hjemmesiden.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
              <h3 className="font-medium mb-4">Kontakt os vedrørende privatlivsspørgsmål:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>E-mail:</strong> privacy@boligdeposit.dk</p>
                  <p><strong>Telefon:</strong> +45 XX XX XX XX</p>
                </div>
                <div>
                  <p><strong>Post:</strong></p>
                  <p>BoligDeposit<br />
                  Att: Databeskyttelse<br />
                  [Adresse]</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}