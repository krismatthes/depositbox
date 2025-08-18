'use client'

import Navigation from '@/components/Navigation'

// Mock data for demonstration
const mockUser = {
  id: 'demo',
  firstName: 'Demo',
  lastName: 'Bruger',
  email: 'demo@housingescrow.dk'
}

const mockEscrows = [
  {
    id: '1',
    propertyTitle: 'Moderne 3-værelses lejlighed',
    propertyAddress: 'Nørrebrogade 123, 2200 København N',
    amount: '75000',
    currency: 'DKK',
    status: 'CREATED',
    buyer: { firstName: 'Anna', lastName: 'Andersen' },
    seller: { firstName: 'Lars', lastName: 'Larsen' },
    createdAt: '2025-08-16T10:00:00Z',
    payproffHostedUrl: 'https://demo.payproff.com/payment/123'
  },
  {
    id: '2',
    propertyTitle: 'Lys penthouse med terrasse',
    propertyAddress: 'Østerbrogade 456, 2100 København Ø',
    amount: '120000',
    currency: 'DKK',
    status: 'FUNDED',
    buyer: { firstName: 'Peter', lastName: 'Pedersen' },
    seller: { firstName: 'Maria', lastName: 'Madsen' },
    createdAt: '2025-08-14T14:30:00Z',
    fundedAt: '2025-08-15T09:15:00Z'
  },
  {
    id: '3',
    propertyTitle: 'Charmerende villa med have',
    propertyAddress: 'Rosenvej 789, 2000 Frederiksberg',
    amount: '200000',
    currency: 'DKK',
    status: 'RELEASED',
    buyer: { firstName: 'Sofie', lastName: 'Sørensen' },
    seller: { firstName: 'Thomas', lastName: 'Thomsen' },
    createdAt: '2025-08-10T11:20:00Z',
    fundedAt: '2025-08-11T16:45:00Z',
    releasedAt: '2025-08-16T08:30:00Z'
  }
]

function getStatusBadge(status: string) {
  const statusStyles = {
    CREATED: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    FUNDED: 'bg-blue-900/50 text-blue-300 border border-blue-700',
    RELEASED: 'bg-green-900/50 text-green-300 border border-green-700',
    CANCELLED: 'bg-red-900/50 text-red-300 border border-red-700'
  }
  
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.CREATED
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">Demo Dashboard</h1>
                <p className="text-slate-600">Velkommen til Housing Escrow Service demo!</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Demo Mode
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-slate-600 text-sm">Total Escrows</p>
                  <p className="text-2xl font-bold text-slate-800">3</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-slate-600 text-sm">Total Værdi</p>
                  <p className="text-2xl font-bold text-slate-800">395.000 DKK</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-slate-600 text-sm">Afsluttede</p>
                  <p className="text-2xl font-bold text-slate-800">1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Escrows */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Aktive Escrows</h2>
            {mockEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-800">{escrow.propertyTitle}</h3>
                      {getStatusBadge(escrow.status)}
                    </div>
                    
                    <p className="text-slate-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {escrow.propertyAddress}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-100 rounded-lg p-3">
                        <p className="text-slate-600 text-sm">Beløb</p>
                        <p className="text-slate-800 font-semibold">{escrow.amount} {escrow.currency}</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-3">
                        <p className="text-slate-600 text-sm">Køber</p>
                        <p className="text-slate-800 font-medium">{escrow.buyer.firstName} {escrow.buyer.lastName}</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-3">
                        <p className="text-slate-600 text-sm">Sælger</p>
                        <p className="text-slate-800 font-medium">{escrow.seller.firstName} {escrow.seller.lastName}</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-3">
                        <p className="text-slate-600 text-sm">Oprettet</p>
                        <p className="text-slate-800 font-medium">{new Date(escrow.createdAt).toLocaleDateString('da-DK')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                    {escrow.status === 'CREATED' && (
                      <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Betal Depositum
                      </button>
                    )}
                    {escrow.status === 'FUNDED' && (
                      <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Frigiv Midler
                      </button>
                    )}
                    {escrow.status === 'RELEASED' && (
                      <div className="bg-green-900/30 border border-green-700 text-green-300 px-6 py-2.5 rounded-lg font-medium inline-flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Afsluttet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}