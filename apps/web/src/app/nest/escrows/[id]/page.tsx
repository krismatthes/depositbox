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
  const [inviteLink, setInviteLink] = useState('')
  const [showLinkGenerated, setShowLinkGenerated] = useState(false)
  
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
        label: 'Oprettet',
        description: 'Venter på at lejer accepterer invitationen',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '📝',
        progress: 10
      },
      'AGREED': {
        label: 'Invitation sendt',
        description: 'Afventer accept og indbetaling fra lejer',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '📧',
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
      alert('Beløb indskudt! Depositums Box er nu aktiv.')
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

  const handleGenerateLink = async () => {
    if (!escrow) return
    setActionLoading(true)
    try {
      // Create invitation via API
      const invitationData = {
        invitationType: 'TENANT',
        tenantEmail: escrow.tenant?.email || '',
        tenantName: escrow.tenant ? `${escrow.tenant.firstName} ${escrow.tenant.lastName}` : '',
        propertyAddress: escrow.propertyAddress || (escrow as any).address,
        message: `Du er inviteret til at deltage i Depositums Box deponering for ${escrow.propertyAddress || (escrow as any).address}`,
        nestEscrowId: escrow.id,
        depositAmount: escrow.depositAmount || 0,
        rentAmount: escrow.firstMonthAmount || 0,
        prepaidAmount: escrow.prepaidAmount || 0,
        utilitiesAmount: (escrow as any).utilitiesAmount || 0,
        invitationData: {
          propertyType: escrow.propertyType || 'APARTMENT',
          propertyPostcode: escrow.propertyPostcode,
          propertyCity: escrow.propertyCity,
          startDate: escrow.startDate,
          endDate: escrow.endDate,
          isTimeLimited: !!escrow.endDate
        }
      }

      const response = await api.post('/tenant/invitations/create', invitationData)
      
      setInviteLink(response.data.invitationLink)
      setShowLinkGenerated(true)
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Fejl ved generering af link. Prøv igen.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResendInvite = async () => {
    if (!escrow) return
    setActionLoading(true)
    try {
      await api.post(`/nest/escrows/${escrow.id}/resend-invite`)
      alert('Invitation er sendt igen til lejer!')
    } catch (error) {
      console.error('Error resending invite:', error)
      alert('Fejl ved afsendelse af invitation.')
    } finally {
      setActionLoading(false)
    }
  }

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    alert('Link kopieret til clipboard!')
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
          <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
            Tilbage til Dashboard
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
              href="/dashboard"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">
              📦 Depositums Box
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
                    Din Depositums Box er nu oprettet og lejer vil modtage en invitation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated Link Display */}
            {showLinkGenerated && inviteLink && (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Invitation Link Genereret</h2>
                    <p className="text-sm text-slate-600">Send dette link til lejeren</p>
                  </div>
                  <button
                    onClick={() => setShowLinkGenerated(false)}
                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-700"
                    />
                    <button
                      onClick={copyLinkToClipboard}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Kopier
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Send til: {escrow.tenant.email}
                  </p>
                </div>
              </div>
            )}

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
                    <h4 className="font-medium text-blue-800 mb-2">📧 Næste skridt:</h4>
                    <p className="text-blue-700 text-sm">
                      Invitationen er blevet sendt til lejeren. De skal acceptere vilkårene og indbetale {formatCurrency(escrow.totalAmount)} DKK.
                    </p>
                  </div>
                )}
                
                {escrow.status === 'AGREED' && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">💳 Næste skridt:</h4>
                    <p className="text-yellow-700 text-sm">
                      Lejeren har modtaget invitationen og skal nu indbetale det aftalte beløb på {formatCurrency(escrow.totalAmount)} DKK.
                    </p>
                  </div>
                )}

                {escrow.status === 'FUNDED' && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">💰 Midler modtaget og sikret!</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Beløbet på {formatCurrency(escrow.totalAmount)} DKK er blevet overført og sikret i deponeringen.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-green-800">Overført til sikker deponering</span>
                      </div>
                      <p className="text-xs text-green-700">
                        Pengene er nu beskyttet og klar til at blive frigivet i henhold til aftalte vilkår.
                      </p>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{formatCurrency(escrow.depositAmount)} DKK</span>
                    {escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Modtaget</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⏳ Afventer</span>
                    )}
                  </div>
                </div>
                {escrow.firstMonthAmount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-slate-600">Første måneds husleje</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{formatCurrency(escrow.firstMonthAmount)} DKK</span>
                      {escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Modtaget</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⏳ Afventer</span>
                      )}
                    </div>
                  </div>
                )}
                {escrow.prepaidAmount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-slate-600">Forudbetalt leje</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{formatCurrency(escrow.prepaidAmount)} DKK</span>
                      {escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Modtaget</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⏳ Afventer</span>
                      )}
                    </div>
                  </div>
                )}
                {((escrow as any).utilitiesAmount || 0) > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-slate-600">A conto betalinger</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{formatCurrency((escrow as any).utilitiesAmount || 0)} DKK</span>
                      {escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Modtaget</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⏳ Afventer</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={`flex justify-between items-center py-3 rounded-lg px-4 ${
                  escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50'
                }`}>
                  <span className={`font-semibold ${
                    escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED'
                      ? 'text-green-800' 
                      : 'text-blue-800'
                  }`}>
                    Total deponeret beløb
                    {escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED' ? (
                      <span className="ml-2 text-xs">✓ Sikret i deponering</span>
                    ) : (
                      <span className="ml-2 text-xs">⏳ Afventer indbetaling</span>
                    )}
                  </span>
                  <span className={`text-xl font-bold ${
                    escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED'
                      ? 'text-green-900' 
                      : 'text-blue-900'
                  }`}>
                    {formatCurrency(escrow.totalAmount)} DKK
                  </span>
                </div>

                {/* Payment status information */}
                {(escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED') && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-green-800">Midler overført og sikret</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Alle beløb er blevet modtaget og sikret i den fælles deponering. Pengene kan nu kun frigives i henhold til de aftalte vilkår.
                    </p>
                  </div>
                )}

                {escrow.status === 'RELEASED' && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-blue-800">Midler udbetalt</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Deponeringen er afsluttet og midlerne er blevet udbetalt til de respektive parter i henhold til de aftalte vilkår.
                    </p>
                  </div>
                )}
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

            {/* Release Conditions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">📋 Frigivelsesvilkår</h2>
              
              {/* Info box explaining release conditions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Om frigivelsesvilkår</h3>
                    <p className="text-sm text-blue-800 leading-relaxed mb-2">
                      Frigivelsesvilkårene styrer <strong>hvornår</strong> og <strong>hvordan</strong> dine penge frigives fra deponeringen. De beskriver automatiske regler for, hvornår bestemte beløb udbetales til hvilke parter.
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>• <strong>Beløb:</strong> Hvor meget der frigives (fast beløb eller procent)</div>
                      <div>• <strong>Hvornår:</strong> Datoen eller begivenheden der udløser frigivelsen</div>
                      <div>• <strong>Til hvem:</strong> Om beløbet går til udlejer eller lejer</div>
                      <div>• <strong>Beskyttelse:</strong> Varsling og indsigelsesperioder for sikkerhed</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Standard deposit release rule */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">🏠</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Standard depositum frigivelse</h3>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Automatisk regel</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium mb-1">💰 BELØB</div>
                      <div className="font-semibold text-slate-900">{formatCurrency(escrow.depositAmount)} DKK</div>
                      <div className="text-xs text-slate-600">Fuldt depositum</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium mb-1">⏰ HVORNÅR</div>
                      <div className="font-semibold text-slate-900">Ved fraflytning</div>
                      <div className="text-xs text-slate-600">
                        {escrow.endDate ? `${formatDate(escrow.endDate)} + 14 dage` : 'Når lejemål opsiges + 14 dage'}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium mb-1">👤 TIL HVEM</div>
                      <div className="font-semibold text-slate-900">Lejer</div>
                      <div className="text-xs text-slate-600">Hvis ingen krav</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="text-xs text-slate-700 space-y-1">
                      <div><strong>🔔 Beskyttelse:</strong> 14 dages kravfrist for udlejer efter fraflytning</div>
                      <div><strong>⚖️ Indsigelse:</strong> Lejer har 5 dage til at svare på eventuelle krav</div>
                      <div><strong>🚀 Automatisk:</strong> Frigives automatisk hvis ingen krav rejses i tide</div>
                    </div>
                  </div>
                </div>

                {/* Rent release rule */}
                {escrow.firstMonthAmount > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">🏘️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Husleje frigivelse</h3>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Automatisk regel</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">💰 BELØB</div>
                        <div className="font-semibold text-slate-900">{formatCurrency(escrow.firstMonthAmount)} DKK</div>
                        <div className="text-xs text-slate-600">Første måneds husleje</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">⏰ HVORNÅR</div>
                        <div className="font-semibold text-slate-900">Ved indflytning</div>
                        <div className="text-xs text-slate-600">
                          {escrow.startDate ? formatDate(escrow.startDate) : 'På aftalt indflytningsdato'}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">👤 TIL HVEM</div>
                        <div className="font-semibold text-slate-900">Udlejer</div>
                        <div className="text-xs text-slate-600">Straks ved indflytning</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-100 rounded-lg p-3">
                      <div className="text-xs text-slate-700 space-y-1">
                        <div><strong>🚀 Automatisk:</strong> Frigives automatisk når lejer flytter ind og bekræfter</div>
                        <div><strong>🔒 Sikkerhed:</strong> Kun frigivet når begge parter bekræfter indflytning</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prepaid rent release rule */}
                {escrow.prepaidAmount > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">📅</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Forudbetalt leje frigivelse</h3>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Automatisk regel</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">💰 BELØB</div>
                        <div className="font-semibold text-slate-900">{formatCurrency(escrow.prepaidAmount)} DKK</div>
                        <div className="text-xs text-slate-600">Forudbetalt husleje</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">⏰ HVORNÅR</div>
                        <div className="font-semibold text-slate-900">Månedlig frigivelse</div>
                        <div className="text-xs text-slate-600">Fra måneden efter indflytning</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">👤 TIL HVEM</div>
                        <div className="font-semibold text-slate-900">Udlejer</div>
                        <div className="text-xs text-slate-600">Månedsvis udbetaling</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-100 rounded-lg p-3">
                      <div className="text-xs text-slate-700 space-y-1">
                        <div><strong>📆 Tidsplan:</strong> Frigives den 1. i hver måned automatisk</div>
                        <div><strong>🔒 Betingelse:</strong> Kun hvis lejeforhold er aktivt og ingen problemer</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom release rules if any exist */}
                {((escrow as any).releaseRules && (escrow as any).releaseRules.length > 0) && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-slate-700 mb-3">🔧 Særlige frigivelsesregler</h3>
                    </div>
                    {((escrow as any).releaseRules || []).map((rule: any, index: number) => (
                      <div key={rule.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">⚙️</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {rule.triggerType === 'LEASE_END' && 'Ved lejeaftalens ophør'}
                              {rule.triggerType === 'START_DATE' && 'På indflytningsdato'}
                              {rule.triggerType === 'SPECIFIC_DATE' && 'På bestemt dato'}
                              {rule.triggerType === 'MOVE_IN_PLUS_5' && '5 dage efter indflytning'}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rule.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {rule.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 font-medium mb-1">💰 BELØB</div>
                            <div className="font-semibold text-slate-900">
                              {rule.amount ? `${formatCurrency(rule.amount)} DKK` : 
                                rule.percentage ? `${rule.percentage}% af total` : 'Fuldt beløb'}
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 font-medium mb-1">⏰ HVORNÅR</div>
                            <div className="font-semibold text-slate-900">
                              {rule.triggerDate ? formatDate(rule.triggerDate) : 'Ved udløser hændelse'}
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 font-medium mb-1">🔔 VARSLING</div>
                            <div className="font-semibold text-slate-900">
                              {rule.requiresNotification ? `${rule.notificationDaysBefore} dage før` : 'Ingen varsling'}
                            </div>
                          </div>
                        </div>
                        
                        {rule.allowObjection && (
                          <div className="bg-slate-100 rounded-lg p-3">
                            <div className="text-xs text-slate-700">
                              <strong>⚖️ Indsigelsesret:</strong> {rule.objectionPeriodDays} dages periode for at gøre indsigelse mod frigivelsen
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            {escrow.startDate && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📅 Tidslinje</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Om tidslinjen</h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Tidslinjen viser de vigtigste datoer for din Depositums Box deponering. <strong>Startdatoen</strong> er når lejeforholdet begynder og huslejen frigives til udlejer. <strong>Slutdatoen</strong> er når lejeforholdet ophører og depositum normalt frigives til lejer. Disse datoer styrer automatisk hvornår penge frigives fra deponeringen.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">🏠 Indflytningsdato</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktiv frigivelsesdato</span>
                    </div>
                    <p className="font-semibold text-slate-900">{formatDate(escrow.startDate)}</p>
                    <p className="text-xs text-slate-600 mt-1">På denne dato frigives første måneds husleje automatisk til udlejer</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">🏃‍♂️ Fraflytningsdato</span>
                      {escrow.endDate ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Planlagt slutdato</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Ikke fastsat</span>
                      )}
                    </div>
                    {escrow.endDate ? (
                      <>
                        <p className="font-semibold text-slate-900">{formatDate(escrow.endDate)}</p>
                        <p className="text-xs text-slate-600 mt-1">På denne dato påbegyndes processen for depositum frigivelse</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-amber-700">Ingen slutdato fastsat</p>
                        <p className="text-xs text-slate-600 mt-1">Lejeforholdet er på ubestemt tid. Depositum frigives når lejemålet opsiges af en af parterne</p>
                      </>
                    )}
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">📝 Oprettelsesdato</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Historisk</span>
                    </div>
                    <p className="font-semibold text-slate-900">{formatDate(escrow.createdAt)}</p>
                    <p className="text-xs text-slate-600 mt-1">Datoen hvor Depositums Box deponeringen blev oprettet i systemet</p>
                  </div>
                  
                  {(escrow as any).moveInDate && (
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-700">🗓️ Bekræftet indflytning</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Bekræftet</span>
                      </div>
                      <p className="font-semibold text-orange-900">{formatDate((escrow as any).moveInDate)}</p>
                      <p className="text-xs text-orange-700 mt-1">Datoen hvor lejeren faktisk flyttede ind</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment & Transfer History */}
            {(escrow.status === 'FUNDED' || escrow.status === 'ACTIVE' || escrow.status === 'RELEASE_PENDING' || escrow.status === 'RELEASED') && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">💳 Betalings & overførselshistorik</h2>
                
                <div className="space-y-4">
                  {/* Incoming payment */}
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-900">Indbetaling modtaget</span>
                        <span className="text-sm text-green-700">{formatDate((escrow as any).fundedAt || escrow.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Fra: {escrow.tenant.firstName} {escrow.tenant.lastName}</span>
                        <span className="font-semibold text-green-900">+{formatCurrency(escrow.totalAmount)} DKK</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Midler sikret i Depositums Box deponering</p>
                    </div>
                  </div>

                  {/* Rent release if applicable */}
                  {escrow.firstMonthAmount > 0 && escrow.status === 'ACTIVE' && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Husleje frigivet</span>
                          <span className="text-sm text-blue-700">{formatDate(escrow.activatedAt || escrow.startDate || escrow.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">Til: {escrow.landlord.firstName} {escrow.landlord.lastName}</span>
                          <span className="font-semibold text-blue-900">-{formatCurrency(escrow.firstMonthAmount)} DKK</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Første måneds husleje ved indflytning</p>
                      </div>
                    </div>
                  )}

                  {/* Final release if released */}
                  {escrow.status === 'RELEASED' && (
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Depositum frigivet</span>
                          <span className="text-sm text-purple-700">{formatDate(escrow.releasedAt || escrow.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700">Til: {escrow.tenant.firstName} {escrow.tenant.lastName}</span>
                          <span className="font-semibold text-purple-900">-{formatCurrency(escrow.depositAmount)} DKK</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">Depositum frigivet ved fraflytning</p>
                      </div>
                    </div>
                  )}

                  {/* Current balance */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">Aktuel saldo i deponering</span>
                        <span className="text-sm text-slate-700">Nu</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">
                          {escrow.status === 'RELEASED' ? 'Deponering lukket' : 'Tilgængelig for frigivelse'}
                        </span>
                        <span className={`font-bold text-lg ${escrow.status === 'RELEASED' ? 'text-slate-500' : 'text-slate-900'}`}>
                          {escrow.status === 'RELEASED' ? '0 DKK' : 
                           escrow.status === 'ACTIVE' && escrow.firstMonthAmount > 0 
                             ? `${formatCurrency(escrow.totalAmount - escrow.firstMonthAmount)} DKK`
                             : `${formatCurrency(escrow.totalAmount)} DKK`}
                        </span>
                      </div>
                    </div>
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

                {(escrow.status === 'FUNDED' || escrow.status === 'ACTIVE') && (
                  <>
                    <button 
                      onClick={handleRequestRelease}
                      disabled={actionLoading}
                      className="w-full bg-orange-50 hover:bg-orange-100 disabled:bg-gray-50 disabled:text-gray-400 border border-orange-200 disabled:border-gray-200 text-orange-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                    >
                      {actionLoading ? '⏳ Anmoder...' : '📤 Anmod om frigivelse'}
                    </button>
                    
                    {user?.id === escrow.landlord.id && (
                      <button 
                        onClick={async () => {
                          if (confirm('Er du sikker på at du vil frigive depositum til lejer? Denne handling kan ikke fortrydes.')) {
                            setActionLoading(true)
                            try {
                              await api.post(`/nest/escrows/${escrow.id}/manual-release`, {
                                reason: 'Manuel frigivelse af udlejer'
                              })
                              const updatedResponse = await api.get(`/nest/escrows/${params.id}`)
                              setEscrow(updatedResponse.data)
                              alert('Depositum frigivet til lejer!')
                            } catch (error: any) {
                              console.error('Error releasing funds:', error)
                              alert(error.response?.data?.error || 'Fejl ved frigivelse af midler')
                            } finally {
                              setActionLoading(false)
                            }
                          }
                        }}
                        disabled={actionLoading}
                        className="w-full bg-green-50 hover:bg-green-100 disabled:bg-gray-50 disabled:text-gray-400 border border-green-200 disabled:border-gray-200 text-green-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                      >
                        {actionLoading ? '⏳ Frigiver...' : '✅ Frigiv depositum manuelt'}
                      </button>
                    )}
                  </>
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

                {/* Invitation actions - Only show for landlord and early statuses */}
                {user?.id === escrow.landlord.id && (escrow.status === 'DRAFT' || escrow.status === 'AGREED') && (
                  <>
                    <button 
                      onClick={handleGenerateLink}
                      disabled={actionLoading}
                      className="w-full bg-purple-50 hover:bg-purple-100 disabled:bg-gray-50 disabled:text-gray-400 border border-purple-200 disabled:border-gray-200 text-purple-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                    >
                      {actionLoading ? '⏳ Genererer...' : '🔗 Generer link'}
                    </button>
                    
                    {/* Only show resend if invitation has been sent before */}
                    {inviteLink && (
                      <button 
                        onClick={handleResendInvite}
                        disabled={actionLoading}
                        className="w-full bg-yellow-50 hover:bg-yellow-100 disabled:bg-gray-50 disabled:text-gray-400 border border-yellow-200 disabled:border-gray-200 text-yellow-800 px-4 py-3 rounded-xl font-medium transition-all text-sm"
                      >
                        {actionLoading ? '⏳ Sender...' : '📧 Send igen'}
                      </button>
                    )}
                  </>
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