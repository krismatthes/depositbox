'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface Nest {
  id: string
  address?: string
  propertyType?: string
  deposit: number
  rent: number
  prepaidRent?: number
  status: string
  moveInDate?: string
  leaseStartDate?: string
  leaseDuration?: number
  description?: string
  createdAt: string
  tenant: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  landlord: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  escrow?: {
    id: string
    status: string
    totalAmount: number
  }
}

interface NestsResponse {
  nests: Nest[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminNestsPage() {
  const [nests, setNests] = useState<Nest[]>([])
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
  const [selectedNest, setSelectedNest] = useState<Nest | null>(null)
  const [showNestModal, setShowNestModal] = useState(false)

  useEffect(() => {
    fetchNests()
  }, [pagination.page, filters])

  const fetchNests = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      })

      const response = await api.get(`/admin/nests?${params}`)
      const data: NestsResponse = response.data
      setNests(data.nests)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching nests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNestClick = (nest: Nest) => {
    setSelectedNest(nest)
    setShowNestModal(true)
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
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700'
      case 'PENDING_LANDLORD': return 'bg-blue-100 text-blue-700'
      case 'AGREED': return 'bg-green-100 text-green-700'
      case 'REJECTED': return 'bg-red-100 text-red-700'
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'COMPLETED': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusName = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'Kladde'
      case 'PENDING_LANDLORD': return 'Afventer Udlejer'
      case 'AGREED': return 'Aftalt'
      case 'REJECTED': return 'Afvist'
      case 'ACTIVE': return 'Aktiv'
      case 'COMPLETED': return 'Færdig'
      default: return status || 'Ukendt'
    }
  }

  const getEscrowStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'AGREED': return 'bg-blue-100 text-blue-700'
      case 'FUNDED': return 'bg-yellow-100 text-yellow-700'
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'RELEASE_PENDING': return 'bg-orange-100 text-orange-700'
      case 'RELEASED': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">🏠 Depositums Box Administration</h1>
            <p className="text-slate-600 mt-1">Administrer alle Depositums Box og invitationer</p>
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
                <option value="DRAFT">Kladde</option>
                <option value="PENDING_LANDLORD">Afventer Udlejer</option>
                <option value="AGREED">Aftalt</option>
                <option value="REJECTED">Afvist</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="COMPLETED">Færdig</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchNests}
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

        {/* Nests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Depositums Box ({pagination.total})
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
                      Lejer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Udlejer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Beløb
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Depositums Box
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
                  {nests.map((nest) => (
                    <tr key={nest.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {nest.address || 'Ingen adresse'}
                          </div>
                          {nest.propertyType && (
                            <div className="text-sm text-slate-500">{nest.propertyType}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {nest.tenant ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {nest.tenant.firstName} {nest.tenant.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{nest.tenant.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Ingen lejer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {nest.landlord ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {nest.landlord.firstName} {nest.landlord.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{nest.landlord.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Ingen udlejer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          <div className="font-medium">💰 {formatCurrency(nest.deposit)}</div>
                          <div className="text-slate-500">🏠 {formatCurrency(nest.rent)}/måned</div>
                          {nest.prepaidRent && (
                            <div className="text-slate-500">📅 {formatCurrency(nest.prepaidRent)} forudbetalt</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(nest.status)}`}>
                          {getStatusName(nest.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {nest.escrow ? (
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEscrowStatusColor(nest.escrow.status)}`}>
                              {nest.escrow.status}
                            </span>
                            <div className="text-xs text-slate-500 mt-1">
                              {formatCurrency(nest.escrow.totalAmount)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Ingen Depositums Box</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(nest.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleNestClick(nest)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Se detaljer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Viser {((pagination.page - 1) * pagination.limit) + 1} til {Math.min(pagination.page * pagination.limit, pagination.total)} af {pagination.total} Depositums Box
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
                >
                  Forrige
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
                >
                  Næste
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nest Details Modal */}
        {showNestModal && selectedNest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  Depositums Box Detaljer
                </h3>
                <button
                  onClick={() => setShowNestModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">🏠 Ejendom Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Adresse:</span> {selectedNest.address || 'Ikke angivet'}</div>
                      <div><span className="font-medium">Type:</span> {selectedNest.propertyType || 'Ikke angivet'}</div>
                      <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedNest.status)}`}>{getStatusName(selectedNest.status)}</span></div>
                      <div><span className="font-medium">Oprettet:</span> {formatDate(selectedNest.createdAt)}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">💰 Økonomiske Detaljer</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Depositum:</span> {formatCurrency(selectedNest.deposit)}</div>
                      <div><span className="font-medium">Månedlig leje:</span> {formatCurrency(selectedNest.rent)}</div>
                      {selectedNest.prepaidRent && (
                        <div><span className="font-medium">Forudbetalt leje:</span> {formatCurrency(selectedNest.prepaidRent)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">👤 Lejer</h4>
                    {selectedNest.tenant ? (
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">Navn:</span> {selectedNest.tenant.firstName} {selectedNest.tenant.lastName}</div>
                        <div><span className="font-medium">Email:</span> {selectedNest.tenant.email}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Ingen lejer tilknyttet</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">🏠 Udlejer</h4>
                    {selectedNest.landlord ? (
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">Navn:</span> {selectedNest.landlord.firstName} {selectedNest.landlord.lastName}</div>
                        <div><span className="font-medium">Email:</span> {selectedNest.landlord.email}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Ingen udlejer tilknyttet</p>
                    )}
                  </div>
                </div>

                {/* Lease Details */}
                {(selectedNest.moveInDate || selectedNest.leaseStartDate || selectedNest.leaseDuration) && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">📅 Lejeaftale Detaljer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {selectedNest.moveInDate && (
                        <div><span className="font-medium">Indflytningsdato:</span> {formatDate(selectedNest.moveInDate)}</div>
                      )}
                      {selectedNest.leaseStartDate && (
                        <div><span className="font-medium">Lejestart:</span> {formatDate(selectedNest.leaseStartDate)}</div>
                      )}
                      {selectedNest.leaseDuration && (
                        <div><span className="font-medium">Lejeperiode:</span> {selectedNest.leaseDuration} måneder</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedNest.description && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">📝 Beskrivelse</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {selectedNest.description}
                    </p>
                  </div>
                )}

                {/* Escrow Information */}
                {selectedNest.escrow && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">💰 Depositums Box Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getEscrowStatusColor(selectedNest.escrow.status)}`}>
                          {selectedNest.escrow.status}
                        </span>
                      </div>
                      <div><span className="font-medium">Total beløb:</span> {formatCurrency(selectedNest.escrow.totalAmount)}</div>
                      <div><span className="font-medium">Depositums Box ID:</span> {selectedNest.escrow.id}</div>
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