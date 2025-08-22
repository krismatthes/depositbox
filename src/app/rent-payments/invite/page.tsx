'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import { canCreateRentAgreement, canSendInvitation, validateUserAccess, validateEmailFormat, validatePropertyAddress, sanitizeInput, generateSecureToken } from '@/lib/security'
import { SmartPropertyField, SmartContactFields, SmartRentField } from '@/components/SmartFormFields'
import { extractAndSaveFromRentPayment, getFormSuggestions } from '@/lib/dataReuse'

export default function RentPaymentInvitePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2

  const [formData, setFormData] = useState({
    // Property information
    propertyAddress: '',
    monthlyRent: '',
    dueDate: 1,
    
    // Counterpart information
    counterpartName: '',
    counterpartEmail: '',
    counterpartPhone: '',
    
    // Personal message
    message: user?.role === 'TENANT' 
      ? 'Hej! Jeg vil gerne invitere dig til at opsætte digital husleje betaling for vores lejeforhold. Dette gør det nemt og sikkert for os begge at håndtere huslejebetalinger med automatiske kvitteringer og overblik.'
      : 'Hej! Jeg vil gerne invitere dig til at opsætte digital husleje betaling for dit lejeforhold. Du kan nemt betale huslejen digitalt med automatiske kvitteringer og påmindelser.'
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [hasActiveAgreement, setHasActiveAgreement] = useState(false)

  useEffect(() => {
    checkActiveAgreements()
  }, [user])

  const checkActiveAgreements = () => {
    if (typeof window !== 'undefined' && user && user.role === 'TENANT') {
      const savedAgreements = localStorage.getItem('rent_agreements') || '[]'
      const allAgreements = JSON.parse(savedAgreements)
      const userAgreements = allAgreements.filter((a: any) => a.tenantId === user.id && a.isActive)
      setHasActiveAgreement(userAgreements.length > 0)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const sendInvitation = async () => {
    // Security validation
    if (!validateUserAccess(user)) {
      alert('Du skal være logget ind for at sende invitationer.')
      return
    }

    // Rate limiting check
    const rateLimitCheck = canSendInvitation(user!.id)
    if (!rateLimitCheck.allowed) {
      alert(rateLimitCheck.reason)
      return
    }

    // Input validation
    if (!validateEmailFormat(formData.counterpartEmail)) {
      alert('Ugyldig email adresse.')
      return
    }

    if (!validatePropertyAddress(formData.propertyAddress)) {
      alert('Ejendomsadresse skal være mellem 10-200 tegn.')
      return
    }

    if (formData.monthlyRent < 1000 || formData.monthlyRent > 100000) {
      alert('Husleje skal være mellem 1.000-100.000 DKK.')
      return
    }

    // Check for existing active agreements for tenants
    if (user?.role === 'TENANT') {
      const agreementCheck = canCreateRentAgreement(user.id, user.role)
      if (!agreementCheck.allowed) {
        alert(agreementCheck.reason)
        return
      }
    }

    setSending(true)

    // Create invitation data
    const invitationId = `rent-invitation-${Date.now()}`
    const invitation = {
      id: invitationId,
      type: 'RENT_PAYMENT',
      inviterRole: user?.role,
      inviter: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email
      },
      invitee: {
        name: formData.counterpartName,
        email: formData.counterpartEmail,
        phone: formData.counterpartPhone
      },
      propertyInfo: {
        address: formData.propertyAddress,
        monthlyRent: Number(formData.monthlyRent) * 100, // Convert to øre
        dueDate: formData.dueDate
      },
      message: sanitizeInput(formData.message),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      invitationLink: `${window.location.origin}/rent-payments/accept/${invitationId}?token=${btoa(formData.counterpartEmail)}`
    }

    // Save invitation
    if (typeof window !== 'undefined') {
      const existingInvitations = localStorage.getItem('rent_invitations') || '[]'
      const invitations = JSON.parse(existingInvitations)
      invitations.push(invitation)
      localStorage.setItem('rent_invitations', JSON.stringify(invitations))
      
      // Also save to user-specific key
      localStorage.setItem(`rent_invitations_${user?.id}`, JSON.stringify(invitations.filter((i: any) => i.inviter.id === user?.id)))
      
      // Save reusable data for future forms
      extractAndSaveFromRentPayment(user!.id, {
        propertyAddress: formData.propertyAddress,
        monthlyRent: Number(formData.monthlyRent) * 100,
        counterpartName: formData.counterpartName,
        counterpartEmail: formData.counterpartEmail,
        counterpartPhone: formData.counterpartPhone,
        inviterRole: user?.role
      })
    }

    // Set the magic link for display
    setMagicLink(invitation.invitationLink)
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSending(false)
    setSent(true)
  }

  const copyMagicLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = magicLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  if (sent) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Invitation Sendt!</h1>
                    <p className="text-green-100">
                      {user?.role === 'TENANT' ? 'Din udlejer er blevet inviteret til digital husleje' : 'Din lejer er blevet inviteret til digital husleje'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-green-800 mb-1">Invitation sendt til {formData.counterpartName}</div>
                        <div className="text-green-700 text-sm">
                          En email med invitationslinket er blevet sendt til {formData.counterpartEmail}. 
                          {user?.role === 'TENANT' ? ' Din udlejer kan nu opsætte digital huslejemodtagelse.' : ' Din lejer kan nu opsætte digital huslejebetaling.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Næste skridt:</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      {user?.role === 'TENANT' ? (
                        <>
                          <li>• Din udlejer modtager en email med invitationslinket</li>
                          <li>• Udlejer opsæter modtagerkonto og bekræfter aftalen</li>
                          <li>• Du modtager besked når systemet er aktiveret</li>
                          <li>• Du kan derefter betale huslejen digitalt hver måned</li>
                        </>
                      ) : (
                        <>
                          <li>• Din lejer modtager en email med invitationslinket</li>
                          <li>• Lejer vælger betalingsmetoder og bekræfter aftalen</li>
                          <li>• Du modtager besked når systemet er aktiveret</li>
                          <li>• Du kan derefter modtage huslejen digitalt hver måned</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Invitation detaljer:</h3>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">
                          {user?.role === 'TENANT' ? 'Udlejer:' : 'Lejer:'}
                        </dt>
                        <dd className="font-medium">{formData.counterpartName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Email:</dt>
                        <dd className="font-medium">{formData.counterpartEmail}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ejendom:</dt>
                        <dd className="font-medium">{formData.propertyAddress}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Månedlig husleje:</dt>
                        <dd className="font-medium">{formData.monthlyRent} DKK</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Magic Link Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-3">
                      Magic Link til {user?.role === 'TENANT' ? 'Udlejer' : 'Lejer'}:
                    </h3>
                    <div className="bg-white border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={magicLink}
                          readOnly
                          className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none"
                        />
                        <button
                          onClick={copyMagicLink}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            linkCopied
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                          }`}
                        >
                          {linkCopied ? 'Kopieret!' : 'Kopier'}
                        </button>
                      </div>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">
                      Send dette link direkte til {user?.role === 'TENANT' ? 'udlejer' : 'lejer'} via SMS, WhatsApp eller anden kommunikation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => router.push('/rent-payments/dashboard')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Tilbage til Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setSent(false)
                      setMagicLink('')
                      setLinkCopied(false)
                      setCurrentStep(1)
                      setFormData({
                        propertyAddress: '',
                        monthlyRent: '',
                        dueDate: 1,
                        counterpartName: '',
                        counterpartEmail: '',
                        counterpartPhone: '',
                        message: user?.role === 'TENANT' 
                          ? 'Hej! Jeg vil gerne invitere dig til at opsætte digital husleje betaling for vores lejeforhold. Dette gør det nemt og sikkert for os begge at håndtere huslejebetalinger med automatiske kvitteringer og overblik.'
                          : 'Hej! Jeg vil gerne invitere dig til at opsætte digital husleje betaling for dit lejeforhold. Du kan nemt betale huslejen digitalt med automatiske kvitteringer og påmindelser.'
                      })
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-semibold transition-colors"
                  >
                    Send Ny Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ejendom Information</h3>
              <div className="space-y-4">
                <SmartPropertyField
                  value={formData.propertyAddress}
                  onChange={(value, propertyInfo) => {
                    handleInputChange('propertyAddress', value)
                    if (propertyInfo?.rent) {
                      handleInputChange('monthlyRent', propertyInfo.rent.toString())
                    }
                  }}
                  placeholder="Eksempel Vej 123, 2100 København Ø"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <SmartRentField
                    value={formData.monthlyRent}
                    onChange={(value) => handleInputChange('monthlyRent', value)}
                    placeholder="15000"
                  />
                  
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-blue-800 mb-1">Hvordan virker det?</div>
                  <div className="text-blue-700 text-sm">
                    {user?.role === 'TENANT' ? (
                      <>Din udlejer modtager en email med et invitationslink hvor de kan opsætte modtagerkonto og godkende aftalen. 
                      Når de har accepteret, kan du betale huslejen digitalt hver måned.</>
                    ) : (
                      <>Din lejer modtager en email med et invitationslink hvor de kan vælge betalingsmetoder og godkende aftalen. 
                      Når de har accepteret, kan de betale huslejen digitalt hver måned.</>
                    )}
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
              <SmartContactFields
                nameValue={formData.counterpartName}
                emailValue={formData.counterpartEmail}
                phoneValue={formData.counterpartPhone}
                onNameChange={(value) => handleInputChange('counterpartName', value)}
                onEmailChange={(value, contactInfo) => {
                  handleInputChange('counterpartEmail', value)
                  if (contactInfo?.phone) {
                    handleInputChange('counterpartPhone', contactInfo.phone)
                  }
                }}
                onPhoneChange={(value) => handleInputChange('counterpartPhone', value)}
                role={user?.role === 'TENANT' ? 'landlord' : 'tenant'}
                nameLabel={user?.role === 'TENANT' ? 'Udlejer navn' : 'Lejer navn'}
                emailLabel={user?.role === 'TENANT' ? 'Udlejer email' : 'Lejer email'}
                phoneLabel={user?.role === 'TENANT' ? 'Udlejer telefon' : 'Lejer telefon'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Personlig besked
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Skriv en personlig besked..."
              />
              <p className="text-xs text-slate-500 mt-1">Denne besked vil blive inkluderet i invitations-emailen</p>
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
                onClick={() => router.push('/rent-payments/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {user?.role === 'TENANT' ? 'Inviter Udlejer til Digital Husleje' : 'Inviter Lejer til Digital Husleje'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {user?.role === 'TENANT' 
                    ? 'Send invitation til din udlejer for aktivering af automatisk betaling'
                    : 'Send invitation til din lejer for aktivering af digital modtagelse'}
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

          {/* Active Agreement Warning */}
          {hasActiveAgreement && user?.role === 'TENANT' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-amber-800 mb-2">Du har allerede en aktiv husleje aftale</div>
                  <div className="text-amber-700 text-sm mb-3">
                    Som lejer kan du kun have én aktiv digital husleje aftale ad gangen. 
                    Du skal slette din eksisterende aftale før du kan invitere en ny udlejer.
                  </div>
                  <button
                    onClick={() => router.push('/rent-payments/settings')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Gå til Indstillinger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden ${hasActiveAgreement && user?.role === 'TENANT' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 && "Ejendom & Huslejedetaljer"}
                {currentStep === 2 && (user?.role === 'TENANT' ? "Udlejer Information & Besked" : "Lejer Information & Besked")}
              </h2>
              <p className="text-green-100 text-sm mt-1">
                {currentStep === 1 && "Oplysninger om lejemålet og huslejen"}
                {currentStep === 2 && (user?.role === 'TENANT' ? "Information om din udlejer og personlig besked" : "Information om din lejer og personlig besked")}
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
                    onClick={sendInvitation}
                    disabled={sending}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sender Invitation...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
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