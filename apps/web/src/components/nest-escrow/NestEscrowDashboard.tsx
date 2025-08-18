'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import Link from 'next/link'

interface NestEscrow {
  id: string
  status: string
  depositAmount: number
  firstMonthAmount: number
  utilitiesAmount: number
  totalAmount: number
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
  releaseRules: any[]
  transactions: any[]
  _count: {
    transactions: number
    approvals: number
  }
  createdAt: string
}

interface PendingApproval {
  id: string
  deadline: string
  approverRole: string
  escrow: {
    id: string
    landlord: { firstName: string; lastName: string }
    tenant: { firstName: string; lastName: string }
  }
  transaction?: {
    type: string
    amount: number
    reason: string
  }
  releaseRule?: {
    triggerType: string
    amount: number
  }
}

export default function NestEscrowDashboard() {
  const { user } = useAuth()
  const [escrows, setEscrows] = useState<NestEscrow[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'pending' | 'history'>('overview')

  useEffect(() => {
    if (user) {
      fetchEscrows()
      fetchPendingApprovals()
    }
  }, [user])

  const fetchEscrows = async () => {
    try {
      const response = await api.get('/nest/escrows')
      setEscrows(response.data.escrows)
    } catch (error) {
      console.error('Failed to fetch escrows:', error)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/nest/approvals/pending')
      setPendingApprovals(response.data.approvals)
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toLocaleString('da-DK')} DKK`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'PARTIAL_RELEASED': 'bg-blue-100 text-blue-800',
      'FULLY_RELEASED': 'bg-gray-100 text-gray-800',
      'DISPUTED': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'PENDING': 'Afventende',
      'ACTIVE': 'Aktiv',
      'PARTIAL_RELEASED': 'Delvist frigivet',
      'FULLY_RELEASED': 'Fuldt frigivet',
      'DISPUTED': 'Tvist'
    }
    return texts[status as keyof typeof texts] || status
  }

  const totalValueManaged = escrows.reduce((sum, escrow) => sum + escrow.totalAmount, 0)
  const activeEscrows = escrows.filter(e => ['ACTIVE', 'PARTIAL_RELEASED'].includes(e.status))
  const pendingEscrows = escrows.filter(e => e.status === 'PENDING')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">🏦 Nest Deponering</h1>
          <p className="text-slate-600 mt-1">Sikker håndtering af depositum og lejemidler</p>
        </div>
        <Link
          href="/nest/create-simple"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
        >
          + Ny Deponering
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Værdi</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalValueManaged)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Aktive Depoter</p>
              <p className="text-2xl font-bold text-slate-800">{activeEscrows.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Afventende</p>
              <p className="text-2xl font-bold text-slate-800">{pendingEscrows.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Ventende Godkendelser</p>
              <p className="text-2xl font-bold text-slate-800">{pendingApprovals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-orange-800">Du har {pendingApprovals.length} ventende godkendelse(r)</h3>
              <p className="text-sm text-orange-600">Disse kræver din handling før de kan fortsætte</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 3).map((approval) => (
              <div key={approval.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {approval.transaction ? 
                      `${approval.transaction.type} - ${formatCurrency(approval.transaction.amount)}` :
                      `Frigivelsesregel - ${formatCurrency(approval.releaseRule?.amount || 0)}`
                    }
                  </p>
                  <p className="text-sm text-slate-600">
                    Fra: {approval.escrow.landlord.firstName} {approval.escrow.landlord.lastName} 
                    til {approval.escrow.tenant.firstName} {approval.escrow.tenant.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Frist: {new Date(approval.deadline).toLocaleDateString('da-DK')}
                  </p>
                </div>
                <Link
                  href={`/nest/escrows/${approval.escrow.id}/approve/${approval.id}`}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Godkend
                </Link>
              </div>
            ))}
            {pendingApprovals.length > 3 && (
              <Link
                href="/nest/approvals"
                className="block text-center text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Se alle {pendingApprovals.length} godkendelser →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Oversigt', count: escrows.length },
            { id: 'active', label: 'Aktive', count: activeEscrows.length },
            { id: 'pending', label: 'Afventende', count: pendingEscrows.length },
            { id: 'history', label: 'Historik', count: escrows.filter(e => e.status === 'FULLY_RELEASED').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs
                  ${activeTab === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {escrows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Ingen deponeringer endnu</h3>
            <p className="text-slate-600 mb-6">Opret din første Nest deponering for at komme i gang</p>
            <Link
              href="/nest/create-simple"
              className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              + Opret Deponering
            </Link>
          </div>
        ) : (
          escrows
            .filter(escrow => {
              if (activeTab === 'active') return ['ACTIVE', 'PARTIAL_RELEASED'].includes(escrow.status)
              if (activeTab === 'pending') return escrow.status === 'PENDING'
              if (activeTab === 'history') return escrow.status === 'FULLY_RELEASED'
              return true // overview shows all
            })
            .map((escrow) => (
              <div key={escrow.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{formatCurrency(escrow.totalAmount)}</h3>
                      <p className="text-sm text-slate-600">
                        {escrow.landlord.firstName} {escrow.landlord.lastName} → {escrow.tenant.firstName} {escrow.tenant.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
                      {getStatusText(escrow.status)}
                    </span>
                    <Link
                      href={`/nest/escrows/${escrow.id}`}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Se detaljer →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Depositum</p>
                    <p className="font-medium">{formatCurrency(escrow.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Transaktioner</p>
                    <p className="font-medium">{escrow._count.transactions}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Oprettet</p>
                    <p className="font-medium">{new Date(escrow.createdAt).toLocaleDateString('da-DK')}</p>
                  </div>
                </div>

                {escrow._count.approvals > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {escrow._count.approvals} ventende godkendelse(r)
                    </p>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  )
}