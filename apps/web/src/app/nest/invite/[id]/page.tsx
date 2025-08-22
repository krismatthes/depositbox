'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

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

export default function NestInvitePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [invitation, setInvitation] = useState<any>(null)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchInvitation()
    }
  }, [params.id])

  const fetchInvitation = async () => {
    try {
      const response = await api.get(`/tenant/invitations/token/${params.id}`)
      setInvitation(response.data)
    } catch (error: any) {
      console.error('Error fetching invitation:', error)
      if (error.response?.status === 404) {
        setError('Invitation ikke fundet')
      } else if (error.response?.status === 410) {
        setError('Invitation er udløbet')
      } else {
        setError('Fejl ved hentning af invitation')
      }
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect to login/register with invitation ID
      router.push(`/login?invite=${params.id}`)
      return
    }

    if (!invitation) return

    setAccepting(true)
    try {
      // Accept invitation via API
      await api.post(`/tenant/invitations/token/${params.id}/accept`)
      
      // Redirect based on invitation type
      if (invitation.invitationType === 'CONTRACT') {
        // For contract invitations, redirect to lease contract creation
        router.push('/lease-contract/create?invitation=accepted')
      } else {
        // For NEST escrow invitations, redirect to dashboard
        router.push('/dashboard?invitation=accepted')
      }
      
    } catch (error: any) {
      console.error('Failed to accept invitation:', error)
      if (error.response?.status === 404) {
        setError('Invitation ikke fundet')
      } else if (error.response?.status === 410) {
        setError('Invitation er udløbet')
      } else if (error.response?.status === 400) {
        setError('Invitation er allerede accepteret')
      } else {
        setError('Der opstod en fejl ved accept af invitationen')
      }
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Invitation ikke fundet</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Gå til Dashboard
            </Link>
          </div>
        </div>
      </>
    )
  }

  if (!invitation) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </>
    )
  }

  const totalAmount = invitation.totalAmount

  // Introduction screen
  if (showIntro && invitation) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              {invitation.invitationType === 'CONTRACT' ? (
                <>
                  <h1 className="text-4xl font-bold text-slate-800 mb-4">
                    <span className="text-blue-600">{JSON.parse(invitation.invitationData || '{}').inviterName}</span> vil gerne have en lejekontrakt
                  </h1>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Du er blevet inviteret til at oprette en A10 standardlejekontrakt. 
                    Som udlejer har du alle de nødvendige ejendomsoplysninger!
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-slate-800 mb-4">
                    <span className="text-blue-600">{invitation.landlord.firstName} {invitation.landlord.lastName}</span> vil gerne bruge NEST
                  </h1>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Du er blevet inviteret til at bruge NEST deponering for <strong>{invitation.propertyAddress}</strong>. 
                    Det er gratis og trygt for dig som lejer!
                  </p>
                </>
              )}
            </div>

            {/* Benefits Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {invitation.invitationType === 'CONTRACT' ? (
                <>
                  {/* Legal Protection Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Juridisk Sikkerhed</h3>
                    <p className="text-slate-600 leading-relaxed">
                      A10 standardkontrakten overholder alle danske lejelove og beskytter begge parter juridisk.
                    </p>
                  </div>

                  {/* Easy to Complete Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Let at Udfylde</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Du har alle ejendomsoplysninger klar og kan udfylde kontrakten hurtigt og korrekt.
                    </p>
                  </div>

                  {/* Digital Signature Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Digital Underskrift</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Begge parter kan underskrive digitalt - ingen printning eller scanning nødvendig.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Safety Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">100% Sikkert</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Dit depositum er beskyttet i en sikker deponering. Du får det tilbage automatisk når du fraflytter - hvis der ikke er skader.
                    </p>
                  </div>

                  {/* Free Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Gratis for Lejere</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Som lejer betaler du intet ekstra. NEST er en gratis service der beskytter dit depositum og giver dig tryghed.
                    </p>
                  </div>

                  {/* Easy Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Nemt & Hurtigt</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Hele processen tager kun få minutter. Du accepterer invitationen og NEST håndterer resten automatisk.
                    </p>
                  </div>
                </>
              )}
            </div>


            {/* How it works */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              {invitation.invitationType === 'CONTRACT' ? (
                <>
                  <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Sådan fungerer Lejekontrakt</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Du Accepterer</h3>
                      <p className="text-sm text-slate-600">Accepter invitationen og log ind eller opret profil</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Udfyld Kontrakt</h3>
                      <p className="text-sm text-slate-600">Udfyld A10 kontrakten med dine ejendomsoplysninger</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Digital Underskrift</h3>
                      <p className="text-sm text-slate-600">Begge parter underskriver kontrakten digitalt</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Sådan fungerer NEST</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Du Accepterer</h3>
                      <p className="text-sm text-slate-600">Accepter invitationen og opret din profil på få minutter</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Depositum Indbetales</h3>
                      <p className="text-sm text-slate-600">Dit depositum indbetales sikkert til NEST deponeringen</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
                      <h3 className="font-semibold text-slate-800 mb-2">Automatisk Retur</h3>
                      <p className="text-sm text-slate-600">Ved fraflytning får du automatisk dit depositum retur</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white mb-8">
                <h2 className="text-2xl font-bold mb-4">Klar til at komme i gang?</h2>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Se alle detaljer om deponeringen og beløb. Det tager kun et par klik at acceptere.
                </p>
                <button
                  onClick={() => setShowIntro(false)}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg transform hover:scale-105"
                >
                  Se Invitation Detaljer
                </button>
              </div>
              
              <p className="text-sm text-slate-500">
                Ved at fortsætte accepterer du at bruge NEST til sikker deponering af dit depositum
              </p>
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
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back to intro button */}
          <button
            onClick={() => setShowIntro(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage til introduktion
          </button>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {invitation.invitationType === 'CONTRACT' ? (
              <>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Du er inviteret til at oprette Lejekontrakt</h1>
                <p className="text-slate-600">
                  Du er blevet bedt om at oprette en A10 standardlejekontrakt
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Du er inviteret til NEST Deponering</h1>
                <p className="text-slate-600">
                  {invitation.invitationType === 'TENANT' 
                    ? 'Du er inviteret som lejer til at deltage i denne deponering'
                    : 'Du er inviteret til at deltage i denne deponering'
                  }
                </p>
              </>
            )}
          </div>

          {/* Invitation Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Deponerings Detaljer</h2>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Property Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">🏠 Bolig</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold text-slate-800">{invitation.propertyAddress}</p>
                  <p className="text-sm text-slate-600">
                    {invitation.invitationData ? 
                      JSON.parse(invitation.invitationData).propertyType || 'Bolig' : 
                      'Bolig'
                    }
                  </p>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">💰 Beløb</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invitation.depositAmount > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-600 font-medium">Depositum</p>
                      <p className="text-2xl font-bold text-blue-800">{formatCurrency(invitation.depositAmount)} DKK</p>
                    </div>
                  )}
                  {invitation.rentAmount > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-600 font-medium">Første måneds leje</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(invitation.rentAmount)} DKK</p>
                    </div>
                  )}
                  {invitation.prepaidAmount > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-purple-600 font-medium">Forudbetalt leje</p>
                      <p className="text-2xl font-bold text-purple-800">{formatCurrency(invitation.prepaidAmount)} DKK</p>
                    </div>
                  )}
                  {invitation.utilitiesAmount > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-orange-600 font-medium">Forbrugsdeposit</p>
                      <p className="text-2xl font-bold text-orange-800">{formatCurrency(invitation.utilitiesAmount)} DKK</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                  <p className="text-slate-600 font-medium">Total beløb:</p>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalAmount)} DKK</p>
                </div>
              </div>

              {/* Dates */}
              {invitation.invitationData && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">📅 Datoer</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    {JSON.parse(invitation.invitationData).startDate && (
                      <p><strong>Lejestart:</strong> {formatDate(JSON.parse(invitation.invitationData).startDate)}</p>
                    )}
                    {JSON.parse(invitation.invitationData).endDate && (
                      <p><strong>Lejeophør:</strong> {formatDate(JSON.parse(invitation.invitationData).endDate)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center space-y-4">
            {!user ? (
              <div className="text-center">
                <p className="text-slate-600 mb-4">Du skal oprette en konto eller logge ind for at acceptere invitationen</p>
                <div className="flex gap-4">
                  <Link
                    href={`/login?invite=${params.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Log ind
                  </Link>
                  <Link
                    href={`/register?invite=${params.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Opret konto
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {accepting ? 'Accepterer...' : 'Accepter Invitation'}
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Ved at acceptere opretter du en NEST deponering og bliver en del af aftalen
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}