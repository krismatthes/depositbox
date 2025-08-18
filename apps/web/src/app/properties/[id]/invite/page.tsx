'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

interface Property {
  id: string
  address: string
  propertyType: string
  size: number
  monthlyRent: number
  depositAmount: number
  prepaidRent: number
  currency: string
  moveInDate: string
  status: string
  landlord: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function InviteTenantPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: 'Kære [Lejer navn],\n\nVelkommen! Du er blevet inviteret til at betale depositum for din nye bolig via BoligDeposit - Danmarks mest sikre platform for depositumbetalinger.\n\nMed BoligDeposit er dine penge beskyttet i en fælles Nest indtil indflytning, så du kan betale dit depositum med fuld tryghed.\n\nKlik på linket i invitationen for at komme i gang med den sikre betalingsproces.\n\nVenlig hilsen,\n[Udlejer navn]'
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && params.id) {
      fetchProperty()
    }
  }, [user, params.id])

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/properties/${params.id}`)
      setProperty(response.data.property)
    } catch (error) {
      console.error('Failed to fetch property:', error)
      setError('Bolig ikke fundet')
    } finally {
      setLoadingProperty(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.post('/invitations/landlord-to-tenant', {
        propertyId: params.id,
        tenantName: `${formData.firstName} ${formData.lastName}`,
        tenantEmail: formData.email,
        tenantPhone: formData.phone,
        message: formData.message
      })
      setSuccess(true)
    } catch (err: any) {
      console.error('Invite tenant error:', err)
      setError(err.response?.data?.error || 'Fejl ved afsendelse af invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading || loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Bolig ikke fundet</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Tilbage til dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Invitation sendt!</h1>
            <p className="text-slate-600 mb-6">
              Din invitation til {formData.firstName} {formData.lastName} er blevet sendt.
              De vil modtage en email med instruktioner.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Tilbage til dashboard
              </Link>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' })
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Inviter flere
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-4xl font-bold text-slate-800">Inviter Lejer</h1>
            </div>
            <p className="text-slate-600">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mr-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bolig oprettet!
              </span>
              Send nu invitation til din første lejer for {property.address}
            </p>
          </div>

          {/* Property Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Bolig detaljer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Adresse:</span>
                <p className="text-blue-800">{property.address}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Type & størrelse:</span>
                <p className="text-blue-800">
                  {property.propertyType === 'APARTMENT' && '🏠 Lejlighed'}
                  {property.propertyType === 'HOUSE' && '🏡 Hus'}
                  {property.propertyType === 'VILLA' && '🏘️ Villa'}
                  {property.propertyType === 'TOWNHOUSE' && '🏘️ Rækkehus'}
                  {property.propertyType === 'STUDIO' && '🏢 Studio'}
                  {property.propertyType === 'ROOM' && '🚪 Værelse'}
                  {!['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'STUDIO', 'ROOM'].includes(property.propertyType) && property.propertyType}
                  , {property.size} m²
                </p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Månedlig husleje:</span>
                <p className="text-blue-800">{property.monthlyRent.toLocaleString()} {property.currency}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Depositum:</span>
                <p className="text-blue-800">{property.depositAmount.toLocaleString()} {property.currency}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Indflytningsdato:</span>
                <p className="text-blue-800">{new Date(property.moveInDate).toLocaleDateString('da-DK')}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary for Tenant */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-800 mb-3">💰 Hvad skal lejeren betale?</h3>
                <p className="text-green-700 text-sm mb-4">
                  Dette er en oversigt over betalinger som den inviterede lejer skal foretage:
                </p>
                <div className="space-y-3">
                  <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-700">Depositum (via BoligDeposit)</span>
                      <span className="text-xl font-bold text-green-800">
                        {property.depositAmount.toLocaleString()} {property.currency}
                      </span>
                    </div>
                    <p className="text-sm text-green-600">
                      🔒 Sikret i Nest indtil indflytning - beskytter både udlejer og lejer
                    </p>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-700">Månedlig husleje</span>
                      <span className="text-xl font-bold text-green-800">
                        {property.monthlyRent.toLocaleString()} {property.currency}/md
                      </span>
                    </div>
                    <p className="text-sm text-green-600">
                      💳 Betales direkte til udlejer hver måned
                    </p>
                  </div>

                  {property.prepaidRent && property.prepaidRent > 0 && (
                    <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-green-700">Forudbetalt husleje</span>
                        <span className="text-xl font-bold text-green-800">
                          {property.prepaidRent.toLocaleString()} {property.currency}
                        </span>
                      </div>
                      <p className="text-sm text-green-600">
                        📅 Første måneds husleje betalt på forhånd
                      </p>
                    </div>
                  )}

                  <div className="border-t border-green-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-800">Total ved indflytning:</span>
                      <span className="text-2xl font-bold text-green-900">
                        {(
                          Number(property.depositAmount) + 
                          Number(property.prepaidRent || 0)
                        ).toLocaleString()} {property.currency}
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      + Månedlig husleje ({property.monthlyRent.toLocaleString()} {property.currency})
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong>Sikkerhed:</strong> Depositum holdes i sikker Nest indtil indflytningen og beskyttes af BoligDeposit systemet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invite Form */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Lejers fornavn"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Efternavn *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Lejers efternavn"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email adresse *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="lejer@email.dk"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="+45 12 34 56 78"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Besked til lejeren
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Skriv en venlig besked til den potentielle lejer..."
                />
                <p className="text-sm text-slate-500 mt-1">
                  Valgfrit - tilføj en personlig besked til invitationen
                </p>
              </div>

              <div className="pt-6 space-y-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sender invitation...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Invitation
                    </div>
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Spring over - gå til dashboard
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-slate-100 border border-slate-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">🎉 Tillykke! Boligen er oprettet</h3>
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <strong>Hvis du sender invitationen:</strong> Lejeren modtager en email med invitation til at betale depositum via BoligDeposit.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <strong>Hvis du springer over:</strong> Du kan altid invitere lejere senere fra dit dashboard.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Pengene holdes sikkert i Nest indtil indflytningsdagen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}