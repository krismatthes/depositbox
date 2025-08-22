'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import { SmartContactFields } from '@/components/SmartFormFields'
import { addContact } from '@/lib/dataReuse'
import { api } from '@/lib/api'

export default function InviteLandlordToLeaseContractPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    landlordEmail: '',
    landlordName: '',
    landlordPhone: '',
    message: 'Hej! Jeg vil gerne bede dig om at oprette en A10 lejekontrakt for vores lejeforhold. Du har alle de nødvendige ejendomsoplysninger og kan sikre, at kontrakten bliver udfyldt korrekt.'
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard')
      return
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')

    try {
      // Save reusable data
      if (user) {
        addContact(user.id, {
          name: formData.landlordName,
          email: formData.landlordEmail,
          phone: formData.landlordPhone,
          role: 'landlord'
        })
      }

      // Create invitation via new API
      const invitationData = {
        invitationType: 'CONTRACT',
        tenantEmail: formData.landlordEmail, // Landlord will receive the invitation
        tenantName: formData.landlordName,
        propertyAddress: 'Lejekontrakt invitation',
        message: formData.message,
        contractId: null, // Will be set when contract is created
        depositAmount: 0,
        rentAmount: 0,
        prepaidAmount: 0,
        utilitiesAmount: 0,
        invitationData: {
          inviterName: `${user?.firstName} ${user?.lastName}`,
          inviterEmail: user?.email,
          inviterPhone: user?.phone,
          landlordName: formData.landlordName,
          landlordEmail: formData.landlordEmail,
          landlordPhone: formData.landlordPhone,
          type: 'LEASE_CONTRACT',
          subject: 'Invitation til Lejekontrakt'
        }
      }

      const response = await api.post('/tenant/invitations/create', invitationData)
      
      // Set the magic link for display
      setMagicLink(response.data.invitationLink)
      
      setSending(false)
      setSent(true)
    } catch (error: any) {
      setSending(false)
      setError(error.response?.data?.error || 'Der opstod en fejl ved afsendelse af invitationen')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || user.role !== 'TENANT') {
    return null
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
                    <p className="text-green-100">Din udlejer er blevet inviteret til at oprette lejekontrakten</p>
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
                        <div className="font-medium text-green-800 mb-1">Invitation sendt til {formData.landlordName}</div>
                        <div className="text-green-700 text-sm">
                          En email med invitationslinket er blevet sendt til {formData.landlordEmail}. 
                          Din udlejer kan nu oprette A10 lejekontrakten ved at følge linket i emailen.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Næste skridt:</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Din udlejer modtager en email med invitationslinket</li>
                      <li>• Udlejer opretter A10 lejekontrakten med ejendomsoplysninger</li>
                      <li>• Du modtager besked når kontrakten er klar til gennemgang</li>
                      <li>• I kan begge underskrive kontrakten digitalt</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Invitation detaljer:</h3>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Udlejer:</dt>
                        <dd className="font-medium">{formData.landlordName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Email:</dt>
                        <dd className="font-medium">{formData.landlordEmail}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Magic Link Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-3">Magic Link til Udlejer:</h3>
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
                      Send dette link direkte til udlejer via SMS, WhatsApp eller anden kommunikation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Tilbage til Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setSent(false)
                      setMagicLink('')
                      setLinkCopied(false)
                      setFormData({
                        landlordEmail: '',
                        landlordName: '',
                        landlordPhone: '',
                        message: 'Hej! Jeg vil gerne bede dig om at oprette en A10 lejekontrakt for vores lejeforhold. Du har alle de nødvendige ejendomsoplysninger og kan sikre, at kontrakten bliver udfyldt korrekt.'
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/lease-contract/create')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Inviter Udlejer til Lejekontrakt</h1>
                <p className="text-slate-600 mt-1">Bed din udlejer om at oprette A10 lejekontrakten</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-xl font-bold text-white">Lejekontrakt Invitation</h2>
              <p className="text-blue-100 text-sm mt-1">Inviter din udlejer til at oprette A10 standardkontrakten</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <div className="font-medium text-red-800 mb-1">Fejl ved afsendelse</div>
                      <div className="text-red-700 text-sm">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Why landlord should create */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-amber-800 mb-1">Hvorfor skal udlejer oprette kontrakten?</div>
                    <div className="text-amber-700 text-sm">
                      Udlejeren har alle de nødvendige ejendomsoplysninger (matrikelnummer, areal, byggeår osv.) 
                      og kan sikre at kontrakten overerholder alle juridiske krav. Dette giver den bedste beskyttelse for begge parter.
                    </div>
                  </div>
                </div>
              </div>


              {/* Landlord Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Udlejer Information</h3>
                <SmartContactFields
                  nameValue={formData.landlordName}
                  emailValue={formData.landlordEmail}
                  phoneValue={formData.landlordPhone}
                  onNameChange={(value) => setFormData(prev => ({ ...prev, landlordName: value }))}
                  onEmailChange={(value, contactInfo) => {
                    setFormData(prev => ({ ...prev, landlordEmail: value }))
                    if (contactInfo?.phone) {
                      setFormData(prev => ({ ...prev, landlordPhone: contactInfo.phone || '' }))
                    }
                  }}
                  onPhoneChange={(value) => setFormData(prev => ({ ...prev, landlordPhone: value }))}
                  role="landlord"
                  nameLabel="Udlejer navn"
                  emailLabel="Udlejer email"
                  phoneLabel="Udlejer telefon"
                />
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Besked til udlejer
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Skriv en personlig besked til din udlejer..."
                />
                <p className="text-xs text-slate-500 mt-1">Denne besked vil blive inkluderet i invitations-emailen</p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-800 mb-1">Hvordan virker det?</div>
                    <div className="text-blue-700 text-sm">
                      Din udlejer modtager en email med et invitationslink. Ved at klikke på linket 
                      starter de lejekontrakt-generatoren med dine oplysninger allerede udfyldt. 
                      I modtager begge besked når kontrakten er klar til underskrift.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sender Invitation...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invitation til Udlejer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}