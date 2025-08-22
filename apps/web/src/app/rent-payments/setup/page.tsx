'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'

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

export default function RentPaymentSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = user?.role === 'TENANT' ? 3 : 4

  const [formData, setFormData] = useState({
    // Common fields
    propertyAddress: '',
    monthlyRent: '',
    dueDate: 1,
    
    // Tenant fields
    landlordName: '',
    landlordEmail: '',
    landlordPhone: '',
    
    // Landlord fields
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    
    // Payment settings
    paymentMethods: {
      card: false,
      mobilepay: false,
      bank: false
    },
    
    // Bank details (for landlords)
    bankAccount: '',
    mobilepayBusiness: '',
    
    // Notifications
    notifications: {
      email: true,
      sms: false,
      reminderDays: 5
    }
  })

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeSetup = () => {
    const agreementId = `rent-agreement-${Date.now()}`
    
    const agreement: RentAgreement = {
      id: agreementId,
      tenantId: user?.role === 'TENANT' ? user.id : '',
      tenantName: user?.role === 'TENANT' ? `${user.firstName} ${user.lastName}` : formData.tenantName,
      tenantEmail: user?.role === 'TENANT' ? user.email : formData.tenantEmail,
      landlordId: user?.role === 'LANDLORD' ? user.id : '',
      landlordName: user?.role === 'LANDLORD' ? `${user.firstName} ${user.lastName}` : formData.landlordName,
      landlordEmail: user?.role === 'LANDLORD' ? user.email : formData.landlordEmail,
      propertyAddress: formData.propertyAddress,
      monthlyRent: Number(formData.monthlyRent) * 100, // Convert to øre
      dueDate: formData.dueDate,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    // Save agreement
    if (typeof window !== 'undefined') {
      const existingAgreements = localStorage.getItem('rent_agreements') || '[]'
      const agreements = JSON.parse(existingAgreements)
      agreements.push(agreement)
      localStorage.setItem('rent_agreements', JSON.stringify(agreements))

      // Create first payment (next month)
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(formData.dueDate)

      const firstPayment = {
        id: `payment-${Date.now()}`,
        tenantId: agreement.tenantId,
        tenantName: agreement.tenantName,
        tenantEmail: agreement.tenantEmail,
        landlordId: agreement.landlordId,
        landlordName: agreement.landlordName,
        landlordEmail: agreement.landlordEmail,
        propertyAddress: agreement.propertyAddress,
        amount: agreement.monthlyRent,
        dueDate: nextMonth.toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      const existingPayments = localStorage.getItem('rent_payments') || '[]'
      const payments = JSON.parse(existingPayments)
      payments.push(firstPayment)
      localStorage.setItem('rent_payments', JSON.stringify(payments))
    }

    router.push('/rent-payments/dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ejendom Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ejendomsadresse *
                  </label>
                  <input
                    type="text"
                    value={formData.propertyAddress}
                    onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Eksempel Vej 123, 2100 København Ø"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Månedlig husleje (DKK) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15000"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Betaling forfalder (dag i måneden) *
                    </label>
                    <select
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>Den {day}.</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {user?.role === 'TENANT' ? 'Udlejer Information' : 'Lejer Information'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fulde navn *
                  </label>
                  <input
                    type="text"
                    value={user?.role === 'TENANT' ? formData.landlordName : formData.tenantName}
                    onChange={(e) => handleInputChange(
                      user?.role === 'TENANT' ? 'landlordName' : 'tenantName', 
                      e.target.value
                    )}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Peter Larsen"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={user?.role === 'TENANT' ? formData.landlordEmail : formData.tenantEmail}
                    onChange={(e) => handleInputChange(
                      user?.role === 'TENANT' ? 'landlordEmail' : 'tenantEmail',
                      e.target.value
                    )}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="peter@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    value={user?.role === 'TENANT' ? formData.landlordPhone : formData.tenantPhone}
                    onChange={(e) => handleInputChange(
                      user?.role === 'TENANT' ? 'landlordPhone' : 'tenantPhone',
                      e.target.value
                    )}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+45 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        if (user?.role === 'TENANT') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Betalingsmetoder & Notifikationer</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Foretrukne betalingsmetoder *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.card}
                        onChange={(e) => handleInputChange('paymentMethods.card', e.target.checked)}
                        className="mr-3"
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

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.mobilepay}
                        onChange={(e) => handleInputChange('paymentMethods.mobilepay', e.target.checked)}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">MobilePay</div>
                          <div className="text-sm text-slate-600">Hurtig betaling via app</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.bank}
                        onChange={(e) => handleInputChange('paymentMethods.bank', e.target.checked)}
                        className="mr-3"
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

                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Notifikationer</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.email}
                        onChange={(e) => handleInputChange('notifications.email', e.target.checked)}
                        className="mr-3"
                      />
                      Email påmindelser
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.sms}
                        onChange={(e) => handleInputChange('notifications.sms', e.target.checked)}
                        className="mr-3"
                      />
                      SMS påmindelser
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Send påmindelse (dage før forfald)
                      </label>
                      <select
                        value={formData.notifications.reminderDays}
                        onChange={(e) => handleInputChange('notifications.reminderDays', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 dag før</option>
                        <option value={3}>3 dage før</option>
                        <option value={5}>5 dage før</option>
                        <option value={7}>7 dage før</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          // Step 3 for landlords - Payment methods
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Betalingsmetoder til Lejere</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.card}
                      onChange={(e) => handleInputChange('paymentMethods.card', e.target.checked)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Betalingskort</div>
                        <div className="text-sm text-slate-600">Lejere kan betale med Visa/Mastercard</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.mobilepay}
                      onChange={(e) => handleInputChange('paymentMethods.mobilepay', e.target.checked)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">MobilePay</div>
                        <div className="text-sm text-slate-600">Lejere kan betale via MobilePay</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.bank}
                      onChange={(e) => handleInputChange('paymentMethods.bank', e.target.checked)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Bankoverførsel</div>
                        <div className="text-sm text-slate-600">Lejere kan overføre direkte til din konto</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )
        }

      case 4:
        // Step 4 for landlords only - Bank details & notifications
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Modtageroplysninger</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bankkonto (kontonummer) *
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234-567890123"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Til modtagelse af huslejebetalinger</p>
                </div>

                {formData.paymentMethods.mobilepay && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      MobilePay Erhverv nummer
                    </label>
                    <input
                      type="text"
                      value={formData.mobilepayBusiness}
                      onChange={(e) => handleInputChange('mobilepayBusiness', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345678"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-700 mb-3">Notifikationer</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.email}
                    onChange={(e) => handleInputChange('notifications.email', e.target.checked)}
                    className="mr-3"
                  />
                  Email når betaling modtages
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sms}
                    onChange={(e) => handleInputChange('notifications.sms', e.target.checked)}
                    className="mr-3"
                  />
                  SMS når betaling mangler
                </label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-3xl font-bold text-slate-800">
                  {user?.role === 'TENANT' ? 'Opsæt Husleje Betaling' : 'Aktiver Huslejemodul'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {user?.role === 'TENANT' 
                    ? 'Konfigurer automatisk husleje betaling'
                    : 'Opsæt digital huslejemodtagelse'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Skridt {currentStep} af {totalSteps}</span>
                <span className="text-sm text-slate-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 && "Ejendom Information"}
                {currentStep === 2 && (user?.role === 'TENANT' ? "Udlejer Information" : "Lejer Information")}
                {currentStep === 3 && (user?.role === 'TENANT' ? "Betalingsmetoder" : "Tilgængelige Betalingsmetoder")}
                {currentStep === 4 && "Modtageroplysninger"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {currentStep === 1 && "Grundlæggende information om lejemålet"}
                {currentStep === 2 && (user?.role === 'TENANT' ? "Information om din udlejer" : "Information om din lejer")}
                {currentStep === 3 && (user?.role === 'TENANT' ? "Vælg hvordan du vil betale" : "Vælg hvilke betalingsmetoder lejere kan bruge")}
                {currentStep === 4 && "Hvor skal huslejen sendes hen"}
              </p>
            </div>
            
            <div className="p-8">
              {renderStep()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Forrige
                </button>
                
                {currentStep === totalSteps ? (
                  <button
                    onClick={completeSetup}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
                  >
                    Gennemfør Opsætning
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Næste
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}