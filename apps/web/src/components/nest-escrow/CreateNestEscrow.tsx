'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

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
    setLoading(true)
    try {
      const response = await api.post('/nest/escrows', escrowData)
      router.push(`/nest/escrows/${response.data.id}`)
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
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
          <p className="text-slate-600">Sikker deponering af depositum og lejemidler</p>
        </div>

        {/* Progress Steps */}
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
                {step === 1 && 'Vælg Ejendom'}
                {step === 2 && 'Vælg Lejer'}
                {step === 3 && 'Konfigurer Beløb'}
                {step === 4 && 'Frigivelsesregler'}
              </h2>
              <p className="text-slate-600 text-sm">
                {step === 1 && 'Vælg den ejendom der skal deponeres for'}
                {step === 2 && 'Find og vælg lejeren'}
                {step === 3 && 'Angiv depositum og andre beløb'}
                {step === 4 && 'Definer hvornår midler skal frigives'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Step 1: Property Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Vælg Ejendom</h3>
              
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Du har ingen egenskaber registreret endnu.</p>
                  <Link
                    href="/properties/create"
                    className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Opret Ejendom
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${selectedProperty?.id === property.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      <h4 className="font-semibold text-slate-800">{property.address}</h4>
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        <p>Månedsleje: {property.monthlyRent.toLocaleString()} DKK</p>
                        <p>Depositum: {property.depositAmount.toLocaleString()} DKK</p>
                        <p>Forudbetalt: {property.prepaidRent.toLocaleString()} DKK</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tenant Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Vælg Lejer</h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Søg efter lejer (navn eller email)"
                  value={tenantSearch}
                  onChange={(e) => {
                    setTenantSearch(e.target.value)
                    searchTenants(e.target.value)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleTenantSelect(user)}
                        className="w-full p-4 text-left hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTenant && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">{selectedTenant.firstName} {selectedTenant.lastName}</p>
                      <p className="text-sm text-green-600">{selectedTenant.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Amount Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Konfigurer Beløb</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Depositum (DKK)
                  </label>
                  <input
                    type="number"
                    value={escrowData.depositAmount / 100}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      depositAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Første måneders husleje (DKK)
                  </label>
                  <input
                    type="number"
                    value={escrowData.firstMonthAmount / 100}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      firstMonthAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    A conto betalinger (DKK)
                  </label>
                  <input
                    type="number"
                    value={escrowData.utilitiesAmount / 100}
                    onChange={(e) => setEscrowData(prev => ({
                      ...prev,
                      utilitiesAmount: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="font-semibold text-slate-800 mb-4">Oversigt</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Depositum:</span>
                    <span>{formatCurrency(escrowData.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Første måneders husleje:</span>
                    <span>{formatCurrency(escrowData.firstMonthAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>A conto betalinger:</span>
                    <span>{formatCurrency(escrowData.utilitiesAmount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 font-semibold flex justify-between">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Release Rules */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Frigivelsesregler</h3>
              
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-medium text-slate-800 mb-4">Depositum Frigivelse</h4>
                  
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
                        className="ml-6 px-3 py-2 border border-slate-300 rounded-lg"
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

                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-medium text-slate-800 mb-4">Første Måneders Husleje</h4>
                  
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
                        className="ml-6 px-3 py-2 border border-slate-300 rounded-lg"
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

                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-medium text-slate-800 mb-4">Godkendelsesindstillinger</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Hvis modparten ikke svarer inden for denne periode, godkendes frigivelsen automatisk
                    </p>
                  </div>
                </div>
              </div>
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
              disabled={
                (step === 1 && !selectedProperty) ||
                (step === 2 && !selectedTenant) ||
                (step === 3 && totalAmount === 0)
              }
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${(step === 1 && !selectedProperty) ||
                  (step === 2 && !selectedTenant) ||
                  (step === 3 && totalAmount === 0)
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
              disabled={loading}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Opretter...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opret Deponering
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}