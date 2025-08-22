'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

export default function InviteLandlordToNestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    propertyAddress: '',
    monthlyRent: '',
    deposit: '',
    landlordEmail: '',
    landlordName: '',
    message: 'Hej! Jeg vil gerne invitere dig til at oprette en sikker NEST depositum escrow for vores lejeforhold. Dette sikrer, at depositummet håndteres sikkert for os begge.'
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

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

    // Create invitation data
    const invitation = {
      id: `invitation-${Date.now()}`,
      type: 'NEST_ESCROW',
      tenant: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email
      },
      landlord: {
        email: formData.landlordEmail,
        name: formData.landlordName
      },
      property: {
        address: formData.propertyAddress,
        monthlyRent: parseFloat(formData.monthlyRent) * 100, // Convert to øre
        deposit: parseFloat(formData.deposit) * 100 // Convert to øre
      },
      message: formData.message,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      invitationLink: `${window.location.origin}/nest/accept-invitation/${`invitation-${Date.now()}`}?token=${btoa(formData.landlordEmail)}`
    }

    // Save to localStorage (in production this would be sent to backend)
    if (typeof window !== 'undefined') {
      const existingInvitations = localStorage.getItem('nest_invitations') || '[]'
      const invitations = JSON.parse(existingInvitations)
      invitations.push(invitation)
      localStorage.setItem('nest_invitations', JSON.stringify(invitations))
      
      // Also save to user-specific key
      localStorage.setItem(`tenant_invitations_${user?.id}`, JSON.stringify(invitations.filter((i: any) => i.tenant.id === user?.id)))
    }

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSending(false)
    setSent(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
                    <p className="text-green-100">Din udlejer er blevet inviteret til NEST escrow</p>
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
                          Din udlejer kan nu oprette NEST escrow'en ved at følge linket i emailen.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Næste skridt:</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Din udlejer modtager en email med invitationslinket</li>
                      <li>• Udlejer opretter NEST escrow'en med de angivne detaljer</li>
                      <li>• Du modtager besked når escrow'en er oprettet</li>
                      <li>• I kan begge se status på jeres dashboards</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Invitation detaljer:</h3>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ejendom:</dt>
                        <dd className="font-medium">{formData.propertyAddress}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Månedlig leje:</dt>
                        <dd className="font-medium">{formData.monthlyRent} DKK</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Depositum:</dt>
                        <dd className="font-medium">{formData.deposit} DKK</dd>
                      </div>
                    </dl>
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
                      setFormData({
                        propertyAddress: '',
                        monthlyRent: '',
                        deposit: '',
                        landlordEmail: '',
                        landlordName: '',
                        message: 'Hej! Jeg vil gerne invitere dig til at oprette en sikker NEST depositum escrow for vores lejeforhold. Dette sikrer, at depositummet håndteres sikkert for os begge.'
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
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Inviter Udlejer til NEST</h1>
                <p className="text-slate-600 mt-1">Send invitation til sikker depositum escrow</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-xl font-bold text-white">NEST Escrow Invitation</h2>
              <p className="text-blue-100 text-sm mt-1">Inviter din udlejer til at oprette sikker depositum escrow</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ejendom Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ejendomsadresse *
                    </label>
                    <input
                      type="text"
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Vej 123, 1234 By"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Månedlig leje (DKK) *
                      </label>
                      <input
                        type="number"
                        name="monthlyRent"
                        value={formData.monthlyRent}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="15000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Depositum (DKK) *
                      </label>
                      <input
                        type="number"
                        name="deposit"
                        value={formData.deposit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="45000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Udlejer Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Udlejer navn *
                    </label>
                    <input
                      type="text"
                      name="landlordName"
                      value={formData.landlordName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Peter Larsen"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Udlejer email *
                    </label>
                    <input
                      type="email"
                      name="landlordEmail"
                      value={formData.landlordEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="peter@udlejer.dk"
                      required
                    />
                  </div>
                </div>
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
                      kan de oprette NEST escrow'en med de informationer du har angivet. 
                      I modtager begge besked når escrow'en er oprettet.
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