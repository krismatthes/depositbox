'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
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

export default function CreateLeaseContractPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [contract, setContract] = useState<any>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [signing, setSigning] = useState(false)
  const [availableNests, setAvailableNests] = useState<any[]>([])
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [addressInputFocus, setAddressInputFocus] = useState(false)
  
  const [formData, setFormData] = useState({
    // NEST integration
    selectedNestId: '',
    useExistingNest: false,
    
    // Step 1: Property Information
    propertyAddress: '',
    propertyNumber: '',
    floor: '',
    building: '',
    propertyType: 'APARTMENT',
    propertySize: '',
    rooms: '',
    additionalAreas: {
      garden: false,
      parking: false,
      balcony: false,
      storage: false,
      basement: false,
      attic: false
    },
    
    // Step 2: Lease Terms
    leaseType: 'INDEFINITE', // INDEFINITE or FIXED_TERM
    startDate: '',
    endDate: '',
    noticePeriod: '3',
    
    // Step 3: Financial Terms
    monthlyRent: '',
    deposit: '',
    prepaidRent: '',
    paymentDate: '1',
    paymentMethod: 'BANK_TRANSFER',
    bankAccount: '',
    acontoHeating: '',
    acontoWater: '',
    acontoElectricity: '',
    acontoInternet: '',
    
    // Step 4: Responsibilities
    interiorMaintenance: 'TENANT',
    exteriorMaintenance: 'LANDLORD',
    heatingCosts: 'LANDLORD',
    waterCosts: 'LANDLORD',
    electricityCosts: 'TENANT',
    internetCosts: 'TENANT',
    
    // Step 5: House Rules & Special Conditions
    houseRules: '',
    petsAllowed: false,
    smokingAllowed: false,
    businessUse: false,
    specialConditions: '',
    
    // Step 6: Move-in/Move-out
    moveInCondition: 'RENOVATED',
    moveInInspection: true,
    moveOutInspection: true,
    
    // Tenant details (optional)
    tenantFirstName: '',
    tenantLastName: '',
    tenantEmail: '',
    tenantPhone: '',
    tenantAddress: ''
  })

  // Address autocomplete function using DAWA API
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      const response = await fetch(`https://api.dataforsyningen.dk/adresser?q=${encodeURIComponent(query)}&per_side=10`)
      const data = await response.json()
      
      const suggestions = data.map((addr: any) => ({
        id: addr.id,
        text: addr.adressebetegnelse,
        address: addr.adressebetegnelse,
        postnummer: addr.postnummer?.nr,
        postdistrikt: addr.postnummer?.navn,
        kommune: addr.kommune?.navn
      }))
      
      setAddressSuggestions(suggestions)
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddressSuggestions([])
    }
  }

  // Handle address input with debounced search
  const handleAddressChange = (value: string) => {
    setFormData({...formData, propertyAddress: value})
    setShowAddressSuggestions(true)
    
    // Debounced search
    setTimeout(() => {
      searchAddresses(value)
    }, 300)
  }

  // Select address from suggestions
  const selectAddress = (suggestion: any) => {
    setFormData({...formData, propertyAddress: suggestion.address})
    setAddressSuggestions([])
    setShowAddressSuggestions(false)
  }

  const steps = [
    { id: 1, title: 'Ejendom', subtitle: 'Beskrivelse af lejemålet' },
    { id: 2, title: 'Periode', subtitle: 'Lejeperiode og opsigelse' },
    { id: 3, title: 'Økonomi', subtitle: 'Leje og betalingsvilkår' },
    { id: 4, title: 'Ansvar', subtitle: 'Vedligeholdelse og udgifter' },
    { id: 5, title: 'Regler', subtitle: 'Husorden og særlige vilkår' },
    { id: 6, title: 'Syn', subtitle: 'Ind- og fraflytningssyn' },
    { id: 7, title: 'Gennemgå', subtitle: 'Kontrol og underskrift' }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && typeof window !== 'undefined') {
      loadAvailableNests()
    }
  }, [user, loading, router])

  const loadAvailableNests = () => {
    const nests: any[] = []
    
    const escrowKeys = [
      `escrows_${user?.id}`,
      'dummyEscrows',
      'escrows'
    ]
    
    escrowKeys.forEach(key => {
      const savedEscrows = localStorage.getItem(key)
      if (savedEscrows) {
        try {
          const parsedEscrows = JSON.parse(savedEscrows)
          if (Array.isArray(parsedEscrows)) {
            parsedEscrows.forEach((escrow: any) => {
              if (!nests.some(n => n.id === escrow.id)) {
                nests.push({
                  id: escrow.id,
                  propertyAddress: escrow.propertyAddress || escrow.property?.address,
                  tenant: escrow.tenant,
                  landlord: escrow.landlord,
                  depositAmount: escrow.deposit || escrow.depositAmount,
                  monthlyRent: escrow.rent || escrow.firstMonthRent,
                  prepaidRent: escrow.prepaidRent,
                  startDate: escrow.startDate
                })
              }
            })
          }
        } catch (error) {
          console.error(`Error parsing escrows from ${key}:`, error)
        }
      }
    })

    setAvailableNests(nests)
  }

  const nextStep = () => {
    if (currentStep < 7) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      generateContract()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const generateContract = () => {
    const newContract = {
      id: `contract-${Date.now()}`,
      tenancyId: `tenancy-${Date.now()}`,
      title: `A10 Lejekontrakt - ${formData.propertyAddress}`,
      
      // Property details following A10 structure
      propertyDetails: {
        address: formData.propertyAddress,
        propertyNumber: formData.propertyNumber,
        floor: formData.floor,
        building: formData.building,
        propertyType: formData.propertyType,
        size: parseInt(formData.propertySize) || 0,
        rooms: formData.rooms,
        additionalAreas: formData.additionalAreas
      },
      
      // Landlord details
      landlord: {
        firstName: user?.firstName || 'Udlejer',
        lastName: user?.lastName || 'Navn',
        email: user?.email || 'udlejer@email.com',
        phone: user?.phone || '',
        address: (user as any)?.address || ''
      },
      
      // Tenant details
      tenant: {
        firstName: formData.tenantFirstName || 'SKAL UDFYLDES',
        lastName: formData.tenantLastName || 'AF LEJER',
        email: formData.tenantEmail || 'lejer@email.com',
        phone: formData.tenantPhone,
        address: formData.tenantAddress
      },
      
      // Lease terms following A10 structure
      leaseTerms: {
        leaseType: formData.leaseType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        noticePeriod: parseInt(formData.noticePeriod) || 3
      },
      
      // Financial terms
      financials: {
        monthlyRent: parseInt(formData.monthlyRent) || 0,
        deposit: parseInt(formData.deposit) || 0,
        prepaidRent: parseInt(formData.prepaidRent) || 0,
        paymentDate: parseInt(formData.paymentDate) || 1,
        paymentMethod: formData.paymentMethod,
        bankAccount: formData.bankAccount,
        aconto: {
          heating: parseInt(formData.acontoHeating) || 0,
          water: parseInt(formData.acontoWater) || 0,
          electricity: parseInt(formData.acontoElectricity) || 0,
          internet: parseInt(formData.acontoInternet) || 0
        }
      },
      
      // Responsibilities
      responsibilities: {
        interiorMaintenance: formData.interiorMaintenance,
        exteriorMaintenance: formData.exteriorMaintenance,
        costs: {
          heating: formData.heatingCosts,
          water: formData.waterCosts,
          electricity: formData.electricityCosts,
          internet: formData.internetCosts
        }
      },
      
      // Special conditions (Section 11 - most important!)
      specialConditions: {
        houseRules: formData.houseRules,
        petsAllowed: formData.petsAllowed,
        smokingAllowed: formData.smokingAllowed,
        businessUse: formData.businessUse,
        other: formData.specialConditions
      },
      
      // Move-in/Move-out terms
      moveInOut: {
        moveInCondition: formData.moveInCondition,
        moveInInspection: formData.moveInInspection,
        moveOutInspection: formData.moveOutInspection
      },
      
      // NEST integration
      nestId: formData.selectedNestId,
      
      // System fields
      createdAt: new Date().toISOString(),
      tenantInfoMissing: !formData.tenantFirstName || !formData.tenantLastName,
      status: 'DRAFT'
    }
    
    // Save contract to localStorage immediately when generated
    try {
      const existingContracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
      existingContracts.push(newContract)
      localStorage.setItem('created_contracts', JSON.stringify(existingContracts))
      console.log('Contract created and saved:', {
        contractId: newContract.id,
        landlordEmail: newContract.landlord?.email,
        userEmail: user?.email,
        emailMatch: newContract.landlord?.email === user?.email
      })
    } catch (error) {
      console.error('Failed to save contract to localStorage:', error)
    }
    
    setContract(newContract)
  }

  const handleNestSelect = (nestId: string) => {
    const selectedNest = availableNests.find(n => n.id === nestId)
    if (selectedNest) {
      setFormData(prev => ({
        ...prev,
        selectedNestId: nestId,
        propertyAddress: selectedNest.propertyAddress || '',
        tenantFirstName: selectedNest.tenant?.firstName || '',
        tenantLastName: selectedNest.tenant?.lastName || '',
        tenantEmail: selectedNest.tenant?.email || '',
        monthlyRent: selectedNest.monthlyRent?.toString() || '',
        deposit: selectedNest.depositAmount?.toString() || '',
        prepaidRent: selectedNest.prepaidRent?.toString() || '',
        startDate: selectedNest.startDate || ''
      }))
    }
  }

  const handleSign = async (signatureData: string) => {
    if (!contract || !user) return
    
    setSigning(true)
    
    try {
      const signatureInfo = {
        signatureData,
        signerName: `${user.firstName} ${user.lastName}`,
        signerEmail: user.email,
        signedAt: new Date().toISOString(),
        documentTitle: contract.title
      }
      
      localStorage.setItem(`signature_landlord_${contract.id}`, JSON.stringify(signatureInfo))
      
      // Update existing contract status instead of adding duplicate
      const existingContracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
      const contractIndex = existingContracts.findIndex((c: any) => c.id === contract.id)
      if (contractIndex !== -1) {
        existingContracts[contractIndex] = {
          ...contract,
          status: 'SIGNED_BY_LANDLORD',
          signedAt: new Date().toISOString()
        }
      } else {
        existingContracts.push({
          ...contract,
          status: 'SIGNED_BY_LANDLORD',
          signedAt: new Date().toISOString()
        })
      }
      localStorage.setItem('created_contracts', JSON.stringify(existingContracts))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Failed to sign contract:', error)
      alert('Der opstod en fejl ved underskrivning. Prøv igen.')
    } finally {
      setSigning(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }


  if (contract) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-white">
          <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Contract Preview and Actions - Similar to existing design */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">A10 Standardlejekontrakt</h2>
                <p className="text-blue-100">Klar til underskrift og fremsendelse</p>
              </div>
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Kontrakt Genereret</h3>
                  <p className="text-gray-600">Din A10 standardlejekontrakt er nu klar til næste skridt</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Send til lejer</h4>
                      <p className="text-sm text-gray-600">
                        Send kontrakten direkte til lejeren for gennemgang og underskrift.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Update existing contract status instead of adding duplicate
                        const existingContracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
                        const contractIndex = existingContracts.findIndex((c: any) => c.id === contract.id)
                        if (contractIndex !== -1) {
                          existingContracts[contractIndex] = {
                            ...contract,
                            status: 'SENT_TO_TENANT',
                            sentAt: new Date().toISOString()
                          }
                        } else {
                          existingContracts.push({
                            ...contract,
                            status: 'SENT_TO_TENANT',
                            sentAt: new Date().toISOString()
                          })
                        }
                        localStorage.setItem('created_contracts', JSON.stringify(existingContracts))
                        alert(`A10 lejekontrakt sendt til ${contract.tenant.email}`)
                        router.push('/dashboard')
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Send til underskrift
                    </button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Underskriv først</h4>
                      <p className="text-sm text-gray-600">
                        Underskriv kontrakten som udlejer først, og send den derefter til lejeren.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSignature(true)}
                      disabled={signing}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {signing ? 'Underskriver...' : 'Underskriv nu'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={() => setContract(null)}
                    className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    ← Tilbage til redigering
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSignature && contract && (
          <DigitalSignature
            onSign={handleSign}
            onCancel={() => setShowSignature(false)}
            signerName={`${user.firstName} ${user.lastName}`}
            documentTitle={contract.title}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Floating Progress - Same design as onboarding */}
          <div className="fixed top-24 right-8 z-50">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step.id <= currentStep 
                        ? 'bg-blue-600 text-white shadow-lg scale-110' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.id <= currentStep && (
                        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25"></div>
                      )}
                      <span className="relative">{step.id}</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-xs font-medium transition-colors duration-300 ${
                        step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Same transition style as onboarding */}
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
            
            {/* Info box for tenants */}
            {user?.role === 'TENANT' && currentStep === 1 && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-2">Normalt opretter udlejer lejekontrakten</h3>
                      <p className="text-amber-700 text-sm mb-4">
                        I de fleste tilfælde er det udlejeren der opretter lejekontrakten, da de har alle de nødvendige ejendomsoplysninger. 
                        Du kan fortsætte her, men overvej at invitere din udlejer til at oprette kontrakten i stedet.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push('/lease-contract/invite-landlord')}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Inviter Udlejer
                        </button>
                        <button
                          onClick={() => {}} 
                          className="bg-white hover:bg-gray-50 text-amber-700 border border-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Fortsæt Alligevel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 1: Property Information */}
            {currentStep === 1 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-2xl">🏠</span>
                      </div>
                    </div>
                    <div className="absolute -inset-2 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Ejendomsoplysninger</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Beskriv lejemålet i henhold til A10 standardkontrakten
                  </p>
                </div>

                {/* NEST Integration */}
                {availableNests.length > 0 && (
                  <div className="mb-12 p-8 bg-gray-50 rounded-3xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">🪺 NEST Integration</h3>
                    
                    <div className="flex items-center justify-center mb-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.useExistingNest}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              useExistingNest: e.target.checked,
                              selectedNestId: e.target.checked ? prev.selectedNestId : ''
                            }))
                          }}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          Opret kontrakt baseret på eksisterende NEST
                        </span>
                      </label>
                    </div>
                    
                    {formData.useExistingNest && (
                      <div className="space-y-4">
                        {availableNests.map(nest => (
                          <button
                            key={nest.id}
                            type="button"
                            onClick={() => handleNestSelect(nest.id)}
                            className={`w-full p-4 border-2 rounded-2xl text-left transition-all duration-200 ${
                              formData.selectedNestId === nest.id
                                ? 'border-blue-400 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {nest.propertyAddress}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Lejer: {nest.tenant?.firstName 
                                    ? `${nest.tenant.firstName} ${nest.tenant.lastName || ''}` 
                                    : nest.tenant?.email || 'Navn ikke angivet'}
                                </div>
                              </div>
                              {formData.selectedNestId === nest.id && (
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* Property Address with Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Ejendommens adresse *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.propertyAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => {
                        setAddressInputFocus(true)
                        if (addressSuggestions.length > 0) {
                          setShowAddressSuggestions(true)
                        }
                      }}
                      onBlur={() => {
                        setAddressInputFocus(false)
                        // Delay hiding suggestions to allow clicking
                        setTimeout(() => {
                          if (!addressInputFocus) {
                            setShowAddressSuggestions(false)
                          }
                        }, 200)
                      }}
                      disabled={!!(formData.useExistingNest && formData.selectedNestId)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                      placeholder="Eksempel: Nørrebrogade 45, 2200 København N"
                      autoComplete="off"
                    />
                    
                    {/* Address Suggestions Dropdown */}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id || index}
                            onClick={() => selectAddress(suggestion)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {suggestion.address}
                            </div>
                            {suggestion.kommune && (
                              <div className="text-sm text-gray-600">
                                {suggestion.kommune}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Lejligheds-/værelses nr.
                      </label>
                      <input
                        type="text"
                        value={formData.propertyNumber}
                        onChange={(e) => setFormData({...formData, propertyNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="th, 1, 2, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Etage
                      </label>
                      <input
                        type="text"
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="st, 1, 2, etc."
                      />
                    </div>
                  </div>

                  {/* Property Type and Size */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Type *
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'APARTMENT', label: 'Lejlighed', icon: '🏢' },
                          { value: 'HOUSE', label: 'Hus', icon: '🏠' },
                          { value: 'ROOM', label: 'Værelse', icon: '🚪' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({...formData, propertyType: option.value})}
                            className={`w-full p-3 border-2 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                              formData.propertyType === option.value
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-lg">{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                            {formData.propertyType === option.value && (
                              <span className="ml-auto">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Areal (m²) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.propertySize}
                        onChange={(e) => setFormData({...formData, propertySize: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="75"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Værelser *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.rooms}
                        onChange={(e) => setFormData({...formData, rooms: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="3 værelser"
                      />
                    </div>
                  </div>

                  {/* Additional Areas */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Medfølgende arealer
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'garden', label: 'Have' },
                        { key: 'parking', label: 'Parkeringsplads' },
                        { key: 'balcony', label: 'Altan/balkon' },
                        { key: 'storage', label: 'Depotrum' },
                        { key: 'basement', label: 'Kælder' },
                        { key: 'attic', label: 'Loft' }
                      ].map(area => (
                        <label key={area.key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.additionalAreas[area.key as keyof typeof formData.additionalAreas]}
                            onChange={(e) => setFormData({
                              ...formData,
                              additionalAreas: {
                                ...formData.additionalAreas,
                                [area.key]: e.target.checked
                              }
                            })}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-700">{area.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Lease Period */}
            {currentStep === 2 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Lejeperiode</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Fastlæg lejeperioden og opsigelsesvilkår
                  </p>
                </div>

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* Lease Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Type af lejemål *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, leaseType: 'INDEFINITE', endDate: ''})}
                        className={`p-6 border-2 rounded-2xl transition-all duration-200 ${
                          formData.leaseType === 'INDEFINITE'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">♾️</div>
                        <div className="font-semibold text-gray-900">Tidsubegrænset</div>
                        <div className="text-sm text-gray-600 mt-1">Almindeligt lejemål</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({...formData, leaseType: 'FIXED_TERM'})}
                        className={`p-6 border-2 rounded-2xl transition-all duration-200 ${
                          formData.leaseType === 'FIXED_TERM'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">⏱️</div>
                        <div className="font-semibold text-gray-900">Tidsbegrænset</div>
                        <div className="text-sm text-gray-600 mt-1">Med fast slutdato</div>
                      </button>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Startdato *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>

                    {formData.leaseType === 'FIXED_TERM' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Slutdato *
                        </label>
                        <input
                          type="date"
                          required={formData.leaseType === 'FIXED_TERM'}
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Notice Period */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Lejers opsigelsesvarsel *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: '1', label: '1 måned', recommended: false },
                        { value: '2', label: '2 måneder', recommended: false },
                        { value: '3', label: '3 måneder', recommended: true },
                        { value: '6', label: '6 måneder', recommended: false }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({...formData, noticePeriod: option.value})}
                          className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-center ${
                            formData.noticePeriod === option.value
                              ? 'border-blue-400 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          {option.recommended && (
                            <div className="text-xs text-blue-600 mt-1">Anbefalet</div>
                          )}
                          {formData.noticePeriod === option.value && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Financial Terms */}
            {currentStep === 3 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Økonomi</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Fastlæg leje, depositum og betalingsvilkår
                  </p>
                </div>

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* Rent and Deposit */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Månedlig husleje (DKK) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="8000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Depositum (DKK) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.deposit}
                        onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="24000"
                      />
                      <p className="text-xs text-gray-500 mt-2">Maks. 3 måneders leje</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Forudbetalt leje (DKK)
                      </label>
                      <input
                        type="number"
                        value={formData.prepaidRent}
                        onChange={(e) => setFormData({...formData, prepaidRent: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="8000"
                      />
                      <p className="text-xs text-gray-500 mt-2">Maks. 3 måneders leje</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Betalingsdato hver måned *
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: '1', label: '1. i måneden', icon: '📅', desc: 'Standard' },
                          { value: '15', label: '15. i måneden', icon: '🗓️', desc: 'Midt på måneden' },
                          { value: 'ultimo', label: 'Ultimo', icon: '📆', desc: 'Sidste dag' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({...formData, paymentDate: option.value})}
                            className={`w-full p-3 border-2 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                              formData.paymentDate === option.value
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-lg">{option.icon}</span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.desc}</div>
                            </div>
                            {formData.paymentDate === option.value && (
                              <span className="ml-auto">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Betalingsform *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'BANK_TRANSFER'})}
                        className={`p-4 border-2 rounded-2xl transition-all duration-200 ${
                          formData.paymentMethod === 'BANK_TRANSFER'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">🏦</div>
                        <div className="font-semibold text-gray-900">Bankoverførsel</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'MOBILEPAY'})}
                        className={`p-4 border-2 rounded-2xl transition-all duration-200 ${
                          formData.paymentMethod === 'MOBILEPAY'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">📱</div>
                        <div className="font-semibold text-gray-900">MobilePay</div>
                      </button>
                    </div>
                  </div>

                  {/* Bank Account (if bank transfer) */}
                  {formData.paymentMethod === 'BANK_TRANSFER' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Kontonummer til betaling
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="1234 5678901234"
                      />
                    </div>
                  )}

                  {/* A Conto Payments */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      A conto beløb (månedligt)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Varme (DKK)</label>
                        <input
                          type="number"
                          value={formData.acontoHeating}
                          onChange={(e) => setFormData({...formData, acontoHeating: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Vand (DKK)</label>
                        <input
                          type="number"
                          value={formData.acontoWater}
                          onChange={(e) => setFormData({...formData, acontoWater: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">El (DKK)</label>
                        <input
                          type="number"
                          value={formData.acontoElectricity}
                          onChange={(e) => setFormData({...formData, acontoElectricity: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Internet (DKK)</label>
                        <input
                          type="number"
                          value={formData.acontoInternet}
                          onChange={(e) => setFormData({...formData, acontoInternet: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Responsibilities */}
            {currentStep === 4 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Ansvar</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Fastlæg vedligeholdelse og fordeling af udgifter
                  </p>
                </div>

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* Maintenance Responsibilities */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Vedligeholdelsesansvar
                    </label>
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <div className="mb-3">
                          <span className="font-medium text-gray-900">Indvendig vedligeholdelse</span>
                          <p className="text-xs text-gray-600 mt-1">Maling, mindre reparationer, rengøring</p>
                        </div>
                        <div className="flex gap-2">
                          {[
                            { value: 'TENANT', label: 'Lejer', icon: '👤' },
                            { value: 'LANDLORD', label: 'Udlejer', icon: '🏠' },
                            { value: 'SHARED', label: 'Delt', icon: '🤝' }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({...formData, interiorMaintenance: option.value})}
                              className={`flex-1 p-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center space-x-1 ${
                                formData.interiorMaintenance === option.value
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <span>{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-xl">
                        <div className="mb-3">
                          <span className="font-medium text-gray-900">Udvendig vedligeholdelse</span>
                          <p className="text-xs text-gray-600 mt-1">Facaderenovering, tag, vinduer</p>
                        </div>
                        <div className="flex gap-2">
                          {[
                            { value: 'LANDLORD', label: 'Udlejer', icon: '🏠' },
                            { value: 'TENANT', label: 'Lejer', icon: '👤' },
                            { value: 'SHARED', label: 'Delt', icon: '🤝' }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({...formData, exteriorMaintenance: option.value})}
                              className={`flex-1 p-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center space-x-1 ${
                                formData.exteriorMaintenance === option.value
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <span>{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Responsibilities */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Udgiftsfordeling
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'heating', label: 'Varme', field: 'heatingCosts' },
                        { key: 'water', label: 'Vand', field: 'waterCosts' },
                        { key: 'electricity', label: 'El', field: 'electricityCosts' },
                        { key: 'internet', label: 'Internet/TV', field: 'internetCosts' }
                      ].map(cost => (
                        <div key={cost.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                          <span className="font-medium text-gray-900">{cost.label}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, [cost.field]: 'LANDLORD'})}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                formData[cost.field as keyof typeof formData] === 'LANDLORD'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Udlejer
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, [cost.field]: 'TENANT'})}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                formData[cost.field as keyof typeof formData] === 'TENANT'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Lejer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: House Rules & Special Conditions */}
            {currentStep === 5 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Regler</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Husorden og særlige vilkår (Afsnit 11)
                  </p>
                </div>

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* House Rules */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Husorden
                    </label>
                    <textarea
                      value={formData.houseRules}
                      onChange={(e) => setFormData({...formData, houseRules: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Beskriv regler for støj, affaldshåndtering, fællesarealer osv."
                      rows={4}
                    />
                  </div>

                  {/* Special Conditions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Særlige begrænsninger og vilkår
                    </label>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <span className="font-medium text-gray-900">Husdyr tilladt</span>
                          <p className="text-sm text-gray-600">Lejer må holde husdyr i lejemålet</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.petsAllowed}
                          onChange={(e) => setFormData({...formData, petsAllowed: e.target.checked})}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <span className="font-medium text-gray-900">Rygning tilladt</span>
                          <p className="text-sm text-gray-600">Rygning er tilladt i lejemålet</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.smokingAllowed}
                          onChange={(e) => setFormData({...formData, smokingAllowed: e.target.checked})}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <span className="font-medium text-gray-900">Erhvervsvirksomhed tilladt</span>
                          <p className="text-sm text-gray-600">Lejer må drive virksomhed fra lejemålet</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.businessUse}
                          onChange={(e) => setFormData({...formData, businessUse: e.target.checked})}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Additional Special Conditions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Andre særlige vilkår
                    </label>
                    <textarea
                      value={formData.specialConditions}
                      onChange={(e) => setFormData({...formData, specialConditions: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Beskriv eventuelle andre særlige vilkår som afviger fra lejelovens almindelige regler"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Move-in/Move-out */}
            {currentStep === 6 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔍</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Syn</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Ind- og fraflytningssyn og istandsættelse
                  </p>
                </div>

                <div className="space-y-8 text-left max-w-2xl mx-auto">
                  {/* Move-in Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Stand ved indflytning *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, moveInCondition: 'RENOVATED'})}
                        className={`p-6 border-2 rounded-2xl transition-all duration-200 ${
                          formData.moveInCondition === 'RENOVATED'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">✨</div>
                        <div className="font-semibold text-gray-900">Nyistandsat</div>
                        <div className="text-sm text-gray-600 mt-1">Nyligt renoveret</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({...formData, moveInCondition: 'NORMAL'})}
                        className={`p-6 border-2 rounded-2xl transition-all duration-200 ${
                          formData.moveInCondition === 'NORMAL'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">🏠</div>
                        <div className="font-semibold text-gray-900">Normal stand</div>
                        <div className="text-sm text-gray-600 mt-1">Almindelig vedligehold</div>
                      </button>
                    </div>
                  </div>

                  {/* Inspection Requirements */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Syn og rapporter
                    </label>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <span className="font-medium text-gray-900">Indflytningssyn påkrævet</span>
                          <p className="text-sm text-gray-600">Der udarbejdes indflytningsrapport ved overtagelse</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.moveInInspection}
                          onChange={(e) => setFormData({...formData, moveInInspection: e.target.checked})}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <span className="font-medium text-gray-900">Fraflytningssyn påkrævet</span>
                          <p className="text-sm text-gray-600">Der udarbejdes fraflytningsrapport ved aflevering</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.moveOutInspection}
                          onChange={(e) => setFormData({...formData, moveOutInspection: e.target.checked})}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Optional Tenant Information */}
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lejeroplysninger (valgfrit)</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Du kan udfylde lejerens oplysninger nu eller lade dem udfylde det selv senere.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Fornavn</label>
                        <input
                          type="text"
                          value={formData.tenantFirstName}
                          onChange={(e) => setFormData({...formData, tenantFirstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Lejerens fornavn"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Efternavn</label>
                        <input
                          type="text"
                          value={formData.tenantLastName}
                          onChange={(e) => setFormData({...formData, tenantLastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Lejerens efternavn"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.tenantEmail}
                          onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="lejer@email.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Review & Summary */}
            {currentStep === 7 && (
              <div className="text-center max-w-4xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    <span className="font-semibold text-blue-600">Gennemgå</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Kontroller alle oplysninger før kontrakten genereres
                  </p>
                </div>

                {/* Contract Summary */}
                <div className="space-y-8 text-left">
                  {/* Property Summary */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                        <span className="text-xl mr-3">🏠</span>
                        Ejendomsoplysninger
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Adresse</p>
                          <p className="font-semibold text-gray-900">{formData.propertyAddress || 'Ikke angivet'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold text-gray-900">
                            {formData.propertyType === 'APARTMENT' ? 'Lejlighed' : 
                             formData.propertyType === 'HOUSE' ? 'Hus' : 'Værelse'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Størrelse</p>
                          <p className="font-semibold text-gray-900">{formData.propertySize || '0'} m²</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Værelser</p>
                          <p className="font-semibold text-gray-900">{formData.rooms || 'Ikke angivet'}</p>
                        </div>
                      </div>
                      {Object.values(formData.additionalAreas).some(Boolean) && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Medfølgende arealer</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(formData.additionalAreas).map(([key, value]) => value && (
                              <span key={key} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {key === 'garden' ? 'Have' :
                                 key === 'parking' ? 'Parkeringsplads' :
                                 key === 'balcony' ? 'Altan/balkon' :
                                 key === 'storage' ? 'Depotrum' :
                                 key === 'basement' ? 'Kælder' : 'Loft'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lease Terms Summary */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                      <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                        <span className="text-xl mr-3">📅</span>
                        Lejeperiode
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold text-gray-900">
                            {formData.leaseType === 'INDEFINITE' ? 'Tidsubegrænset' : 'Tidsbegrænset'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Opsigelsesvarsel</p>
                          <p className="font-semibold text-gray-900">{formData.noticePeriod} måned{parseInt(formData.noticePeriod) > 1 ? 'er' : ''}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Startdato</p>
                          <p className="font-semibold text-gray-900">
                            {formData.startDate ? new Date(formData.startDate).toLocaleDateString('da-DK') : 'Ikke angivet'}
                          </p>
                        </div>
                        {formData.leaseType === 'FIXED_TERM' && formData.endDate && (
                          <div>
                            <p className="text-sm text-gray-600">Slutdato</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(formData.endDate).toLocaleDateString('da-DK')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                      <h3 className="text-lg font-semibold text-green-900 flex items-center">
                        <span className="text-xl mr-3">💰</span>
                        Økonomi
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Månedlig leje</p>
                          <p className="font-semibold text-green-600 text-xl">
                            {formData.monthlyRent ? `${parseInt(formData.monthlyRent).toLocaleString('da-DK')} DKK` : 'Ikke angivet'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Depositum</p>
                          <p className="font-semibold text-gray-900">
                            {formData.deposit ? `${parseInt(formData.deposit).toLocaleString('da-DK')} DKK` : 'Ikke angivet'}
                          </p>
                        </div>
                        {formData.prepaidRent && (
                          <div>
                            <p className="text-sm text-gray-600">Forudbetalt leje</p>
                            <p className="font-semibold text-gray-900">
                              {parseInt(formData.prepaidRent).toLocaleString('da-DK')} DKK
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Betalingsdato</p>
                          <p className="font-semibold text-gray-900">
                            {formData.paymentDate === 'ultimo' ? 'Ultimo' : `${formData.paymentDate}. i måneden`}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Betalingsform</p>
                        <p className="font-semibold text-gray-900">
                          {formData.paymentMethod === 'BANK_TRANSFER' ? 'Bankoverførsel' : 'MobilePay'}
                        </p>
                      </div>
                      {(formData.acontoHeating || formData.acontoWater || formData.acontoElectricity || formData.acontoInternet) && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">A conto beløb (månedligt)</p>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            {formData.acontoHeating && (
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">Varme</p>
                                <p className="font-semibold">{formData.acontoHeating} DKK</p>
                              </div>
                            )}
                            {formData.acontoWater && (
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">Vand</p>
                                <p className="font-semibold">{formData.acontoWater} DKK</p>
                              </div>
                            )}
                            {formData.acontoElectricity && (
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">El</p>
                                <p className="font-semibold">{formData.acontoElectricity} DKK</p>
                              </div>
                            )}
                            {formData.acontoInternet && (
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">Internet</p>
                                <p className="font-semibold">{formData.acontoInternet} DKK</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rules & Special Conditions Summary */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                      <h3 className="text-lg font-semibold text-amber-900 flex items-center">
                        <span className="text-xl mr-3">📋</span>
                        Regler og særlige vilkår
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-2xl mb-1">{formData.petsAllowed ? '✅' : '❌'}</p>
                          <p className="text-sm font-medium">Husdyr</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-2xl mb-1">{formData.smokingAllowed ? '✅' : '❌'}</p>
                          <p className="text-sm font-medium">Rygning</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-2xl mb-1">{formData.businessUse ? '✅' : '❌'}</p>
                          <p className="text-sm font-medium">Erhverv</p>
                        </div>
                      </div>
                      {formData.houseRules && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Husorden</p>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-xl text-sm">{formData.houseRules}</p>
                        </div>
                      )}
                      {formData.specialConditions && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Andre særlige vilkår</p>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-xl text-sm">{formData.specialConditions}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Move-in/Move-out Summary */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                      <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
                        <span className="text-xl mr-3">🔍</span>
                        Ind- og fraflytning
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Stand ved indflytning</p>
                          <p className="font-semibold text-gray-900">
                            {formData.moveInCondition === 'RENOVATED' ? 'Nyistandsat' : 'Normal stand'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className={`text-lg mr-2 ${formData.moveInInspection ? 'text-green-500' : 'text-gray-400'}`}>
                              {formData.moveInInspection ? '✅' : '❌'}
                            </span>
                            <span className="text-sm">Indflytningssyn</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-lg mr-2 ${formData.moveOutInspection ? 'text-green-500' : 'text-gray-400'}`}>
                              {formData.moveOutInspection ? '✅' : '❌'}
                            </span>
                            <span className="text-sm">Fraflytningssyn</span>
                          </div>
                        </div>
                      </div>
                      {(formData.tenantFirstName || formData.tenantLastName || formData.tenantEmail) && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Lejeroplysninger</p>
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="font-medium text-gray-900">
                              {formData.tenantFirstName || formData.tenantLastName 
                                ? `${formData.tenantFirstName || ''} ${formData.tenantLastName || ''}`.trim()
                                : 'Navn ikke angivet'}
                            </p>
                            {formData.tenantEmail && (
                              <p className="text-sm text-gray-600">{formData.tenantEmail}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NEST Integration (if applicable) */}
                  {formData.useExistingNest && formData.selectedNestId && (
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                          <span className="text-xl mr-3">🪺</span>
                          NEST Integration
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="font-medium text-blue-900">Integreret med NEST escrow</p>
                            <p className="text-sm text-blue-700">Depositum håndteres automatisk gennem NEST</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation - Same style as onboarding */}
            <div className="mt-16 flex items-center justify-between">
              <div className="flex space-x-4">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors rounded-xl hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Tilbage
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {currentStep < 7 ? 'Næste' : 'Generer Kontrakt'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}