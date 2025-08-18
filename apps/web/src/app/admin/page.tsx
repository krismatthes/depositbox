'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface DashboardMetrics {
  users: {
    total: number
    tenants: number
    landlords: number
    admins: number
  }
  nests: {
    total: number
  }
  escrows: {
    total: number
    active: number
    totalValue: number
  }
  recentActivity: {
    users: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      role: string
      createdAt: string
    }>
    nests: Array<{
      id: string
      address: string
      deposit: number
      status: string
      createdAt: string
      tenant: { firstName: string; lastName: string } | null
      landlord: { firstName: string; lastName: string } | null
    }>
  }
  verification: Record<string, number>
  escrowStatus: Record<string, number>
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/admin/dashboard/metrics')
      setMetrics(response.data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!metrics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Kunne ikke indlæse data</h2>
          <button
            onClick={fetchMetrics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Prøv igen
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📊 Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Oversigt over BoligDeposit systemet</p>
          </div>
          <button
            onClick={fetchMetrics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Opdater</span>
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Samlede Brugere</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{metrics.users.total}</p>
                <div className="flex items-center mt-2 text-sm text-slate-500">
                  <span>👥 {metrics.users.tenants} Lejere</span>
                  <span className="mx-2">•</span>
                  <span>🏠 {metrics.users.landlords} Udlejere</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Nests Oprettet</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{metrics.nests.total}</p>
                <div className="text-sm text-green-600 mt-2">
                  Invitation system
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Escrows</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{metrics.escrows.total}</p>
                <div className="text-sm text-blue-600 mt-2">
                  {metrics.escrows.active} aktive
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600">Total Værdi</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {formatCurrency(metrics.escrows.totalValue)}
                </p>
                <div className="text-sm text-purple-600 mt-2">
                  I escrow
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Escrow Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">💰 Escrow Status Fordeling</h3>
            <div className="space-y-3">
              {Object.entries(metrics.escrowStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'ACTIVE' ? 'bg-green-500' :
                      status === 'DRAFT' ? 'bg-yellow-500' :
                      status === 'FUNDED' ? 'bg-blue-500' :
                      status === 'RELEASED' ? 'bg-gray-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-slate-600 capitalize">{status.toLowerCase()}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Verification Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">✅ Verificering Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">MitID Verificeret</span>
                <span className="font-semibold text-green-600">
                  {Object.entries(metrics.verification).reduce((acc, [key, count]) => {
                    return key.includes('mitId_true') ? acc + count : acc
                  }, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Identitet Verificeret</span>
                <span className="font-semibold text-blue-600">
                  {Object.entries(metrics.verification).reduce((acc, [key, count]) => {
                    return key.includes('identity_true') ? acc + count : acc
                  }, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Email Verificeret</span>
                <span className="font-semibold text-purple-600">
                  {Object.entries(metrics.verification).reduce((acc, [key, count]) => {
                    return key.includes('email_true') ? acc + count : acc
                  }, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Nye Brugere</h3>
            <div className="space-y-4">
              {metrics.recentActivity.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'TENANT' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'LANDLORD' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Nests */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🏠 Nye Nests</h3>
            <div className="space-y-4">
              {metrics.recentActivity.nests.map((nest) => (
                <div key={nest.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{nest.address || 'Ingen adresse'}</p>
                    <p className="text-sm text-slate-600">
                      {nest.tenant ? `${nest.tenant.firstName} ${nest.tenant.lastName}` : 'Ingen lejer'} 
                      {nest.landlord ? ` → ${nest.landlord.firstName} ${nest.landlord.lastName}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{formatCurrency(nest.deposit)}</p>
                    <p className="text-xs text-slate-500">{formatDate(nest.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">🚀 Hurtige Handlinger</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a 
              href="/admin/users"
              className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm font-medium">Administrer Brugere</span>
            </a>
            <a 
              href="/admin/verifications"
              className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700"
            >
              <span className="text-2xl mb-2">✅</span>
              <span className="text-sm font-medium">Verificeringer</span>
            </a>
            <a 
              href="/admin/escrows"
              className="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-yellow-700"
            >
              <span className="text-2xl mb-2">💰</span>
              <span className="text-sm font-medium">Escrow Admin</span>
            </a>
            <a 
              href="/admin/reports"
              className="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700"
            >
              <span className="text-2xl mb-2">📈</span>
              <span className="text-sm font-medium">Rapporter</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}