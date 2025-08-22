'use client'

import React from 'react'
import Navigation from '@/components/Navigation'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Servicevilkår for BoligDeposit
          </h1>
          
          <div className="prose max-w-none">
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Sidste opdatering:</strong> {new Date().toLocaleDateString('da-DK')}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Gældende fra:</strong> Ved tilmelding til BoligDeposit-platformen
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Generelle bestemmelser</h2>
            
            <h3 className="text-lg font-medium mb-3">1.1 Virksomhedsoplysninger</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p><strong>BoligDeposit ApS</strong></p>
              <p>CVR-nr.: [CVR-NUMMER]</p>
              <p>Adresse: [ADRESSE]</p>
              <p>E-mail: support@boligdeposit.dk</p>
              <p>Telefon: +45 XX XX XX XX</p>
            </div>

            <h3 className="text-lg font-medium mb-3">1.2 Platformens formål</h3>
            <p className="mb-4">
              BoligDeposit er en digital platform, der tilbyder escrow-tjenester til håndtering 
              af depositum og andre finansielle transaktioner mellem udlejere og lejere i Danmark. 
              Platformen sikrer tryg og lovlig håndtering af depositum i overensstemmelse med dansk 
              lejelovgivning.
            </p>

            <h3 className="text-lg font-medium mb-3">1.3 Aftaleindgåelse</h3>
            <p className="mb-4">
              Ved oprettelse af en bruger på BoligDeposit accepterer du disse servicevilkår. 
              Aftalen træder i kraft fra det tidspunkt, hvor du klikker "Accepter" under 
              registreringsprocessen.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Brugertyper og adgang</h2>
            
            <h3 className="text-lg font-medium mb-3">2.1 Udlejere</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Skal være myndig og have juridisk ret til at udleje boligen</li>
              <li>Skal være verificeret via MitID</li>
              <li>Ansvarlig for korrekte oplysninger om udlejningsejendom</li>
              <li>Kan oprette og administrere escrow-konti for depositum</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">2.2 Lejere</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Skal være myndig og have bolig i Danmark</li>
              <li>Skal være verificeret via MitID</li>
              <li>Kan deltage i escrow-aftaler oprettet af udlejere</li>
              <li>Har ret til transparent visning af depositum-status</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">2.3 Verifikationskrav</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Obligatorisk MitID-verifikation:</strong> Alle brugere skal verificeres 
                via MitID for at sikre identitet og overholdelse af hvidvasklovgivningen.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Escrow-tjenester</h2>
            
            <h3 className="text-lg font-medium mb-3">3.1 NEST-escrow (Neutral Escrow Security Trust)</h3>
            <p className="mb-4">
              NEST er vores primære escrow-løsning, der sikrer neutral opbevaring af depositum 
              mellem parter i en lejeaftale.
            </p>

            <h4 className="font-medium mb-2">Sådan fungerer NEST:</h4>
            <ol className="list-decimal pl-6 mb-4">
              <li>Udlejer opretter en NEST-escrow med boligoplysninger</li>
              <li>Lejer inviteres til at deltage og acceptere vilkår</li>
              <li>Depositum indbetales til escrow-kontoen</li>
              <li>Midlerne holdes neutralt indtil lejemålets ophør</li>
              <li>Udbetaling sker efter gensidig aftale eller voldgift</li>
            </ol>

            <h3 className="text-lg font-medium mb-3">3.2 Gebyrer og omkostninger</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Tjeneste</th>
                    <th className="border border-gray-300 p-3 text-left">Gebyr</th>
                    <th className="border border-gray-300 p-3 text-left">Betales af</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">NEST-escrow oprettelse</td>
                    <td className="border border-gray-300 p-3">99 DKK</td>
                    <td className="border border-gray-300 p-3">Udlejer</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Månedlig administrations-gebyr</td>
                    <td className="border border-gray-300 p-3">19 DKK/måned</td>
                    <td className="border border-gray-300 p-3">Udlejer</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Indbetaling til escrow</td>
                    <td className="border border-gray-300 p-3">Gratis</td>
                    <td className="border border-gray-300 p-3">-</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Standard udbetaling</td>
                    <td className="border border-gray-300 p-3">Gratis</td>
                    <td className="border border-gray-300 p-3">-</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Tvistløsning/voldgift</td>
                    <td className="border border-gray-300 p-3">299 DKK</td>
                    <td className="border border-gray-300 p-3">Begge parter</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Brugerens forpligtelser</h2>
            
            <h3 className="text-lg font-medium mb-3">4.1 Korrekte oplysninger</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Du skal opgive korrekte og opdaterede personoplysninger</li>
              <li>Du skal omgående meddele ændringer i dine oplysninger</li>
              <li>Du er ansvarlig for skader opstået pga. forkerte oplysninger</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">4.2 Sikkerhed og adgangskoder</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Du skal holde dine login-oplysninger hemmelige</li>
              <li>Du skal omgående meddele mistanke om misbrug af din konto</li>
              <li>Du er ansvarlig for al aktivitet på din konto</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">4.3 Forbudt brug</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 mb-2"><strong>Det er forbudt at bruge platformen til:</strong></p>
              <ul className="list-disc pl-6 text-red-800">
                <li>Ulovlige aktiviteter eller svindel</li>
                <li>Hvidvask eller finansiering af terrorisme</li>
                <li>Krænkelse af andre brugeres rettigheder</li>
                <li>Upload af virus eller skadelig kode</li>
                <li>Forsøg på at omgå sikkerhedsforanstaltninger</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. BoligDeposits forpligtelser</h2>
            
            <h3 className="text-lg font-medium mb-3">5.1 Tjenestens tilgængelighed</h3>
            <p className="mb-4">
              Vi stræber efter 99,5% oppetid, men kan ikke garantere uafbrudt adgang til platformen 
              grundet vedligeholdelse, tekniske problemer eller andre omstændigheder uden for vores kontrol.
            </p>

            <h3 className="text-lg font-medium mb-3">5.2 Sikkerhed og databeskyttelse</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Vi anvender branchestandarder for datasikkerhed</li>
              <li>End-to-end kryptering af følsomme data</li>
              <li>Regelmæssige sikkerhedsaudit og penetrationstest</li>
              <li>Overholdelse af GDPR og dansk databeskyttelseslov</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">5.3 Kundeservice</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p><strong>Support:</strong> support@boligdeposit.dk</p>
              <p><strong>Telefon:</strong> +45 XX XX XX XX (hverdage 9-17)</p>
              <p><strong>Svartid:</strong> Maksimalt 24 timer på hverdage</p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Betaling og refusion</h2>
            
            <h3 className="text-lg font-medium mb-3">6.1 Betalingsmetoder</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Dankort og internationale kreditkort</li>
              <li>MobilePay</li>
              <li>Bankoverførsel</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">6.2 Automatisk betaling</h3>
            <p className="mb-4">
              Månedlige administrationsgebyrer trækkes automatisk via dit registrerede betalingskort. 
              Du modtager besked 7 dage før træk.
            </p>

            <h3 className="text-lg font-medium mb-3">6.3 Refusionspolitik</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p><strong>Oprettelsesgebyrer:</strong> Refunderes ikke efter escrow-oprettelse</p>
              <p><strong>Månedlige gebyrer:</strong> Refunderes ikke for påbegyndte måneder</p>
              <p><strong>Tvistløsning:</strong> Refunderes kun hvis tvist afvises</p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Tvistløsning</h2>
            
            <h3 className="text-lg font-medium mb-3">7.1 Intern tvistløsning</h3>
            <p className="mb-4">
              Ved uenighed om depositum-udbetaling tilbyder BoligDeposit neutral voldgift 
              udført af certificerede boligeksperter.
            </p>

            <h3 className="text-lg font-medium mb-3">7.2 Voldgiftsproces</h3>
            <ol className="list-decimal pl-6 mb-4">
              <li>En part anmoder om voldgift via platformen</li>
              <li>Begge parter præsenterer deres sag med dokumentation</li>
              <li>Neutral voldgiftsdommer gennemgår sagen</li>
              <li>Bindende afgørelse træffes inden for 14 dage</li>
              <li>Depositum udbetales i henhold til afgørelsen</li>
            </ol>

            <h3 className="text-lg font-medium mb-3">7.3 Klageadgang</h3>
            <p className="mb-4">
              Du kan klage til Ankenævnet for Forsikring og Pension eller rette henvendelse 
              til domstolene, hvis du er utilfreds med vores afgørelse.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Ansvarsbegrænsning</h2>
            
            <h3 className="text-lg font-medium mb-3">8.1 Direkte tab</h3>
            <p className="mb-4">
              BoligDeposits ansvar for direkte tab er begrænset til det beløb, der er betalt 
              i gebyrer til BoligDeposit i de seneste 12 måneder, dog maksimalt 50.000 DKK.
            </p>

            <h3 className="text-lg font-medium mb-3">8.2 Indirekte tab</h3>
            <p className="mb-4">
              BoligDeposit er ikke ansvarlig for indirekte tab, herunder driftstab, 
              avancetab eller andre følgeskader.
            </p>

            <h3 className="text-lg font-medium mb-3">8.3 Force majeure</h3>
            <p className="mb-4">
              BoligDeposit er ikke ansvarlig for forhold uden for vores kontrol, 
              herunder naturkatastrofer, krig, terrorhandlinger, lovindgreb eller 
              nedbrud af tredjeparts-systemer.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Opsigelse og lukning</h2>
            
            <h3 className="text-lg font-medium mb-3">9.1 Brugerens opsigelse</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Du kan til enhver tid slette din konto via indstillinger</li>
              <li>Aktive escrow-aftaler skal afsluttes før sletning</li>
              <li>Betalte gebyrer refunderes ikke ved opsigelse</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">9.2 BoligDeposits opsigelse</h3>
            <p className="mb-4">
              Vi kan lukke din konto med 30 dages varsel eller omgående ved:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Brud på disse servicevilkår</li>
              <li>Mistanke om svindel eller misbrug</li>
              <li>Manglende betaling af gebyrer</li>
              <li>Inaktivitet i over 24 måneder</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Ændringer og opdateringer</h2>
            
            <h3 className="text-lg font-medium mb-3">10.1 Ændring af vilkår</h3>
            <p className="mb-4">
              BoligDeposit kan ændre disse vilkår med 30 dages skriftligt varsel. 
              Væsentlige ændringer kræver dit samtykke.
            </p>

            <h3 className="text-lg font-medium mb-3">10.2 Platformsopdateringer</h3>
            <p className="mb-4">
              Vi forbeholder os ret til at opdatere og forbedre platformen. 
              Større ændringer kommunikeres på forhånd.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Lovvalg og værneting</h2>
            
            <h3 className="text-lg font-medium mb-3">11.1 Dansk ret</h3>
            <p className="mb-4">
              Disse vilkår er underlagt dansk ret, herunder lejelovgivning og 
              lov om forbrugeraftaler.
            </p>

            <h3 className="text-lg font-medium mb-3">11.2 Værneting</h3>
            <p className="mb-4">
              Eventuelle tvister, der ikke kan løses gennem forhandling eller voldgift, 
              skal afgøres ved danske domstole med København som værneting.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Kontakt og support</h2>
            
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-medium mb-4">Har du spørgsmål til servicevilkårene?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>E-mail:</strong> legal@boligdeposit.dk</p>
                  <p><strong>Support:</strong> support@boligdeposit.dk</p>
                  <p><strong>Telefon:</strong> +45 XX XX XX XX</p>
                </div>
                <div>
                  <p><strong>Post:</strong></p>
                  <p>BoligDeposit ApS<br />
                  Att: Juridisk afdeling<br />
                  [Adresse]</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600">
                <strong>Senest opdateret:</strong> {new Date().toLocaleDateString('da-DK')}<br />
                <strong>Version:</strong> 1.0<br />
                <strong>Godkendelse påkrævet:</strong> Ved registrering og ved væsentlige ændringer
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}