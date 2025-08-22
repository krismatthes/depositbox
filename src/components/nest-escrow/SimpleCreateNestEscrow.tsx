'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { canCreateNestEscrow, validateUserAccess, validateEmailFormat, validatePropertyAddress, sanitizeInput } from '@/lib/security'
import { SmartPropertyField, SmartContactFields, SmartRentField, SmartDepositField } from '@/components/SmartFormFields'
import { extractAndSaveFromNestEscrow, getFormSuggestions } from '@/lib/dataReuse'

interface DanishAddress {
  id: string
  tekst: string
  adresse: {
    vejnavn: string
    husnr: string
    postnr: string
    postnrnavn: string
  }
}

interface SimpleEscrowData {
  landlordEmail: string
  tenantName: string
  tenantEmail: string
  propertyAddress: string
  propertyPostcode: string
  propertyCity: string
  propertyType: string
  
  depositAmount: number
  firstMonthRent: number
  prepaidRent: number
  utilitiesAmount: number
  
  startDate: string
  endDate?: string
  isTimeLimited: boolean
  
  depositReleaseType: 'LEASE_END' | 'SPECIFIC_DATE' | 'MANUAL' | 'MOVE_IN_PLUS_5'
  depositReleaseDate?: string
  firstMonthReleaseType: 'START_DATE' | 'SPECIFIC_DATE' | 'MANUAL'
  firstMonthReleaseDate?: string
  prepaidReleaseType: 'START_DATE' | 'SPECIFIC_DATE' | 'MANUAL'
  prepaidReleaseDate?: string
}

export default function SimpleCreateNestEscrow() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const isLandlord = user?.role === 'LANDLORD'
  const isTenant = user?.role === 'TENANT' || user?.role === 'USER'
  const [addressSuggestions, setAddressSuggestions] = useState<DanishAddress[]>([])
  const [addressQuery, setAddressQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<DanishAddress | null>(null)
  
  const [useEmailInvite, setUseEmailInvite] = useState(true)
  const [generatedInviteLink, setGeneratedInviteLink] = useState('')
  
  const [escrowData, setEscrowData] = useState<SimpleEscrowData>({
    landlordEmail: isLandlord ? (user?.email || '') : '',
    tenantName: isTenant ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '',
    tenantEmail: isTenant ? (user?.email || '') : '',
    propertyAddress: '',
    propertyPostcode: '',
    propertyCity: '',
    propertyType: 'LEJLIGHED',
    
    depositAmount: 0,
    firstMonthRent: 0,
    prepaidRent: 0,
    utilitiesAmount: 0,
    
    startDate: '',
    endDate: '',
    isTimeLimited: false,
    
    depositReleaseType: 'LEASE_END',
    firstMonthReleaseType: 'START_DATE',
    prepaidReleaseType: 'START_DATE'
  })

  useEffect(() => {
    if (user) {
      setEscrowData(prev => ({
        ...prev,
        landlordEmail: isLandlord ? user.email : prev.landlordEmail,
        tenantName: isTenant ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : prev.tenantName,
        tenantEmail: isTenant ? user.email : prev.tenantEmail
      }))
    }
  }, [user, isLandlord, isTenant])

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      // Using DAWA (Danmarks Adressers Web API)
      const response = await fetch(`https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=10`)
      const data = await response.json()
      setAddressSuggestions(data)
    } catch (error) {
      console.error('Address search failed:', error)
      setAddressSuggestions([])
    }
  }

  const handleAddressSelect = (address: DanishAddress) => {
    setSelectedAddress(address)
    setAddressQuery(address.tekst)
    setAddressSuggestions([])
    
    setEscrowData(prev => ({
      ...prev,
      propertyAddress: `${address.adresse.vejnavn} ${address.adresse.husnr}`,
      propertyPostcode: address.adresse.postnr,
      propertyCity: address.adresse.postnrnavn
    }))
  }

  const createEscrow = async () => {
    // Security validation
    if (!validateUserAccess(user)) {
      alert('Du skal være logget ind for at oprette en Depositums Box.')
      return
    }

    if (!user || user.role !== 'LANDLORD') {
      alert('Kun udlejere kan oprette Depositums Box.')
      return
    }

    const depositCheck = canCreateNestEscrow(user.id)
    if (!depositCheck.allowed) {
      alert(depositCheck.reason)
      return
    }

    // Validate input data
    if (!validateEmailFormat(escrowData.tenantEmail) || !validateEmailFormat(escrowData.landlordEmail)) {
      alert('Ugyldig email adresse.')
      return
    }

    if (!validatePropertyAddress(escrowData.propertyAddress)) {
      alert('Ejendomsadresse skal være mellem 10-200 tegn.')
      return
    }

    if (escrowData.depositAmount < 0 || escrowData.depositAmount > 200000) {
      alert('Depositum skal være mellem 0-200.000 DKK.')
      return
    }

    setLoading(true)
    try {
      // Save reusable data for future forms
      extractAndSaveFromNestEscrow(user!.id, escrowData)

      // Prepare data for the simple Depositums Box API
      const apiData = {
        landlordId: user!.id,
        tenantName: escrowData.tenantName,
        tenantEmail: escrowData.tenantEmail,
        propertyAddress: escrowData.propertyAddress,
        propertyPostcode: '', // Extract from address if needed
        propertyCity: '', // Extract from address if needed
        propertyType: 'LEJLIGHED', // Default type
        depositAmount: escrowData.depositAmount * 100, // Convert to øre
        firstMonthAmount: escrowData.firstMonthRent * 100, // Convert to øre
        prepaidAmount: escrowData.prepaidRent * 100, // Convert to øre
        utilitiesAmount: 0, // Not used in simple form
        startDate: escrowData.startDate || new Date().toISOString(),
        endDate: escrowData.isTimeLimited ? escrowData.endDate : null,
        releaseConditions: {
          depositReleaseType: 'LEASE_END',
          firstMonthReleaseType: 'START_DATE'
        }
      }

      console.log('Creating Depositums Box via API:', apiData)
      
      // Make the actual API call
      const response = await api.post('/nest/escrows/simple', apiData)
      
      console.log('Depositums Box created successfully:', response.data)
      
      // Success - redirect to escrow details page
      if (response.data?.id) {
        router.push(`/nest/escrows/${response.data.id}?created=true`)
      } else {
        // Fallback to dashboard if no ID returned
        router.push('/dashboard?created=true')
      }
    } catch (error: any) {
      console.error('Failed to create escrow:', error)
      console.log('Error code:', error.code)
      console.log('Error status:', error.response?.status)
      
      // Check if it's a network/API error (API not available) - demo mode fallback
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('Network Error') ||
          error.response?.status === 404 ||
          error.response?.status === 503) {
        console.warn('API not available, using demo mode for Depositums Box creation')
        
        // Create demo escrow in localStorage
        const demoEscrowData = {
          id: `escrow-${Date.now()}`,
          landlordId: user!.id,
          tenantName: escrowData.tenantName,
          tenantEmail: escrowData.tenantEmail,
          landlord: {
            id: user!.id,
            email: user!.email,
            firstName: user!.firstName,
            lastName: user!.lastName
          },
          tenant: {
            name: escrowData.tenantName,
            email: escrowData.tenantEmail
          },
          propertyAddress: selectedAddress?.tekst || escrowData.propertyAddress,
          propertyPostcode: escrowData.propertyPostcode,
          propertyCity: escrowData.propertyCity,
          propertyType: escrowData.propertyType,
          depositAmount: escrowData.depositAmount * 100, // Convert to øre
          firstMonthAmount: escrowData.firstMonthRent * 100,
          prepaidAmount: escrowData.prepaidRent * 100,
          utilitiesAmount: 0,
          startDate: escrowData.startDate || new Date().toISOString(),
          endDate: escrowData.isTimeLimited ? escrowData.endDate : null,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
          releaseConditions: {
            depositReleaseType: 'LEASE_END',
            firstMonthReleaseType: 'START_DATE'
          }
        }
        
        // Store in localStorage for demo
        const existingEscrows = JSON.parse(localStorage.getItem(`escrows_${user!.id}`) || '[]')
        existingEscrows.push(demoEscrowData)
        localStorage.setItem(`escrows_${user!.id}`, JSON.stringify(existingEscrows))
        
        // Save reusable data for future forms
        extractAndSaveFromNestEscrow(user!.id, escrowData)
        
        // Redirect to dashboard with success message
        router.push('/dashboard?created=demo')
        return
      }
      
      alert('Fejl ved oprettelse af deponering. Kontroller at alle felter er udfyldt korrekt.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK')
  }

  const totalAmount = escrowData.depositAmount + escrowData.firstMonthRent + escrowData.prepaidRent

  const canProceed = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return escrowData.depositAmount > 0 // Deposit is mandatory
      case 2:
        return selectedAddress !== null // Only address required now
      case 3:
        return escrowData.startDate.trim() !== ''
      case 4: // New final step for invitation
        if (isLandlord) {
          return escrowData.tenantName.trim() && (useEmailInvite ? escrowData.tenantEmail.trim() : generatedInviteLink.length > 0)
        } else {
          return (useEmailInvite ? escrowData.landlordEmail.trim() : generatedInviteLink.length > 0)
        }
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opret Depositums Box</h1>
              <p className="text-gray-600 mt-2">Sikker håndtering af depositum og husleje</p>
            </div>
          </div>

          {/* Progress indicator - samme som lejekontrakt */}
          <div className="flex items-center justify-center mb-12">
            {[
              { num: 1, title: 'Beløb', desc: 'Depositum og husleje' },
              { num: 2, title: 'Ejendom', desc: 'Adresse og detaljer' },
              { num: 3, title: 'Datoer', desc: 'Start og slutdato' },
              { num: 4, title: 'Invitation', desc: 'Send til modpart' }
            ].map((item, index) => (
              <div key={item.num} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all
                    ${step >= item.num 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : step === item.num 
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step > item.num ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      item.num
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`font-medium text-sm ${
                      step >= item.num ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{item.desc}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors ${
                    step > item.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - samme som lejekontrakt */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          {/* Step 1: Money */}
          {step === 1 && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Beløbsoplysninger</h2>
                <p className="text-blue-100">Angiv de beløb der skal deponeres sikkert</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  {/* Depositum - Required */}
                  <div className="border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Depositum *</h3>
                        <p className="text-sm text-gray-600">Obligatorisk sikkerhed for udlejer</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="15.000"
                      value={escrowData.depositAmount || ''}
                      onChange={(e) => setEscrowData(prev => ({
                        ...prev,
                        depositAmount: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Depositum som holdes sikkert indtil lejemålet ophører
                    </p>
                  </div>

                  {/* Første måned husleje */}
                  <div className="border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5h8" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Første måneds husleje</h3>
                        <p className="text-sm text-gray-600">Valgfri startbetaling</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="8.000"
                      value={escrowData.firstMonthRent || ''}
                      onChange={(e) => setEscrowData(prev => ({
                        ...prev,
                        firstMonthRent: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Første måneders husleje som frigives til udlejer ved indflytning
                    </p>
                  </div>

                  {/* Forudbetalt leje - Optional with dropdown */}
                  <div className="border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M8 7L3 7m0 0v10a2 2 0 002 2h14a2 2 0 002-2V7H3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Forudbetalt leje</h3>
                        <p className="text-sm text-gray-600">Valgfri - maks 3 måneder</p>
                      </div>
                    </div>
                    <select
                      value={escrowData.prepaidRent > 0 ? Math.round(escrowData.prepaidRent / escrowData.firstMonthRent || 1) : 0}
                      onChange={(e) => {
                        const months = parseInt(e.target.value)
                        const amount = months > 0 ? escrowData.firstMonthRent * months : 0
                        setEscrowData(prev => ({
                          ...prev,
                          prepaidRent: amount
                        }))
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                    >
                      <option value={0}>Ingen forudbetaling</option>
                      <option value={1}>1 måned{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent)} DKK)`}</option>
                      <option value={2}>2 måneder{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent * 2)} DKK)`}</option>
                      <option value={3}>3 måneder{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent * 3)} DKK)`}</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Forudbetalt husleje som frigives til udlejer ved lejemålets start
                    </p>
                  </div>

                  {/* Total Summary */}
                  {totalAmount > 0 && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-blue-100 text-sm mb-1">Total beløb til deponering</p>
                          <p className="text-3xl font-bold">{formatCurrency(totalAmount)} DKK</p>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <p className="text-xs text-blue-100 mt-2">Sikret deponering</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation message */}
                  {escrowData.depositAmount === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.865-.833-2.635 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <p className="text-yellow-800 font-medium">Depositum er påkrævet for at oprette en deponering</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Property Address */}
          {step === 2 && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Ejendomsoplysninger</h2>
                <p className="text-blue-100">Indtast adressen og type af den ejendom som deponeringen vedrører</p>
              </div>
              <div className="p-8 space-y-8">
                {/* Property Address */}
                <div className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Boligens adresse</h3>
                      <p className="text-sm text-gray-600">Søg og vælg den korrekte adresse</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                      <input
                        type="text"
                        placeholder="Søg adresse... f.eks. Nørrebrogade 1"
                        value={addressQuery}
                        onChange={(e) => {
                          setAddressQuery(e.target.value)
                          searchAddresses(e.target.value)
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-lg"
                      />
                      
                      {addressSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          {addressSuggestions.map((address) => (
                            <button
                              key={address.id}
                              onClick={() => handleAddressSelect(address)}
                              className="w-full p-4 text-left hover:bg-blue-50 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
                            >
                              <p className="font-medium text-gray-900">{address.tekst}</p>
                              <p className="text-sm text-gray-600">{address.adresse.postnr} {address.adresse.postnrnavn}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {selectedAddress && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">{selectedAddress.tekst}</p>
                            <p className="text-sm text-green-600">{selectedAddress.adresse.postnr} {selectedAddress.adresse.postnrnavn}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Type - med ikoner som du bad om */}
                <div className="border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Boligtype</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { 
                        value: 'VÆRELSE', 
                        label: 'Værelse', 
                        icon: (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11" />
                          </svg>
                        )
                      },
                      { 
                        value: 'LEJLIGHED', 
                        label: 'Lejlighed',
                        icon: (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )
                      },
                      { 
                        value: 'HUS', 
                        label: 'Hus',
                        icon: (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )
                      },
                      { 
                        value: 'VILLA', 
                        label: 'Villa',
                        icon: (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-7 4 7M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4" />
                          </svg>
                        )
                      }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setEscrowData(prev => ({ ...prev, propertyType: type.value }))}
                        className={`
                          p-4 rounded-2xl border-2 text-center transition-all hover:shadow-lg hover:scale-105
                          ${escrowData.propertyType === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`${escrowData.propertyType === type.value ? 'text-blue-600' : 'text-gray-400'}`}>
                            {type.icon}
                          </div>
                          <span className="font-medium text-sm">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Udlejer info (compact) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Udlejer (dig)</h4>
                  <p className="text-sm text-gray-800">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} - {escrowData.landlordEmail}</p>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Dates */}
          {step === 3 && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Datoer</h2>
                <p className="text-blue-100">Hvornår starter lejemålet og skal det være tidsbegrænset?</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 4h6m-7 0a1 1 0 00-1 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 00-1-1H7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Startdato for lejemål</h3>
                      <p className="text-sm text-gray-600">Hvornår skal lejemålet begynde?</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={escrowData.startDate}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Lejemålets varighed</h3>
                      <p className="text-sm text-gray-600">Skal lejemålet have en slutdato?</p>
                    </div>
                  </div>
                  <label className="flex items-center mb-6 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={escrowData.isTimeLimited}
                      onChange={(e) => setEscrowData(prev => ({ ...prev, isTimeLimited: e.target.checked }))}
                      className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="font-medium text-gray-900">Tidsbegrænset lejemål</span>
                  </label>
                  
                  {escrowData.isTimeLimited && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Slutdato for lejemål
                      </label>
                      <input
                        type="date"
                        value={escrowData.endDate}
                        onChange={(e) => setEscrowData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                        min={escrowData.startDate}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Hvorfor spørger vi om datoer?</h4>
                      <p className="text-blue-800 text-sm">
                        Datoerne bruges til at sætte automatiske frigivelsesregler, så I ikke skal huske at frigive pengene manuelt. I kan altid ændre dette senere.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Invitation Setup */}
          {step === 4 && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Invitation</h2>
                <p className="text-blue-100">Hvordan vil du sende invitationen til din kommende {isLandlord ? 'lejer' : 'udlejer'}?</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="border border-gray-200 rounded-2xl p-6">
                  <div className="space-y-6">
                    {isLandlord && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Lejer navn *</label>
                        <input
                          type="text"
                          placeholder="Anders Andersen"
                          value={escrowData.tenantName}
                          onChange={(e) => setEscrowData(prev => ({ ...prev, tenantName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-lg"
                        />
                      </div>
                    )}
                    
                    {/* Invitation Method Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Invitationsmetode</label>
                      <div className="grid grid-cols-1 gap-3">
                        <label className="flex items-start p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={useEmailInvite}
                            onChange={() => {
                              setUseEmailInvite(true)
                              setGeneratedInviteLink('')
                            }}
                            className="mr-3 mt-1 text-blue-600"
                          />
                          <div>
                            <span className="font-medium text-gray-900">Email invitation</span>
                            <p className="text-sm text-gray-600 mt-1">Send invitation direkte til {isLandlord ? 'lejerens' : 'udlejerens'} email</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={!useEmailInvite}
                            onChange={() => setUseEmailInvite(false)}
                            className="mr-3 mt-1 text-blue-600"
                          />
                          <div>
                            <span className="font-medium text-gray-900">Invitations-link</span>
                            <p className="text-sm text-gray-600 mt-1">Generer et link som kan deles via SMS, WhatsApp, eller andre kanaler</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {useEmailInvite ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {isLandlord ? 'Lejer email' : 'Udlejer email'} *
                        </label>
                        <input
                          type="email"
                          placeholder={isLandlord ? "anders@email.com" : "udlejer@email.com"}
                          value={isLandlord ? escrowData.tenantEmail : escrowData.landlordEmail}
                          onChange={(e) => {
                            if (isLandlord) {
                              setEscrowData(prev => ({ ...prev, tenantEmail: e.target.value }))
                            } else {
                              setEscrowData(prev => ({ ...prev, landlordEmail: e.target.value }))
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-lg"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Invitations-link metode
                              </p>
                              <p className="text-xs text-blue-800">
                                Når du ikke kender {isLandlord ? 'lejerens' : 'udlejerens'} email, kan du generere et link som kan deles via SMS, sociale medier eller andre kanaler.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {generatedInviteLink ? (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <p className="text-sm font-medium text-green-800 mb-2">Invitations-link genereret:</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={generatedInviteLink}
                                readOnly
                                className="flex-1 px-3 py-2 text-xs bg-white border border-green-300 rounded-lg text-green-700"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedInviteLink)
                                  alert('Link kopieret til clipboard!')
                                }}
                                className="px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Kopier
                              </button>
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              Del dette link med {isLandlord ? 'lejeren' : 'udlejeren'} for at invitere dem til at acceptere Depositums Box deponeringen.
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Generate unique invitation link
                              const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              const inviteLink = `${window.location.origin}/nest/invite/${inviteId}`
                              setGeneratedInviteLink(inviteLink)
                              
                              // Store invitation data for later use
                              const inviteData = {
                                id: inviteId,
                                type: 'nest',
                                createdBy: user?.id,
                                createdAt: new Date().toISOString(),
                                targetRole: isLandlord ? 'tenant' : 'landlord',
                                escrowData: escrowData,
                                propertyAddress: selectedAddress?.tekst
                              }
                              
                              const existingInvites = localStorage.getItem('pending_invitations') || '[]'
                              const pendingInvites = JSON.parse(existingInvites)
                              pendingInvites.push(inviteData)
                              localStorage.setItem('pending_invitations', JSON.stringify(pendingInvites))
                            }}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                          >
                            Generer Invitations-link
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Sikker invitation</h4>
                      <p className="text-green-800 text-sm">
                        {useEmailInvite ? (
                          isLandlord 
                            ? 'Lejeren vil få en invitation på email for at acceptere deponeringen'
                            : 'Udlejeren vil få en invitation på email for at acceptere deponeringen'
                        ) : (
                          'Du kan dele invitations-linket via SMS, WhatsApp, eller andre kanaler efter Depositums Box er oprettet'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation - samme som lejekontrakt */}
        <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
              ${step === 1 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-100 text-gray-700 shadow-lg hover:shadow-xl'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Forrige
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${!canProceed(step)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              Fortsæt til {step === 1 ? 'ejendom' : step === 2 ? 'datoer' : 'invitation'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={createEscrow}
              disabled={loading || !canProceed(step)}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${loading || !canProceed(step)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Opretter Depositums Box...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opret Depositums Box
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}