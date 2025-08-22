'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

export default function CreateHandoverReportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    propertyAddress: '',
    propertyType: 'APARTMENT',
    reportType: 'MOVE_IN',
    tenancyId: '',
    includeSharedKitchen: true,
    includeSharedBath: true,
    includeSharedAreas: false,
    otherPartyEmail: '',
    selectedContractId: '',
  })
  const [availableContracts, setAvailableContracts] = useState<any[]>([])
  const [useExistingContract, setUseExistingContract] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Load available contracts when component mounts
    if (user && typeof window !== 'undefined') {
      loadAvailableContracts()
    }
  }, [user, loading, router])

  const loadAvailableContracts = () => {
    const contracts: any[] = []
    
    // Load lease contracts
    const savedContracts = localStorage.getItem('leaseContracts')
    if (savedContracts) {
      try {
        const parsedContracts = JSON.parse(savedContracts)
        parsedContracts.forEach((contract: any) => {
          contracts.push({
            id: contract.id,
            type: 'lease',
            propertyAddress: contract.propertyDetails?.address || 'Adresse ikke angivet',
            landlord: contract.landlord,
            tenant: contract.tenant,
            displayName: `Lejekontrakt - ${contract.propertyDetails?.address || 'Ukendt adresse'}`
          })
        })
      } catch (error) {
        console.error('Error parsing lease contracts:', error)
      }
    }

    // Load escrows/nests - check multiple possible storage keys
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
              // Avoid duplicates
              if (!contracts.some(c => c.id === escrow.id)) {
                contracts.push({
                  id: escrow.id,
                  type: 'nest',
                  propertyAddress: escrow.propertyAddress || escrow.property?.address || escrow.address,
                  landlord: escrow.landlord || escrow.seller,
                  tenant: escrow.tenant || escrow.buyer,
                  displayName: `NEST Escrow - ${escrow.propertyAddress || escrow.property?.address || escrow.address || 'Ukendt adresse'}`
                })
              }
            })
          }
        } catch (error) {
          console.error(`Error parsing escrows from ${key}:`, error)
        }
      }
    })

    // Also check for invitations that contain escrow data
    const invitationKeys = [
      `invitations_${user?.id}`,
      'invitations'
    ]
    
    invitationKeys.forEach(key => {
      const savedInvitations = localStorage.getItem(key)
      if (savedInvitations) {
        try {
          const parsedInvitations = JSON.parse(savedInvitations)
          if (Array.isArray(parsedInvitations)) {
            parsedInvitations.forEach((invitation: any) => {
              if (invitation.escrow && !contracts.some(c => c.id === invitation.escrow.id)) {
                const escrow = invitation.escrow
                contracts.push({
                  id: escrow.id,
                  type: 'nest',
                  propertyAddress: escrow.propertyAddress || escrow.property?.address || escrow.address,
                  landlord: escrow.landlord || escrow.seller,
                  tenant: escrow.tenant || escrow.buyer,
                  displayName: `NEST Escrow - ${escrow.propertyAddress || escrow.property?.address || escrow.address || 'Ukendt adresse'}`
                })
              }
            })
          }
        } catch (error) {
          console.error(`Error parsing invitations from ${key}:`, error)
        }
      }
    })

    setAvailableContracts(contracts)
  }

  const handleContractSelect = (contractId: string) => {
    const selectedContract = availableContracts.find(c => c.id === contractId)
    if (selectedContract) {
      setFormData(prev => ({
        ...prev,
        selectedContractId: contractId,
        propertyAddress: selectedContract.propertyAddress,
        otherPartyEmail: user?.role === 'LANDLORD' ? 
          selectedContract.tenant?.email || '' : 
          selectedContract.landlord?.email || ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      // For demo purposes, simulate report creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate a demo report ID
      const reportId = `demo-report-${Date.now()}`
      
      // Create report data
      const reportData = {
        id: reportId,
        propertyAddress: formData.propertyAddress,
        propertyType: formData.propertyType,
        reportType: formData.reportType,
        tenancyId: formData.tenancyId,
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        createdBy: user?.role || 'LANDLORD',
        landlord: user?.role === 'LANDLORD' ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : {
          firstName: '',
          lastName: '',
          email: formData.otherPartyEmail
        },
        tenant: user?.role === 'TENANT' ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : {
          firstName: '',
          lastName: '',
          email: formData.otherPartyEmail
        }
      }
      
      // Save to localStorage
      const existingReports = JSON.parse(localStorage.getItem('handoverReports') || '[]')
      existingReports.push(reportData)
      localStorage.setItem('handoverReports', JSON.stringify(existingReports))
      
      // Redirect to the new report
      router.push(`/handover-reports/${reportId}`)
    } catch (error) {
      console.error('Failed to create report:', error)
      alert('Der opstod en fejl ved oprettelse af rapporten. Prøv igen.')
    } finally {
      setCreating(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-3xl font-bold text-slate-800">Opret Overtagelsesrapport</h1>
                <p className="text-slate-600 mt-1">Dokumenter boligens tilstand ved ind- eller fraflytning</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-xl font-bold text-white">Rapport Detaljer</h2>
              <p className="text-blue-100 text-sm">Udfyld informationer om boligen og rapporttypen</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Contract Selection */}
              {availableContracts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vælg deltagere</h3>
                  
                  {/* Primary Option: Use Existing Contract */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUseExistingContract(true)
                        if (!formData.selectedContractId && availableContracts.length === 1) {
                          handleContractSelect(availableContracts[0].id)
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-colors ${
                        useExistingContract 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              useExistingContract ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {useExistingContract && (
                                <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Fra eksisterende kontrakt/NEST</div>
                              <div className="text-sm text-gray-600">Vælg deltagere fra en aktiv kontrakt</div>
                            </div>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </button>

                    {useExistingContract && (
                      <div className="ml-8 space-y-3">
                        {availableContracts.map(contract => (
                          <button
                            key={contract.id}
                            type="button"
                            onClick={() => handleContractSelect(contract.id)}
                            className={`w-full p-4 border rounded-xl text-left transition-colors ${
                              formData.selectedContractId === contract.id
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {contract.type === 'lease' ? '📄 Lejekontrakt' : '🏦 NEST Escrow'}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">{contract.propertyAddress}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {contract.type === 'lease' ? 'Lejer' : 'Køber'}: {
                                    contract.tenant?.firstName 
                                      ? `${contract.tenant.firstName} ${contract.tenant.lastName || ''}` 
                                      : contract.tenant?.email || 'Navn ikke angivet'
                                  }
                                </div>
                              </div>
                              {formData.selectedContractId === contract.id && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Alternative Option: Manual Entry */}
                    <button
                      type="button"
                      onClick={() => {
                        setUseExistingContract(false)
                        setFormData(prev => ({
                          ...prev,
                          selectedContractId: '',
                          propertyAddress: '',
                          otherPartyEmail: ''
                        }))
                      }}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-colors ${
                        !useExistingContract 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          !useExistingContract ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {!useExistingContract && (
                            <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Indtast manuelt</div>
                          <div className="text-sm text-gray-600">Opgiv adresse og email manuelt</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Property Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Boligadresse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Nørrebrogade 45, 2200 København N"
                  disabled={useExistingContract}
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Boligtype *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="APARTMENT">Lejlighed</option>
                  <option value="HOUSE">Hus</option>
                  <option value="ROOM">Værelse (delt bolig)</option>
                  <option value="DORM">Kollegieværelse</option>
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Rapport Type *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="MOVE_IN">Indflytningsrapport</option>
                  <option value="MOVE_OUT">Fraflytningsrapport</option>
                  <option value="PERIODIC">Periodisk inspektion</option>
                </select>
              </div>

              {/* Shared Areas (only for ROOM type) */}
              {formData.propertyType === 'ROOM' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Fællesområder at inkludere i rapporten
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeSharedKitchen}
                        onChange={(e) => setFormData({...formData, includeSharedKitchen: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Fælles køkken</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeSharedBath}
                        onChange={(e) => setFormData({...formData, includeSharedBath: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Fælles bad</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeSharedAreas}
                        onChange={(e) => setFormData({...formData, includeSharedAreas: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Andre fællesområder (gang, stue)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Kun de valgte områder vil blive inkluderet i rapporten for værelselejemål
                  </p>
                </div>
              )}

              {/* Other Party Email */}
              {!useExistingContract && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {user?.role === 'LANDLORD' ? 'Lejerens email' : 'Udlejers email'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.otherPartyEmail}
                    onChange={(e) => setFormData({...formData, otherPartyEmail: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder={user?.role === 'LANDLORD' ? 'lejer@email.com' : 'udlejer@email.com'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rapporten vil blive tilgængelig for begge parter når den anden logger ind med denne email
                  </p>
                </div>
              )}
              
              {useExistingContract && formData.selectedContractId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="font-medium text-blue-800">
                      {user?.role === 'LANDLORD' ? 'Lejer' : 'Udlejer'}: {formData.otherPartyEmail}
                    </div>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Rapporten deles automatisk med den anden part fra den valgte kontrakt
                  </p>
                </div>
              )}

              {/* Tenancy ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Kontrakt/Lejemål ID (valgfrit)
                </label>
                <input
                  type="text"
                  value={formData.tenancyId}
                  onChange={(e) => setFormData({...formData, tenancyId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="A10-123"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Forbind rapporten med en specifik lejekontrakt for bedre organisering
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-800 mb-1">Sådan fungerer det</div>
                    <div className="text-blue-700 text-sm space-y-1">
                      <p>• Systemet opretter automatisk en tjekliste baseret på boligtypen</p>
                      <p>• Begge parter udfylder rapporten sammen ved fælles gennemgang</p>
                      <p>• Rapporten bliver tilgængelig for begge når I logger ind med jeres emails</p>
                      <p>• Rapporten kan underskrives digitalt når gennemgangen er færdig</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-8 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {creating ? 'Opretter...' : 'Opret Overtagelsesrapport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}