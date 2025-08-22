'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

interface ChecklistItem {
  id: string
  label: string
  category: 'OVERFLADE' | 'INSTALLATION' | 'INVENTAR'
  status?: 'GOD' | 'MINDRE_SKADE' | 'STOR_SKADE' | 'MANGLER'
  note?: string
  photos?: string[]
  agreedByBoth?: boolean
}

interface Room {
  id: string
  name: string
  scope: 'PRIVATE' | 'SHARED'
  items: ChecklistItem[]
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ikke angivet'
  return new Date(dateString).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function HandoverReportSignPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [landlordSigned, setLandlordSigned] = useState(false)
  const [tenantSigned, setTenantSigned] = useState(false)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && params.id) {
      loadReport(params.id as string)
    }
  }, [user, loading, router, params.id])

  const loadReport = (reportId: string) => {
    // Try to load report from localStorage first
    if (typeof window !== 'undefined') {
      const savedReports = localStorage.getItem('handoverReports')
      if (savedReports) {
        try {
          const parsedReports = JSON.parse(savedReports)
          const foundReport = parsedReports.find((r: any) => r.id === reportId)
          if (foundReport) {
            setReport(foundReport)
            // Set signature states from saved data
            setLandlordSigned(foundReport.landlordSigned || false)
            setTenantSigned(foundReport.tenantSigned || false)
            // Create room templates with completed assessments
            const roomTemplates = createCompletedRoomTemplates()
            setRooms(roomTemplates)
            return
          }
        } catch (error) {
          console.error('Error parsing handover reports:', error)
        }
      }
    }

    // Fallback to dummy data if not found in localStorage
    const dummyReport = {
      id: reportId,
      tenancyId: 'A10-123',
      propertyAddress: 'Østerbrogade 12, 2100 København Ø',
      propertyType: 'APARTMENT',
      reportType: 'MOVE_IN',
      status: 'READY_FOR_SIGNATURE',
      createdAt: new Date().toISOString(),
      landlord: {
        firstName: 'Peter',
        lastName: 'Larsen',
        email: 'peter.larsen@email.com'
      },
      tenant: {
        firstName: 'Lejer',
        lastName: 'Jørgensen',
        email: 'lejer.jorgensen@email.com'
      }
    }

    setReport(dummyReport)
    const roomTemplates = createCompletedRoomTemplates()
    setRooms(roomTemplates)
  }

  const createCompletedRoomTemplates = (): Room[] => {
    // Create room templates with completed assessments
    return [
      {
        id: 'room-1',
        name: 'Entré/Gang',
        scope: 'PRIVATE',
        items: [
          { id: 'item-1-1', label: 'Loft', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-1-2', label: 'Vægge', category: 'OVERFLADE', status: 'MINDRE_SKADE', note: 'Lille plet på væggen ved dør', agreedByBoth: true },
          { id: 'item-1-3', label: 'Gulv', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-1-4', label: 'Lister/Døre', category: 'OVERFLADE', status: 'MINDRE_SKADE', note: 'Lille ridse på dør', agreedByBoth: true },
        ]
      },
      {
        id: 'room-2',
        name: 'Stue',
        scope: 'PRIVATE',
        items: [
          { id: 'item-2-1', label: 'Loft', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-2-2', label: 'Vægge', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-2-3', label: 'Gulv', category: 'OVERFLADE', status: 'STOR_SKADE', note: 'Tydelige ridser og pletter', agreedByBoth: true },
          { id: 'item-2-4', label: 'Lister/Døre', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
        ]
      },
      {
        id: 'room-3',
        name: 'Køkken',
        scope: 'PRIVATE',
        items: [
          { id: 'item-3-1', label: 'Loft', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-3-2', label: 'Vægge', category: 'OVERFLADE', status: 'MINDRE_SKADE', note: 'Fedtpletter bag komfur', agreedByBoth: true },
          { id: 'item-3-3', label: 'Gulv', category: 'OVERFLADE', status: 'GOD', agreedByBoth: true },
          { id: 'item-3-4', label: 'Hvidevarer', category: 'INSTALLATION', status: 'GOD', agreedByBoth: true },
          { id: 'item-3-5', label: 'Vask/VVS', category: 'INSTALLATION', status: 'GOD', agreedByBoth: true },
          { id: 'item-3-6', label: 'El/Emhætte', category: 'INSTALLATION', status: 'MINDRE_SKADE', note: 'Emhætte laver støj', agreedByBoth: true },
        ]
      }
    ]
  }

  const getStatusColor = (status?: 'GOD' | 'MINDRE_SKADE' | 'STOR_SKADE' | 'MANGLER') => {
    switch (status) {
      case 'GOD': return 'text-green-700 bg-green-100'
      case 'MINDRE_SKADE': return 'text-yellow-700 bg-yellow-100'
      case 'STOR_SKADE': return 'text-red-700 bg-red-100'
      case 'MANGLER': return 'text-gray-700 bg-gray-100'
      default: return 'text-slate-700 bg-slate-100'
    }
  }

  const getStatusLabel = (status?: 'GOD' | 'MINDRE_SKADE' | 'STOR_SKADE' | 'MANGLER') => {
    switch (status) {
      case 'GOD': return 'God stand'
      case 'MINDRE_SKADE': return 'Mindre skade'
      case 'STOR_SKADE': return 'Stor skade'
      case 'MANGLER': return 'Mangler'
      default: return '—'
    }
  }

  const handleSign = async (party: 'landlord' | 'tenant') => {
    setSigning(true)
    try {
      // Simulate signing process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newLandlordSigned = party === 'landlord' ? true : landlordSigned
      const newTenantSigned = party === 'tenant' ? true : tenantSigned
      
      if (party === 'landlord') {
        setLandlordSigned(true)
      } else {
        setTenantSigned(true)
      }
      
      // Check if both have signed
      const bothSigned = newLandlordSigned && newTenantSigned
      const newStatus = bothSigned ? 'SIGNED' : 'READY_FOR_SIGNATURE'
      
      // Update report status
      const updatedReport = { ...report, status: newStatus }
      setReport(updatedReport)
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        const savedReports = localStorage.getItem('handoverReports')
        if (savedReports) {
          try {
            const parsedReports = JSON.parse(savedReports)
            const reportIndex = parsedReports.findIndex((r: any) => r.id === report.id)
            if (reportIndex !== -1) {
              parsedReports[reportIndex] = {
                ...parsedReports[reportIndex],
                status: newStatus,
                [`${party}Signed`]: true,
                signedAt: new Date().toISOString()
              }
              localStorage.setItem('handoverReports', JSON.stringify(parsedReports))
            }
          } catch (error) {
            console.error('Error updating report in localStorage:', error)
          }
        }
      }
      
      if (bothSigned) {
        alert('Rapporten er nu underskrevet af begge parter og kan ikke længere ændres.')
      } else {
        alert(`Du har underskrevet rapporten. Afventer underskrift fra ${party === 'landlord' ? 'lejer' : 'udlejer'}.`)
      }
    } catch (error) {
      console.error('Failed to sign:', error)
      alert('Der opstod en fejl ved underskrift.')
    } finally {
      setSigning(false)
    }
  }

  if (loading || !user || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const totalItems = rooms.flatMap(r => r.items).length
  const goodItems = rooms.flatMap(r => r.items).filter(item => item.status === 'GOD').length
  const damageItems = rooms.flatMap(r => r.items).filter(item => item.status === 'MINDRE_SKADE' || item.status === 'STOR_SKADE').length

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push(`/handover-reports/${report.id}`)}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Digital Underskrift</h1>
                <p className="text-slate-600 mt-1">{report.propertyAddress}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Rapport Sammendrag</h2>
              <p className="text-emerald-100 text-sm">Gennemgået i fællesskab</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-800">{totalItems}</div>
                  <div className="text-sm text-slate-600">Punkter gennemgået</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{goodItems}</div>
                  <div className="text-sm text-slate-600">God tilstand</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{damageItems}</div>
                  <div className="text-sm text-slate-600">Skader/bemærkninger</div>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Underskrift</h2>
              <p className="text-slate-300 text-sm">Begge parter skal underskrive for at færdiggøre rapporten</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Landlord Signature */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Udlejer</h3>
                    <p className="text-slate-600">{report.landlord?.firstName || 'Navn ikke angivet'} {report.landlord?.lastName || ''}</p>
                    <p className="text-sm text-slate-500">{report.landlord?.email}</p>
                  </div>
                  
                  {landlordSigned ? (
                    <div className="text-center py-8 bg-green-50 border-2 border-green-200 rounded-lg">
                      <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="font-medium text-green-800">Underskrevet</div>
                      <div className="text-sm text-green-600">{formatDate(new Date().toISOString())}</div>
                    </div>
                  ) : user?.role === 'LANDLORD' ? (
                    <button
                      onClick={() => handleSign('landlord')}
                      disabled={signing}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                    >
                      {signing ? 'Underskriver...' : 'Underskriv som Udlejer'}
                    </button>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 border-2 border-slate-200 rounded-lg">
                      <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="font-medium text-slate-600">Afventer underskrift</div>
                      <div className="text-sm text-slate-500">Kun udlejer kan underskrive her</div>
                    </div>
                  )}
                </div>

                {/* Tenant Signature */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Lejer</h3>
                    <p className="text-slate-600">{report.tenant?.firstName || 'Navn ikke angivet'} {report.tenant?.lastName || ''}</p>
                    <p className="text-sm text-slate-500">{report.tenant?.email}</p>
                  </div>
                  
                  {tenantSigned ? (
                    <div className="text-center py-8 bg-green-50 border-2 border-green-200 rounded-lg">
                      <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="font-medium text-green-800">Underskrevet</div>
                      <div className="text-sm text-green-600">{formatDate(new Date().toISOString())}</div>
                    </div>
                  ) : user?.role === 'TENANT' ? (
                    <button
                      onClick={() => handleSign('tenant')}
                      disabled={signing}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                    >
                      {signing ? 'Underskriver...' : 'Underskriv som Lejer'}
                    </button>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 border-2 border-slate-200 rounded-lg">
                      <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="font-medium text-slate-600">Afventer underskrift</div>
                      <div className="text-sm text-slate-500">Kun lejer kan underskrive her</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              {landlordSigned && tenantSigned && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="font-medium text-green-800">Rapporten er nu officielt underskrevet af begge parter</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {landlordSigned && tenantSigned && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.open(`/handover-reports/${report.id}/pdf`, '_blank')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Download Underskrevet PDF
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
              >
                Tilbage til Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}