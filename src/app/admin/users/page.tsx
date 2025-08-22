'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'TENANT' | 'LANDLORD' | 'ADMIN'
  phone?: string
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  mitIdVerified: boolean
  createdAt: string
  lastLoginAt?: string
  cprNumber?: string
  monthlyIncome?: number
  employer?: string
  employmentType?: string
  profileCompleteness?: number
  _count: {
    createdNests: number
    assignedNests: number
    escrows: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    verified: ''
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, filters])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { search: filters.search }),
        ...(filters.verified && { verified: filters.verified })
      })

      const response = await api.get(`/admin/users?${params}`)
      const data: UsersResponse = response.data
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = async (user: User) => {
    try {
      const response = await api.get(`/admin/users/${user.id}`)
      setSelectedUser(response.data.user)
      setShowUserModal(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const updateUserVerification = async (userId: string, field: string, value: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, { [field]: value })
      await fetchUsers()
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, [field]: value } : null)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'TENANT': return 'bg-blue-100 text-blue-700'
      case 'LANDLORD': return 'bg-green-100 text-green-700'
      case 'ADMIN': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'TENANT': return 'Lejer'
      case 'LANDLORD': return 'Udlejer'
      case 'ADMIN': return 'Admin'
      default: return role
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">👥 Brugeradministration</h1>
            <p className="text-slate-600 mt-1">Administrer alle brugere i systemet</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Søg</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Navn eller email..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rolle</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle roller</option>
                <option value="TENANT">Lejere</option>
                <option value="LANDLORD">Udlejere</option>
                <option value="ADMIN">Administratorer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Verificeret</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle</option>
                <option value="true">Verificerede</option>
                <option value="false">Ikke verificerede</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchUsers}
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

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Brugere ({pagination.total})
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
                      Bruger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Verificering
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aktivitet
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-slate-400">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                        {user.role === 'TENANT' && user.profileCompleteness && (
                          <div className="text-xs text-slate-500 mt-1">
                            Profil: {user.profileCompleteness}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span title="Email verificeret">
                            {user.emailVerified ? '✅' : '❌'}
                          </span>
                          <span title="Telefon verificeret">
                            {user.phoneVerified ? '📱' : '📴'}
                          </span>
                          <span title="MitID verificeret">
                            {user.mitIdVerified ? '🆔' : '🔒'}
                          </span>
                          <span title="Identitet verificeret">
                            {user.identityVerified ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          🏠 {user._count.createdNests + user._count.assignedNests} Nests
                        </div>
                        <div className="text-sm text-slate-500">
                          💰 {user._count.escrows} Escrows
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleUserClick(user)}
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
                Viser {((pagination.page - 1) * pagination.limit) + 1} til {Math.min(pagination.page * pagination.limit, pagination.total)} af {pagination.total} brugere
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

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  Bruger Detaljer: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
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
                    <h4 className="font-semibold text-slate-800 mb-3">📋 Grundlæggende Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                      <div><span className="font-medium">Telefon:</span> {selectedUser.phone || 'Ikke angivet'}</div>
                      <div><span className="font-medium">CPR:</span> {selectedUser.cprNumber || 'Ikke angivet'}</div>
                      <div><span className="font-medium">Rolle:</span> {getRoleName(selectedUser.role)}</div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">✅ Verificering Status</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'emailVerified', label: 'Email verificeret' },
                        { key: 'phoneVerified', label: 'Telefon verificeret' },
                        { key: 'identityVerified', label: 'Identitet verificeret' },
                        { key: 'mitIdVerified', label: 'MitID verificeret' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{label}:</span>
                          <button
                            onClick={() => updateUserVerification(selectedUser.id, key, !selectedUser[key as keyof User])}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedUser[key as keyof User]
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {selectedUser[key as keyof User] ? 'Verificeret' : 'Ikke verificeret'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Employment Info for Tenants */}
                {selectedUser.role === 'TENANT' && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">💼 Beskæftigelse</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Månedlig indkomst:</span> {selectedUser.monthlyIncome ? formatCurrency(selectedUser.monthlyIncome) : 'Ikke angivet'}</div>
                      <div><span className="font-medium">Arbejdsgiver:</span> {selectedUser.employer || 'Ikke angivet'}</div>
                      <div><span className="font-medium">Ansættelsestype:</span> {selectedUser.employmentType || 'Ikke angivet'}</div>
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