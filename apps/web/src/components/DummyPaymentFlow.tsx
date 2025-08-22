'use client'

import { useState, useEffect } from 'react'

interface DummyPaymentFlowProps {
  invitation: any
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: (escrowId: string) => void
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount
  return (numAmount / 100).toLocaleString('da-DK')
}

export default function DummyPaymentFlow({ 
  invitation, 
  isOpen, 
  onClose, 
  onPaymentComplete 
}: DummyPaymentFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setProcessing(false)
      setCardDetails({ number: '', expiry: '', cvv: '', name: '' })
    }
  }, [isOpen])

  if (!isOpen || !invitation) return null

  const serviceFee = invitation.fees?.serviceFee || Math.max(19900, Math.min(79900, (invitation.totalAmount || 0) * 0.03))
  const totalWithFee = (invitation.totalAmount || 0) + serviceFee

  const handlePayment = async () => {
    setProcessing(true)
    
    // Simulate payment processing steps (faster for better UX)
    setCurrentStep(2) // Processing
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setCurrentStep(3) // Bank authentication
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    setCurrentStep(4) // Payment confirmation
    await new Promise(resolve => setTimeout(resolve, 600))
    
    setCurrentStep(5) // Success
    
    // Immediately trigger escrow creation for faster UX
    setTimeout(() => {
      onPaymentComplete('new-escrow-id')
      onClose()
    }, 1000)
  }

  const handleCardInputChange = (field: string, value: string) => {
    if (field === 'number') {
      // Format card number with spaces
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      if (value.length > 19) return
    } else if (field === 'expiry') {
      // Format MM/YY
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
      if (value.length > 5) return
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '')
      if (value.length > 3) return
    }
    
    setCardDetails(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return cardDetails.number.replace(/\s/g, '').length === 16 &&
           cardDetails.expiry.length === 5 &&
           cardDetails.cvv.length === 3 &&
           cardDetails.name.length > 0
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 text-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                {currentStep <= 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ) : currentStep <= 4 ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentStep === 1 && 'Betaling via PayProff'}
                  {currentStep === 2 && 'Behandler betaling...'}
                  {currentStep === 3 && 'Bank godkendelse...'}
                  {currentStep === 4 && 'Bekræfter betaling...'}
                  {currentStep === 5 && 'Betaling gennemført!'}
                </h2>
                <p className="text-green-100">
                  {invitation.propertyAddress || 'Nest deponering'}
                </p>
                <p className="text-green-200 text-sm">
                  Total: {formatCurrency(totalWithFee)} DKK
                </p>
              </div>
            </div>
            {currentStep === 1 && (
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Payment Form */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Betalingsoversigt</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nest deponering:</span>
                    <span className="font-semibold">{formatCurrency(invitation.totalAmount)} DKK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service gebyr:</span>
                    <span className="font-semibold">{formatCurrency(serviceFee)} DKK</span>
                  </div>
                  <div className="border-t pt-2 border-slate-200">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalWithFee)} DKK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Details Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Betalingsoplysninger</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kortnummer
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => handleCardInputChange('number', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Udløb (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12/25"
                      value={cardDetails.expiry}
                      onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Navn på kort
                  </label>
                  <input
                    type="text"
                    placeholder="Dit fulde navn"
                    value={cardDetails.name}
                    onChange={(e) => handleCardInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Sikker betaling</div>
                    <div className="text-blue-700 text-sm">
                      Dine betalingsoplysninger er krypterede og sikre. Pengene holdes i sikker deponering indtil betingelserne er opfyldt.
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={!isFormValid() || processing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Betal {formatCurrency(totalWithFee)} DKK
              </button>
            </div>
          )}

          {/* Step 2-4: Processing States */}
          {(currentStep >= 2 && currentStep <= 4) && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                {currentStep === 2 && 'Behandler din betaling...'}
                {currentStep === 3 && 'Venter på bank godkendelse...'}
                {currentStep === 4 && 'Bekræfter betaling...'}
              </h3>
              
              <div className="text-slate-600 mb-8">
                {currentStep === 2 && 'Vi behandler dine betalingsoplysninger sikkert.'}
                {currentStep === 3 && 'Din bank skal godkende betalingen. Dette kan tage et øjeblik.'}
                {currentStep === 4 && 'Betalingen er ved at blive bekræftet og Nest\'en oprettes.'}
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200'
                }`}>
                  {currentStep > 2 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '1'
                  )}
                </div>
                <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-green-500' : 'bg-slate-200'} rounded`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200'
                }`}>
                  {currentStep > 3 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '2'
                  )}
                </div>
                <div className={`w-12 h-1 ${currentStep >= 4 ? 'bg-green-500' : 'bg-slate-200'} rounded`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-slate-200'
                }`}>
                  {currentStep > 4 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '3'
                  )}
                </div>
              </div>

              <div className="text-sm text-slate-500">
                Luk ikke denne side mens betalingen behandles
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-bold text-green-600 mb-4">
                Betaling gennemført!
              </h3>
              
              <div className="text-slate-600 mb-8 space-y-2">
                <p className="text-lg">Din Nest er nu oprettet og aktiv.</p>
                <p>Beløbet på <strong>{formatCurrency(totalWithFee)} DKK</strong> er betalt og holdes sikkert i deponering.</p>
                <p className="text-sm">Du vil modtage en bekræftelse på email kort.</p>
              </div>

              {/* Next Steps */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-green-800 mb-3">Næste skridt:</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    1. måneds leje frigives automatisk på indflytningsdatoen
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    Depositum frigives når du flytter ud (hvis alt er i orden)
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    Du kan følge status på dit dashboard
                  </li>
                </ul>
              </div>

              <div className="text-sm text-slate-500">
                Denne side lukker automatisk om få sekunder...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}