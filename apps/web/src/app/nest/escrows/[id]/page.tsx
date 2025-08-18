'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

interface NestEscrow {
  id: string
  status: string
  landlordId: string
  tenantId: string
  depositAmount: number
  firstMonthAmount: number
  prepaidAmount: number
  totalAmount: number
  propertyAddress?: string
  propertyPostcode?: string
  propertyCity?: string
  propertyType?: string
  startDate?: string
  endDate?: string
  createdAt: string
  landlord: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  tenant: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function NestEscrowDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [escrow, setEscrow] = useState<NestEscrow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  
  const isNewlyCreated = searchParams.get('created') === 'true'

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchEscrow = async () => {
      try {
        const [escrowResponse, deadlinesResponse, claimsResponse] = await Promise.all([
          api.get(`/nest/escrows/${params.id}`),
          api.get(`/nest/escrows/${params.id}/deadlines`),
          api.get(`/nest/escrows/${params.id}/claims`)
        ])
        setEscrow(escrowResponse.data)
        setDeadlines(deadlinesResponse.data.deadlines || [])
        setClaims(claimsResponse.data.claims || [])
      } catch (error: any) {
        console.error('Error fetching escrow:', error)
        setError('Fejl ved hentning af deponering')
      } finally {
        setLoading(false)
      }
    }

    fetchEscrow()
  }, [user, params.id, router])

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('da-DK')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'DRAFT': {
        label: 'Udkast',
        description: 'Venter på godkendelse fra begge parter',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '📝',
        progress: 10
      },
      'AGREED': {
        label: 'Godkendt',
        description: 'Afventer indbetaling fra lejer',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '✅',
        progress: 30
      },
      'FUNDED': {
        label: 'Indbetalt',
        description: 'Midler modtaget og sikret',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '💰',
        progress: 50
      },
      'ACTIVE': {
        label: 'Aktiv',
        description: 'Lejemål er startet og kører',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🏠',
        progress: 70
      },
      'RELEASE_PENDING': {
        label: 'Afventer frigivelse',
        description: 'Fraflytning startet, kravfrist løber',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏳',
        progress: 85
      },
      'RELEASED': {
        label: 'Frigivet',
        description: 'Depositum frigivet til lejer',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🎉',
        progress: 100
      },
      'PARTIALLY_RELEASED': {
        label: 'Delvist frigivet',
        description: 'Del af depositum tilbageholdt',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⚖️',
        progress: 95
      },
      'DISPUTED': {
        label: 'Tvist',
        description: 'Uenighed om frigivelse',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '⚠️',
        progress: 80
      },
      'ESCALATED': {
        label: 'Eskaleret',
        description: 'Neutral vurdering igang',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '🏛️',
        progress: 90
      },
      'CLOSED': {
        label: 'Lukket',
        description: 'Endelig afregning gennemført',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: '✔️',
        progress: 100
      }
    }

    return statusMap[status as keyof typeof statusMap] || {
      label: status,
      description: 'Ukendt status',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '❓',
      progress: 0
    }
  }

  const handleApprove = async () => {
    if (!escrow) return

    setActionLoading(true)
    try {
      const response = await api.post(`/nest/escrows/${escrow.id}/approve`)
      
      // Refresh escrow data
      const updatedResponse = await api.get(`/nest/escrows/${params.id}`)
      setEscrow(updatedResponse.data)
      
      // Show success message
      alert('Vilkår godkendt! Venter på den anden parts godkendelse.')
    } catch (error: any) {
      console.error('Error approving escrow:', error)
      alert(error.response?.data?.error || 'Fejl ved godkendelse af vilkår')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFund = async () => {
    if (!escrow) return

    const paymentReference = prompt('Indtast betalingsreference (valgfrit):')

    setActionLoading(true)
    try {
      const response = await api.post(`/nest/escrows/${escrow.id}/fund`, {
        paymentReference
      })
      
      // Refresh escrow data
      const updatedResponse = await api.get(`/nest/escrows/${params.id}`)
      setEscrow(updatedResponse.data)
      
      // Show success message
      alert('Beløb indskudt! Nest escrow er nu aktiv.')
    } catch (error: any) {
      console.error('Error funding escrow:', error)
      alert(error.response?.data?.error || 'Fejl ved indbetaling')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestRelease = async () => {
    if (!escrow) return

    const reason = prompt('Årsag til frigivelsesanmodning (valgfrit):')

    setActionLoading(true)
    try {
      const response = await api.post(`/nest/escrows/${escrow.id}/request-release`, {
        reason
      })
      
      // Refresh escrow data
      const updatedResponse = await api.get(`/nest/escrows/${params.id}`)
      setEscrow(updatedResponse.data)
      
      // Show success message
      alert('Frigivelsesanmodning sendt! Kravfristen er nu startet.')
    } catch (error: any) {
      console.error('Error requesting release:', error)
      alert(error.response?.data?.error || 'Fejl ved frigivelsesanmodning')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateClaim = async () => {
    if (!escrow) return

    const description = prompt('Beskriv dit krav:')
    if (!description) return

    const amountStr = prompt('Beløb (DKK):')
    if (!amountStr) return

    const amount = parseInt(amountStr) * 100 // Convert to øre

    if (isNaN(amount) || amount <= 0) {
      alert('Indtast et gyldigt beløb')
      return
    }

    const type = confirm('Er dette en tvist (Ja) eller blot et fradrag (Nej)?') ? 'DISPUTE' : 'DEDUCTION'

    setActionLoading(true)
    try {
      const response = await api.post(`/nest/escrows/${escrow.id}/claims`, {
        type,
        amount,
        description
      })
      
      // Refresh data
      const [escrowResponse, claimsResponse] = await Promise.all([
        api.get(`/nest/escrows/${params.id}`),
        api.get(`/nest/escrows/${params.id}/claims`)
      ])
      setEscrow(escrowResponse.data)
      setClaims(claimsResponse.data.claims || [])
      
      // Show success message
      alert('Krav oprettet! Den anden part har nu mulighed for at svare.')
    } catch (error: any) {
      console.error('Error creating claim:', error)
      alert(error.response?.data?.error || 'Fejl ved oprettelse af krav')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Deponering ikke fundet</h1>
          <p className="text-slate-600 mb-6">{error || 'Deponeringen eksisterer ikke eller du har ikke adgang til den.'}</p>
          <Link href="/nest" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
            Tilbage til Nest oversigt
          </Link>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold text-slate-800">
              🏦 Nest Deponering
            </h1>
            <div className={`px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 ${getStatusInfo(escrow.status).color}`}>
              <span>{getStatusInfo(escrow.status).icon}</span>
              <span>{getStatusInfo(escrow.status).label}</span>
            </div>
          </div>
          
          {isNewlyCreated && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Deponering oprettet!</h3>
                  <p className="text-green-700">
                    Din Nest deponering er nu oprettet og lejer vil modtage en invitation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Progress */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">📈 Status forløb</h2>
              
              <div className="space-y-4">
                {/* Current Status Card */}
                <div className={`p-4 rounded-xl border-2 ${getStatusInfo(escrow.status).color.replace('bg-', 'border-').replace('text-', 'bg-').replace('border-', 'border-').split(' ')[0]} bg-opacity-10`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getStatusInfo(escrow.status).icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800">Nuværende status: {getStatusInfo(escrow.status).label}</h3>
                      <p className="text-slate-600 text-sm">{getStatusInfo(escrow.status).description}</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Fremgang</span>
                      <span>{getStatusInfo(escrow.status).progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${getStatusInfo(escrow.status).progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                {escrow.status === 'DRAFT' && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">📋 Næste skridt:</h4>
                    <p className="text-blue-700 text-sm">
                      Venter på at begge parter godkender vilkårene. Når dette er sket, kan lejer indbetale depositum.
                    </p>
                  </div>
                )}
                
                {escrow.status === 'AGREED' && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">💳 Næste skridt:</h4>
                    <p className="text-yellow-700 text-sm">
                      Lejer skal nu indbetale det aftalte beløb på {formatCurrency(escrow.totalAmount)} DKK.
                    </p>
                  </div>
                )}

                {escrow.status === 'FUNDED' && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🏠 Næste skridt:</h4>
                    <p className="text-green-700 text-sm">
                      Midlerne er sikret. Lejemålet kan nu starte officielt.
                    </p>
                  </div>
                )}

                {escrow.status === 'ACTIVE' && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">🏠 Status:</h4>
                    <p className="text-blue-700 text-sm">
                      Lejemålet kører. Depositum frigives automatisk ved normal fraflytning.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">💰 Beløb oversigt</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="text-slate-600">Depositum</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(escrow.depositAmount)} DKK</span>
                </div>
                {escrow.firstMonthAmount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-slate-600">Første måneds husleje</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(escrow.firstMonthAmount)} DKK</span>
                  </div>
                )}
                {escrow.prepaidAmount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-slate-600">Forudbetalt leje</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(escrow.prepaidAmount)} DKK</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 bg-slate-50 rounded-lg px-4">
                  <span className="font-semibold text-slate-800">Total</span>
                  <span className="text-xl font-bold text-slate-900">{formatCurrency(escrow.totalAmount)} DKK</span>
                </div>
              </div>
            </div>

            {/* Property Info */}
            {escrow.propertyAddress && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🏠 Bolig information</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-600">Adresse</span>
                    <p className="font-medium text-slate-800">
                      {escrow.propertyAddress}<br />
                      {escrow.propertyPostcode} {escrow.propertyCity}
                    </p>
                  </div>
                  {escrow.propertyType && (
                    <div>
                      <span className="text-sm text-slate-600">Boligtype</span>
                      <p className="font-medium text-slate-800">{escrow.propertyType}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {escrow.startDate && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📅 Tidslinje</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-600">Startdato</span>
                    <p className="font-medium text-slate-800">{formatDate(escrow.startDate)}</p>
                  </div>
                  {escrow.endDate && (
                    <div>
                      <span className="text-sm text-slate-600">Slutdato</span>
                      <p className="font-medium text-slate-800">{formatDate(escrow.endDate)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-slate-600">Oprettet</span>
                    <p className="font-medium text-slate-800">{formatDate(escrow.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Deadlines */}
            {deadlines.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">⏰ Aktive frister</h2>
                <div className="space-y-3">
                  {deadlines.filter(d => d.status === 'ACTIVE').map(deadline => {
                    const isExpired = new Date(deadline.deadline) < new Date()
                    const daysLeft = Math.ceil((new Date(deadline.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div key={deadline.id} className={`p-3 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : daysLeft <= 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isExpired ? 'text-red-800' : daysLeft <= 3 ? 'text-yellow-800' : 'text-blue-800'}`}>
                              {deadline.description}
                            </p>
                            <p className={`text-xs ${isExpired ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-blue-600'}`}>
                              {formatDate(deadline.deadline)}
                            </p>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${isExpired ? 'bg-red-100 text-red-700' : daysLeft <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isExpired ? 'Udløbet' : daysLeft > 0 ? `${daysLeft} dage tilbage` : 'Udløber i dag'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Claims Section */}
            {claims.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">⚖️ Krav og svar</h2>
                <div className="space-y-4">
                  {claims.map(claim => {
                    const getClaimStatusColor = (status: string) => {
                      switch (status) {
                        case 'PENDING': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        case 'ACCEPTED': return 'bg-green-50 border-green-200 text-green-800'
                        case 'REJECTED': return 'bg-red-50 border-red-200 text-red-800'
                        case 'COUNTER_OFFERED': return 'bg-blue-50 border-blue-200 text-blue-800'
                        default: return 'bg-gray-50 border-gray-200 text-gray-800'
                      }
                    }

                    const getClaimTypeIcon = (type: string) => {
                      switch (type) {
                        case 'DEDUCTION': return '💸'
                        case 'REFUND': return '💰'
                        case 'DISPUTE': return '⚠️'
                        default: return '📋'
                      }
                    }

                    return (
                      <div key={claim.id} className={`p-4 rounded-lg border ${getClaimStatusColor(claim.status)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{getClaimTypeIcon(claim.type)}</span>
                            <span className="font-medium">
                              {claim.claimant.firstName} {claim.claimant.lastName}
                            </span>
                            <span className="text-sm">• {formatCurrency(claim.amount)} DKK</span>
                          </div>
                          <div className="text-xs px-2 py-1 rounded bg-white bg-opacity-60">
                            {claim.status}
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3">{claim.description}</p>
                        
                        <div className="text-xs text-gray-600">
                          Oprettet: {formatDate(claim.createdAt)}
                          {claim.responseDeadline && (
                            <>
                              {' • '}
                              Svarfrist: {formatDate(claim.responseDeadline)}
                            </>
                          )}
                        </div>

                        {/* Responses */}
                        {claim.responses && claim.responses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-2">Svar:</p>
                            {claim.responses.map((response: any) => (
                              <div key={response.id} className="text-sm bg-white bg-opacity-60 rounded p-2 mb-2">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium">
                                    {response.responder.firstName} {response.responder.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(response.createdAt)}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    response.action === 'ACCEPT' ? 'bg-green-100 text-green-700' :
                                    response.action === 'REJECT' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {response.action}
                                  </span>
                                  {response.amount && (
                                    <span className="ml-2 text-sm">
                                      {formatCurrency(response.amount)} DKK
                                    </span>
                                  )}
                                </div>
                                {response.comment && (
                                  <p className="text-sm mt-1 text-gray-600">{response.comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">👥 Parter</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-800">Udlejer</span>
                  </div>
                  <p className="font-semibold text-blue-900">
                    {escrow.landlord.firstName} {escrow.landlord.lastName}
                  </p>
                  <p className="text-sm text-blue-700">{escrow.landlord.email}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-green-800">Lejer</span>
                  </div>
                  <p className="font-semibold text-green-900">
                    {escrow.tenant.firstName} {escrow.tenant.lastName}
                  </p>
                  <p className="text-sm text-green-700">{escrow.tenant.email}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">⚡ Handlinger</h2>
              <div className="space-y-3">
                {/* State-specific actions */}
                {escrow.status === 'DRAFT' && (
                  <button 
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-green-50 hover:bg-green-100 disabled:bg-gray-50 disabled:text-gray-400 border border-green-200 disabled:border-gray-200 text-green-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                  >
                    {actionLoading ? '⏳ Godkender...' : '✅ Godkend vilkår'}
                  </button>
                )}
                
                {escrow.status === 'AGREED' && user?.id === escrow.tenant.id && (
                  <button 
                    onClick={handleFund}
                    disabled={actionLoading}
                    className="w-full bg-blue-50 hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-400 border border-blue-200 disabled:border-gray-200 text-blue-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                  >
                    {actionLoading ? '⏳ Indskylder...' : '💰 Indbetal beløb'}
                  </button>
                )}

                {escrow.status === 'ACTIVE' && (
                  <button 
                    onClick={handleRequestRelease}
                    disabled={actionLoading}
                    className="w-full bg-orange-50 hover:bg-orange-100 disabled:bg-gray-50 disabled:text-gray-400 border border-orange-200 disabled:border-gray-200 text-orange-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                  >
                    {actionLoading ? '⏳ Anmoder...' : '📤 Anmod om frigivelse'}
                  </button>
                )}

                {escrow.status === 'RELEASE_PENDING' && (
                  <button 
                    onClick={handleCreateClaim}
                    disabled={actionLoading}
                    className="w-full bg-red-50 hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-400 border border-red-200 disabled:border-gray-200 text-red-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                  >
                    {actionLoading ? '⏳ Opretter...' : '⚖️ Opret krav'}
                  </button>
                )}

                {/* General actions */}
                <button className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl font-medium transition-all text-sm">
                  📧 Send påmindelse
                </button>
                <button className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl font-medium transition-all text-sm">
                  📄 Generer rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}