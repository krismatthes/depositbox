'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import { createConversationFromContract } from '@/lib/chatUtils'

interface RentInvitation {
  id: string
  type: 'RENT_PAYMENT'
  inviterRole: 'TENANT' | 'LANDLORD'
  inviter: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  invitee: {
    name: string
    email: string
    phone: string
  }
  propertyInfo: {
    address: string
    monthlyRent: number
    dueDate: number
  }
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

export default function AcceptRentInvitationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [invitation, setInvitation] = useState<RentInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // Form data for acceptance
  const [formData, setFormData] = useState({
    // Payment methods (for tenants accepting landlord invitation)
    paymentMethods: {
      card: false,
      mobilepay: false,
      bank: false
    },
    
    // Bank details (for landlords accepting tenant invitation)
    bankAccount: '',
    mobilepayBusiness: '',
    
    // Notifications
    notifications: {
      email: true,
      sms: false,
      reminderDays: 5
    }
  })

  useEffect(() => {
    loadInvitation()
  }, [id])

  const loadInvitation = () => {
    if (typeof window !== 'undefined' && id) {
      try {
        const savedInvitations = localStorage.getItem('rent_invitations')
        if (savedInvitations) {
          const invitations = JSON.parse(savedInvitations)
          const foundInvitation = invitations.find((inv: RentInvitation) => inv.id === id)
          if (foundInvitation && foundInvitation.status === 'PENDING') {
            setInvitation(foundInvitation)
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading invitation:', error)
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

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

  const acceptInvitation = async () => {
    if (!invitation || !user) return

    // Check for existing active agreements for tenants
    if (user.role === 'TENANT') {
      const savedAgreements = localStorage.getItem('rent_agreements') || '[]'
      const allAgreements = JSON.parse(savedAgreements)
      const userAgreements = allAgreements.filter((a: any) => a.tenantId === user.id && a.isActive)
      if (userAgreements.length > 0) {
        alert('Du har allerede en aktiv husleje aftale. Du kan kun have én aktiv aftale ad gangen. Gå til indstillinger for at slette den eksisterende aftale først.')
        router.push('/rent-payments/settings')
        return
      }
    }

    setAccepting(true)

    // Create rent agreement from invitation
    const agreementId = `rent-agreement-${Date.now()}`
    const agreement = {
      id: agreementId,
      tenantId: invitation.inviterRole === 'TENANT' ? invitation.inviter.id : user.id,
      tenantName: invitation.inviterRole === 'TENANT' ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}` : `${user.firstName} ${user.lastName}`,
      tenantEmail: invitation.inviterRole === 'TENANT' ? invitation.inviter.email : user.email,
      landlordId: invitation.inviterRole === 'LANDLORD' ? invitation.inviter.id : user.id,
      landlordName: invitation.inviterRole === 'LANDLORD' ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}` : `${user.firstName} ${user.lastName}`,
      landlordEmail: invitation.inviterRole === 'LANDLORD' ? invitation.inviter.email : user.email,
      propertyAddress: invitation.propertyInfo.address,
      monthlyRent: invitation.propertyInfo.monthlyRent,
      dueDate: invitation.propertyInfo.dueDate,
      isActive: true,
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      invitationId: invitation.id
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
      nextMonth.setDate(invitation.propertyInfo.dueDate)

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

      // Update invitation status
      const savedInvitations = localStorage.getItem('rent_invitations')
      if (savedInvitations) {
        const invitations = JSON.parse(savedInvitations)
        const updatedInvitations = invitations.map((inv: RentInvitation) =>
          inv.id === invitation.id ? { ...inv, status: 'ACCEPTED', acceptedAt: new Date().toISOString() } : inv
        )
        localStorage.setItem('rent_invitations', JSON.stringify(updatedInvitations))
      }

      // Create chat conversation automatically
      createConversationFromContract({
        contractId: agreement.id,
        contractType: 'rent_agreement',
        propertyAddress: agreement.propertyAddress,
        tenantId: agreement.tenantId,
        tenantName: agreement.tenantName,
        tenantEmail: agreement.tenantEmail,
        landlordId: agreement.landlordId,
        landlordName: agreement.landlordName,
        landlordEmail: agreement.landlordEmail
      })
    }

    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setAccepting(false)
    setAccepted(true)
  }

  const rejectInvitation = () => {
    if (!invitation) return

    // Update invitation status
    if (typeof window !== 'undefined') {
      const savedInvitations = localStorage.getItem('rent_invitations')
      if (savedInvitations) {
        const invitations = JSON.parse(savedInvitations)
        const updatedInvitations = invitations.map((inv: RentInvitation) =>
          inv.id === invitation.id ? { ...inv, status: 'REJECTED', rejectedAt: new Date().toISOString() } : inv
        )
        localStorage.setItem('rent_invitations', JSON.stringify(updatedInvitations))
      }
    }

    router.push('/dashboard')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Invitation ikke fundet</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Gå til Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  if (accepted) {
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
                    <h1 className="text-2xl font-bold text-white">Invitation Accepteret!</h1>
                    <p className="text-green-100">Digital husleje er nu aktiveret</p>
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
                          Aftale med {invitation.inviter.firstName} {invitation.inviter.lastName}
                        </div>
                        <div className="text-green-700 text-sm">
                          Digital huslejesystem er nu opsat og klart til brug. I vil begge få adgang til jeres betalingsdashboard.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Næste skridt:</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      {invitation.inviterRole === 'TENANT' ? (
                        // You are landlord accepting tenant invitation
                        <>
                          <li>• Huslejebetalinger sker nu digitalt hver måned</li>
                          <li>• Du modtager automatiske notifikationer om betalinger</li>
                          <li>• Alle kvitteringer gemmes i systemet</li>
                          <li>• Du kan se betalingshistorik i dit dashboard</li>
                          <li>• 💬 En chat-samtale er oprettet så I kan kommunikere sikkert</li>
                        </>
                      ) : (
                        // You are tenant accepting landlord invitation
                        <>
                          <li>• Du kan nu betale huslejen digitalt hver måned</li>
                          <li>• Automatiske påmindelser før forfald</li>
                          <li>• Kvitteringer sendes automatisk efter betaling</li>
                          <li>• Fuld betalingshistorik i dit dashboard</li>
                          <li>• 💬 En chat-samtale er oprettet så I kan kommunikere sikkert</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3">Aftale detaljer:</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ejendom:</dt>
                        <dd className="font-medium">{invitation.propertyInfo.address}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Månedlig husleje:</dt>
                        <dd className="font-medium">{formatCurrency(invitation.propertyInfo.monthlyRent)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Betaling forfalder:</dt>
                        <dd className="font-medium">Den {invitation.propertyInfo.dueDate}. i måneden</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Status:</dt>
                        <dd className="font-medium text-green-600">Aktiveret</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => router.push('/rent-payments/dashboard')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Husleje Dashboard
                    </button>
                    <button
                      onClick={() => router.push('/chat')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Start Chat
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="border border-green-600 text-green-600 bg-white hover:bg-green-50 px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Dashboard
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Digital Husleje Invitation</h1>
            <p className="text-slate-600">
              Du er blevet inviteret til at opsætte digital husleje betaling
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Invitation fra {invitation.inviter.firstName} {invitation.inviter.lastName}</h2>
              <p className="text-blue-100 text-sm">
                {invitation.inviterRole === 'TENANT' ? 'Din lejer vil gerne opsætte digital husleje' : 'Din udlejer vil gerne opsætte digital husleje'}
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-blue-800 mb-2">Personlig besked:</div>
                      <div className="text-blue-700 text-sm whitespace-pre-wrap">
                        {invitation.message}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3">Ejendom detaljer</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-600">Adresse:</dt>
                        <dd className="font-medium">{invitation.propertyInfo.address}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Månedlig husleje:</dt>
                        <dd className="font-medium">{formatCurrency(invitation.propertyInfo.monthlyRent)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Betaling forfalder:</dt>
                        <dd className="font-medium">Den {invitation.propertyInfo.dueDate}. i måneden</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3">Invitation fra</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-600">Navn:</dt>
                        <dd className="font-medium">{invitation.inviter.firstName} {invitation.inviter.lastName}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Email:</dt>
                        <dd className="font-medium">{invitation.inviter.email}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Rolle:</dt>
                        <dd className="font-medium">{invitation.inviterRole === 'TENANT' ? 'Lejer' : 'Udlejer'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Sendt:</dt>
                        <dd className="font-medium">{formatDate(invitation.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Steps */}
          {invitation.inviterRole === 'TENANT' ? (
            // Landlord accepting tenant invitation - need bank details
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Opsæt Modtagerkonto</h2>
                <p className="text-green-100 text-sm">Hvor skal huslejen indsættes?</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bankkonto (kontonummer) *
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="1234-567890123"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Til modtagelse af huslejebetalinger</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    MobilePay Erhverv (valgfrit)
                  </label>
                  <input
                    type="text"
                    value={formData.mobilepayBusiness}
                    onChange={(e) => handleInputChange('mobilepayBusiness', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Notifikationer</h4>
                  <div className="space-y-2">
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
            </div>
          ) : (
            // Tenant accepting landlord invitation - choose payment methods
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Vælg Betalingsmetoder</h2>
                <p className="text-green-100 text-sm">Hvordan vil du betale huslejen?</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.card}
                      onChange={(e) => handleInputChange('paymentMethods.card', e.target.checked)}
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

                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.mobilepay}
                      onChange={(e) => handleInputChange('paymentMethods.mobilepay', e.target.checked)}
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

                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.bank}
                      onChange={(e) => handleInputChange('paymentMethods.bank', e.target.checked)}
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

                <div className="mt-6">
                  <h4 className="font-medium text-slate-700 mb-3">Notifikationer</h4>
                  <div className="space-y-2">
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

                    <div className="ml-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Send påmindelse (dage før forfald)
                      </label>
                      <select
                        value={formData.notifications.reminderDays}
                        onChange={(e) => handleInputChange('notifications.reminderDays', Number(e.target.value))}
                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={acceptInvitation}
              disabled={accepting || (invitation.inviterRole === 'TENANT' && !formData.bankAccount.trim())}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              {accepting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Accepterer...
                </span>
              ) : (
                'Accepter Invitation'
              )}
            </button>
            
            <button
              onClick={rejectInvitation}
              className="px-6 py-4 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-lg font-semibold transition-colors"
            >
              Afvis
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-blue-800 mb-1">Sikkerhed og privatlivn</div>
                <div className="text-blue-700 text-sm">
                  Alle betalinger er krypteret og PCI-DSS compliant. Dine bankoplysninger opbevares sikkert og deles kun med autoriserede betalingsudbydere. 
                  Du kan til enhver tid ændre eller deaktivere systemet.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}