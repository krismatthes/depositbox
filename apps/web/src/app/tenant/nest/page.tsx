'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface LandlordInvitation {
  landlordName: string
  landlordEmail: string
  landlordPhone?: string
  personalMessage?: string
  propertyAddress?: string
}

export default function TenantInviteLandlordPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<LandlordInvitation>({
    landlordName: '',
    landlordEmail: '',
    landlordPhone: '',
    personalMessage: '',
    propertyAddress: ''
  })
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    try {
      const response = await fetch(`https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=5`)
      const data = await response.json()
      
      const suggestions = data.map((address: any) => address.tekst)
      setAddressSuggestions(suggestions)
      setShowAddressSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
    }
  }

  const handleAddressChange = (value: string) => {
    setInvitationData(prev => ({ ...prev, propertyAddress: value }))
    fetchAddressSuggestions(value)
  }

  const handleAddressSelect = (address: string) => {
    setInvitationData(prev => ({ ...prev, propertyAddress: address }))
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Send invitation to landlord
      const response = await api.post('/tenant/invitations/landlord', {
        ...invitationData,
        tenantId: user!.id
      })

      // Show success message
      alert(`Invitation sendt til ${invitationData.landlordName}! De vil få en email med instruktioner om at oprette et fælles Nest depositum.`)
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      alert(error.response?.data?.error || 'Fejl ved afsendelse af invitation')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Indlæser...</div>
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-800">
                  🪺 Inviter Udlejer til Nest
                </h1>
                <p className="text-slate-600 mt-1">
                  Send en invitation til din udlejer så I kan oprette et sikkert Nest depositum sammen
                </p>
              </div>
              <div className="w-6"></div>
            </div>
          </div>

          {/* Invitation Form */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Udlejer navn *
                </label>
                <input
                  type="text"
                  value={invitationData.landlordName}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, landlordName: e.target.value }))}
                  placeholder="Ole Hansen"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Udlejer email *
                </label>
                <input
                  type="email"
                  value={invitationData.landlordEmail}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, landlordEmail: e.target.value }))}
                  placeholder="ole@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Udlejer vil få en email med invitation til at oprette Nest depositum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefonnummer (valgfrit)
                </label>
                <input
                  type="tel"
                  value={invitationData.landlordPhone}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, landlordPhone: e.target.value }))}
                  placeholder="+45 12 34 56 78"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Boligens adresse (valgfrit)
                </label>
                <input
                  type="text"
                  value={invitationData.propertyAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                  placeholder="Eksempel Vej 123, 2100 København Ø"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Address suggestions dropdown */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((address, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-b-0"
                        onClick={() => handleAddressSelect(address)}
                      >
                        <span className="text-sm text-slate-800">{address}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-1">
                  Hjælper udlejer med at identificere den relevante bolig
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Personlig besked
                </label>
                <textarea
                  value={invitationData.personalMessage}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, personalMessage: e.target.value }))}
                  placeholder="Hej [Udlejer navn], vi har aftalt lejemålet og jeg vil gerne foreslå at vi bruger Nest til sikker håndtering af depositum..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  En personlig besked kan hjælpe med at forklare situationen til udlejer
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Hvad sker der næst?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Din udlejer får en email med invitation</li>
                  <li>• De kan oprette en konto og udfylde Nest detaljerne</li>
                  <li>• I begge godkender vilkårene sammen</li>
                  <li>• Nest depositum aktiveres og I kan begynde indbetalinger</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuller
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors"
                >
                  {loading ? 'Sender...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}