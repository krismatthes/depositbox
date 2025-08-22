'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import DigitalSignature from '@/components/DigitalSignature'

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount
  return (numAmount / 100).toLocaleString('da-DK')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ikke angivet'
  return new Date(dateString).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function ContractSignPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<any>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && params.id) {
      // Find the contract/escrow from localStorage or API
      const contractId = params.id as string
      
      // Try to load contract from created_contracts first
      const createdContracts = localStorage.getItem('created_contracts')
      let foundContract = null
      
      if (createdContracts) {
        try {
          const contracts = JSON.parse(createdContracts)
          foundContract = contracts.find((c: any) => c.id === contractId)
        } catch (error) {
          console.error('Failed to parse created contracts:', error)
        }
      }
      
      // If no created contract found, use dummy data for old escrow contracts
      if (!foundContract) {
        foundContract = {
          id: contractId,
          title: `Lejekontrakt - ${contractId === 'escrow-funded-demo' ? 'Østerbrogade 12' : 'Bolig'}`,
          propertyAddress: contractId === 'escrow-funded-demo' ? 'Østerbrogade 12, 2100 København Ø' : 'Boligadresse',
          landlord: {
            firstName: 'Peter',
            lastName: 'Larsen',
            email: 'peter.larsen@email.com',
            phone: '12 34 56 78',
            cprNumber: '010180-1234',
            address: 'Udlejergade 10, 2100 København Ø'
          },
          tenant: user?.role === 'TENANT' ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : {
            id: 'tenant-demo',
            firstName: 'Lejer',
            lastName: 'Jørgensen',
            email: 'lejer.jorgensen@email.com'
          },
          monthlyRent: 8000,
          deposit: 12000,
          startDate: '2025-09-01',
          endDate: '2026-08-31',
          propertySize: 75,
          rooms: '3 værelser',
          floor: '3. sal',
          elevator: true,
          furnished: false,
          createdAt: new Date('2025-01-15').toISOString()
        }
      }
      
      setContract(foundContract)
      
      // Automatically open signature modal when page loads
      setTimeout(() => {
        setShowSignature(true)
      }, 500) // Small delay to ensure contract is loaded
    }
  }, [user, loading, router, params.id])

  const handleSign = async (signatureData: string) => {
    if (!contract || !user) return
    
    setSigning(true)
    
    try {
      // Save signature to localStorage
      const signatureInfo = {
        signatureData,
        signerName: `${user.firstName} ${user.lastName}`,
        signerEmail: user.email,
        signedAt: new Date().toISOString(),
        documentTitle: contract.title
      }
      
      const storageKey = user.role === 'TENANT' 
        ? `signature_tenant_${contract.id}`
        : `signature_landlord_${contract.id}`
      
      localStorage.setItem(storageKey, JSON.stringify(signatureInfo))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect back to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Failed to sign contract:', error)
      alert('Der opstod en fejl ved underskrivning. Prøv igen.')
    } finally {
      setSigning(false)
    }
  }

  const handleCancel = () => {
    setShowSignature(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Kontrakt ikke fundet</h1>
            <p className="text-slate-600 mb-6">Den ønskede kontrakt kunne ikke findes.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Tilbage til Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Underskriv Lejekontrakt</h1>
                <p className="text-slate-600 mt-1">{contract.propertyAddress}</p>
              </div>
            </div>
          </div>

          {/* Full Lease Contract */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">LEJEKONTRAKT</h2>
              <p className="text-purple-100 text-sm">Lejemål i enfamiliehus/ejerlejlighed</p>
            </div>
            
            <div className="p-8 space-y-8 text-sm leading-relaxed">
              {/* Contract Header */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">LEJEKONTRAKT</h1>
                <p className="text-slate-600">for lejemål i enfamiliehus/ejerlejlighed</p>
                <p className="text-slate-600 mt-2">Oprettet den {formatDate(contract.createdAt)}</p>
              </div>

              {/* Parties Section */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 1. KONTRAKTENS PARTER</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">UDLEJER:</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-1">
                      <p className="font-medium">{contract.landlord.firstName} {contract.landlord.lastName}</p>
                      <p className="text-sm">{contract.landlord.email}</p>
                      {contract.landlord.phone && <p className="text-sm">Telefon: {contract.landlord.phone}</p>}
                      {contract.landlord.cprNumber && <p className="text-sm">CPR: {contract.landlord.cprNumber}</p>}
                      {contract.landlord.address && <p className="text-sm">{contract.landlord.address}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">LEJER:</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-1">
                      <p className="font-medium">{contract.tenant.firstName} {contract.tenant.lastName}</p>
                      <p className="text-sm">{contract.tenant.email}</p>
                      {contract.tenant.phone && <p className="text-sm">Telefon: {contract.tenant.phone}</p>}
                      {contract.tenant.cprNumber && <p className="text-sm">CPR: {contract.tenant.cprNumber}</p>}
                      {contract.tenant.address && <p className="text-sm">Nuværende adresse: {contract.tenant.address}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 2. LEJEMÅLETS BESKRIVELSE</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Ejendommens adresse:</h3>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="font-medium">{contract.propertyAddress}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Lejemålets beskrivelse:</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p><strong>Størrelse:</strong> {contract.propertySize} m²</p>
                      <p><strong>Antal værelser:</strong> {contract.rooms}</p>
                      <p><strong>Etage:</strong> {contract.floor}</p>
                      <p><strong>Elevator:</strong> {contract.elevator ? 'Ja' : 'Nej'}</p>
                      <p><strong>Møbleret:</strong> {contract.furnished ? 'Ja' : 'Nej'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p><strong>Lejemålet omfatter:</strong> Lejlighed med køkken, badeværelse, {contract.propertyDetails?.rooms?.toLowerCase() || contract.rooms?.toLowerCase() || 'værelser'}, samt adgang til fælles områder som angivet i husordenen.</p>
                </div>
              </div>

              {/* Lease Period */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 3. LEJEPERIODE</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p><strong>Lejeforhold påbegyndes:</strong> {formatDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <p><strong>Lejeforhold ophører:</strong> {formatDate(contract.endDate)}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p><strong>Bemærk:</strong> Dette er et tidsbegrænset lejemål. Kontrakten udløber automatisk på den angivne slutdato uden yderligere opsigelse.</p>
                </div>
              </div>

              {/* Rent and Costs */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 4. LEJE OG OMKOSTNINGER</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-2">Månedlig husleje:</h3>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(contract.monthlyRent * 100)} DKK</p>
                        <p className="text-sm text-slate-600">Betales forud hver måned</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-2">Depositum:</h3>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(contract.deposit * 100)} DKK</p>
                        <p className="text-sm text-green-600">Sikret via Nest Escrow Service</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Betalingsvilkår:</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Huslejen betales forud hver måned, senest den 1. i måneden</li>
                      <li>Første måneds husleje er betalt ved kontraktens indgåelse</li>
                      <li>Depositum er sikret gennem Nest Escrow Service og frigives ved fraflytning</li>
                      <li>Ved for sen betaling påløber renter i henhold til renteloven</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 5. VARME, VAND, EL OG ANDRE UDGIFTER</h2>
                
                <div className="space-y-3">
                  <p><strong>Lejerens ansvar:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>El-forbrug (egen måleur)</li>
                    <li>Internet og TV</li>
                    <li>Telefon</li>
                    <li>Eventuelle parkeringsudgifter</li>
                  </ul>

                  <p className="mt-4"><strong>Udlejerens ansvar:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Varme</li>
                    <li>Vand og spildevand</li>
                    <li>Renovation</li>
                    <li>Ejendomsskat</li>
                    <li>Grundejerforening/ejerforening</li>
                  </ul>
                </div>
              </div>

              {/* Use of Property */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 6. LEJEMÅLETS BRUG</h2>
                
                <div className="space-y-3">
                  <p>Lejemålet må kun anvendes til <strong>beboelse for lejeren og dennes husstand</strong>.</p>
                  
                  <p><strong>Følgende er ikke tilladt uden udlejerens skriftlige samtykke:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Erhvervsvirksomhed i lejemålet</li>
                    <li>Fremleje af hele eller dele af lejemålet</li>
                    <li>Husdyr (dog tilladt med skriftligt samtykke)</li>
                    <li>Ændringer eller ombygginger</li>
                    <li>Faste installationer (vaskemaskine, tørretumbler, etc.)</li>
                  </ul>
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 7. VEDLIGEHOLDELSE</h2>
                
                <div className="space-y-4">
                  <div>
                    <p><strong>Lejerens vedligeholdelsespligt:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                      <li>Indvendig vedligeholdelse og rengøring</li>
                      <li>Udskiftning af pærer, sikringer og andre forbrugsdele</li>
                      <li>Mindre reparationer og justeringer</li>
                      <li>Vedligeholdelse af hvidevarer hvis medfølgende</li>
                    </ul>
                  </div>

                  <div>
                    <p><strong>Udlejerens vedligeholdelsespligt:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                      <li>Udvendig vedligeholdelse</li>
                      <li>Større reparationer af installationer</li>
                      <li>Vedligeholdelse af fælles områder</li>
                      <li>Strukturelle reparationer</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Termination */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 8. OPSIGELSE</h2>
                
                <div className="space-y-3">
                  <p>Da dette er et <strong>tidsbegrænset lejemål</strong>, udløber kontrakten automatisk den {formatDate(contract.endDate)} uden yderligere opsigelse.</p>
                  
                  <p><strong>Ekstraordinær opsigelse:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Ved misligholdelse kan kontrakten opsiges med 14 dages varsel</li>
                    <li>Ved grov misligholdelse kan kontrakten ophæves uden varsel</li>
                    <li>Lejer kan opsige med 1 måneds varsel til den 1. i en måned</li>
                  </ul>
                </div>
              </div>

              {/* Move-out */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 9. FRAFLYTNING</h2>
                
                <div className="space-y-3">
                  <p>Ved fraflytning skal lejemålet afleveres i samme stand som ved indflytning, bortset fra almindelig slitage.</p>
                  
                  <p><strong>Fraflytningsvilkår:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejemålet skal rengøres grundigt</li>
                    <li>Alle personlige ejendele skal fjernes</li>
                    <li>Nøgler afleveres til udlejer</li>
                    <li>Fraflytningsrapport udfyldes</li>
                    <li>Depositum frigives via Nest Escrow Service efter godkendelse</li>
                  </ul>
                </div>
              </div>

              {/* Security and Insurance */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 10. SIKKERHED OG FORSIKRING</h2>
                
                <div className="space-y-3">
                  <p><strong>Lejerens forsikringspligt:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejer skal have indbo- og ansvarsforsikring</li>
                    <li>Forsikringen skal dække skader på lejemålet og tredjemands ejendom</li>
                    <li>Forsikringsbevis skal fremvises på udlejerens anmodning</li>
                  </ul>

                  <p className="mt-4"><strong>Nøgler og adgang:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejer modtager nøgler til lejemålet ved indflytning</li>
                    <li>Ekstra nøgler kan bestilles for lejerens regning</li>
                    <li>Ved nøgletab betaler lejer for omlåsning</li>
                    <li>Alle nøgler skal afleveres ved fraflytning</li>
                  </ul>
                </div>
              </div>

              {/* Improvements and Modifications */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 11. FORBEDRINGER OG ÆNDRINGER</h2>
                
                <div className="space-y-3">
                  <p><strong>Lejerens ret til forbedringer:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Mindre forbedringer kan udføres uden samtykke (maling, tapetsering)</li>
                    <li>Større ændringer kræver udlejerens skriftlige samtykke</li>
                    <li>Lejer bærer alle omkostninger ved forbedringer</li>
                    <li>Ved fraflytning kan udlejer kræve genoprettelse</li>
                  </ul>

                  <p className="mt-4"><strong>Forbudte ændringer uden samtykke:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Strukturelle ændringer (nedrivning af vægge, etc.)</li>
                    <li>Installation af fast inventar (køkkenelementer, indbygningsskabe)</li>
                    <li>Ændringer af VVS- og el-installationer</li>
                    <li>Opsætning af antenner eller paraboler</li>
                  </ul>
                </div>
              </div>

              {/* House Rules and Common Areas */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 12. HUSORDEN OG FÆLLESOMRÅDER</h2>
                
                <div className="space-y-3">
                  <p><strong>Husorden:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejer skal overholde ejendommens husorden</li>
                    <li>Støjende aktiviteter er forbudt mellem kl. 22:00 og 07:00</li>
                    <li>Rygning er ikke tilladt i lejemålet og fælles områder</li>
                    <li>Lejer er ansvarlig for gæsters opførsel</li>
                  </ul>

                  <p className="mt-4"><strong>Fælles områder:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Adgang til fælles kælder- og loftrum efter aftale</li>
                    <li>Fælles vaskerum anvendes efter booking-system</li>
                    <li>Cykel- og barnevognsopbevaring i dertil indrettede områder</li>
                    <li>Renholdelse af fælles områder varetages af udlejer</li>
                  </ul>
                </div>
              </div>

              {/* Default and Legal Consequences */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 13. MISLIGHOLDELSE OG JURIDISKE KONSEKVENSER</h2>
                
                <div className="space-y-3">
                  <p><strong>Lejerens misligholdelse:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>For sen betaling af husleje medfører renter og gebyr</li>
                    <li>Gentagen for sen betaling kan medføre opsigelse</li>
                    <li>Overtrædelse af husorden kan medføre advarsel eller opsigelse</li>
                    <li>Skader på lejemålet ud over almindelig slitage erstattes af lejer</li>
                  </ul>

                  <p className="mt-4"><strong>Udlejerens misligholdelse:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Manglende vedligeholdelse giver lejer ret til huslejenedsættelse</li>
                    <li>Væsentlige mangler giver ret til erstatning</li>
                    <li>Ved grov misligholdelse kan lejer ophæve kontrakten</li>
                  </ul>

                  <p className="mt-4"><strong>Tvistløsning:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Først forsøg på mindelig løsning mellem parterne</li>
                    <li>Ved uenighed kan sagen indbringes for Huslejenævnet</li>
                    <li>Boligrettens regler finder anvendelse</li>
                  </ul>
                </div>
              </div>

              {/* Environmental and Energy */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 14. MILJØ OG ENERGI</h2>
                
                <div className="space-y-3">
                  <p><strong>Energimærkning:</strong></p>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p>Ejendommens energimærke: <span className="font-semibold text-green-600">B</span></p>
                    <p className="text-sm text-slate-600 mt-1">Energimærkningsrapport er tilgængelig hos udlejer</p>
                  </div>

                  <p className="mt-4"><strong>Miljøhensyn:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Affaldssortering efter kommunale retningslinjer</li>
                    <li>Sparsommelig brug af vand og elektricitet opfordres</li>
                    <li>Miljøvenlige produkter anbefales ved rengøring</li>
                  </ul>
                </div>
              </div>

              {/* Rent Regulation and Increases */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 15. LEJEREGULERING</h2>
                
                <div className="space-y-3">
                  <p><strong>Huslejeregulering:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Huslejen kan reguleres i henhold til nettoprisindekset en gang årligt</li>
                    <li>Huslejeforhøjelser skal varsles med mindst 3 måneder</li>
                    <li>Lejer har ret til at gøre indsigelse mod huslejeforhøjelser</li>
                    <li>Forbedringer kan give anledning til huslejeforhøjelse efter lejelovens regler</li>
                  </ul>

                  <p className="mt-4"><strong>Omkostninger og bidrag:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejer betaler sin forholdsmæssige andel af ejendomsskat og grundejerforeningsbidrag</li>
                    <li>Ændringer i variable omkostninger meddeles med 3 måneders varsel</li>
                    <li>Lejer har ret til at se dokumentation for omkostninger</li>
                  </ul>
                </div>
              </div>

              {/* Pets and Animals */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 16. HUSDYR</h2>
                
                <div className="space-y-3">
                  <p><strong>Regler for husdyr:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Husdyr er ikke tilladt uden udlejerens skriftlige samtykke</li>
                    <li>Ansøgning om husdyr skal behandles inden for rimelig tid</li>
                    <li>Udlejer kan kræve depositumforhøjelse ved tilladelse til husdyr</li>
                    <li>Lejer er fuldt ansvarlig for skader forårsaget af husdyr</li>
                    <li>Ved overtrædelse kan udlejer kræve husdyret fjernet eller opsige lejemålet</li>
                  </ul>

                  <p className="mt-4"><strong>Service- og førerhunde:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Service- og førerhunde er tilladt uden særskilt tilladelse</li>
                    <li>Dokumentation for hundenes funktion skal kunne fremvises</li>
                  </ul>
                </div>
              </div>

              {/* Subletting and Assignment */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 17. FREMLEJE OG OVERDRAGELSE</h2>
                
                <div className="space-y-3">
                  <p><strong>Fremleje:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Fremleje af hele eller dele af lejemålet kræver udlejerens skriftlige samtykke</li>
                    <li>Lejer må ikke opkræve højere leje end egen husleje forholdsmæssigt</li>
                    <li>Udlejer kan nægte fremleje hvis det ikke er rimeligt begrundet</li>
                    <li>Ulovlig fremleje kan medføre ophævelse af lejemålet</li>
                  </ul>

                  <p className="mt-4"><strong>Lejemålets overdragelse:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejemålet kan ikke overdrages uden udlejerens samtykke</li>
                    <li>Overdragelse til ægtefælle/samlever kræver dog ikke samtykke</li>
                    <li>Dødsfald: Ægtefælle/børn kan overtage lejemålet</li>
                  </ul>
                </div>
              </div>

              {/* Right of Entry */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 18. UDLEJERENS ADGANGSRET</h2>
                
                <div className="space-y-3">
                  <p><strong>Adgang til lejemålet:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Udlejer har kun adgang til lejemålet efter aftale med lejer</li>
                    <li>Ved akut fare kan udlejer få adgang uden forudgående aftale</li>
                    <li>Vedligeholdelse og inspektion kræver mindst 24 timers varsel</li>
                    <li>Adgang i rimelige tidsrum på hverdage mellem kl. 8-17</li>
                  </ul>

                  <p className="mt-4"><strong>Visning til nye lejere:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Seneste 3 måneder af lejeforholdet kan lejemålet vises</li>
                    <li>Maksimalt 2 gange ugentligt i 1 time ad gangen</li>
                    <li>Lejer skal have mindst 24 timers varsel</li>
                  </ul>
                </div>
              </div>

              {/* Force Majeure */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 19. FORCE MAJEURE</h2>
                
                <div className="space-y-3">
                  <p><strong>Ekstraordinære omstændigheder:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Brand, vandskade eller andre katastrofer</li>
                    <li>Offentlige forbud eller restriktioner</li>
                    <li>Krig, terror eller naturkatastrofer</li>
                  </ul>

                  <p className="mt-4"><strong>Konsekvenser:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Midlertidig bortfald af huslejebetaling ved ubeboelighed</li>
                    <li>Ret til ophævelse hvis skade ikke kan udbedres inden rimelig tid</li>
                    <li>Udlejer skal straks underrette lejer om skader</li>
                    <li>Forsikringsforhold skal afklares mellem parterne</li>
                  </ul>
                </div>
              </div>

              {/* Data Protection */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 20. DATABESKYTTELSE</h2>
                
                <div className="space-y-3">
                  <p><strong>Behandling af personoplysninger:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Udlejer behandler lejerens personoplysninger i henhold til GDPR</li>
                    <li>Oplysninger anvendes kun til administration af lejeforholdet</li>
                    <li>Lejer har ret til indsigt, rettelse og sletning af egne data</li>
                    <li>Oplysninger videregives ikke til tredjeparter uden samtykke</li>
                  </ul>

                  <p className="mt-4"><strong>Opbevaring:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Personoplysninger slettes senest 5 år efter lejeforholdets ophør</li>
                    <li>Regnskabsmateriale opbevares i henhold til bogføringsloven</li>
                  </ul>
                </div>
              </div>

              {/* Final Provisions */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">§ 21. AFSLUTTENDE BESTEMMELSER</h2>
                
                <div className="space-y-3">
                  <p><strong>Juridisk grundlag:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Kontrakten er underlagt dansk ret og særligt lejeloven</li>
                    <li>Eventuelle tvister afgøres ved danske domstole</li>
                    <li>Ændringer i kontrakten skal ske skriftligt og underskrives af begge parter</li>
                    <li>Husordenen, som udleveres særskilt, er en integreret del af lejekontrakten</li>
                  </ul>

                  <p className="mt-4"><strong>Kontraktens gyldighed:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                    <li>Lejer har modtaget kopi af denne kontrakt</li>
                    <li>Ved uenighed følges lejelovens regler</li>
                    <li>Kontrakten træder i kraft ved begge parters underskrift</li>
                    <li>Eventuelle tillæg til kontrakten skal være skriftlige og underskrevne</li>
                  </ul>

                  <div className="mt-4 p-4 bg-slate-100 border border-slate-300 rounded-lg">
                    <p className="font-semibold text-slate-800">Erklæring fra parterne:</p>
                    <p className="text-sm text-slate-700 mt-2">
                      Begge parter erklærer hermed at have læst og forstået alle kontraktens bestemmelser. 
                      Parterne bekræfter, at alle oplysninger i kontrakten er korrekte, og at de accepterer 
                      kontraktens juridisk bindende karakter.
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-800 mb-2">Vigtige Referencer:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Lejeloven (LBK nr. 927 af 4. september 2019)</li>
                      <li>• Bekendtgørelse om husorden</li>
                      <li>• Bekendtgørelse om depositum</li>
                      <li>• Databeskyttelsesforordningen (GDPR)</li>
                      <li>• Boligreguleringsloven</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Escrow Service Notice */}
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">Om Nest Escrow Service</h3>
                <div className="text-blue-700 space-y-2">
                  <p>Depositum på {formatCurrency(contract.deposit * 100)} DKK er sikret gennem Nest Escrow Service, som fungerer som neutral tredjepart.</p>
                  <p><strong>Fordele:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Depositum holdes sikkert indtil fraflytning</li>
                    <li>Automatisk frigivelse ved godkendt fraflytning</li>
                    <li>Neutral håndtering af eventuelle tvister</li>
                    <li>Transparent proces for begge parter</li>
                  </ul>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-amber-800 mb-3">Vigtig juridisk information</div>
                    <div className="text-amber-700 space-y-2">
                      <p>Ved at underskrive denne kontrakt bekræfter begge parter, at:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>De har læst og forstået alle kontraktens vilkår</li>
                        <li>Alle oplysninger i kontrakten er korrekte</li>
                        <li>De accepterer kontraktens juridiske bindende karakter</li>
                        <li>Depositum er sikret via Nest Escrow Service</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowSignature(true)}
              disabled={signing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {signing ? 'Underskriver...' : 'Underskriv Kontrakt'}
            </button>
          </div>
        </div>
      </div>

      {/* Digital Signature Modal */}
      {showSignature && (
        <DigitalSignature
          onSign={handleSign}
          onCancel={handleCancel}
          signerName={`${user.firstName} ${user.lastName}`}
          documentTitle={contract.title}
        />
      )}
    </>
  )
}