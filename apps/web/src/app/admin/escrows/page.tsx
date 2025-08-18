'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface Escrow {
  id: string
  totalAmount: number
  status: string
  currency: string
  buyerId: string
  sellerId: string
  buyer: {
    firstName: string
    lastName: string
    email: string
  }
  seller: {
    firstName: string
    lastName: string
    email: string
  }
  propertyAddress?: string
  propertyTitle?: string
  createdAt: string
  fundedAt?: string
  releasedAt?: string
  plannedReleaseDate?: string
  payproffTransactionId?: string
  nestEscrow?: {
    id: string
    address?: string
    deposit: number
    status: string
  }
}

interface EscrowsResponse {
  escrows: Escrow[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminEscrowsPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null)
  const [showEscrowModal, setShowEscrowModal] = useState(false)

  useEffect(() => {
    fetchEscrows()
  }, [pagination.page, filters])

  const fetchEscrows = async () => {
    try {
      // Since there's no dedicated escrows endpoint yet, we'll create a mock response
      // In production, you would call: const response = await api.get('/admin/escrows')
      
      // Mock data for now
      const mockEscrows: Escrow[] = [
        {
          id: '1',
          totalAmount: 2500000, // 25000 DKK in øre
          status: 'ACTIVE',
          currency: 'DKK',
          buyerId: 'user1',
          sellerId: 'user2',
          buyer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          seller: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
          propertyAddress: 'Nørrebrogade 123, 2200 København N',
          createdAt: new Date().toISOString(),
          fundedAt: new Date().toISOString()
        }
      ]

      setEscrows(mockEscrows)
      setPagination({
        page: 1,
        limit: 25,
        total: mockEscrows.length,
        pages: 1
      })
    } catch (error) {
      console.error('Error fetching escrows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEscrowClick = (escrow: Escrow) => {
    setSelectedEscrow(escrow)
    setShowEscrowModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREATED': return 'bg-gray-100 text-gray-700'
      case 'FUNDED': return 'bg-blue-100 text-blue-700'
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'RELEASED': return 'bg-purple-100 text-purple-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusName = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREATED': return 'Oprettet'
      case 'FUNDED': return 'Finansieret'
      case 'ACTIVE': return 'Aktiv'
      case 'RELEASED': return 'Frigivet'
      case 'CANCELLED': return 'Annulleret'
      default: return status || 'Ukendt'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">💰 Escrow Administration</h1>
            <p className="text-slate-600 mt-1">Administrer alle escrow-transaktioner</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Søg</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Adresse eller bruger..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle statusser</option>
                <option value="CREATED">Oprettet</option>
                <option value="FUNDED">Finansieret</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="RELEASED">Frigivet</option>
                <option value="CANCELLED">Annulleret</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchEscrows}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Søg</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Total Escrows</h3>
                <p className="text-2xl font-bold text-slate-800 mt-2">{pagination.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Aktive Escrows</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {escrows.filter(e => e.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Total Værdi</h3>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {formatCurrency(escrows.reduce((sum, e) => sum + e.totalAmount, 0))}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💎</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Afventer Finansiering</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {escrows.filter(e => e.status === 'CREATED').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrows Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Escrows ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ejendom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Køber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sælger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Beløb
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Oprettet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {escrows.map((escrow) => (
                    <tr key={escrow.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {escrow.propertyAddress || escrow.propertyTitle || 'Ingen adresse'}
                          </div>
                          {escrow.nestEscrow && (
                            <div className="text-sm text-slate-500">
                              Nest: {escrow.nestEscrow.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {escrow.buyer.firstName} {escrow.buyer.lastName}
                          </div>
                          <div className="text-sm text-slate-500">{escrow.buyer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {escrow.seller.firstName} {escrow.seller.lastName}
                          </div>
                          <div className="text-sm text-slate-500">{escrow.seller.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(escrow.totalAmount)}
                        </div>
                        <div className="text-sm text-slate-500">{escrow.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(escrow.status)}`}>
                          {getStatusName(escrow.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(escrow.createdAt)}
                        {escrow.fundedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Finansieret: {formatDate(escrow.fundedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEscrowClick(escrow)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Se detaljer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {escrows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Ingen escrows fundet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Escrow Details Modal */}
        {showEscrowModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  Escrow Detaljer
                </h3>
                <button
                  onClick={() => setShowEscrowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">💰 Escrow Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">ID:</span> {selectedEscrow.id}</div>
                      <div><span className="font-medium">Beløb:</span> {formatCurrency(selectedEscrow.totalAmount)}</div>
                      <div><span className="font-medium">Valuta:</span> {selectedEscrow.currency}</div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedEscrow.status)}`}>
                          {getStatusName(selectedEscrow.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">🏠 Ejendom</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Adresse:</span> {selectedEscrow.propertyAddress || selectedEscrow.propertyTitle || 'Ikke angivet'}</div>
                      {selectedEscrow.nestEscrow && (
                        <>
                          <div><span className="font-medium">Tilknyttet Nest:</span> {selectedEscrow.nestEscrow.id}</div>
                          <div><span className="font-medium">Nest Adresse:</span> {selectedEscrow.nestEscrow.address}</div>
                          <div><span className="font-medium">Depositum:</span> {formatCurrency(selectedEscrow.nestEscrow.deposit)}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">👤 Køber</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Navn:</span> {selectedEscrow.buyer.firstName} {selectedEscrow.buyer.lastName}</div>
                      <div><span className="font-medium">Email:</span> {selectedEscrow.buyer.email}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">🏢 Sælger</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Navn:</span> {selectedEscrow.seller.firstName} {selectedEscrow.seller.lastName}</div>
                      <div><span className="font-medium">Email:</span> {selectedEscrow.seller.email}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">📅 Tidslinje</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Oprettet:</span>
                      <div className="text-slate-600">{formatDate(selectedEscrow.createdAt)}</div>
                    </div>
                    {selectedEscrow.fundedAt && (
                      <div>
                        <span className="font-medium">Finansieret:</span>
                        <div className="text-slate-600">{formatDate(selectedEscrow.fundedAt)}</div>
                      </div>
                    )}
                    {selectedEscrow.releasedAt && (
                      <div>
                        <span className="font-medium">Frigivet:</span>
                        <div className="text-slate-600">{formatDate(selectedEscrow.releasedAt)}</div>
                      </div>
                    )}
                    {selectedEscrow.plannedReleaseDate && (
                      <div>
                        <span className="font-medium">Planlagt frigivelse:</span>
                        <div className="text-slate-600">{formatDate(selectedEscrow.plannedReleaseDate)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                {selectedEscrow.payproffTransactionId && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">💳 Betalingsinformation</h4>
                    <div className="text-sm">
                      <div><span className="font-medium">PayProff Transaction ID:</span> {selectedEscrow.payproffTransactionId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}