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

export default function HandoverReportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoom, setActiveRoom] = useState(0)
  const [saving, setSaving] = useState(false)

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
            // Set default status to COMPLETED for demo reports
            const reportWithStatus = {
              ...foundReport,
              status: foundReport.status || 'COMPLETED'
            }
            setReport(reportWithStatus)
            // Create room templates based on the loaded report's property type
            const roomTemplates = createRoomTemplates(foundReport.propertyType)
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
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      landlord: {
        firstName: 'Peter',
        lastName: 'Larsen',
        email: 'peter.larsen@email.com'
      },
      tenant: user?.role === 'TENANT' ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      } : {
        id: 'tenant-demo',
        firstName: 'Lejer',
        lastName: 'Jørgensen',
        email: 'lejer.jorgensen@email.com'
      }
    }

    setReport(dummyReport)
    const roomTemplates = createRoomTemplates(dummyReport.propertyType)
    setRooms(roomTemplates)
  }

  const createRoomTemplates = (propertyType: string): Room[] => {
    // Create room templates based on property type
    return [
      {
        id: 'room-1',
        name: 'Entré/Gang',
        scope: 'PRIVATE',
        items: [
          { id: 'item-1-1', label: 'Loft', category: 'OVERFLADE' },
          { id: 'item-1-2', label: 'Vægge', category: 'OVERFLADE' },
          { id: 'item-1-3', label: 'Gulv', category: 'OVERFLADE' },
          { id: 'item-1-4', label: 'Lister/Døre', category: 'OVERFLADE' },
        ]
      },
      {
        id: 'room-2',
        name: 'Stue',
        scope: 'PRIVATE',
        items: [
          { id: 'item-2-1', label: 'Loft', category: 'OVERFLADE' },
          { id: 'item-2-2', label: 'Vægge', category: 'OVERFLADE' },
          { id: 'item-2-3', label: 'Gulv', category: 'OVERFLADE' },
          { id: 'item-2-4', label: 'Lister/Døre', category: 'OVERFLADE' },
        ]
      },
      {
        id: 'room-3',
        name: 'Køkken',
        scope: 'PRIVATE',
        items: [
          { id: 'item-3-1', label: 'Loft', category: 'OVERFLADE' },
          { id: 'item-3-2', label: 'Vægge', category: 'OVERFLADE' },
          { id: 'item-3-3', label: 'Gulv', category: 'OVERFLADE' },
          { id: 'item-3-4', label: 'Hvidevarer', category: 'INSTALLATION' },
          { id: 'item-3-5', label: 'Vask/VVS', category: 'INSTALLATION' },
          { id: 'item-3-6', label: 'El/Emhætte', category: 'INSTALLATION' },
        ]
      },
      {
        id: 'room-4',
        name: 'Bad',
        scope: 'PRIVATE',
        items: [
          { id: 'item-4-1', label: 'Loft', category: 'OVERFLADE' },
          { id: 'item-4-2', label: 'Vægge', category: 'OVERFLADE' },
          { id: 'item-4-3', label: 'Gulv', category: 'OVERFLADE' },
          { id: 'item-4-4', label: 'Toilet/Bruser', category: 'INSTALLATION' },
          { id: 'item-4-5', label: 'Afløb/Ventilation', category: 'INSTALLATION' },
          { id: 'item-4-6', label: 'El/Armatur', category: 'INSTALLATION' },
        ]
      },
      {
        id: 'room-5',
        name: 'Værelse',
        scope: 'PRIVATE',
        items: [
          { id: 'item-5-1', label: 'Loft', category: 'OVERFLADE' },
          { id: 'item-5-2', label: 'Vægge', category: 'OVERFLADE' },
          { id: 'item-5-3', label: 'Gulv', category: 'OVERFLADE' },
          { id: 'item-5-4', label: 'Lister/Døre', category: 'OVERFLADE' },
        ]
      }
    ]
  }

  const updateItemStatus = (roomId: string, itemId: string, status: ChecklistItem['status'], note?: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? {
            ...room,
            items: room.items.map(item => 
              item.id === itemId 
                ? { ...item, status, note, agreedByBoth: true }
                : item
            )
          }
        : room
    ))
  }

  const getStatusColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'GOD': return 'bg-green-100 text-green-800 border-green-200'
      case 'MINDRE_SKADE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'STOR_SKADE': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANGLER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusLabel = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'GOD': return 'God stand'
      case 'MINDRE_SKADE': return 'Mindre skade'
      case 'STOR_SKADE': return 'Stor skade'
      case 'MANGLER': return 'Mangler'
      default: return status
    }
  }

  const getRoomProgress = (room: Room) => {
    const completedItems = room.items.filter(item => item.status && item.agreedByBoth)
    return `${completedItems.length}/${room.items.length}`
  }

  const handlePhotoUpload = (roomId: string, itemId: string, files: FileList | null) => {
    if (!files) return
    
    const newPhotos: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          newPhotos.push(result)
          
          // Update the specific item with new photos
          setRooms(prev => prev.map(room => 
            room.id === roomId 
              ? {
                  ...room,
                  items: room.items.map(item => 
                    item.id === itemId 
                      ? { ...item, photos: [...(item.photos || []), result] }
                      : item
                  )
                }
              : room
          ))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (roomId: string, itemId: string, photoIndex: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? {
            ...room,
            items: room.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    photos: item.photos?.filter((_, index) => index !== photoIndex) 
                  }
                : item
            )
          }
        : room
    ))
  }

  const saveProgress = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
  }

  const isReportComplete = () => {
    return rooms.every(room => 
      room.items.every(item => item.status && item.agreedByBoth)
    )
  }


  if (loading || !user || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // If report is signed/completed, show read-only view
  if (report.status === 'SIGNED' || report.status === 'COMPLETED') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  <h1 className="text-3xl font-bold text-slate-800">
                    {report.reportType === 'MOVE_IN' ? 'Indflytningsrapport' : 'Fraflytningsrapport'}
                  </h1>
                  <p className="text-slate-600 mt-1">{report.propertyAddress}</p>
                </div>
              </div>
              
              {/* Status Banner */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-green-800">Rapporten er færdiggjort</div>
                    <div className="text-green-700 text-sm">
                      Begge parter har gennemgået og accepteret rapporten. 
                      Download PDF-versionen nedenfor.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Rapport Oversigt</h2>
                <p className="text-purple-100 text-sm">Færdiggjort rapport for {report.propertyAddress}</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Rapport Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-slate-600">Type:</span> <span className="font-medium">{report.reportType === 'MOVE_IN' ? 'Indflytning' : 'Fraflytning'}</span></div>
                      <div><span className="text-slate-600">Status:</span> <span className="font-medium text-green-600">Færdiggjort</span></div>
                      <div><span className="text-slate-600">Oprettet:</span> <span className="font-medium">{formatDate(report.createdAt)}</span></div>
                      <div><span className="text-slate-600">Boligtype:</span> <span className="font-medium">
                        {report.propertyType === 'APARTMENT' ? 'Lejlighed' : 
                         report.propertyType === 'HOUSE' ? 'Hus' : 
                         report.propertyType === 'ROOM' ? 'Værelse' : 'Kollegieværelse'}
                      </span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Parter</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-slate-600">Udlejer:</div>
                        <div className="font-medium">{report.landlord?.firstName} {report.landlord?.lastName}</div>
                        <div className="text-slate-500">{report.landlord?.email}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Lejer:</div>
                        <div className="font-medium">{report.tenant?.firstName} {report.tenant?.lastName}</div>
                        <div className="text-slate-500">{report.tenant?.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const reportData = encodeURIComponent(JSON.stringify({ ...report, rooms }))
                      window.open(`/handover-reports/${report.id}/pdf?data=${reportData}`, '_blank')
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Rapport
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Rapport
                  </button>
                </div>
              </div>
            </div>

            {/* Note for completed report */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-blue-800 mb-1">Færdig rapport</div>
                  <div className="text-blue-700 text-sm">
                    Denne rapport er færdiggjort og kan ikke længere redigeres. 
                    Download PDF-versionen for at få den komplette rapport med alle detaljer, 
                    bemærkninger og billeder fra gennemgangen.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-3xl font-bold text-slate-800">
                  {report.reportType === 'MOVE_IN' ? 'Indflytningsrapport' : 'Fraflytningsrapport'}
                </h1>
                <p className="text-slate-600 mt-1">{report.propertyAddress}</p>
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Status:</span>
                  <div className={`font-medium ${report.status === 'SIGNED' ? 'text-green-700' : 'text-amber-700'}`}>
                    {report.status === 'SIGNED' ? 'Underskrevet' : 'Under gennemgang'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600">Oprettet:</span>
                  <div className="font-medium">{formatDate(report.createdAt)}</div>
                </div>
                <div>
                  <span className="text-slate-600">Boligtype:</span>
                  <div className="font-medium">
                    {report.propertyType === 'APARTMENT' ? 'Lejlighed' : 
                     report.propertyType === 'HOUSE' ? 'Hus' : 
                     report.propertyType === 'ROOM' ? 'Værelse' : 'Kollegieværelse'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600">Fremgang:</span>
                  <div className={`font-medium ${isReportComplete() ? 'text-green-700' : 'text-slate-800'}`}>
                    {rooms.reduce((acc, room) => acc + room.items.filter(item => item.status && item.agreedByBoth).length, 0)} / {rooms.reduce((acc, room) => acc + room.items.length, 0)} punkter
                    {isReportComplete() && (
                      <span className="ml-2 text-green-600">
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Completion Notice */}
              {isReportComplete() && report.status !== 'SIGNED' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-green-800">Alle punkter er gennemgået!</div>
                      <div className="text-green-700 text-sm">Rapporten er klar til digital underskrift.</div>
                    </div>
                  </div>
                </div>
              )}
              
              {report.status === 'SIGNED' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-blue-800">Rapporten er underskrevet</div>
                      <div className="text-blue-700 text-sm">Begge parter har underskrevet. Download PDF fra underskrift-siden.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Room Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3">
                  <h3 className="text-lg font-bold text-white">Rum</h3>
                </div>
                <div className="p-0">
                  {rooms.map((room, index) => {
                    const progress = getRoomProgress(room)
                    const isComplete = room.items.every(item => item.status && item.agreedByBoth)
                    
                    return (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoom(index)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          activeRoom === index ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-800">{room.name}</div>
                            <div className="text-xs text-slate-500">
                              {room.scope === 'SHARED' && '(Fælles) '}
                              {progress} gennemgået
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            isComplete ? 'bg-green-400' : 
                            room.items.some(item => item.status) ? 'bg-yellow-400' : 
                            'bg-slate-300'
                          }`} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Room Content */}
            <div className="lg:col-span-3">
              {rooms[activeRoom] && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">{rooms[activeRoom].name}</h2>
                        <p className="text-slate-300 text-sm">
                          Gennemgå tilstanden for hvert punkt sammen
                          {rooms[activeRoom].scope === 'SHARED' && ' (Fællesområde)'}
                        </p>
                      </div>
                      <button
                        onClick={saveProgress}
                        disabled={saving}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Gemmer...' : 'Gem'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      {rooms[activeRoom].items.map((item, itemIndex) => (
                        <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-800">{item.label}</h4>
                              <div className="text-sm text-slate-500">
                                {item.category === 'OVERFLADE' ? 'Overflade' : 
                                 item.category === 'INSTALLATION' ? 'Installation' : 'Inventar'}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.status ? getStatusColor(item.status) : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {item.status ? getStatusLabel(item.status) : 'Ikke vurderet'}
                            </span>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {(['GOD', 'MINDRE_SKADE', 'STOR_SKADE', 'MANGLER'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => updateItemStatus(rooms[activeRoom].id, item.id, status)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                                  item.status === status
                                    ? getStatusColor(status).replace('100', '200').replace('800', '700') + ' border-current'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {getStatusLabel(status)}
                              </button>
                            ))}
                          </div>

                          {/* Note Input */}
                          {(item.status === 'MINDRE_SKADE' || item.status === 'STOR_SKADE' || item.note) && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Bemærkning:
                                </label>
                                <textarea
                                  value={item.note || ''}
                                  onChange={(e) => updateItemStatus(rooms[activeRoom].id, item.id, item.status, e.target.value)}
                                  placeholder="Beskriv skaden eller tilføj bemærkninger..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                  rows={2}
                                />
                              </div>
                              
                              {/* Photo Upload */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Billeder:
                                </label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handlePhotoUpload(rooms[activeRoom].id, item.id, e.target.files)}
                                    className="hidden"
                                    id={`photo-upload-${item.id}`}
                                  />
                                  <label
                                    htmlFor={`photo-upload-${item.id}`}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-slate-300"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Tilføj Billeder
                                  </label>
                                  <span className="text-xs text-slate-500">
                                    {item.photos?.length || 0} billeder uploadet
                                  </span>
                                </div>
                                
                                {/* Display uploaded photos */}
                                {item.photos && item.photos.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                    {item.photos.map((photo, photoIndex) => (
                                      <div key={photoIndex} className="relative group">
                                        <img
                                          src={photo}
                                          alt={`Billede ${photoIndex + 1}`}
                                          className="w-full h-20 object-cover rounded-lg border border-slate-200"
                                        />
                                        <button
                                          onClick={() => removePhoto(rooms[activeRoom].id, item.id, photoIndex)}
                                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
                      <button
                        onClick={() => setActiveRoom(Math.max(0, activeRoom - 1))}
                        disabled={activeRoom === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Forrige rum
                      </button>
                      
                      <div className="flex gap-3">
                        {isReportComplete() ? (
                          <button
                            onClick={() => router.push(`/handover-reports/${report.id}/sign`)}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-colors"
                          >
                            Klar til Underskrift
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveRoom(Math.min(rooms.length - 1, activeRoom + 1))}
                            disabled={activeRoom === rooms.length - 1}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
                          >
                            Næste rum
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}