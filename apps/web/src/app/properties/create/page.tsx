'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import Link from 'next/link'

export default function CreatePropertyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    address: '',
    propertyType: 'APARTMENT',
    size: '',
    monthlyRent: '',
    depositAmount: '',
    prepaidRent: '',
    currency: 'DKK',
    moveInDate: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await api.post('/properties', {
        ...formData,
        size: formData.size ? parseInt(formData.size) : 50,
        monthlyRent: parseFloat(formData.monthlyRent),
        depositAmount: parseFloat(formData.depositAmount),
        prepaidRent: formData.prepaidRent ? parseFloat(formData.prepaidRent) : 0,
        moveInDate: formData.moveInDate || null
      })
      // Redirect to invite page as part of the creation flow
      router.push(`/properties/${response.data.property.id}/invite`)
    } catch (err: any) {
      console.error('Create property error:', err)
      setError(err.response?.data?.error || 'Failed to create property')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
                href="/properties"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-4xl font-bold text-slate-800">Tilføj Ny Bolig</h1>
            </div>
            <p className="text-slate-600">Opret en ny udlejningsbolig og start med at invitere lejere</p>
          </div>

          {/* Enhanced Property Details Form */}
          <div className="bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            {/* Form Header */}
            <div className="text-center mb-8 pb-6 border-b border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">🏠 Boligdetaljer</h2>
              <p className="text-slate-600">Udfyld alle oplysninger om din udlejningsbolig</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Address with Autocomplete */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                  🏠 Bolig adresse *
                </label>
                <AddressAutocomplete
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  placeholder="f.eks. Nørrebrogade 123, København"
                />
              </div>

              {/* Property Type & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-2">
                    🏠 Boligtype *
                  </label>
                  <div className="relative">
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white cursor-pointer"
                    >
                      <option value="APARTMENT">🏠 Lejlighed</option>
                      <option value="HOUSE">🏡 Hus</option>
                      <option value="VILLA">🏘️ Villa</option>
                      <option value="TOWNHOUSE">🏘️ Rækkehus</option>
                      <option value="STUDIO">🏢 Studio</option>
                      <option value="ROOM">🚪 Værelse</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-slate-700 mb-2">
                    📐 Størrelse (m²) *
                  </label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    required
                    min="1"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="85"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Boligens størrelse i kvadratmeter
                  </p>
                </div>
              </div>

              {/* Monthly Rent & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="monthlyRent" className="block text-sm font-medium text-slate-700 mb-2">
                    Månedlig husleje *
                  </label>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-2">
                    Valuta
                  </label>
                  <div className="relative">
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white cursor-pointer"
                    >
                      <option value="DKK">🇩🇰 DKK</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="USD">🇺🇸 USD</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Deposit Amount */}
              <div>
                <label htmlFor="depositAmount" className="block text-sm font-medium text-slate-700 mb-2">
                  Depositum beløb *
                </label>
                <input
                  type="number"
                  id="depositAmount"
                  name="depositAmount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="45000"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Det depositum beløb som lejeren skal betale
                </p>
              </div>

              {/* Prepaid Rent */}
              <div>
                <label htmlFor="prepaidRent" className="block text-sm font-medium text-slate-700 mb-2">
                  Forudbetalt husleje
                </label>
                <input
                  type="number"
                  id="prepaidRent"
                  name="prepaidRent"
                  min="0"
                  step="0.01"
                  value={formData.prepaidRent}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="15000"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Valgfrit - første måneds husleje betalt på forhånd
                </p>
              </div>

              {/* Move-in Date */}
              <div>
                <label htmlFor="moveInDate" className="block text-sm font-medium text-slate-700 mb-2">
                  📅 Planlagt indflytningsdato *
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    id="moveInDate"
                    name="moveInDate"
                    required
                    value={formData.moveInDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30 cursor-pointer hover:shadow-md"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Hvornår kan lejeren flytte ind og få adgang til boligen</span>
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Opretter...
                    </div>
                  ) : (
                    'Opret Bolig'
                  )}
                </button>
                <Link
                  href="/properties"
                  className="sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center"
                >
                  Annuller
                </Link>
              </div>
            </form>
          </div>

          {/* Payment Summary Section */}
          {formData.depositAmount && formData.monthlyRent && (
            <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 mb-3">💰 Hvad skal lejeren betale?</h3>
                  <div className="space-y-3">
                    <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-green-700">Depositum (via Housing Escrow)</span>
                        <span className="text-xl font-bold text-green-800">
                          {Number(formData.depositAmount || 0).toLocaleString()} {formData.currency}
                        </span>
                      </div>
                      <p className="text-sm text-green-600">
                        🔒 Sikret i escrow indtil indflytning - beskytter både udlejer og lejer
                      </p>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-green-700">Månedlig husleje</span>
                        <span className="text-xl font-bold text-green-800">
                          {Number(formData.monthlyRent || 0).toLocaleString()} {formData.currency}/md
                        </span>
                      </div>
                      <p className="text-sm text-green-600">
                        💳 Betales direkte til udlejer hver måned
                      </p>
                    </div>

                    {formData.prepaidRent && parseFloat(formData.prepaidRent) > 0 && (
                      <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-green-700">Forudbetalt husleje</span>
                          <span className="text-xl font-bold text-green-800">
                            {Number(formData.prepaidRent || 0).toLocaleString()} {formData.currency}
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
                            Number(formData.depositAmount || 0) + 
                            Number(formData.prepaidRent || 0)
                          ).toLocaleString()} {formData.currency}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        + Månedlig husleje ({Number(formData.monthlyRent || 0).toLocaleString()} {formData.currency})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Info Box */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-800 mb-3">🚀 Næste skridt</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</span>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      <strong>Opret boligen</strong> - Gem alle boligdetaljer i systemet
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</span>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      <strong>Inviter lejere</strong> - Send sikker invitation via email fra dit dashboard
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</span>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      <strong>Sikker betaling</strong> - Lejeren betaler depositum gennem Housing Escrow systemet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}