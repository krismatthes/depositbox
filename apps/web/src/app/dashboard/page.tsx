'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import EscrowCard from '@/components/EscrowCard'
import Link from 'next/link'

interface Property {
  id: string
  address: string
  propertyType: string
  size: number
  monthlyRent: number
  depositAmount: number
  prepaidRent: number
  currency: string
  moveInDate?: string
  status: string
  createdAt: string
  escrows: Array<{
    id: string
    status: string
    buyer: {
      firstName: string
      lastName: string
      email: string
    }
  }>
  invitations: Array<{
    id: string
    status: string
    type: string
    createdAt: string
  }>
}

interface DraftContract {
  id: string
  title: string
  data: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Escrow {
  id: string
  amount: string
  currency: string
  status: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
  property?: {
    title: string
    address: string
    moveInDate?: string
  }
  propertyTitle?: string
  propertyAddress?: string
  buyer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  seller: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  payproffHostedUrl?: string
  createdAt: string
  fundedAt?: string
  releasedAt?: string
  plannedReleaseDate?: string
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  property: {
    id: string
    address: string
    moveInDate?: string
  }
  status: 'INVITED' | 'ACCEPTED' | 'ACTIVE' | 'MOVED_OUT'
  invitationDate?: string
  moveInDate?: string
  moveOutDate?: string
  leaseEndDate?: string
  nestStatus?: 'CREATED' | 'FUNDED' | 'RELEASED'
  nestAmount?: number
  currency?: string
  source: 'INVITATION' | 'NEST' | 'CONTRACT'
  // Rental details
  monthlyRent?: number
  depositAmount?: number
  prepaidRentAmount?: number
  totalRentPaid?: number
  daysLived?: number
  contractStartDate?: string
  contractEndDate?: string
}

// Helper functions moved outside component
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ikke angivet'
  return new Date(dateString).toLocaleDateString('da-DK')
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('da-DK')
}

const getEscrowStatusBadge = (status: string) => {
  const statusStyles = {
    CREATED: 'bg-blue-100 text-blue-800 border border-blue-200',
    FUNDED: 'bg-green-100 text-green-800 border border-green-200',
    RELEASED: 'bg-purple-100 text-purple-800 border border-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 border border-red-200'
  }
  
  const statusLabels = {
    CREATED: 'Oprettet',
    FUNDED: 'Finansieret', 
    RELEASED: 'Frigivet',
    CANCELLED: 'Annulleret'
  }
  
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.CREATED
  const label = statusLabels[status as keyof typeof statusLabels] || status
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [draftContracts, setDraftContracts] = useState<DraftContract[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/tenant/invitations/${invitationId}/${action}`)
      // Refresh invitations after action
      await fetchDashboardData()
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'LANDLORD') {
        const [propertiesResponse, nestEscrowsResponse, contractsResponse] = await Promise.all([
          api.get('/properties'),
          api.get('/nest/escrows'),
          api.get('/draft-contracts')
        ])

        const properties = propertiesResponse.data.properties || []
        const nestEscrows = nestEscrowsResponse.data.escrows || []
        const contracts = contractsResponse.data.contracts || []

        setProperties(properties)
        setEscrows(nestEscrows)
        setDraftContracts(contracts)
      } else {
        // Fetch escrows and invitations for tenants
        const [escrowResponse, invitationResponse] = await Promise.all([
          api.get('/escrow'),
          api.get('/tenant/invitations').catch(() => ({ data: [] }))
        ])
        setEscrows(escrowResponse.data)
        setInvitations(invitationResponse.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (user?.role === 'LANDLORD') {
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
                    <p className="text-slate-600 mt-2">Velkommen tilbage, {user.firstName}! 👋</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3">
                      <Link 
                        href="/nest/create-simple"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        🪺 Opret Nest
                      </Link>
                      <Link 
                        href="/lease-contract/create"
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📋 Opret Lejekontrakt
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H19a2 2 0 012 2v0a2 2 0 01-2 2h-5M9 7h6m-6 4h6m-7 4h7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Boliger</p>
                          <p className="text-2xl font-bold text-blue-800">{properties.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">Aktive Nests</p>
                          <p className="text-2xl font-bold text-green-800">
                            {escrows.filter(escrow => escrow.status === 'FUNDED').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Kontrakter</p>
                          <p className="text-2xl font-bold text-purple-800">{draftContracts.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Tenant Dashboard (simplified version)
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-800">Mine Nests</h1>
                  <p className="text-slate-600 mt-2">Velkommen tilbage, {user.firstName}! 👋</p>
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Invitations Section */}
                {invitations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Nye Invitationer</h2>
                          <p className="text-amber-100 text-sm">Du har {invitations.length} ventende invitation{invitations.length !== 1 ? 'er' : ''}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {invitations.map((invitation, index) => (
                        <div key={invitation.id || index} className="p-6 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-slate-800 truncate">
                                    {invitation.propertyAddress || invitation.address || 'Ny boliginvitation'}
                                  </h3>
                                  <p className="text-slate-600">
                                    Fra: {invitation.landlordName || invitation.fromName || 'Udlejer'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    {invitation.depositAmount && (
                                      <div className="flex items-center gap-1 text-sm text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <span>Depositum: {invitation.depositAmount.toLocaleString()} kr</span>
                                      </div>
                                    )}
                                    {invitation.moveInDate && (
                                      <div className="flex items-center gap-1 text-sm text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Indtrykning: {formatDate(invitation.moveInDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4">
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                                Venter på svar
                              </span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleInvitationAction(invitation.id, 'accept')}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  Acceptér
                                </button>
                                <button 
                                  onClick={() => handleInvitationAction(invitation.id, 'reject')}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  Afvis
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nests Section */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Mine Nests</h2>
                  {escrows.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ingen Nests endnu</h3>
                      <p className="text-slate-600 mb-6">
                        Du har ikke nogen aktive Nest-indskud endnu. 
                        Når du accepterer en invitation fra en udlejer, vil den vises her.
                      </p>
                      <p className="text-sm text-slate-500">
                        Du vil modtage en email når du bliver inviteret til at oprette en Nest.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {escrows.map((escrow) => (
                        <div key={escrow.id} className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">{escrow.propertyAddress}</h3>
                              <p className="text-slate-600">{formatDate(escrow.createdAt)}</p>
                            </div>
                            {getEscrowStatusBadge(escrow.status)}
                          </div>
                          <p className="text-2xl font-bold text-slate-900 mt-2">
                            {escrow.amount.toLocaleString()} DKK
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}