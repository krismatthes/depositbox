'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
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

export default function PayRentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [payment, setPayment] = useState<RentPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Card details
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  })

  // MobilePay data
  const [mobilepayPhone, setMobilepayPhone] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'TENANT') {
      router.push('/dashboard')
      return
    }
    loadPayment()
  }, [id, user, router])

  const loadPayment = () => {
    if (typeof window !== 'undefined' && id) {
      try {
        const savedPayments = localStorage.getItem('rent_payments')
        if (savedPayments) {
          const payments = JSON.parse(savedPayments)
          const foundPayment = payments.find((p: RentPayment) => p.id === id && p.tenantId === user?.id)
          if (foundPayment && foundPayment.status === 'PENDING') {
            setPayment(foundPayment)
          } else {
            router.push('/rent-payments/dashboard')
          }
        }
      } catch (error) {
        console.error('Error loading payment:', error)
        router.push('/rent-payments/dashboard')
      }
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount / 100) // Convert from øre to DKK
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      // Remove all non-digits and add spaces every 4 digits
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
      if (formattedValue.length > 19) return // Max 16 digits + 3 spaces
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4)
    } else if (field === 'expiryMonth' || field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '')
      if (field === 'expiryMonth') {
        formattedValue = formattedValue.substring(0, 2)
      } else {
        formattedValue = formattedValue.substring(0, 4)
      }
    }

    setCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }

  const processPayment = async () => {
    if (!payment) return

    setProcessing(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate receipt number
    const receiptNumber = `HSL-${Date.now().toString().slice(-8)}`

    // Update payment status
    const updatedPayment = {
      ...payment,
      status: 'PAID' as const,
      paidDate: new Date().toISOString(),
      paymentMethod: getPaymentMethodText(),
      receiptNumber
    }

    // Save updated payment
    if (typeof window !== 'undefined') {
      try {
        const savedPayments = localStorage.getItem('rent_payments')
        if (savedPayments) {
          const payments = JSON.parse(savedPayments)
          const updatedPayments = payments.map((p: RentPayment) => 
            p.id === payment.id ? updatedPayment : p
          )
          localStorage.setItem('rent_payments', JSON.stringify(updatedPayments))
        }
      } catch (error) {
        console.error('Error updating payment:', error)
      }
    }

    setProcessing(false)
    setShowSuccess(true)
  }

  const getPaymentMethodText = () => {
    switch (paymentMethod) {
      case 'card': return 'Betalingskort'
      case 'mobilepay': return 'MobilePay'
      case 'bank': return 'Bankoverførsel'
      default: return paymentMethod
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Betaling ikke fundet</h1>
            <button
              onClick={() => router.push('/rent-payments/dashboard')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Tilbage til Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  if (showSuccess) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Betaling Gennemført!</h1>
                    <p className="text-green-100">Din husleje er betalt succesfuldt</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-green-800 mb-1">
                          Betaling til {payment.landlordName}
                        </div>
                        <div className="text-green-700 text-sm">
                          {formatCurrency(payment.amount)} er overført via {getPaymentMethodText()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3">Kvitteringsdetaljer</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Kvitteringsnummer:</dt>
                        <dd className="font-medium">{payment.receiptNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ejendom:</dt>
                        <dd className="font-medium">{payment.propertyAddress}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Beløb:</dt>
                        <dd className="font-medium">{formatCurrency(payment.amount)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Betalingsmetode:</dt>
                        <dd className="font-medium">{getPaymentMethodText()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Betalingsdato:</dt>
                        <dd className="font-medium">{formatDate(new Date().toISOString())}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push('/rent-payments/dashboard')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Tilbage til Dashboard
                    </button>
                    <button
                      onClick={() => {
                        // Download receipt (placeholder)
                        const receiptData = {
                          receiptNumber: payment.receiptNumber,
                          propertyAddress: payment.propertyAddress,
                          amount: payment.amount,
                          paymentMethod: getPaymentMethodText(),
                          date: new Date().toISOString()
                        }
                        const dataStr = JSON.stringify(receiptData, null, 2)
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                        const exportFileDefaultName = `kvittering-${payment.receiptNumber}.json`
                        
                        const linkElement = document.createElement('a')
                        linkElement.setAttribute('href', dataUri)
                        linkElement.setAttribute('download', exportFileDefaultName)
                        linkElement.click()
                      }}
                      className="px-6 py-3 border border-green-600 text-green-600 bg-white hover:bg-green-50 rounded-lg font-semibold transition-colors"
                    >
                      Download Kvittering
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/rent-payments/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage til Dashboard
            </button>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Betal Husleje</h1>
              <p className="text-slate-600">{payment.propertyAddress}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Til betaling</p>
                  <p className="text-2xl font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Forfald</p>
                  <p className="font-semibold text-slate-800">{formatDate(payment.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Vælg Betalingsmetode</h2>
            </div>
            
            <div className="p-6">
              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Betalingskort</div>
                        <div className="text-sm text-slate-600">Visa, Mastercard</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobilepay"
                      checked={paymentMethod === 'mobilepay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">MobilePay</div>
                        <div className="text-sm text-slate-600">Hurtig betaling</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Bankoverførsel</div>
                        <div className="text-sm text-slate-600">Direkte fra bankkonto</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Details Forms */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Kortoplysninger</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kortnummer *
                    </label>
                    <input
                      type="text"
                      value={cardData.cardNumber}
                      onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Måned *
                      </label>
                      <input
                        type="text"
                        value={cardData.expiryMonth}
                        onChange={(e) => handleCardInputChange('expiryMonth', e.target.value)}
                        placeholder="12"
                        maxLength={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        År *
                      </label>
                      <input
                        type="text"
                        value={cardData.expiryYear}
                        onChange={(e) => handleCardInputChange('expiryYear', e.target.value)}
                        placeholder="2025"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={cardData.cvv}
                        onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kortholders navn *
                    </label>
                    <input
                      type="text"
                      value={cardData.cardholderName}
                      onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'mobilepay' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">MobilePay oplysninger</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Telefonnummer tilknyttet MobilePay *
                    </label>
                    <input
                      type="tel"
                      value={mobilepayPhone}
                      onChange={(e) => setMobilepayPhone(e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-purple-800 mb-1">Sådan fungerer det</div>
                        <div className="text-purple-700 text-sm">
                          Du vil modtage en push besked i MobilePay appen for at godkende betalingen.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Bankoverførsel</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-blue-800 mb-2">Overførselsoplysninger</div>
                        <div className="text-blue-700 text-sm space-y-1">
                          <div><strong>Modtager:</strong> {payment.landlordName}</div>
                          <div><strong>Kontonummer:</strong> 1234-567890123</div>
                          <div><strong>Beløb:</strong> {formatCurrency(payment.amount)}</div>
                          <div><strong>Besked:</strong> Husleje {formatDate(payment.dueDate)}</div>
                        </div>
                        <p className="text-blue-600 text-xs mt-2">
                          Overførslen registreres automatisk når den modtages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <div className="mt-8">
                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Behandler betaling...
                    </span>
                  ) : (
                    `Betal ${formatCurrency(payment.amount)}`
                  )}
                </button>
              </div>

              {/* Security Notice */}
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-800 mb-1">Sikker betaling</div>
                    <div className="text-gray-700 text-sm">
                      Alle betalinger er krypteret og PCI-DSS certificeret. 
                      Du modtager automatisk kvittering efter gennemført betaling.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}