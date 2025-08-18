'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

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
  const [addressSuggestions, setAddressSuggestions] = useState<DanishAddress[]>([])
  const [addressQuery, setAddressQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<DanishAddress | null>(null)
  
  const [escrowData, setEscrowData] = useState<SimpleEscrowData>({
    landlordEmail: user?.email || '',
    tenantName: '',
    tenantEmail: '',
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
        landlordEmail: user.email
      }))
    }
  }, [user])

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
    setLoading(true)
    try {
      // Create tenant user if doesn't exist
      let tenantId = null
      try {
        const searchResponse = await api.get(`/auth/search-users?q=${encodeURIComponent(escrowData.tenantEmail)}`)
        const existingTenant = searchResponse.data.users.find((u: any) => u.email.toLowerCase() === escrowData.tenantEmail.toLowerCase())
        tenantId = existingTenant?.id
      } catch (error) {
        console.log('Search failed, will create invitation')
      }

      const nestEscrowData = {
        landlordId: user!.id,
        tenantId: tenantId,
        tenantName: escrowData.tenantName,
        tenantEmail: escrowData.tenantEmail,
        
        propertyAddress: escrowData.propertyAddress,
        propertyPostcode: escrowData.propertyPostcode,
        propertyCity: escrowData.propertyCity,
        propertyType: escrowData.propertyType,
        
        depositAmount: Math.round(escrowData.depositAmount * 100), // Convert to øre
        firstMonthAmount: Math.round(escrowData.firstMonthRent * 100),
        prepaidAmount: Math.round(escrowData.prepaidRent * 100),
        utilitiesAmount: 0, // No utilities in simplified flow
        
        startDate: escrowData.startDate,
        endDate: escrowData.isTimeLimited ? escrowData.endDate : null,
        
        releaseConditions: {
          depositReleaseType: escrowData.depositReleaseType,
          depositReleaseDate: escrowData.depositReleaseDate,
          firstMonthReleaseType: escrowData.firstMonthReleaseType,
          firstMonthReleaseDate: escrowData.firstMonthReleaseDate
        }
      }

      const response = await api.post('/nest/escrows/simple', nestEscrowData)
      
      // Success - redirect to the escrow
      router.push(`/nest/escrows/${response.data.id}?created=true`)
    } catch (error) {
      console.error('Failed to create escrow:', error)
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
        return escrowData.tenantName.trim() && escrowData.tenantEmail.trim() && selectedAddress
      case 3:
        return escrowData.startDate.trim()
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/nest"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">🏦 Opret Nest Deponering</h1>
          </div>
          <p className="text-slate-600">Hurtig og sikker deponering på få minutter</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${step >= stepNum ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-0.5 mx-2 ${step > stepNum ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800">
                {step === 1 && '💰 Hvad skal deponeres?'}
                {step === 2 && '🏠 Boligens adresse'}
                {step === 3 && '📅 Hvornår starter lejemålet?'}
                {step === 4 && '🔄 Hvornår skal penge frigives?'}
              </h2>
              <p className="text-slate-600 text-sm">
                {step === 1 && 'Angiv de beløb der skal deponeres'}
                {step === 2 && 'Lejer oplysninger og boligens adresse og type'}
                {step === 3 && 'Start og eventuel slutdato for lejemål'}
                {step === 4 && 'Automatisk eller manuel frigivelse'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Step 1: Money */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Comprehensive explanation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
                <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  Hvorfor bruge Nest deponering?
                </h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* For Lejer */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      Fordele for Lejer:
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ <strong>Sikkerhed:</strong> Dine penge er beskyttet hos PayProff</li>
                      <li>✅ <strong>Gennemsigtighed:</strong> Du kan altid se status på dine penge</li>
                      <li>✅ <strong>Automatisk retur:</strong> Depositum frigives automatisk ved fraflytning</li>
                      <li>✅ <strong>Lovlig beskyttelse:</strong> Opfylder alle danske krav til deponering</li>
                      <li>✅ <strong>Ingen gebyrer:</strong> Du betaler ingen ekstra omkostninger</li>
                    </ul>
                  </div>

                  {/* For Udlejer */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <span className="text-lg">🏠</span>
                      Fordele for Udlejer:
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ <strong>Professionel indtryk:</strong> Viser seriøsitet og professionalisme</li>
                      <li>✅ <strong>Hurtigere udlejning:</strong> Lejere føler sig mere trygge</li>
                      <li>✅ <strong>Automatisk håndtering:</strong> Ingen manuel administration</li>
                      <li>✅ <strong>Juridisk sikkerhed:</strong> Opfylder alle lovkrav automatisk</li>
                      <li>✅ <strong>Tvist-håndtering:</strong> Neutral part ved eventuelle konflikter</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    Sådan fungerer det teknisk:
                  </h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Sikker opbevaring:</strong> Alle penge opbevares hos PayProff (licenseret betalingsudbyder)</p>
                    <p>• <strong>Automatiske regler:</strong> Pengene frigives automatisk baseret på jeres aftale</p>
                    <p>• <strong>Begge godkender:</strong> Ingen kan frigive penge ensidigt - begge parter skal være enige</p>
                    <p>• <strong>Komplet historik:</strong> Alle handlinger logges og kan ikke ændres</p>
                    <p>• <strong>Email notifikationer:</strong> I får besked om alle ændringer i status</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800 font-medium text-center">
                    🎯 <strong>Resultat:</strong> Tryg udlejning for begge parter med fuld gennemsigtighed og automatisk administration
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Depositum - Required */}
                <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800 text-lg">Depositum *</h5>
                      <p className="text-sm text-slate-600">Obligatorisk sikkerhed for udlejer</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="15000"
                    value={escrowData.depositAmount || ''}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      depositAmount: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    required
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    Depositum som holdes sikkert indtil lejemålet ophører.
                  </p>
                </div>

                {/* Første måned husleje */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏠</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800 text-lg">Første måneds husleje</h5>
                      <p className="text-sm text-slate-600">Valgfri startbetaling</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="8000"
                    value={escrowData.firstMonthRent || ''}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      firstMonthRent: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    Første måneders husleje som frigives til udlejer ved indflytning.
                  </p>
                </div>

                {/* Forudbetalt leje - Optional with dropdown */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800 text-lg">Forudbetalt leje</h5>
                      <p className="text-sm text-slate-600">Valgfri - maks 3 måneder</p>
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  >
                    <option value={0}>Ingen forudbetaling</option>
                    <option value={1}>1 måned{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent)} DKK)`}</option>
                    <option value={2}>2 måneder{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent * 2)} DKK)`}</option>
                    <option value={3}>3 måneder{escrowData.firstMonthRent > 0 && ` (${formatCurrency(escrowData.firstMonthRent * 3)} DKK)`}</option>
                  </select>
                  <p className="text-xs text-slate-600 mt-2">
                    Forudbetalt husleje som frigives til udlejer ved lejemålets start.
                  </p>
                </div>
              </div>

              {/* Total Summary */}
              {totalAmount > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-purple-800">💰 Total deponeringsbeløb</span>
                      <p className="text-sm text-purple-600 mt-1">Dette beløb vil blive opbevaret sikkert i Nest</p>
                    </div>
                    <span className="text-3xl font-bold text-purple-900">{formatCurrency(totalAmount)} DKK</span>
                  </div>
                </div>
              )}

              {/* Validation message */}
              {escrowData.depositAmount === 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-amber-800 font-medium">Depositum er påkrævet for at oprette en deponering</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Property & Tenant */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Tenant Info */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">👤 Lejer oplysninger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Navn</label>
                    <input
                      type="text"
                      placeholder="Anders Andersen"
                      value={escrowData.tenantName}
                      onChange={(e) => setEscrowData(prev => ({ ...prev, tenantName: e.target.value }))}
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="anders@email.com"
                      value={escrowData.tenantEmail}
                      onChange={(e) => setEscrowData(prev => ({ ...prev, tenantEmail: e.target.value }))}
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">Lejeren vil få en invitation på email for at acceptere deponeringen</p>
              </div>

              {/* Property Address */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4">🏠 Boligens adresse</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-green-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      placeholder="Søg adresse... f.eks. Nørrebrogade 1"
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value)
                        searchAddresses(e.target.value)
                      }}
                      className="w-full px-4 py-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    
                    {addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-green-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {addressSuggestions.map((address) => (
                          <button
                            key={address.id}
                            onClick={() => handleAddressSelect(address)}
                            className="w-full p-4 text-left hover:bg-green-50 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <p className="font-medium text-slate-800">{address.tekst}</p>
                            <p className="text-sm text-slate-600">{address.adresse.postnr} {address.adresse.postnrnavn}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedAddress && (
                    <div className="p-4 bg-white border border-green-300 rounded-xl">
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

              {/* Property Type */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">🏡 Boligtype</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'VÆRELSE', label: '🚪 Værelse', icon: '🚪' },
                    { value: 'LEJLIGHED', label: '🏠 Lejlighed', icon: '🏠' },
                    { value: 'HUS', label: '🏡 Hus', icon: '🏡' },
                    { value: 'VILLA', label: '🏘️ Villa', icon: '🏘️' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEscrowData(prev => ({ ...prev, propertyType: type.value }))}
                      className={`
                        p-4 rounded-xl border-2 text-center transition-all hover:scale-105
                        ${escrowData.propertyType === type.value
                          ? 'border-orange-500 bg-orange-100 text-orange-800'
                          : 'border-orange-200 bg-white text-orange-600 hover:border-orange-300'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label.replace(type.icon + ' ', '')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Udlejer info (compact) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-medium text-slate-600 mb-2">Udlejer (dig)</h4>
                <p className="text-sm text-slate-800">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} - {escrowData.landlordEmail}</p>
              </div>
            </div>
          )}

          {/* Step 3: Dates */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  📅 Startdato for lejemål
                </label>
                <input
                  type="date"
                  value={escrowData.startDate}
                  onChange={(e) => setEscrowData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={escrowData.isTimeLimited}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, isTimeLimited: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">Tidsbegrænset lejemål</span>
                </label>
                
                {escrowData.isTimeLimited && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      📅 Slutdato for lejemål
                    </label>
                    <input
                      type="date"
                      value={escrowData.endDate}
                      onChange={(e) => setEscrowData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min={escrowData.startDate}
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Hvorfor spørger vi om datoer?</h4>
                <p className="text-sm text-blue-700">
                  Datoerne bruges til at sætte automatiske frigivelsesregler, så I ikke skal huske at frigive pengene manuelt.
                  I kan altid ændre dette senere.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Release Rules */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Deposit Release Rules */}
              <div className="border-2 border-orange-200 rounded-2xl overflow-hidden">
                <div className="bg-orange-100 px-6 py-4 border-b border-orange-200">
                  <h4 className="text-xl font-bold text-orange-800 flex items-center gap-3">
                    <span className="text-3xl">🛡️</span>
                    Depositum frigivelse
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">Hvornår skal depositum frigives til lejer?</p>
                </div>
                
                <div className="p-6 bg-white space-y-4">
                  <div className="grid gap-4">
                    <label className="flex items-start p-4 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="LEASE_END"
                        checked={escrowData.depositReleaseType === 'LEASE_END'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          depositReleaseType: e.target.value as any
                        }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-semibold text-orange-800">Automatisk ved lejeaftalens ophør</span>
                        <p className="text-sm text-orange-600">Anbefalet - frigives automatisk når lejemålet slutter</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start p-4 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="MOVE_IN_PLUS_5"
                        checked={escrowData.depositReleaseType === 'MOVE_IN_PLUS_5'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          depositReleaseType: e.target.value as any
                        }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-semibold text-orange-800">5 dage efter indflytning</span>
                        <p className="text-sm text-orange-600">Automatisk frigivelse hvis ingen indvendinger</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start p-4 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="SPECIFIC_DATE"
                        checked={escrowData.depositReleaseType === 'SPECIFIC_DATE'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          depositReleaseType: e.target.value as any
                        }))}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-orange-800">På bestemt dato</span>
                        <p className="text-sm text-orange-600 mb-2">Vælg selv hvornår depositum skal frigives</p>
                        {escrowData.depositReleaseType === 'SPECIFIC_DATE' && (
                          <input
                            type="date"
                            value={escrowData.depositReleaseDate || ''}
                            onChange={(e) => setEscrowData(prev => ({
                              ...prev,
                              depositReleaseDate: e.target.value
                            }))}
                            className="px-3 py-2 border border-orange-300 rounded-lg"
                            min={escrowData.startDate}
                          />
                        )}
                      </div>
                    </label>
                    
                    <label className="flex items-start p-4 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="MANUAL"
                        checked={escrowData.depositReleaseType === 'MANUAL'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          depositReleaseType: e.target.value as any
                        }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-semibold text-orange-800">Kun manuel frigivelse</span>
                        <p className="text-sm text-orange-600">I skal begge godkende før pengene frigives</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* First Month Rent Release (only if amount > 0) */}
              {escrowData.firstMonthRent > 0 && (
                <div className="border-2 border-blue-200 rounded-2xl overflow-hidden">
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <h4 className="text-xl font-bold text-blue-800 flex items-center gap-3">
                      <span className="text-3xl">🏠</span>
                      Forudbetalt husleje frigivelse
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Hvornår skal første måneders husleje frigives til udlejer?</p>
                  </div>
                  
                  <div className="p-6 bg-white space-y-4">
                    <div className="grid gap-4">
                      <label className="flex items-start p-4 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="firstMonthRelease"
                          value="START_DATE"
                          checked={escrowData.firstMonthReleaseType === 'START_DATE'}
                          onChange={(e) => setEscrowData(prev => ({
                            ...prev,
                            firstMonthReleaseType: e.target.value as any
                          }))}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <span className="font-semibold text-blue-800">Automatisk på startdato</span>
                          <p className="text-sm text-blue-600">Anbefalet - frigives når lejemålet starter</p>
                        </div>
                      </label>
                      
                      <label className="flex items-start p-4 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="firstMonthRelease"
                          value="SPECIFIC_DATE"
                          checked={escrowData.firstMonthReleaseType === 'SPECIFIC_DATE'}
                          onChange={(e) => setEscrowData(prev => ({
                            ...prev,
                            firstMonthReleaseType: e.target.value as any
                          }))}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-blue-800">På bestemt dato</span>
                          <p className="text-sm text-blue-600 mb-2">Vælg selv hvornår husleje skal frigives</p>
                          {escrowData.firstMonthReleaseType === 'SPECIFIC_DATE' && (
                            <input
                              type="date"
                              value={escrowData.firstMonthReleaseDate || ''}
                              onChange={(e) => setEscrowData(prev => ({
                                ...prev,
                                firstMonthReleaseDate: e.target.value
                              }))}
                              className="px-3 py-2 border border-blue-300 rounded-lg"
                              min={escrowData.startDate}
                            />
                          )}
                        </div>
                      </label>
                      
                      <label className="flex items-start p-4 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="firstMonthRelease"
                          value="MANUAL"
                          checked={escrowData.firstMonthReleaseType === 'MANUAL'}
                          onChange={(e) => setEscrowData(prev => ({
                            ...prev,
                            firstMonthReleaseType: e.target.value as any
                          }))}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <span className="font-semibold text-blue-800">Kun manuel frigivelse</span>
                          <p className="text-sm text-blue-600">I skal begge godkende før pengene frigives</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Prepaid Rent Info (only if amount > 0) */}
              {escrowData.prepaidRent > 0 && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    Forudbetalt leje frigivelse
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-purple-800">Automatisk frigivelse</p>
                        <p className="text-sm text-purple-600 mt-1">
                          Forudbetalt leje ({formatCurrency(escrowData.prepaidRent)} DKK) frigives automatisk til udlejer på startdatoen sammen med første måneders husleje.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {totalAmount > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-3">
                    <span className="text-3xl">🎉</span>
                    Klar til oprettelse!
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-green-600 font-medium mb-1">Total deponering</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(totalAmount)} DKK</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-green-600 font-medium mb-1">Lejer</p>
                      <p className="font-semibold text-green-800">{escrowData.tenantName}</p>
                      <p className="text-xs text-green-600">{escrowData.tenantEmail}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-green-600 font-medium mb-1">Bolig</p>
                      <p className="font-semibold text-green-800">{escrowData.propertyType}</p>
                      <p className="text-xs text-green-600">{selectedAddress?.tekst}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
              ${step === 1 
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

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${!canProceed(step)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              Næste
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
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Opretter deponering...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opret Deponering & Send Invitation
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}