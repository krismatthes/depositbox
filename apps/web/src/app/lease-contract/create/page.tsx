'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import Step1ParterLejemaal from '@/components/lease-contract/Step1ParterLejemaal'
import Step2Lejeperiode from '@/components/lease-contract/Step2Lejeperiode'
import Step3Oekonomi from '@/components/lease-contract/Step3Oekonomi'
import Step4Vilkaar from '@/components/lease-contract/Step4Vilkaar'
import Step5SaerligeVilkaar from '@/components/lease-contract/Step5SaerligeVilkaar'
import Step6Review from '@/components/lease-contract/Step6Review'

// Enhanced Type definitions for Danish lease contract data (Typeformular A10 compliant)
interface LeaseContractData {
  // § 1: Parter & Lejemål
  udlejer: {
    navn: string
    adresse: string
    cvr: string
  }
  lejer: Array<{
    navn: string
    adresse: string
    cpr?: string
    email?: string
  }>
  ejendom: {
    adresse: string
    postnr_by: string
    etage: string
    lejl_nr: string
    areal_m2: number
    rum: number
  }
  
  // Danish lease law specific fields
  reguleret_kommune: boolean
  udlejer_har_flere_end_1_lejemaal: boolean
  lejetype: 'lejlighed' | 'accessorisk_vaerelse' | 'separat_vaerelse'
  
  // § 2: Begyndelse og ophør
  startdato: string
  tidsbegraenset: boolean
  slutdato?: string
  saglig_begrundelse_tidsbegraensning?: string
  
  // § 3: Leje og betaling
  maanedsleje_ex_forbrug: number
  forfaldsdato_dag_i_mdr: number
  betalingsinfo: {
    modtager: string
    iban_eller_reg_konto: string
    reference: string
  }
  
  // § 4: Forbrug (a conto)
  aconto: {
    varme: number
    vand: number
    el: number
    internet_tv: number
  }
  
  // Depositum og forudbetaling
  depositum_maaneder: number
  forudbetalt_leje_maaneder: number
  
  // Lejefastsættelse
  fri_leje: boolean
  fri_leje_grundlag?: string
  lejegrundlag: 'omkostningsbestemt' | 'det_lejedes_vaerdi' | 'fri_leje'
  
  // § 10: Regulering af leje
  npi_regulering: {
    aktiv: boolean
    maaned_dag: string
  }
  
  // § 5: Vedligeholdelse og istandsættelse
  vedligehold: {
    indvendig_lejer: boolean
    udvendig_udlejer: boolean
    hvidevarer_lejer: boolean
  }
  
  // § 6: Brugsret/fællesfaciliteter
  brugsret: {
    loft_eller_kaelder: string
    parkering: string
    cykel: string
    faelles_faciliteter: string
  }
  
  // § 7: Husorden (reference to attached document)
  husorden_vedhaeftet: boolean
  
  // § 8: Husdyr/rygning
  husdyr_tilladt: boolean
  rygning_tilladt: boolean
  
  // § 9: Fremleje/udlån
  fremleje_tilladt_delvist: boolean
  
  // § 11: Særlige vilkår
  saerlige_vilkaar: string[]
  
  // Nest integration
  nest_deponering: {
    aktiv: boolean
    udbyder: string
    konto_oplysninger: string
  }
  
  // Digital features
  kommunikation: {
    email: boolean
    digital_signatur: boolean
  }
  
  // Legal jurisdiction
  tvist_huslejenaevn_kommune: string
  
  // Legacy compatibility
  landlord?: {
    name: string
    address: string
    cvrCpr: string
  }
  tenants?: Array<{
    name: string
    currentAddress: string
    cpr: string
    email: string
  }>
  property?: {
    address: string
    area: number
    rooms: number
    type: 'apartment' | 'house' | 'room'
    moveInDate: string
    facilities: string[]
  }
  leaseType?: 'unlimited' | 'limited'
  limitedReason?: string
  economy?: {
    monthlyRent: number
    heating: number
    water: number
    electricity: number
    other: number
    deposit: number
    prepaidRent: number
    includeFirstMonthInEscrow?: boolean
  }
  conditions?: {
    heating: string
    water: string
    electricity: string
    newlyRenovated: boolean
    maintenanceResponsibility: 'landlord' | 'tenant'
    inventory: string[]
    petsAllowed: boolean
  }
  specialConditions?: string
}

const STEPS = [
  { 
    id: 1, 
    title: '§ 1: Parter & Lejemål', 
    description: 'Grundlæggende oplysninger',
    info: 'Udlejer, lejer(e) og lejemålets grunddata. Alle oplysninger skal være korrekte da de fremgår af den endelige kontrakt.'
  },
  { 
    id: 2, 
    title: '§ 2: Lejeperiode', 
    description: 'Tidsubegrænset eller tidsbegrænset',
    info: 'Bestem om lejemålet er på bestemt eller ubestemt tid. Tidsbegrænset udlejning kræver lovlig begrundelse (renovering, salg, eget brug).'
  },
  { 
    id: 3, 
    title: '§ 3-4: Økonomi', 
    description: 'Husleje og depositum',
    info: 'Fastsæt husleje, a conto betalinger og depositum. Depositum + forudbetalt må maks være 3x månedlig husleje.'
  },
  { 
    id: 4, 
    title: '§ 5-10: Vilkår', 
    description: 'Vedligeholdelse og inventar',
    info: 'Bestem hvem der har vedligeholdelsespligt, hvilke faciliteter der følger med, og om husdyr er tilladt.'
  },
  { 
    id: 5, 
    title: '§ 11: Særlige vilkår', 
    description: 'Specielle aftaler',
    info: 'Eventuelle særlige aftaler der ikke er dækket af standardkontrakten. F.eks. specielle regler for haven, fællesområder etc.'
  },
  { 
    id: 6, 
    title: 'Gennemse & Generer', 
    description: 'Kontroller og download PDF',
    info: 'Gennemgå alle oplysninger og generer den endelige lejekontrakt som PDF til underskrift.'
  }
]

export default function CreateLeaseContractPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [tenantInfoOptional, setTenantInfoOptional] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [contractData, setContractData] = useState<LeaseContractData>({
    // Enhanced Danish structure
    udlejer: {
      navn: '',
      adresse: '',
      cvr: ''
    },
    lejer: [{
      navn: '',
      adresse: '',
      cpr: '',
      email: ''
    }],
    ejendom: {
      adresse: '',
      postnr_by: '',
      etage: '',
      lejl_nr: '',
      areal_m2: 0,
      rum: 0
    },
    reguleret_kommune: false,
    udlejer_har_flere_end_1_lejemaal: true,
    lejetype: 'lejlighed',
    startdato: '',
    tidsbegraenset: false,
    maanedsleje_ex_forbrug: 0,
    forfaldsdato_dag_i_mdr: 1,
    betalingsinfo: {
      modtager: '',
      iban_eller_reg_konto: '',
      reference: ''
    },
    aconto: {
      varme: 0,
      vand: 0,
      el: 0,
      internet_tv: 0
    },
    depositum_maaneder: 3,
    forudbetalt_leje_maaneder: 0,
    fri_leje: false,
    lejegrundlag: 'omkostningsbestemt',
    npi_regulering: {
      aktiv: false,
      maaned_dag: '01-01'
    },
    vedligehold: {
      indvendig_lejer: true,
      udvendig_udlejer: true,
      hvidevarer_lejer: false
    },
    brugsret: {
      loft_eller_kaelder: '',
      parkering: '',
      cykel: 'ja',
      faelles_faciliteter: ''
    },
    husorden_vedhaeftet: true,
    husdyr_tilladt: false,
    rygning_tilladt: false,
    fremleje_tilladt_delvist: true,
    saerlige_vilkaar: [],
    nest_deponering: {
      aktiv: false,
      udbyder: 'PayProff',
      konto_oplysninger: ''
    },
    kommunikation: {
      email: true,
      digital_signatur: true
    },
    tvist_huslejenaevn_kommune: '',
    
    // Legacy compatibility
    landlord: {
      name: '',
      address: '',
      cvrCpr: ''
    },
    tenants: [{
      name: '',
      currentAddress: '',
      cpr: '',
      email: ''
    }],
    property: {
      address: '',
      area: 0,
      rooms: 0,
      type: 'apartment',
      moveInDate: '',
      facilities: []
    },
    leaseType: 'unlimited',
    economy: {
      monthlyRent: 0,
      heating: 0,
      water: 0,
      electricity: 0,
      other: 0,
      deposit: 0,
      prepaidRent: 0,
      includeFirstMonthInEscrow: false
    },
    conditions: {
      heating: '',
      water: '',
      electricity: '',
      newlyRenovated: false,
      maintenanceResponsibility: 'landlord',
      inventory: [],
      petsAllowed: false
    },
    specialConditions: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProperties()
      // Pre-fill landlord data from user profile (both new and legacy format)
      setContractData(prev => ({
        ...prev,
        udlejer: {
          navn: `${user.firstName} ${user.lastName}`,
          adresse: '',
          cvr: ''
        },
        landlord: {
          name: `${user.firstName} ${user.lastName}`,
          address: '',
          cvrCpr: ''
        }
      }))
    }
  }, [user])

  // Auto-save draft (but not on final step 6 to avoid duplicates)
  useEffect(() => {
    if (!user || currentStep === 6) return
    
    // Check if we have any meaningful data to save
    const hasData = (contractData?.udlejer?.navn || contractData?.landlord?.name) ||
                   (contractData?.ejendom?.adresse || contractData?.property?.address) ||
                   (contractData?.maanedsleje_ex_forbrug || contractData?.economy?.monthlyRent)
    
    if (!hasData) return

    const saveTimeout = setTimeout(() => {
      saveDraft()
    }, 5000) // Save after 5 seconds of inactivity

    return () => clearTimeout(saveTimeout)
  }, [contractData, user, currentStep])

  const saveDraft = async () => {
    if (!user) return

    try {
      const title = contractData?.ejendom?.adresse || contractData?.property?.address || `Kontrakt ${new Date().toLocaleDateString('da-DK')}`
      
      const payload = {
        title,
        data: JSON.stringify(contractData),
        id: draftId
      }

      if (draftId) {
        // Update existing draft
        await api.put(`/draft-contracts/${draftId}`, payload)
      } else {
        // Create new draft
        const response = await api.post('/draft-contracts', payload)
        setDraftId(response.data.id)
      }
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties')
      setProperties(response.data.properties || [])
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    }
  }

  const fillFromProperty = (property: any) => {
    setSelectedProperty(property)
    setContractData(prev => ({
      ...prev,
      // Update new Danish structure
      ejendom: {
        ...prev.ejendom,
        adresse: property.address,
        areal_m2: property.size || 0,
      },
      startdato: property.moveInDate || '',
      maanedsleje_ex_forbrug: Number(property.monthlyRent),
      depositum_maaneder: property.depositAmount ? Math.round(Number(property.depositAmount) / Number(property.monthlyRent)) : 3,
      forudbetalt_leje_maaneder: property.prepaidRent ? Math.round(Number(property.prepaidRent) / Number(property.monthlyRent)) : 0,
      
      // Update legacy structure for compatibility
      property: {
        ...prev.property,
        address: property.address,
        area: property.size || 0,
        type: property.propertyType?.toLowerCase() || 'apartment',
        moveInDate: property.moveInDate || ''
      },
      economy: {
        ...prev.economy,
        monthlyRent: Number(property.monthlyRent),
        deposit: Number(property.depositAmount),
        prepaidRent: Number(property.prepaidRent || 0)
      }
    }))
  }

  const validateCurrentStep = () => {
    try {
      switch (currentStep) {
        case 1:
          // Validate Step 1: Basic info (both new and legacy format)
          const hasLandlord = (contractData?.udlejer?.navn && contractData?.udlejer?.adresse && contractData?.udlejer?.cvr) ||
                             (contractData?.landlord?.name && contractData?.landlord?.address && contractData?.landlord?.cvrCpr)
          
          // Tenant info validation depends on whether it's marked as optional
          const hasTenant = tenantInfoOptional || 
                           (contractData?.lejer && Array.isArray(contractData.lejer) && contractData.lejer.every((tenant: any) => 
                             tenant?.navn && tenant?.cpr && tenant?.email && tenant?.adresse
                           )) ||
                           (contractData?.tenants && Array.isArray(contractData.tenants) && contractData.tenants.every((tenant: any) => 
                             tenant?.name && tenant?.cpr && tenant?.email && tenant?.currentAddress
                           ))
          
          const hasProperty = (contractData?.ejendom?.adresse && contractData?.ejendom?.areal_m2 && 
                              contractData?.ejendom?.rum && contractData?.startdato) ||
                             (contractData?.property?.address && contractData?.property?.area && 
                              contractData?.property?.rooms && contractData?.property?.moveInDate)
          
          return hasLandlord && hasTenant && hasProperty
        
        case 2:
          // Validate Step 2: Danish lease period validation
          if (contractData?.tidsbegraenset || contractData?.leaseType === 'limited') {
            const reason = contractData?.saglig_begrundelse_tidsbegraensning || contractData?.limitedReason
            return reason && reason.trim().length > 10
          }
          return true
        
        case 3:
          // Validate Step 3: Danish lease law economic validation
          const hasBasicEconomy = (contractData?.maanedsleje_ex_forbrug && contractData.maanedsleje_ex_forbrug > 0) || 
                                 (contractData?.economy?.monthlyRent && contractData.economy.monthlyRent > 0)
          if (!hasBasicEconomy) return false
          
          // Danish law: depositum + forudbetalt leje ≤ 3 × månedsleje
          const monthlyRent = contractData?.maanedsleje_ex_forbrug || contractData?.economy?.monthlyRent || 0
          const depositMonths = contractData?.depositum_maaneder || 0
          const prepaidMonths = contractData?.forudbetalt_leje_maaneder || 0
          const legacyDeposit = monthlyRent > 0 ? (contractData?.economy?.deposit || 0) / monthlyRent : 0
          const legacyPrepaid = monthlyRent > 0 ? (contractData?.economy?.prepaidRent || 0) / monthlyRent : 0
          
          const totalMonths = Math.max(depositMonths + prepaidMonths, legacyDeposit + legacyPrepaid)
          return totalMonths <= 3
        
        case 4:
          // Validate Step 4: Danish lease conditions
          return (contractData?.vedligehold?.indvendig_lejer !== undefined && 
                  contractData?.vedligehold?.udvendig_udlejer !== undefined) ||
                 (contractData?.conditions?.heating && 
                  contractData?.conditions?.water && 
                  contractData?.conditions?.electricity &&
                  contractData?.conditions?.maintenanceResponsibility &&
                  contractData?.conditions?.petsAllowed !== undefined)
        
        case 5:
          // Step 5: Special conditions are optional
          return true
        
        case 6:
          // Step 6: Review - validate all required fields for legal compliance
          const step6HasLandlord = (contractData?.udlejer?.navn && contractData?.udlejer?.adresse && contractData?.udlejer?.cvr) ||
                                  (contractData?.landlord?.name && contractData?.landlord?.address && contractData?.landlord?.cvrCpr)
          
          const step6HasTenant = tenantInfoOptional || 
                                (contractData?.lejer && Array.isArray(contractData.lejer) && contractData.lejer.length > 0) ||
                                (contractData?.tenants && Array.isArray(contractData.tenants) && contractData.tenants.length > 0)
          
          const step6HasProperty = (contractData?.ejendom?.adresse && contractData?.ejendom?.areal_m2) ||
                                  (contractData?.property?.address && contractData?.property?.area)
          
          const step6HasEconomy = (contractData?.maanedsleje_ex_forbrug && contractData.maanedsleje_ex_forbrug > 0) || 
                                 (contractData?.economy?.monthlyRent && contractData.economy.monthlyRent > 0)
          
          return step6HasLandlord && step6HasTenant && step6HasProperty && step6HasEconomy
        
        default:
          return true
      }
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      // Scroll to top when moving to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-4xl font-bold text-slate-800">📄 Dansk Lejekontrakt Udfylder</h1>
              {lastSaved && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Gemt {lastSaved.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <p className="text-slate-600">Opret en færdigudfyldt lejekontrakt baseret på Typeformular A10</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold
                    ${currentStep === step.id 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : currentStep > step.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-2
                      ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-slate-800">{STEPS[currentStep - 1].title}</h2>
                <div className="group relative">
                  <svg className="w-4 h-4 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-6 hidden group-hover:block z-50 w-80 p-4 bg-white border border-slate-300 rounded-lg shadow-xl text-sm text-slate-700">
                    <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-300 rotate-45"></div>
                    <strong className="text-blue-800">{STEPS[currentStep - 1].title}:</strong>
                    <br />
                    <span className="text-slate-600">{STEPS[currentStep - 1].info}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Property Selection (shown on step 1) */}
          {currentStep === 1 && properties.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">🏠 Udfyld automatisk fra eksisterende bolig (valgfrit)</h4>
              <p className="text-sm text-blue-600 mb-3">Du kan vælge en eksisterende bolig som udgangspunkt og redigere detaljerne nedenfor efter behov.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => fillFromProperty(property)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${selectedProperty?.id === property.id 
                        ? 'border-blue-500 bg-blue-100' 
                        : 'border-blue-200 bg-white hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="font-medium text-slate-800">{property.address}</div>
                    <div className="text-sm text-slate-600">
                      {property.size} m² • {property.monthlyRent?.toLocaleString()} DKK/md
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Klik for at forudfylde (kan redigeres)</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {currentStep === 1 && (
              <Step1ParterLejemaal 
                data={contractData} 
                onUpdate={setContractData}
                onTenantOptionalChange={setTenantInfoOptional}
              />
            )}

            {currentStep === 2 && (
              <Step2Lejeperiode 
                data={contractData} 
                onUpdate={setContractData}
              />
            )}

            {currentStep === 3 && (
              <Step3Oekonomi 
                data={contractData} 
                onUpdate={setContractData}
              />
            )}

            {currentStep === 4 && (
              <Step4Vilkaar 
                data={contractData} 
                onUpdate={setContractData}
              />
            )}

            {currentStep === 5 && (
              <Step5SaerligeVilkaar 
                data={contractData} 
                onUpdate={setContractData}
              />
            )}

            {currentStep === 6 && (
              <Step6Review 
                data={contractData} 
                onUpdate={setContractData}
                contractId={draftId}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${currentStep === 1 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Forrige
            </button>

            {/* Validation Status */}
            <div className="flex items-center gap-2">
              {!validateCurrentStep() && currentStep < 6 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium">Udfyld alle obligatoriske felter</span>
                </div>
              )}
            </div>
            
            <button
              onClick={nextStep}
              disabled={currentStep === STEPS.length || !validateCurrentStep()}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${currentStep === STEPS.length || !validateCurrentStep()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {currentStep === STEPS.length ? 'Færdig' : 'Næste'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}