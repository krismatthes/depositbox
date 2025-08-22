'use client'

import { useState } from 'react'
import DummyPaymentFlow from './DummyPaymentFlow'

interface InvitationDetailsModalProps {
  invitation: any
  isOpen: boolean
  onClose: () => void
  onAccept: (invitationId: string) => Promise<void>
  onReject: (invitationId: string) => Promise<void>
  processing?: boolean
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount
  return (numAmount / 100).toLocaleString('da-DK')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ikke angivet'
  return new Date(dateString).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getReleaseTypeLabel = (type: string) => {
  switch (type) {
    case 'LEASE_END':
      return 'Ved lejemålets ophør'
    case 'START_DATE':
      return 'Ved indflytningsdato'
    case 'SPECIFIC_DATE':
      return 'På specifik dato'
    case 'MANUAL':
      return 'Manuel frigivelse'
    case 'MOVE_IN_PLUS_5':
      return '5 dage efter indflytning'
    default:
      return type
  }
}

export default function InvitationDetailsModal({ 
  invitation, 
  isOpen, 
  onClose, 
  onAccept, 
  onReject,
  processing = false 
}: InvitationDetailsModalProps) {
  const [acceptingInvitation, setAcceptingInvitation] = useState(false)
  const [rejectingInvitation, setRejectingInvitation] = useState(false)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)

  if (!isOpen || !invitation) return null

  const handleAccept = async () => {
    // Show payment flow instead of immediately accepting
    setShowPaymentFlow(true)
  }

  const handlePaymentComplete = async (escrowId: string) => {
    console.log('Payment completed, accepting invitation:', invitation.id)
    setAcceptingInvitation(true)
    setShowPaymentFlow(false) // Close payment flow first
    try {
      await onAccept(invitation.id)
      onClose() // Close the invitation details modal after successful payment
    } catch (error) {
      console.error('Failed to accept invitation:', error)
    } finally {
      setAcceptingInvitation(false)
    }
  }

  const handleReject = async () => {
    setRejectingInvitation(true)
    try {
      await onReject(invitation.id)
      onClose()
    } catch (error) {
      console.error('Failed to reject invitation:', error)
    } finally {
      setRejectingInvitation(false)
    }
  }

  const serviceFee = invitation.fees?.serviceFee || Math.max(19900, Math.min(79900, (invitation.totalAmount || 0) * 0.03))
  const totalWithFee = (invitation.totalAmount || 0) + serviceFee

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6 text-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Invitation til Nest</h2>
                <p className="text-blue-100 text-lg">
                  {invitation.propertyAddress || 'Ny boliginvitation'}
                </p>
                <p className="text-blue-200 text-sm">
                  Fra: {invitation.landlord?.firstName} {invitation.landlord?.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Property Information */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Ejendomsoplysninger</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Adresse:</span>
                    <span className="font-semibold">{invitation.propertyAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-semibold">
                      {invitation.propertyType === 'LEJLIGHED' ? 'Lejlighed' : invitation.propertyType}
                    </span>
                  </div>
                  {invitation.propertyDetails?.size && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Størrelse:</span>
                      <span className="font-semibold">{invitation.propertyDetails.size} m²</span>
                    </div>
                  )}
                  {invitation.propertyDetails?.rooms && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Værelser:</span>
                      <span className="font-semibold">{invitation.propertyDetails.rooms}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {invitation.propertyDetails?.facilities && (
                  <div>
                    <div className="text-slate-600 mb-2">Faciliteter:</div>
                    <div className="flex flex-wrap gap-2">
                      {invitation.propertyDetails.facilities.map((facility: string, index: number) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {invitation.propertyDetails?.description && (
                  <div className="mt-4">
                    <div className="text-slate-600 mb-2">Beskrivelse:</div>
                    <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border">
                      {invitation.propertyDetails.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Landlord Information */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Udlejer</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Navn:</span>
                  <span className="font-semibold">
                    {invitation.landlordName || (invitation.landlord?.firstName && invitation.landlord?.lastName ? 
                      `${invitation.landlord.firstName} ${invitation.landlord.lastName}` : 
                      'Udlejer navn')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email:</span>
                  <span className="font-semibold">{invitation.landlordEmail || invitation.landlord?.email}</span>
                </div>
              </div>
              
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Betalingsoplysninger</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-slate-800 mb-3">Hvad skal betales:</h4>
                <div className="space-y-2">
                  {invitation.depositAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Depositum:</span>
                      <span className="font-semibold">{formatCurrency(invitation.depositAmount)} DKK</span>
                    </div>
                  )}
                  {invitation.firstMonthAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">1. måneds leje:</span>
                      <span className="font-semibold">{formatCurrency(invitation.firstMonthAmount)} DKK</span>
                    </div>
                  )}
                  {invitation.prepaidAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Forudbetalt leje:</span>
                      <span className="font-semibold">{formatCurrency(invitation.prepaidAmount)} DKK</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-slate-800">Deponering total:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(invitation.totalAmount)} DKK</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Service gebyr (3%):</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(serviceFee)} DKK</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl">
                      <span className="font-bold text-slate-900">Du betaler i alt:</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalWithFee)} DKK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Release Conditions */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-slate-800 mb-3">Hvornår frigives pengene:</h4>
                <div className="space-y-3">
                  {invitation.depositAmount > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Depositum ({formatCurrency(invitation.depositAmount)} DKK)</div>
                        <div className="text-sm text-slate-600">
                          {getReleaseTypeLabel(invitation.releaseConditions?.depositReleaseType || 'LEASE_END')}
                          {invitation.releaseConditions?.depositReleaseDate && (
                            <span> - {formatDate(invitation.releaseConditions.depositReleaseDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invitation.firstMonthAmount > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">1. måneds leje ({formatCurrency(invitation.firstMonthAmount)} DKK)</div>
                        <div className="text-sm text-slate-600">
                          {getReleaseTypeLabel(invitation.releaseConditions?.firstMonthReleaseType || 'START_DATE')}
                          {invitation.releaseConditions?.firstMonthReleaseDate && (
                            <span> - {formatDate(invitation.releaseConditions.firstMonthReleaseDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invitation.prepaidAmount > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Forudbetalt leje ({formatCurrency(invitation.prepaidAmount)} DKK)</div>
                        <div className="text-sm text-slate-600">
                          {getReleaseTypeLabel(invitation.releaseConditions?.prepaidReleaseType || 'START_DATE')}
                          {invitation.releaseConditions?.prepaidReleaseDate && (
                            <span> - {formatDate(invitation.releaseConditions.prepaidReleaseDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              {invitation.conditions && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-slate-800 mb-3">Vigtige betingelser:</h4>
                  <ul className="space-y-2">
                    {invitation.conditions.map((condition: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Contract Period */}
          {(invitation.startDate || invitation.endDate) && (
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Lejeperiode</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invitation.startDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Indflytning:</span>
                    <span className="font-semibold">{formatDate(invitation.startDate)}</span>
                  </div>
                )}
                {invitation.endDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fraflytning:</span>
                    <span className="font-semibold">{formatDate(invitation.endDate)}</span>
                  </div>
                )}
              </div>
              
              {invitation.isTimeLimited && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.182 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-amber-800 font-medium">
                      Dette er et tidsbegrænset lejemål
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expiry Information */}
          {invitation.expiresAt && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-semibold text-orange-800">Invitation udløber</div>
                  <div className="text-sm text-orange-700">
                    {formatDate(invitation.expiresAt)} - Husk at svare i tide!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Luk
            </button>
            <button
              onClick={handleReject}
              disabled={acceptingInvitation || rejectingInvitation || processing}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {rejectingInvitation ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Afvis'
              )}
            </button>
            <button
              onClick={handleAccept}
              disabled={acceptingInvitation || rejectingInvitation || processing}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {acceptingInvitation ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Acceptér og betal'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Flow Modal */}
      <DummyPaymentFlow
        invitation={invitation}
        isOpen={showPaymentFlow}
        onClose={() => setShowPaymentFlow(false)}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}