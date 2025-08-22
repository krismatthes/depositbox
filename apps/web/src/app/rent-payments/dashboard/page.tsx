'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

interface RentPayment {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  landlordId: string
  landlordName: string
  landlordEmail: string
  propertyAddress: string
  amount: number
  dueDate: string
  paidDate?: string
  paymentMethod?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  receiptNumber?: string
  createdAt: string
}

interface RentAgreement {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  landlordId: string
  landlordName: string
  landlordEmail: string
  propertyAddress: string
  monthlyRent: number
  dueDate: number // day of month
  isActive: boolean
  createdAt: string
}

export default function RentPaymentsDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<RentPayment[]>([])
  const [agreements, setAgreements] = useState<RentAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPaid: 0,
    nextPayment: 0,
    overdue: 0,
    monthlyReceived: 0,
    outstanding: 0
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadData()
  }, [user, router])

  const loadData = () => {
    if (typeof window !== 'undefined' && user) {
      // Load rent agreements
      const savedAgreements = localStorage.getItem('rent_agreements') || '[]'
      let allAgreements = JSON.parse(savedAgreements)
      
      // Load rent payments
      const savedPayments = localStorage.getItem('rent_payments') || '[]'
      let allPayments = JSON.parse(savedPayments)

      // Create dummy data if none exists
      if (allAgreements.length === 0) {
        const dummyAgreement: RentAgreement = {
          id: `dummy-agreement-${user.id}`,
          tenantId: user.role === 'TENANT' ? user.id : 'dummy-landlord-id',
          tenantName: user.role === 'TENANT' ? `${user.firstName} ${user.lastName}` : 'Anna Nielsen',
          tenantEmail: user.role === 'TENANT' ? user.email : 'anna@tenant.dk',
          landlordId: user.role === 'LANDLORD' ? user.id : 'dummy-tenant-id',
          landlordName: user.role === 'LANDLORD' ? `${user.firstName} ${user.lastName}` : 'Peter Larsen',
          landlordEmail: user.role === 'LANDLORD' ? user.email : 'peter@landlord.dk',
          propertyAddress: 'Eksempel Vej 123, 2100 København Ø',
          monthlyRent: 1500000, // 15,000 DKK in øre
          dueDate: 1,
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          acceptedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days ago
        }

        allAgreements = [dummyAgreement]
        localStorage.setItem('rent_agreements', JSON.stringify(allAgreements))

        // Create some dummy payments
        const now = new Date()
        const dummyPayments: RentPayment[] = [
          // Last month - PAID
          {
            id: `dummy-payment-1-${user.id}`,
            tenantId: dummyAgreement.tenantId,
            tenantName: dummyAgreement.tenantName,
            tenantEmail: dummyAgreement.tenantEmail,
            landlordId: dummyAgreement.landlordId,
            landlordName: dummyAgreement.landlordName,
            landlordEmail: dummyAgreement.landlordEmail,
            propertyAddress: dummyAgreement.propertyAddress,
            amount: dummyAgreement.monthlyRent,
            dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
            paidDate: new Date(now.getFullYear(), now.getMonth() - 1, 1, 10, 30).toISOString(),
            paymentMethod: 'MobilePay',
            status: 'PAID',
            receiptNumber: 'HSL-12345678',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString()
          },
          // This month - PAID
          {
            id: `dummy-payment-2-${user.id}`,
            tenantId: dummyAgreement.tenantId,
            tenantName: dummyAgreement.tenantName,
            tenantEmail: dummyAgreement.tenantEmail,
            landlordId: dummyAgreement.landlordId,
            landlordName: dummyAgreement.landlordName,
            landlordEmail: dummyAgreement.landlordEmail,
            propertyAddress: dummyAgreement.propertyAddress,
            amount: dummyAgreement.monthlyRent,
            dueDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            paidDate: new Date(now.getFullYear(), now.getMonth(), 1, 14, 15).toISOString(),
            paymentMethod: 'Betalingskort',
            status: 'PAID',
            receiptNumber: 'HSL-23456789',
            createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()
          },
          // Next month - PENDING
          {
            id: `dummy-payment-3-${user.id}`,
            tenantId: dummyAgreement.tenantId,
            tenantName: dummyAgreement.tenantName,
            tenantEmail: dummyAgreement.tenantEmail,
            landlordId: dummyAgreement.landlordId,
            landlordName: dummyAgreement.landlordName,
            landlordEmail: dummyAgreement.landlordEmail,
            propertyAddress: dummyAgreement.propertyAddress,
            amount: dummyAgreement.monthlyRent,
            dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ]

        allPayments = dummyPayments
        localStorage.setItem('rent_payments', JSON.stringify(allPayments))
      }

      let filteredAgreements: RentAgreement[] = []
      let filteredPayments: RentPayment[] = []

      if (user.role === 'TENANT') {
        filteredAgreements = allAgreements.filter((a: RentAgreement) => a.tenantId === user.id)
        filteredPayments = allPayments.filter((p: RentPayment) => p.tenantId === user.id)
      } else if (user.role === 'LANDLORD') {
        filteredAgreements = allAgreements.filter((a: RentAgreement) => a.landlordId === user.id)
        filteredPayments = allPayments.filter((p: RentPayment) => p.landlordId === user.id)
      }

      setAgreements(filteredAgreements)
      setPayments(filteredPayments)
      calculateStats(filteredPayments, filteredAgreements)
    }
    setLoading(false)
  }

  const calculateStats = (payments: RentPayment[], agreements: RentAgreement[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    if (user?.role === 'TENANT') {
      const totalPaid = payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)

      const nextPayment = payments
        .filter(p => p.status === 'PENDING' && new Date(p.dueDate) >= now)
        .reduce((sum, p) => sum + p.amount, 0)

      const overdue = payments
        .filter(p => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0)

      setStats({
        totalPaid,
        nextPayment,
        overdue,
        monthlyReceived: 0,
        outstanding: 0
      })
    } else {
      const monthlyReceived = payments
        .filter(p => {
          if (p.status !== 'PAID' || !p.paidDate) return false
          const paidDate = new Date(p.paidDate)
          return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
        })
        .reduce((sum, p) => sum + p.amount, 0)

      const outstanding = payments
        .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0)

      setStats({
        totalPaid: 0,
        nextPayment: 0,
        overdue: 0,
        monthlyReceived,
        outstanding
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-50'
      case 'PENDING': return 'text-blue-600 bg-blue-50'
      case 'OVERDUE': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Betalt'
      case 'PENDING': return 'Afventer'
      case 'OVERDUE': return 'Forfaldet'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Huslejebetalinger</h1>
                <p className="text-slate-600 mt-1">
                  {user?.role === 'TENANT' ? 'Administrer dine huslejebetalinger' : 'Administrer huslejeindbetaling'}
                </p>
              </div>
            </div>
          </div>

          {agreements.length === 0 ? (
            // No agreements - setup flow
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {user?.role === 'TENANT' ? 'Inviter Udlejer til Digital Husleje' : 'Inviter Lejer til Digital Husleje'}
              </h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                {user?.role === 'TENANT' 
                  ? 'Send en invitation til din udlejer for at aktivere automatisk husleje betaling med kvitteringer og overblik.'
                  : 'Send en invitation til din lejer for at aktivere digital huslejemodtagelse med transparens og notifikationer.'}
              </p>
              <button
                onClick={() => {
                  // Check if tenant already has active agreement before allowing invitation
                  if (user?.role === 'TENANT') {
                    const savedAgreements = localStorage.getItem('rent_agreements') || '[]'
                    const allAgreements = JSON.parse(savedAgreements)
                    const userAgreements = allAgreements.filter((a: any) => a.tenantId === user.id && a.isActive)
                    if (userAgreements.length > 0) {
                      alert('Du har allerede en aktiv husleje aftale. Gå til indstillinger for at administrere den.')
                      router.push('/rent-payments/settings')
                      return
                    }
                  }
                  router.push('/rent-payments/invite')
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {user?.role === 'TENANT' ? 'Inviter Udlejer' : 'Inviter Lejer'}
              </button>
            </div>
          ) : (
            // Active agreements - dashboard view
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {user?.role === 'TENANT' ? (
                  <>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Betalt i alt</p>
                          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalPaid)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Næste betaling</p>
                          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.nextPayment)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Forfaldet</p>
                          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.overdue)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Månedens indbetaling</p>
                          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.monthlyReceived)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Udestående</p>
                          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.outstanding)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Aktive lejere</p>
                          <p className="text-2xl font-bold text-slate-800">{agreements.length}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recent Payments */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      {user?.role === 'TENANT' ? 'Mine Betalinger' : 'Betalingsoversigt'}
                    </h2>
                    <button
                      onClick={() => router.push('/rent-payments/history')}
                      className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
                    >
                      Se alle →
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-600">Ingen betalinger endnu</p>
                    </div>
                  ) : (
                    payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-slate-800">
                                {user?.role === 'TENANT' ? payment.propertyAddress : payment.tenantName}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {getStatusText(payment.status)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {user?.role === 'TENANT' ? (
                                <>
                                  Forfald: {formatDate(payment.dueDate)}
                                  {payment.paidDate && ` • Betalt: ${formatDate(payment.paidDate)}`}
                                  {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                                </>
                              ) : (
                                <>
                                  {payment.propertyAddress} • Forfald: {formatDate(payment.dueDate)}
                                  {payment.paidDate && ` • Modtaget: ${formatDate(payment.paidDate)}`}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">{formatCurrency(payment.amount)}</p>
                            {payment.receiptNumber && (
                              <p className="text-xs text-slate-500">#{payment.receiptNumber}</p>
                            )}
                          </div>
                        </div>
                        
                        {user?.role === 'TENANT' && payment.status === 'PENDING' && (
                          <div className="mt-4">
                            <button
                              onClick={() => router.push(`/rent-payments/pay/${payment.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Betal Nu
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => router.push('/rent-payments/history')}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Betalingshistorik</h3>
                      <p className="text-slate-600 text-sm">Se alle betalinger og download kvitteringer</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/rent-payments/settings')}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Indstillinger</h3>
                      <p className="text-slate-600 text-sm">
                        {user?.role === 'TENANT' 
                          ? 'Administrer betalingsmetoder og notifikationer'
                          : 'Administrer konti og notifikationer'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}