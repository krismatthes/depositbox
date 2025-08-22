'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { SmartPropertyField, SmartContactFields, SmartRentField, SmartDepositField } from '@/components/SmartFormFields'
import { extractAndSaveFromNestEscrow } from '@/lib/dataReuse'
import { validateUserAccess, canCreateNestEscrow, sanitizeInput } from '@/lib/security'
import { createConversationFromContract } from '@/lib/chatUtils'

interface Property {
  id: string
  address: string
  monthlyRent: number
  depositAmount: number
  prepaidRent: number
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface EscrowData {
  landlordId: string
  tenantId: string
  depositAmount: number
  firstMonthAmount: number
  utilitiesAmount: number
  releaseConditions: {
    depositReleaseType: 'LEASE_END' | 'SPECIFIC_DATE' | 'MANUAL_ONLY'
    depositReleaseDate?: string
    firstMonthReleaseType: 'MOVE_IN_DATE' | 'SPECIFIC_DATE' | 'MANUAL_ONLY'
    firstMonthReleaseDate?: string
    autoApprovalDays: number
  }
}

export default function CreateNestEscrow() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [tenantSearch, setTenantSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<User | null>(null)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [propertyAddress, setPropertyAddress] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  
  const [escrowData, setEscrowData] = useState<EscrowData>({
    landlordId: user?.id || '',
    tenantId: '',
    depositAmount: 0,
    firstMonthAmount: 0,
    utilitiesAmount: 0,
    releaseConditions: {
      depositReleaseType: 'LEASE_END',
      firstMonthReleaseType: 'MOVE_IN_DATE',
      autoApprovalDays: 14
    }
  })

  useEffect(() => {
    if (user) {
      fetchProperties()
      setEscrowData(prev => ({ ...prev, landlordId: user.id }))
    }
  }, [user])

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties')
      setProperties(response.data.properties || [])
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    }
  }

  const searchTenants = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      // Mock search - i virkeligheden ville vi have en søge-endpoint
      const response = await api.get(`/auth/search-users?q=${encodeURIComponent(query)}`)
      setSearchResults(response.data.users || [])
    } catch (error) {
      console.error('Failed to search users:', error)
      setSearchResults([])
    }
  }

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property)
    setEscrowData(prev => ({
      ...prev,
      depositAmount: Math.round(property.depositAmount * 100), // Convert to øre
      firstMonthAmount: Math.round(property.monthlyRent * 100),
      utilitiesAmount: 0
    }))
  }

  const handleTenantSelect = (tenant: User) => {
    setSelectedTenant(tenant)
    setTenantSearch(`${tenant.firstName} ${tenant.lastName} (${tenant.email})`)
    setSearchResults([])
    setEscrowData(prev => ({ ...prev, tenantId: tenant.id }))
  }

  const createEscrow = async () => {
    // Security validation
    if (!validateUserAccess(user)) {
      alert('Du skal være logget ind for at oprette Depositums Box.')
      return
    }

    const depositCheck = canCreateNestEscrow(user!.id)
    if (!depositCheck.allowed) {
      alert(depositCheck.reason)
      return
    }

    setLoading(true)
    try {
      // Save reusable data
      const escrowForSaving = {
        propertyAddress,
        propertyType: selectedProperty?.address ? 'Existing' : 'New',
        firstMonthRent: escrowData.firstMonthAmount,
        depositAmount: escrowData.depositAmount,
        tenantName,
        tenantEmail,
        tenantPhone,
        landlordEmail: user?.email,
        landlordName: `${user?.firstName} ${user?.lastName}`
      }
      
      extractAndSaveFromNestEscrow(user!.id, escrowForSaving)
      
      // Format data for the simple Depositums Box API
      const simpleEscrowData = {
        landlordId: user!.id,
        tenantName,
        tenantEmail,
        propertyAddress,
        propertyPostcode: '', // Extract from address if needed
        propertyCity: '', // Extract from address if needed
        propertyType: selectedProperty?.address ? 'EXISTING' : 'NEW',
        depositAmount: escrowData.depositAmount,
        firstMonthAmount: escrowData.firstMonthAmount,
        prepaidAmount: 0,
        utilitiesAmount: escrowData.utilitiesAmount,
        startDate: new Date().toISOString(),
        releaseConditions: {
          depositReleaseType: escrowData.releaseConditions.depositReleaseType === 'LEASE_END' ? 'LEASE_END' :
                              escrowData.releaseConditions.depositReleaseType === 'SPECIFIC_DATE' ? 'SPECIFIC_DATE' : 'MANUAL',
          depositReleaseDate: escrowData.releaseConditions.depositReleaseDate,
          firstMonthReleaseType: escrowData.releaseConditions.firstMonthReleaseType === 'MOVE_IN_DATE' ? 'START_DATE' :
                                 escrowData.releaseConditions.firstMonthReleaseType === 'SPECIFIC_DATE' ? 'SPECIFIC_DATE' : 'MANUAL',
          firstMonthReleaseDate: escrowData.releaseConditions.firstMonthReleaseDate
        }
      }
      
      const response = await api.post('/nest/escrows/simple', simpleEscrowData)
      const escrowId = response.data.id
      
      // Create chat conversation for Depositums Box
      if (tenantName && tenantEmail) {
        createConversationFromContract({
          contractId: escrowId,
          contractType: 'nest_escrow',
          propertyAddress: propertyAddress,
          tenantId: selectedTenant?.id || 'unknown-tenant',
          tenantName: tenantName,
          tenantEmail: tenantEmail,
          landlordId: user!.id,
          landlordName: `${user!.firstName} ${user!.lastName}`,
          landlordEmail: user!.email
        })
      }
      
      router.push(`/nest/escrows/${escrowId}?created=true`)
    } catch (error) {
      console.error('Failed to create escrow:', error)
      alert('Fejl ved oprettelse af deponering. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toLocaleString('da-DK')} DKK`
  }

  const totalAmount = escrowData.depositAmount + escrowData.firstMonthAmount + escrowData.utilitiesAmount

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opret Depositums Box</h1>
              <p className="text-gray-600 mt-1">Sikker håndtering af depositum og husleje</p>
            </div>
          </div>

          {/* Progress indicator with blue colors and checkmarks */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[
              { num: 1, title: 'Ejendom', desc: 'Adresse og grundoplysninger' },
              { num: 2, title: 'Lejer', desc: 'Kontaktoplysninger' },
              { num: 3, title: 'Beløb', desc: 'Depositum og husleje' },
              { num: 4, title: 'Vilkår', desc: 'Frigivelsesregler' }
            ].map((item, index) => (
              <div key={item.num} className="flex flex-col items-center text-center flex-1">
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
                <div className="text-xs">
                  <p className={`font-medium ${step >= item.num ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.title}
                  </p>
                  <p className="text-gray-400 mt-0.5 hidden sm:block">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className={`hidden sm:block absolute h-px w-16 mt-6 ml-16 transition-colors ${
                    step > item.num ? 'bg-blue-600' : 'bg-gray-300'
                  }`} style={{transform: 'translateY(-24px)'}} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-12">
          {/* Step 1: Property Selection */}
          {step === 1 && (
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Ejendomsoplysninger</h2>
                <p className="text-blue-100">Indtast adressen på den ejendom, som deponeringen vedrører</p>
              </div>
              <div className="p-8 space-y-8">
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ejendomsadresse *
                </label>
                <SmartPropertyField
                  value={propertyAddress}
                  onChange={(value, propertyInfo) => {
                    setPropertyAddress(value)
                    if (propertyInfo) {
                      setEscrowData(prev => ({
                        ...prev,
                        depositAmount: (propertyInfo.deposit || 0) * 100,
                        firstMonthAmount: (propertyInfo.rent || 0) * 100
                      }))
                    }
                  }}
                  placeholder="Eksempel: Kongens Nytorv 1, 1050 København K"
                  label=""
                />
                <p className="text-xs text-gray-500 mt-2">Indtast den fulde adresse inkl. postnummer og by</p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Beløbsoplysninger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SmartDepositField
                      value={escrowData.depositAmount / 100}
                      rentValue={escrowData.firstMonthAmount / 100}
                      onChange={(value) => setEscrowData(prev => ({
                        ...prev,
                        depositAmount: Math.round(parseFloat(value || '0') * 100)
                      }))}
                      label="Depositum (DKK) *"
                      placeholder="45.000"
                    />
                    <p className="text-xs text-slate-500 mt-1">Typisk 3 måneders husleje</p>
                  </div>
                  
                  <div>
                    <SmartRentField
                      value={escrowData.firstMonthAmount / 100}
                      onChange={(value) => setEscrowData(prev => ({
                        ...prev,
                        firstMonthAmount: Math.round(parseFloat(value || '0') * 100)
                      }))}
                      label="Månedlig husleje (DKK) *"
                      placeholder="15.000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Første måneders husleje</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    A conto betalinger (DKK)
                  </label>
                  <input
                    type="number"
                    value={escrowData.utilitiesAmount / 100}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      utilitiesAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="2.000"
                  />
                  <p className="text-xs text-gray-500 mt-2">Valgfri - forudbetaling til varme, vand, el osv.</p>
                </div>
              </div>
              
              {/* Property overview */}
              {properties.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Eksisterende ejendomme:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {properties.slice(0, 4).map((property) => (
                      <button
                        key={property.id}
                        onClick={() => {
                          setPropertyAddress(property.address)
                          handlePropertySelect(property)
                        }}
                        className="p-3 text-left bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <p className="font-medium text-blue-800 text-sm">{property.address}</p>
                        <p className="text-xs text-blue-600">Leje: {property.monthlyRent.toLocaleString()} DKK</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Step 2: Tenant Selection */}
          {step === 2 && (
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Lejeroplysninger</h2>
                <p className="text-blue-100">Indtast kontaktoplysninger på den person, der skal leje ejendommen</p>
              </div>
              <div className="p-8 space-y-8">
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Kontaktoplysninger</h3>
                <SmartContactFields
                  nameValue={tenantName}
                  emailValue={tenantEmail}
                  phoneValue={tenantPhone}
                  onNameChange={(value) => {
                    setTenantName(value)
                    setTenantSearch(value)
                  }}
                  onEmailChange={(value, contactInfo) => {
                    setTenantEmail(value)
                    if (contactInfo) {
                      setTenantName(contactInfo.name)
                      setTenantPhone(contactInfo.phone || '')
                      setEscrowData(prev => ({ ...prev, tenantId: contactInfo.id }))
                    }
                  }}
                  onPhoneChange={(value) => setTenantPhone(value)}
                  role="tenant"
                  nameLabel="Lejer navn *"
                  emailLabel="Lejer email *"
                  phoneLabel="Lejer telefon"
                />
              </div>
              
              {/* Existing search functionality as fallback */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-700 mb-3">💡 Tip: Søg efter eksisterende bruger</h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Søg efter lejer (navn eller email)"
                    value={tenantSearch}
                    onChange={(e) => {
                      setTenantSearch(e.target.value)
                      searchTenants(e.target.value)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            handleTenantSelect(user)
                            setTenantName(`${user.firstName} ${user.lastName}`)
                            setTenantEmail(user.email)
                          }}
                          className="w-full p-4 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(selectedTenant || tenantName) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">
                        {selectedTenant ? `${selectedTenant.firstName} ${selectedTenant.lastName}` : tenantName}
                      </p>
                      <p className="text-sm text-green-600">
                        {selectedTenant ? selectedTenant.email : tenantEmail}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Step 3: Amount Configuration */}
          {step === 3 && (
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Bekræft beløb</h2>
                <p className="text-blue-100">Gennemgå og juster beløbene, der skal deponeres</p>
              </div>
              <div className="p-8 space-y-8">
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-medium text-gray-900 mb-6">Beløbsoversigt</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Depositum
                      </label>
                      <p className="text-xs text-gray-500">Sikkerheds depositum til udlejer</p>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        value={escrowData.depositAmount / 100}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          depositAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                        }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">DKK</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Første måneders husleje
                      </label>
                      <p className="text-xs text-gray-500">Husleje for første måned</p>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        value={escrowData.firstMonthAmount / 100}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          firstMonthAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                        }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">DKK</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        A conto betalinger
                      </label>
                      <p className="text-xs text-gray-500">Varme, vand, el osv. (valgfri)</p>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        value={escrowData.utilitiesAmount / 100}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          utilitiesAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                        }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">DKK</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total beløb til deponering</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-200">Lejeren betaler</p>
                    <p className="text-xs text-blue-200">Pengene er sikret</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Step 4: Release Rules */}
          {step === 4 && (
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Frigivelsesvilkår</h2>
                <p className="text-blue-100">Hvornår skal pengene automatisk frigives?</p>
              </div>
              <div className="p-8 space-y-8">
              
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Når skal depositum frigives?</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="LEASE_END"
                        checked={escrowData.releaseConditions.depositReleaseType === 'LEASE_END'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, depositReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>Automatisk ved lejeaftalens ophør</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="SPECIFIC_DATE"
                        checked={escrowData.releaseConditions.depositReleaseType === 'SPECIFIC_DATE'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, depositReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>På bestemt dato</span>
                    </label>
                    
                    {escrowData.releaseConditions.depositReleaseType === 'SPECIFIC_DATE' && (
                      <input
                        type="date"
                        value={escrowData.releaseConditions.depositReleaseDate || ''}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, depositReleaseDate: e.target.value }
                        }))}
                        className="ml-6 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="depositRelease"
                        value="MANUAL_ONLY"
                        checked={escrowData.releaseConditions.depositReleaseType === 'MANUAL_ONLY'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, depositReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>Kun manuel frigivelse</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Når skal huslejen frigives?</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="firstMonthRelease"
                        value="MOVE_IN_DATE"
                        checked={escrowData.releaseConditions.firstMonthReleaseType === 'MOVE_IN_DATE'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, firstMonthReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>Automatisk på indflytningsdato</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="firstMonthRelease"
                        value="SPECIFIC_DATE"
                        checked={escrowData.releaseConditions.firstMonthReleaseType === 'SPECIFIC_DATE'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, firstMonthReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>På bestemt dato</span>
                    </label>
                    
                    {escrowData.releaseConditions.firstMonthReleaseType === 'SPECIFIC_DATE' && (
                      <input
                        type="date"
                        value={escrowData.releaseConditions.firstMonthReleaseDate || ''}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, firstMonthReleaseDate: e.target.value }
                        }))}
                        className="ml-6 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="firstMonthRelease"
                        value="MANUAL_ONLY"
                        checked={escrowData.releaseConditions.firstMonthReleaseType === 'MANUAL_ONLY'}
                        onChange={(e) => setEscrowData(prev => ({
                          ...prev,
                          releaseConditions: { ...prev.releaseConditions, firstMonthReleaseType: e.target.value as any }
                        }))}
                        className="mr-3"
                      />
                      <span>Kun manuel frigivelse</span>
                    </label>
                  </div>
                </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Du er sikret</h4>
                    <p className="text-green-800 text-sm">Alle transaktioner er beskyttet og kan kun frigives med begge parters samtykke eller automatisk efter de valgte regler.</p>
                  </div>
                </div>
              </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-900 mb-4">🕰️ Sikkerhedsindstilling</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Automatisk godkendelse efter (dage)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={escrowData.releaseConditions.autoApprovalDays}
                      onChange={(e) => setEscrowData(prev => ({
                        ...prev,
                        releaseConditions: { ...prev.releaseConditions, autoApprovalDays: parseInt(e.target.value) || 14 }
                      }))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-sm text-blue-600 mt-1">
                      Hvis modparten ikke svarer inden for denne periode, godkendes frigivelsen automatisk
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border
              ${step === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-300'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Forrige
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !propertyAddress) ||
                (step === 2 && (!tenantName || !tenantEmail)) ||
                (step === 3 && totalAmount === 0)
              }
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${(step === 1 && !propertyAddress) ||
                  (step === 2 && (!tenantName || !tenantEmail)) ||
                  (step === 3 && totalAmount === 0)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }
              `}
            >
              Fortsæt til {step === 1 ? 'lejeroplysninger' : step === 2 ? 'beløb' : 'vilkår'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={createEscrow}
              disabled={loading}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Opretter Depositums Box...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
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