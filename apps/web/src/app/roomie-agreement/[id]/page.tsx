'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

interface RoomieData {
  id: string
  propertyAddress: string
  propertyType: string
  totalRent: number
  totalUtilities: number
  
  mainTenantName: string
  mainTenantEmail: string
  mainTenantPhone: string
  
  roommates: Array<{
    name: string
    email: string
    phone: string
    rentShare: number
    utilitiesShare: number
    room: string
  }>
  
  agreementType: 'all_on_lease' | 'main_tenant_only'
  agreementStartDate: string
  agreementEndDate: string
  depositAmount: number
  depositSplit: 'equal' | 'by_rent_share' | 'main_tenant_only'
  
  quietHours: { start: string, end: string }
  smokingPolicy: 'no_smoking' | 'designated_areas' | 'allowed'
  petsPolicy: 'no_pets' | 'with_permission' | 'allowed'
  guestPolicy: string
  cleaningSchedule: string
  shoppingArrangement: string
  
  kitchenRules: string
  bathroomRules: string
  livingRoomRules: string
  storageRules: string
  
  rentDueDate: number
  utilitiesSplitMethod: 'equal' | 'by_usage' | 'by_room_size'
  sharedExpenses: string
  
  noticeRequired: number
  findReplacementRule: boolean
  subletAllowed: boolean
  
  additionalRules: string
  createdAt: string
}

export default function RoomieAgreementViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [agreement, setAgreement] = useState<RoomieData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgreement()
  }, [id])

  const loadAgreement = () => {
    if (typeof window !== 'undefined' && id) {
      try {
        const savedAgreements = localStorage.getItem('roomie_agreements')
        if (savedAgreements) {
          const agreements = JSON.parse(savedAgreements)
          const foundAgreement = agreements.find((a: any) => a.id === id)
          if (foundAgreement) {
            setAgreement(foundAgreement)
          }
        }
      } catch (error) {
        console.error('Error loading roomie agreement:', error)
      }
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ikke angivet'
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const getPolicyText = (policy: string, type: 'smoking' | 'pets') => {
    if (type === 'smoking') {
      switch (policy) {
        case 'no_smoking': return 'Rygning forbudt overalt'
        case 'designated_areas': return 'Kun i udpegede områder'
        case 'allowed': return 'Rygning tilladt'
        default: return policy
      }
    } else {
      switch (policy) {
        case 'no_pets': return 'Ingen kæledyr tilladt'
        case 'with_permission': return 'Kun med alle beboeres samtykke'
        case 'allowed': return 'Kæledyr tilladt'
        default: return policy
      }
    }
  }

  const getSplitMethodText = (method: string) => {
    switch (method) {
      case 'equal': return 'Ligeligt mellem alle'
      case 'by_usage': return 'Efter forbrug (afregnes bagud)'
      case 'by_room_size': return 'Efter værelsesstørrelse'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Roomie-aftale ikke fundet</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Tilbage til Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage til Dashboard
            </button>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Roomie-/Samboaftale</h1>
                  <p className="text-slate-600 mt-1">{agreement.propertyAddress}</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    const agreementData = encodeURIComponent(JSON.stringify(agreement))
                    window.open(`/roomie-agreement/${agreement.id}/pdf?data=${agreementData}`, '_blank')
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <div className="text-sm text-slate-500 flex items-center">
                  Oprettet: {formatDate(agreement.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Content */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Grundoplysninger</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Ejendom</h3>
                    <p className="text-slate-600">{agreement.propertyAddress}</p>
                    <p className="text-slate-500 text-sm">
                      Type: {agreement.propertyType === 'apartment' ? 'Lejlighed' : 
                             agreement.propertyType === 'house' ? 'Hus' : 
                             agreement.propertyType === 'room' ? 'Værelse' : 'Andet'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Aftale Type</h3>
                    <p className="text-slate-600">
                      {agreement.agreementType === 'all_on_lease' ? 
                        'Alle beboere står på A10 kontrakten' : 
                        'Kun hovedlejer står på kontrakten'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Periode</h3>
                    <p className="text-slate-600">
                      Fra: {formatDate(agreement.agreementStartDate)}
                    </p>
                    {agreement.agreementEndDate && (
                      <p className="text-slate-600">
                        Til: {formatDate(agreement.agreementEndDate)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Økonomi</h3>
                    <p className="text-slate-600">
                      Husleje: {formatCurrency(agreement.totalRent)}/måned
                    </p>
                    {agreement.totalUtilities > 0 && (
                      <p className="text-slate-600">
                        Forbrug: {formatCurrency(agreement.totalUtilities)}/måned
                      </p>
                    )}
                    {agreement.depositAmount > 0 && (
                      <p className="text-slate-600">
                        Depositum: {formatCurrency(agreement.depositAmount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tenants */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Beboere</h2>
              </div>
              <div className="p-6">
                {/* Main Tenant */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Hovedlejer</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="font-medium text-slate-800">{agreement.mainTenantName}</p>
                    <p className="text-slate-600">{agreement.mainTenantEmail}</p>
                    {agreement.mainTenantPhone && (
                      <p className="text-slate-600">{agreement.mainTenantPhone}</p>
                    )}
                  </div>
                </div>
                
                {/* Roommates */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Roomies/Sambeboere</h3>
                  <div className="space-y-4">
                    {agreement.roommates.map((roommate, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">{roommate.name}</p>
                            {roommate.email && <p className="text-slate-600">{roommate.email}</p>}
                            {roommate.phone && <p className="text-slate-600">{roommate.phone}</p>}
                            {roommate.room && <p className="text-slate-500 text-sm">Værelse: {roommate.room}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-slate-600">Husleje: {roommate.rentShare}%</p>
                            <p className="text-slate-600">Forbrug: {roommate.utilitiesShare}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Husorden & Regler</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Ro-tider</h3>
                    <p className="text-slate-600">
                      {agreement.quietHours.start} - {agreement.quietHours.end}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Rygning</h3>
                    <p className="text-slate-600">
                      {getPolicyText(agreement.smokingPolicy, 'smoking')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Kæledyr</h3>
                    <p className="text-slate-600">
                      {getPolicyText(agreement.petsPolicy, 'pets')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Husleje forfald</h3>
                    <p className="text-slate-600">
                      Den {agreement.rentDueDate}. i måneden
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Gæsteregler</h3>
                  <p className="text-slate-600">{agreement.guestPolicy}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Rengøring</h3>
                  <p className="text-slate-600">{agreement.cleaningSchedule}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Indkøb</h3>
                  <p className="text-slate-600">{agreement.shoppingArrangement}</p>
                </div>
              </div>
            </div>

            {/* Shared Spaces */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Fællesarealer</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Køkken</h3>
                  <p className="text-slate-600">{agreement.kitchenRules}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Badeværelse</h3>
                  <p className="text-slate-600">{agreement.bathroomRules}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Stue/fællesrum</h3>
                  <p className="text-slate-600">{agreement.livingRoomRules}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Opbevaring</h3>
                  <p className="text-slate-600">{agreement.storageRules}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Forbrug fordeles</h3>
                  <p className="text-slate-600">{getSplitMethodText(agreement.utilitiesSplitMethod)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Fælles udgifter</h3>
                  <p className="text-slate-600">{agreement.sharedExpenses}</p>
                </div>
              </div>
            </div>

            {/* Moving Out */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Fraflytning & Særlige Bestemmelser</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Opsigelsesvarsel</h3>
                  <p className="text-slate-600">{agreement.noticeRequired} dage</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Pligter ved fraflytning</h3>
                  <ul className="text-slate-600 space-y-1">
                    <li>• {agreement.findReplacementRule ? 'Skal hjælpe med at finde erstatning' : 'Ingen pligt til at finde erstatning'}</li>
                    <li>• {agreement.subletAllowed ? 'Fremleje er tilladt (med udlejers samtykke)' : 'Fremleje ikke tilladt'}</li>
                  </ul>
                </div>
                
                {agreement.additionalRules && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Yderligere bestemmelser</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{agreement.additionalRules}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-amber-800 mb-2">Juridisk bemærkning</div>
                  <div className="text-amber-700 text-sm">
                    Denne roomie-/samboaftale er et supplement til den officielle A10 lejekontrakt og erstatter ikke den juridiske lejekontrakt med udlejer. 
                    Alle beboere bør gennemgå aftalen grundigt og sikre sig, at de forstår og accepterer alle vilkår før underskrift.
                    Ved tvivl bør der søges juridisk rådgivning.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}