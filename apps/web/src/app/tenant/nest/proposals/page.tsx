'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface LandlordInvitation {
  id: string
  status: string
  landlordName: string
  landlordEmail: string
  propertyAddress?: string
  subject: string
  message: string
  expiresAt: string
  createdAt: string
  nestEscrow?: {
    id: string
    status: string
    totalAmount: number
    propertyAddress: string
  }
}

export default function TenantNestProposalsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [proposals, setProposals] = useState<LandlordInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchProposals()
  }, [user, router])

  const fetchProposals = async () => {
    try {
      const response = await api.get('/tenant/invitations')
      setProposals(response.data.invitations)
    } catch (error: any) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('da-DK')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const getStatusBadge = (invitation: LandlordInvitation) => {
    const isExpired = new Date(invitation.expiresAt) < new Date()
    
    const statusConfig = {
      'PENDING': isExpired 
        ? { color: 'bg-red-100 text-red-700', text: 'Udløbet' }
        : { color: 'bg-yellow-100 text-yellow-700', text: 'Afventer Svar' },
      'ACCEPTED': { color: 'bg-green-100 text-green-700', text: 'Accepteret' },
      'DECLINED': { color: 'bg-red-100 text-red-700', text: 'Afvist' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-700', text: 'Annulleret' }
    }

    const config = statusConfig[invitation.status as keyof typeof statusConfig] || 
                   { color: 'bg-slate-100 text-slate-700', text: invitation.status }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div>Indlæser...</div>
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                📋 Mine Udlejer Invitationer
              </h1>
              <p className="text-slate-600 mt-1">
                Oversigt over alle dine sendte invitationer til udlejere
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/tenant/nest"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                + Inviter Udlejer
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-slate-800">{proposals.length}</div>
              <div className="text-sm text-slate-600">Total Invitationer</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">
                {proposals.filter(p => p.status === 'PENDING' && new Date(p.expiresAt) > new Date()).length}
              </div>
              <div className="text-sm text-slate-600">Afventer Svar</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-green-600">
                {proposals.filter(p => p.status === 'ACCEPTED').length}
              </div>
              <div className="text-sm text-slate-600">Accepteret</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-red-600">
                {proposals.filter(p => p.status === 'DECLINED' || (p.status === 'PENDING' && new Date(p.expiresAt) < new Date())).length}
              </div>
              <div className="text-sm text-slate-600">Afvist/Udløbet</div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Ingen invitationer sendt endnu
            </h2>
            <p className="text-slate-600 mb-6">
              Du har ikke sendt nogle invitationer til udlejere endnu.
            </p>
            <Link
              href="/tenant/nest"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Inviter Din Første Udlejer
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Invitation Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {invitation.landlordName}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {invitation.landlordEmail}
                        </p>
                        {invitation.propertyAddress && (
                          <p className="text-sm text-slate-500">
                            📍 {invitation.propertyAddress}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(invitation)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-slate-500">Sendt</span>
                        <div className="font-semibold text-slate-800">
                          {formatDate(invitation.createdAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Udløber</span>
                        <div className="font-semibold text-slate-800">
                          {formatDate(invitation.expiresAt)}
                        </div>
                      </div>
                      {invitation.nestEscrow && (
                        <div>
                          <span className="text-xs text-slate-500">Nest Status</span>
                          <div className="font-semibold text-slate-800">
                            {invitation.nestEscrow.status}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Preview */}
                    {invitation.message && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {invitation.message}
                        </p>
                      </div>
                    )}

                    {/* Nest Info if created */}
                    {invitation.nestEscrow && (
                      <div className="text-sm text-green-700 bg-green-50 rounded-lg p-2">
                        ✅ Nest depositum oprettet! Total: {formatCurrency(invitation.nestEscrow.totalAmount)} DKK
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                    {invitation.nestEscrow ? (
                      <Link
                        href={`/nest/escrows/${invitation.nestEscrow.id}`}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Se Nest
                      </Link>
                    ) : invitation.status === 'PENDING' && new Date(invitation.expiresAt) > new Date() ? (
                      <button
                        onClick={() => {
                          // TODO: Implement resend functionality
                          alert('Gensend invitation funktionalitet kommer snart')
                        }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Gensend
                      </button>
                    ) : invitation.status === 'PENDING' && new Date(invitation.expiresAt) < new Date() ? (
                      <button
                        onClick={() => {
                          // TODO: Implement resend functionality
                          alert('Send ny invitation funktionalitet kommer snart')
                        }}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Send Igen
                      </button>
                    ) : (
                      <div className="text-center text-sm text-slate-500 px-4 py-2">
                        {invitation.status === 'DECLINED' ? 'Afvist' : 'Færdig'}
                      </div>
                    )}

                    {invitation.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          if (confirm('Er du sikker på at du vil annullere denne invitation?')) {
                            try {
                              await api.delete(`/tenant/invitations/${invitation.id}`)
                              fetchProposals() // Refresh list
                            } catch (error) {
                              alert('Fejl ved annullering af invitation')
                            }
                          }
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Annuller
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Link */}
        <div className="mt-8 text-center">
          <Link
            href="/tenant/profile"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Tilbage til Min Profil
          </Link>
        </div>
        </div>
      </div>
    </>
  )
}