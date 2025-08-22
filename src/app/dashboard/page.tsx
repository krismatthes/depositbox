'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import BudgetPlanner from '@/components/BudgetPlanner'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [createdContracts, setCreatedContracts] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadPersistedData()
    }
  }, [user])

  const loadPersistedData = async () => {
    console.log('🔍 DEBUG: Loading persisted data for user:', user?.email, user?.role)
    
    if (typeof window !== 'undefined' && user) {
      const allItems: any[] = []
      
      // Load lease contracts
      const persistedContracts = localStorage.getItem('created_contracts')
      if (persistedContracts) {
        try {
          const contracts = JSON.parse(persistedContracts)
          allItems.push(...contracts.map((c: any) => ({
            ...c,
            type: 'contract',
            propertyAddress: c.propertyAddress || c.propertyDetails?.address
          })))
        } catch (error) {
          console.error('Failed to parse contracts:', error)
        }
      }
      

      // Load Depositums Box escrows from API instead of localStorage
      try {
        const response = await api.get('/nest/escrows')
        if (response.data.escrows) {
          allItems.push(...response.data.escrows.map((e: any) => ({
            id: e.id,
            type: 'nest',
            title: `Depositums Box - ${e.propertyAddress || e.address}`,
            propertyAddress: e.propertyAddress || e.address,
            landlord: e.landlord,
            tenant: e.tenant,
            monthlyRent: e.firstMonthAmount ? e.firstMonthAmount / 100 : 0,
            deposit: e.depositAmount ? e.depositAmount / 100 : 0,
            status: e.status,
            tenantInfoMissing: false // Depositums Box escrows don't have missing info
          })))
        }
      } catch (error) {
        console.error('Failed to fetch Depositums Box escrows from API:', error)
        // Fallback to localStorage for legacy data
        const userEscrows = localStorage.getItem(`escrows_${user.id}`)
        if (userEscrows) {
          try {
            const escrows = JSON.parse(userEscrows)
            allItems.push(...escrows.map((e: any) => ({
              id: e.id,
              type: 'nest',
              title: `Depositums Box - ${e.propertyAddress || e.propertyTitle}`,
              propertyAddress: e.propertyAddress || e.propertyTitle,
              landlord: e.landlord,
              tenant: e.tenant,
              monthlyRent: e.rent ? e.rent / 100 : 0,
              deposit: e.deposit ? e.deposit / 100 : 0,
              status: e.status,
              tenantInfoMissing: false // Depositums Box escrows don't have missing info
            })))
          } catch (error) {
            console.error('Failed to parse escrows:', error)
          }
        }
      }
      
      // Load handover reports
      const handoverReports = localStorage.getItem('handoverReports')
      if (handoverReports) {
        try {
          const reports = JSON.parse(handoverReports)
          allItems.push(...reports.map((r: any) => ({
            id: r.id,
            type: 'report',
            title: `Overtagelsesrapport - ${r.propertyAddress}`,
            propertyAddress: r.propertyAddress,
            landlord: r.landlord,
            tenant: r.tenant,
            status: r.status || 'COMPLETED', // Default to COMPLETED for demo reports
            reportType: r.reportType,
            tenantInfoMissing: false // Reports don't have missing info
          })))
        } catch (error) {
          console.error('Failed to parse handover reports:', error)
        }
      }
      
      // Load roomie agreements
      const roomieAgreements = localStorage.getItem('roomie_agreements')
      if (roomieAgreements) {
        try {
          const agreements = JSON.parse(roomieAgreements)
          allItems.push(...agreements.map((a: any) => ({
            id: a.id,
            type: 'roomie',
            title: `Roomie-aftale - ${a.propertyAddress}`,
            propertyAddress: a.propertyAddress,
            mainTenant: a.mainTenantName,
            roommates: a.roommates,
            agreementType: a.agreementType,
            status: 'ACTIVE',
            tenantInfoMissing: false // Roomie agreements don't have missing info
          })))
        } catch (error) {
          console.error('Failed to parse roomie agreements:', error)
        }
      }
      
      console.log('🔍 DEBUG: All items loaded:', {
        total: allItems.length,
        userRole: user.role,
        userEmail: user.email,
        items: allItems.map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          landlordEmail: item.landlord?.email
        }))
      })
      
      // Filter items for landlords
      if (user.role === 'LANDLORD') {
        const filteredItems = allItems.filter((item: any) => item.landlord?.email === user.email)
        console.log('🔍 DEBUG: Filtered items for landlord:', {
          original: allItems.length,
          filtered: filteredItems.length,
          userEmail: user.email
        })
        setCreatedContracts(filteredItems)
      } else {
        setCreatedContracts(allItems)
      }
    }
    setLoadingData(false)
  }

  const clearPersistedData = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.removeItem('created_contracts')
      localStorage.removeItem(`escrows_${user.id}`)
      localStorage.removeItem(`invitations_${user.id}`)
      localStorage.removeItem('handoverReports')
      localStorage.removeItem('roomie_agreements')
      console.log('🔍 DEBUG: Cleared all contracts, escrows and reports')
      setCreatedContracts([])
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
                  <p className="text-slate-600 mt-2">Velkommen, {user.firstName}! 👋</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const contracts = localStorage.getItem('created_contracts')
                      alert(`Contracts: ${contracts ? JSON.parse(contracts).length : 0}`)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm"
                  >
                    📄 Show Contracts
                  </button>
                  <button
                    onClick={clearPersistedData}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm"
                  >
                    🗑️ Ryd Alt
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await api.post('/nest/escrows/create-funded-dummy')
                        alert(`Dummy funded escrow created! ID: ${response.data.escrow.id}`)
                        // Refresh the page to show the new escrow
                        window.location.href = response.data.url
                      } catch (error: any) {
                        console.error('Error creating dummy:', error)
                        alert('Fejl ved oprettelse af dummy Depositums Box')
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm"
                  >
                    💰 Dummy FUNDED
                  </button>
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Hurtige Handlinger</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create Lease Contract */}
                    <button
                      onClick={() => router.push('/lease-contract/create')}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Opret Lejekontrakt</h3>
                          <p className="text-slate-600 text-sm">Generér ny A10 lejekontrakt</p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">Udfyld lejeoplysninger og opret kontrakt til underskrift</p>
                    </button>

                    {/* Create NEST Escrow - Different for TENANT vs LANDLORD */}
                    {user.role === 'TENANT' ? (
                      <button
                        onClick={() => router.push('/nest/invite-landlord')}
                        className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Inviter Udlejer til Depositums Box</h3>
                            <p className="text-slate-600 text-sm">Send invitation til Depositums Box</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm">Inviter din udlejer til at oprette sikker Depositums Box</p>
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/nest/create-simple')}
                        className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Opret Depositums Box</h3>
                            <p className="text-slate-600 text-sm">Sikker deponering af depositum</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm">Start Depositums Box for lejekontrakt</p>
                      </button>
                    )}

                    {/* Create Handover Report */}
                    <button
                      onClick={() => router.push('/handover-reports/create')}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Overtagelsesrapport</h3>
                          <p className="text-slate-600 text-sm">Dokumentér boligtilstand</p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">Opret ind- eller fraflytningsrapport</p>
                    </button>

                    {/* Create Roomie Agreement */}
                    <button
                      onClick={() => router.push('/roomie-agreement/create')}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Roomie-/Samboaftale</h3>
                          <p className="text-slate-600 text-sm">Aftale for delt beboelse</p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">Opret aftale mellem roomies/sambeboere</p>
                    </button>

                    {/* Digital Rent Payments */}
                    <button
                      onClick={() => router.push('/rent-payments/dashboard')}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Digital Husleje</h3>
                          <p className="text-slate-600 text-sm">
                            {user?.role === 'TENANT' ? 'Inviter til digital betaling' : 'Inviter til digital indbetalign'}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">
                        {user?.role === 'TENANT' 
                          ? 'Send invitation til din udlejer for automatisk betaling'
                          : 'Send invitation til din lejer for digital modtagelse'}
                      </p>
                    </button>


                    {/* Budget Planner */}
                    <button
                      onClick={() => router.push('/budget')}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Budgetplan</h3>
                          <p className="text-slate-600 text-sm">Økonomisk planlægning</p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">
                        Lav din personlige budgetplan og få overblik over økonomien
                      </p>
                    </button>

                  </div>
                </div>

                {/* Debug Info */}
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  <strong>DEBUG:</strong> User: {user.email} ({user.role}) | Contracts: {createdContracts.length}
                </div>

                {/* Contracts that need tenant info */}
                {createdContracts.some(contract => contract.tenantInfoMissing) && (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Anmodning om Oplysninger</h2>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                      {createdContracts.filter(contract => contract.tenantInfoMissing).map((contract) => (
                        <div key={contract.id} className="p-6 border-b border-slate-100 last:border-b-0">
                          <h3 className="text-lg font-semibold text-slate-800">{contract.title}</h3>
                          <p className="text-slate-600">{contract.propertyAddress}</p>
                          <p className="text-amber-600 mt-2">Venter på lejer oplysninger</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Se Kontrakt
                            </button>
                            <button
                              onClick={() => {
                                const magicLink = `${window.location.origin}/contracts/${contract.id}/info`
                                navigator.clipboard.writeText(magicLink)
                                alert('Magic link kopieret til clipboard! Send dette link til lejeren så de kan udfylde deres oplysninger.')
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Kopier Magic Link
                            </button>
                            <button
                              onClick={() => {
                                const contractData = encodeURIComponent(JSON.stringify(contract))
                                window.open(`/contracts/${contract.id}/pdf?data=${contractData}`, '_blank')
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready contracts */}
                {createdContracts.some(contract => !contract.tenantInfoMissing) && (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Mine Dokumenter</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {createdContracts.filter(item => !item.tenantInfoMissing).map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 group transform hover:-translate-y-1">
                          {/* Header with icon and type */}
                          <div className="p-4 pb-3">
                            <div className="flex items-center gap-3 mb-3">
                              {item.type === 'nest' ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                              ) : item.type === 'report' ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                </div>
                              ) : item.type === 'roomie' ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    item.type === 'nest' ? 'bg-emerald-100 text-emerald-700' :
                                    item.type === 'report' ? 'bg-purple-100 text-purple-700' :
                                    item.type === 'roomie' ? 'bg-pink-100 text-pink-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.type === 'nest' ? 'Depositums Box' :
                                     item.type === 'report' ? 'Rapport' :
                                     item.type === 'roomie' ? 'Roomie Aftale' :
                                     'Lejekontrakt'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">{item.title}</h3>
                              <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.propertyAddress}</p>
                              
                              {/* Status badge */}
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                item.type === 'nest' ? 'bg-emerald-50 text-emerald-700' :
                                item.type === 'report' ? 'bg-purple-50 text-purple-700' :
                                item.type === 'roomie' ? 'bg-pink-50 text-pink-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                  item.type === 'nest' ? 'bg-emerald-500' :
                                  item.type === 'report' ? 'bg-purple-500' :
                                  item.type === 'roomie' ? 'bg-pink-500' :
                                  'bg-blue-500'
                                }`}></div>
                                {item.type === 'nest' ? 'Aktiv' : 
                                 item.type === 'report' ? `${item.reportType === 'MOVE_IN' ? 'Indflytning' : 'Fraflytning'}` : 
                                 item.type === 'roomie' ? `${item.agreementType === 'all_on_lease' ? 'Alle på kontrakt' : 'Kun hovedlejer'}` :
                                 'Klar til underskrift'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer with actions */}
                          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex gap-2 justify-center">
                              {item.type === 'contract' && (
                                <>
                                  <button
                                    onClick={() => router.push(`/contracts/${item.id}`)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Se Kontrakt
                                  </button>
                                  <button
                                    onClick={() => {
                                      const contractData = encodeURIComponent(JSON.stringify(item))
                                      window.open(`/contracts/${item.id}/pdf?data=${contractData}`, '_blank')
                                    }}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Download PDF
                                  </button>
                                </>
                              )}
                              {item.type === 'nest' && (
                                <button
                                  onClick={() => router.push(`/nest/escrows/${item.id}`)}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                >
                                  Se Depositums Box
                                </button>
                              )}
                              {item.type === 'report' && (
                                <>
                                  <button
                                    onClick={() => router.push(`/handover-reports/${item.id}`)}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Se Rapport
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reportData = encodeURIComponent(JSON.stringify(item))
                                      window.open(`/handover-reports/${item.id}/pdf?data=${reportData}`, '_blank')
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Download PDF
                                  </button>
                                </>
                              )}
                              {item.type === 'roomie' && (
                                <>
                                  <button
                                    onClick={() => router.push(`/roomie-agreement/${item.id}`)}
                                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Se Aftale
                                  </button>
                                  <button
                                    onClick={() => {
                                      const agreementData = encodeURIComponent(JSON.stringify(item))
                                      window.open(`/roomie-agreement/${item.id}/pdf?data=${agreementData}`, '_blank')
                                    }}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow"
                                  >
                                    Download PDF
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}



                {/* No contracts message */}
                {createdContracts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600">Ingen kontrakter fundet. Opret din første kontrakt ved at bruge "Hurtige Handlinger" ovenfor.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}