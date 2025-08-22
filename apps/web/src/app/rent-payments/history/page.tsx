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

export default function RentPaymentsHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadPayments()
  }, [user, router])

  const loadPayments = () => {
    if (typeof window !== 'undefined' && user) {
      try {
        const savedPayments = localStorage.getItem('rent_payments')
        if (savedPayments) {
          const allPayments = JSON.parse(savedPayments)
          let filteredPayments: RentPayment[] = []

          if (user.role === 'TENANT') {
            filteredPayments = allPayments.filter((p: RentPayment) => p.tenantId === user.id)
          } else if (user.role === 'LANDLORD') {
            filteredPayments = allPayments.filter((p: RentPayment) => p.landlordId === user.id)
          }

          setPayments(filteredPayments)
        }
      } catch (error) {
        console.error('Error loading payments:', error)
      }
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('da-DK')} kl. ${date.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
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

  const downloadReceipt = (payment: RentPayment) => {
    if (!payment.receiptNumber) return

    const receiptData = {
      receiptNumber: payment.receiptNumber,
      tenantName: payment.tenantName,
      landlordName: payment.landlordName,
      propertyAddress: payment.propertyAddress,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      dueDate: payment.dueDate,
      paidDate: payment.paidDate,
      status: payment.status
    }

    const dataStr = JSON.stringify(receiptData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `kvittering-${payment.receiptNumber}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const exportAllPayments = () => {
    const exportData = payments.map(payment => ({
      receiptNumber: payment.receiptNumber || 'N/A',
      tenantName: payment.tenantName,
      landlordName: payment.landlordName,
      propertyAddress: payment.propertyAddress,
      amount: formatCurrency(payment.amount),
      paymentMethod: payment.paymentMethod || 'N/A',
      dueDate: formatDate(payment.dueDate),
      paidDate: payment.paidDate ? formatDate(payment.paidDate) : 'N/A',
      status: getStatusText(payment.status)
    }))

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `huslejehistorik-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getFilteredAndSortedPayments = () => {
    let filtered = payments

    // Apply filter
    if (filter === 'paid') {
      filtered = filtered.filter(p => p.status === 'PAID')
    } else if (filter === 'pending') {
      filtered = filtered.filter(p => p.status === 'PENDING')
    } else if (filter === 'overdue') {
      filtered = filtered.filter(p => p.status === 'OVERDUE')
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        case 'date-asc':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredPayments = getFilteredAndSortedPayments()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/rent-payments/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Betalingshistorik</h1>
                <p className="text-slate-600 mt-1">
                  Komplet oversigt over alle {user?.role === 'TENANT' ? 'dine huslejebetalinger' : 'huslejeindbetalinger'}
                </p>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Filter
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Alle betalinger</option>
                    <option value="paid">Betalte</option>
                    <option value="pending">Afventende</option>
                    <option value="overdue">Forfaldne</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sorter efter
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="date-desc">Nyeste først</option>
                    <option value="date-asc">Ældste først</option>
                    <option value="amount-desc">Højeste beløb</option>
                    <option value="amount-asc">Laveste beløb</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              {/* Export */}
              <div className="flex items-end">
                <button
                  onClick={exportAllPayments}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Eksporter Alt
                </button>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {user?.role === 'TENANT' ? 'Mine Betalinger' : 'Modtagne Betalinger'}
                </h2>
                <span className="text-green-100 text-sm">
                  {filteredPayments.length} af {payments.length} betalinger
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Ingen betalinger fundet</h3>
                  <p className="text-slate-600">
                    {filter === 'all' ? 'Der er endnu ingen betalinger i historikken.' : `Ingen betalinger matcher det valgte filter "${filter}".`}
                  </p>
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {user?.role === 'TENANT' ? payment.propertyAddress : payment.tenantName}
                            </h3>
                            <p className="text-slate-600 text-sm">
                              {user?.role === 'TENANT' ? 
                                `Til: ${payment.landlordName}` : 
                                `Ejendom: ${payment.propertyAddress}`
                              }
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Forfald:</span> {formatDate(payment.dueDate)}
                          </div>
                          {payment.paidDate && (
                            <div>
                              <span className="font-medium">Betalt:</span> {formatDateTime(payment.paidDate)}
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <div>
                              <span className="font-medium">Metode:</span> {payment.paymentMethod}
                            </div>
                          )}
                          {payment.receiptNumber && (
                            <div>
                              <span className="font-medium">Kvittering:</span> #{payment.receiptNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {payment.receiptNumber && (
                            <button
                              onClick={() => downloadReceipt(payment)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Kvittering
                            </button>
                          )}
                          
                          {user?.role === 'TENANT' && payment.status === 'PENDING' && (
                            <button
                              onClick={() => router.push(`/rent-payments/pay/${payment.id}`)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Betal Nu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary Stats */}
          {payments.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Betalte</p>
                    <p className="text-xl font-bold text-slate-800">
                      {payments.filter(p => p.status === 'PAID').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Afventende</p>
                    <p className="text-xl font-bold text-slate-800">
                      {payments.filter(p => p.status === 'PENDING').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Forfaldne</p>
                    <p className="text-xl font-bold text-slate-800">
                      {payments.filter(p => p.status === 'OVERDUE').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}