'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface VerificationUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  mitIdVerified: boolean
  incomeVerified: boolean
  creditChecked: boolean
  creditScore?: number
  cprNumber?: string
  monthlyIncome?: number
  employer?: string
  createdAt: string
  documents: Array<{
    id: string
    type: string
    title: string
    verified: boolean
    verifiedAt?: string
    createdAt: string
  }>
}

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<VerificationUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    search: ''
  })
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50', // Get more users for verification view
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { search: filters.search }),
        ...(filters.verified && { verified: filters.verified })
      })

      const response = await api.get(`/admin/users?${params}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserVerification = async (userId: string, field: string, value: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, { [field]: value })
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, [field]: value } : user
      ))
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, [field]: value } : null)
      }
    } catch (error) {
      console.error('Error updating verification:', error)
    }
  }

  const handleUserClick = async (user: VerificationUser) => {
    try {
      const response = await api.get(`/admin/users/${user.id}`)
      setSelectedUser(response.data.user)
      setShowVerificationModal(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
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
      year: 'numeric'
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

  const getVerificationScore = (user: VerificationUser) => {
    const checks = [
      user.emailVerified,
      user.phoneVerified,
      user.identityVerified,
      user.mitIdVerified,
      user.incomeVerified,
      user.creditChecked
    ]
    return checks.filter(Boolean).length
  }

  const getVerificationColor = (score: number) => {
    if (score >= 5) return 'text-green-600 bg-green-100'
    if (score >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const pendingVerifications = users.filter(user => 
    !user.emailVerified || !user.phoneVerified || !user.identityVerified || 
    (user.role === 'TENANT' && (!user.incomeVerified || !user.creditChecked))
  ).length

  const fullyVerified = users.filter(user => 
    user.emailVerified && user.phoneVerified && user.identityVerified && 
    user.mitIdVerified && (user.role !== 'TENANT' || (user.incomeVerified && user.creditChecked))
  ).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">✅ Verificering Administration</h1>
            <p className="text-slate-600 mt-1">Administrer bruger verificeringer og dokumenter</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Total Brugere</h3>
                <p className="text-2xl font-bold text-slate-800 mt-2">{users.length}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Afventer Verificering</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{pendingVerifications}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Fuldt Verificerede</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">{fullyVerified}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">MitID Verificerede</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {users.filter(u => u.mitIdVerified).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🆔</span>
              </div>
            </div>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Verificering Status</label>
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
              Bruger Verificeringer ({users.length})
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
                      Verificeringer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Dokumenter
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
                  {users.map((user) => {
                    const verificationScore = getVerificationScore(user)
                    return (
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
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <span title="Email verificeret" className={user.emailVerified ? "text-green-600" : "text-red-600"}>
                              📧
                            </span>
                            <span title="Telefon verificeret" className={user.phoneVerified ? "text-green-600" : "text-red-600"}>
                              📱
                            </span>
                            <span title="MitID verificeret" className={user.mitIdVerified ? "text-green-600" : "text-red-600"}>
                              🆔
                            </span>
                            <span title="Identitet verificeret" className={user.identityVerified ? "text-green-600" : "text-red-600"}>
                              ✓
                            </span>
                            {user.role === 'TENANT' && (
                              <>
                                <span title="Indkomst verificeret" className={user.incomeVerified ? "text-green-600" : "text-red-600"}>
                                  💰
                                </span>
                                <span title="Kredit tjekket" className={user.creditChecked ? "text-green-600" : "text-red-600"}>
                                  📊
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getVerificationColor(verificationScore)}`}>
                            {verificationScore}/6
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {user.documents?.length || 0} dokumenter
                          </div>
                          {user.documents?.some(doc => !doc.verified) && (
                            <div className="text-xs text-yellow-600">
                              Afventer verificering
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleUserClick(user)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            Administrer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {showVerificationModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  Verificering Administration: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
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
                    <h4 className="font-semibold text-slate-800 mb-3">👤 Bruger Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                      <div><span className="font-medium">CPR:</span> {selectedUser.cprNumber || 'Ikke angivet'}</div>
                      <div><span className="font-medium">Rolle:</span> {getRoleName(selectedUser.role)}</div>
                      {selectedUser.role === 'TENANT' && (
                        <>
                          <div><span className="font-medium">Månedlig indkomst:</span> {selectedUser.monthlyIncome ? formatCurrency(selectedUser.monthlyIncome) : 'Ikke angivet'}</div>
                          <div><span className="font-medium">Arbejdsgiver:</span> {selectedUser.employer || 'Ikke angivet'}</div>
                          {selectedUser.creditScore && (
                            <div><span className="font-medium">Kreditscore:</span> {selectedUser.creditScore}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">🔧 Verificering Handlinger</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailVerified', label: 'Email verificeret', icon: '📧' },
                        { key: 'phoneVerified', label: 'Telefon verificeret', icon: '📱' },
                        { key: 'identityVerified', label: 'Identitet verificeret', icon: '✓' },
                        { key: 'mitIdVerified', label: 'MitID verificeret', icon: '🆔' },
                        ...(selectedUser.role === 'TENANT' ? [
                          { key: 'incomeVerified', label: 'Indkomst verificeret', icon: '💰' },
                          { key: 'creditChecked', label: 'Kredit tjekket', icon: '📊' }
                        ] : [])
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="mr-2">{icon}</span>
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <button
                            onClick={() => updateUserVerification(selectedUser.id, key, !selectedUser[key as keyof VerificationUser])}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedUser[key as keyof VerificationUser]
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {selectedUser[key as keyof VerificationUser] ? 'Fjern' : 'Verificer'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {selectedUser.documents && selectedUser.documents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">📄 Dokumenter</h4>
                    <div className="space-y-3">
                      {selectedUser.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{doc.title}</div>
                            <div className="text-xs text-slate-600">
                              Type: {doc.type} • Oprettet: {formatDate(doc.createdAt)}
                            </div>
                            {doc.verifiedAt && (
                              <div className="text-xs text-green-600">
                                Verificeret: {formatDate(doc.verifiedAt)}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              doc.verified 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.verified ? 'Verificeret' : 'Afventer'}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                              Se dokument
                            </button>
                          </div>
                        </div>
                      ))}
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