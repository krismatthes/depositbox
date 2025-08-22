'use client'

import { useState } from 'react'

interface Escrow {
  id: string
  amount: string
  currency: string
  status: string
  property?: {
    title: string
    address: string
    moveInDate?: string
  }
  propertyTitle?: string
  propertyAddress?: string
  buyer: {
    firstName: string
    lastName: string
    email: string
  }
  seller: {
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  fundedAt?: string
  releasedAt?: string
  plannedReleaseDate?: string
  payproffHostedUrl?: string
}

interface EscrowCardProps {
  escrow: Escrow
  userRole: 'buyer' | 'seller'
  currentUserId: string
  onRelease?: (escrowId: string) => Promise<void>
}

function getStatusBadge(status: string) {
  const statusStyles = {
    CREATED: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    FUNDED: 'bg-blue-100 text-blue-800 border border-blue-200',
    RELEASED: 'bg-green-100 text-green-800 border border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border border-red-200'
  }
  
  const statusLabels = {
    CREATED: 'Afventer betaling',
    FUNDED: 'Betalt & sikret',
    RELEASED: 'Frigivet',
    CANCELLED: 'Annulleret'
  }
  
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.CREATED
  const label = statusLabels[status as keyof typeof statusLabels] || status
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

function getTimelineStatus(escrow: Escrow) {
  const steps = [
    { 
      key: 'created', 
      label: 'Escrow oprettet', 
      completed: true, 
      date: escrow.createdAt 
    },
    { 
      key: 'funded', 
      label: 'Depositum betalt', 
      completed: !!escrow.fundedAt, 
      date: escrow.fundedAt 
    },
    { 
      key: 'released', 
      label: 'Midler frigivet', 
      completed: !!escrow.releasedAt, 
      date: escrow.releasedAt 
    }
  ]

  return steps
}

export default function EscrowCard({ escrow, userRole, currentUserId, onRelease }: EscrowCardProps) {
  const [releasing, setReleasing] = useState(false)
  
  const propertyTitle = escrow.property?.title || escrow.propertyTitle
  const propertyAddress = escrow.property?.address || escrow.propertyAddress
  const moveInDate = escrow.property?.moveInDate || escrow.plannedReleaseDate
  
  const timelineSteps = getTimelineStatus(escrow)
  const canRelease = userRole === 'seller' && escrow.status === 'FUNDED'
  const needsPayment = userRole === 'buyer' && escrow.status === 'CREATED'

  const handleRelease = async () => {
    if (!onRelease) return
    
    setReleasing(true)
    try {
      await onRelease(escrow.id)
    } catch (error) {
      console.error('Release failed:', error)
    } finally {
      setReleasing(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-slate-800">{propertyTitle}</h3>
            {getStatusBadge(escrow.status)}
          </div>
          
          <p className="text-slate-600 flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {propertyAddress}
          </p>

          {/* Amount */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Depositum beløb</span>
              <span className="text-2xl font-bold text-blue-600">{escrow.amount} {escrow.currency}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 lg:w-auto">
          {needsPayment && escrow.payproffHostedUrl && (
            <a 
              href={escrow.payproffHostedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Betal depositum
            </a>
          )}
          
          {canRelease && (
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {releasing ? 'Frigiver...' : 'Frigiv midler'}
            </button>
          )}
          
          {escrow.status === 'RELEASED' && (
            <div className="bg-green-100 border border-green-200 text-green-700 px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Afsluttet
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Status timeline</h4>
        <div className="space-y-4">
          {timelineSteps.map((step, index) => (
            <div key={step.key} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-400'
              }`}>
                {step.completed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="text-sm text-slate-500">
                      {formatDate(step.date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Move-in date info */}
        {moveInDate && escrow.status === 'FUNDED' && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m0 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2v-6z" />
              </svg>
              <div>
                <p className="font-medium text-blue-800">Planlagt indflytning</p>
                <p className="text-sm text-blue-600">{formatDate(moveInDate)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Deltagere</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Lejer (køber)</p>
            <p className="font-medium text-slate-800">
              {escrow.buyer.firstName} {escrow.buyer.lastName}
              {currentUserId === escrow.buyer.id && <span className="text-blue-600 ml-2">(dig)</span>}
            </p>
            <p className="text-sm text-slate-500">{escrow.buyer.email}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Udlejer (sælger)</p>
            <p className="font-medium text-slate-800">
              {escrow.seller.firstName} {escrow.seller.lastName}
              {currentUserId === escrow.seller.id && <span className="text-blue-600 ml-2">(dig)</span>}
            </p>
            <p className="text-sm text-slate-500">{escrow.seller.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}