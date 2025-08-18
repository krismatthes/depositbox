'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Step6Props {
  data: any
  onUpdate: (data: any) => void
  contractId?: string | null // Optional: if provided, update existing contract instead of creating new
}

export default function Step6Review({ data, onUpdate, contractId }: Step6Props) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Auto-scroll to top when this step loads
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  const generatePDF = async () => {
    setIsGenerating(true)
    setError('')
    
    try {
      const response = await api.post('/lease-contract/generate-pdf', data, {
        responseType: 'blob'
      })
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lejekontrakt-${data.property.address.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Show success message and save contract
      setShowSuccess(true)
      await saveContract()
    } catch (err: any) {
      console.error('PDF generation error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      // Always save the contract even if PDF generation fails
      await saveContract()
      
      if (err.response?.status === 401) {
        setError('Du skal være logget ind for at generere PDF. Prøv at logge ind igen.')
      } else if (err.response?.status === 400) {
        setError('Kontraktdata er ikke valid. Kontroller alle felter er udfyldt korrekt.')
      } else {
        setError(`Der opstod en fejl ved generering af PDF: ${err.response?.data?.error || err.message || 'Ukendt fejl'}`)
      }
      
      // Show continue options even when PDF fails
      setShowSuccess(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveContract = async () => {
    try {
      if (contractId) {
        // Update existing contract
        await api.put(`/draft-contracts/${contractId}`, {
          data: JSON.stringify(data)
        })
      } else {
        // Save new contract as draft
        const contractTitle = `${data.property.address} - ${new Date().toLocaleDateString('da-DK')}`
        await api.post('/draft-contracts', {
          title: contractTitle,
          data: JSON.stringify(data)
        })
      }
      return true
    } catch (error) {
      console.error('Failed to save contract as draft:', error)
      // Don't show error to user as PDF was successful
      return false
    }
  }

  const saveAndContinue = async () => {
    setIsSaving(true)
    const saved = await saveContract()
    setIsSaving(false)
    
    if (saved) {
      setShowSuccess(true)
    } else {
      setError('Der opstod en fejl ved gemning af kontrakten. Prøv igen.')
    }
  }

  const createNestEscrow = async () => {
    try {
      // Extract relevant data from lease contract
      const nestEscrowData = {
        contractId: contractId,
        landlordId: data.landlord?.id || data.udlejer?.id,
        tenantId: data.tenants?.[0]?.id || data.lejer?.[0]?.id,
        depositAmount: Math.round((data.economy?.deposit || data.depositum_maaneder * data.maanedsleje_ex_forbrug || 0) * 100),
        firstMonthAmount: Math.round((data.economy?.monthlyRent || data.maanedsleje_ex_forbrug || 0) * 100),
        utilitiesAmount: Math.round(((data.economy?.heating || data.aconto?.varme || 0) + 
                                    (data.economy?.water || data.aconto?.vand || 0) + 
                                    (data.economy?.electricity || data.aconto?.el || 0)) * 100),
        releaseConditions: {
          depositReleaseType: data.leaseType === 'limited' ? 'SPECIFIC_DATE' : 'LEASE_END',
          depositReleaseDate: data.leaseType === 'limited' ? data.property?.moveInDate : undefined,
          firstMonthReleaseType: 'MOVE_IN_DATE',
          autoApprovalDays: 14
        }
      }

      const response = await api.post('/nest/escrows', nestEscrowData)
      
      // Redirect to the new escrow
      router.push(`/nest/escrows/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create Nest escrow:', error)
      alert('Fejl ved oprettelse af Nest deponering. Kontroller at alle nødvendige oplysninger er udfyldt.')
    }
  }

  const continueToDashboard = () => {
    router.push('/dashboard')
  }

  const sendEmail = async () => {
    if (!emailAddress.trim()) {
      setError('Indtast venligst en email adresse')
      return
    }

    setIsSendingEmail(true)
    setError('')
    
    try {
      const response = await api.post('/lease-contract/send-email', {
        ...data,
        recipientEmail: emailAddress
      })
      
      alert('Lejekontrakten er sendt via email!')
      setShowEmailForm(false)
      setEmailAddress('')
    } catch (err) {
      console.error('Email sending error:', err)
      setError('Der opstod en fejl ved afsendelse af email. Prøv igen.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} DKK`
  }

  const getPropertyType = (type: string) => {
    const types: any = {
      apartment: '🏠 Lejlighed',
      house: '🏡 Hus', 
      room: '🚪 Værelse',
      studio: '🏢 Studio'
    }
    return types[type] || type
  }

  const getMaintenanceText = (responsibility: string) => {
    return responsibility === 'landlord' 
      ? 'Udlejer har vedligeholdelsespligt' 
      : 'Lejer har vedligeholdelsespligt'
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">👁️ Gennemse & Generer Lejekontrakt</h3>
      
      {/* Overview Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-xl font-semibold text-blue-800 mb-4">📋 Kontraktoversigt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="font-medium text-blue-700">Udlejer:</span>
              <p className="text-slate-800">{data.landlord.name}</p>
              <p className="text-sm text-slate-600">{data.landlord.address}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Lejemål:</span>
              <p className="text-slate-800">{data.property.address}</p>
              <p className="text-sm text-slate-600">
                {getPropertyType(data.property.type)} • {data.property.area} m² • {data.property.rooms} værelser
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-blue-700">Lejer(e):</span>
              {data.tenants.map((tenant: any, index: number) => (
                <div key={index}>
                  <p className="text-slate-800">{tenant.name}</p>
                  <p className="text-sm text-slate-600">{tenant.email}</p>
                </div>
              ))}
            </div>
            <div>
              <span className="font-medium text-blue-700">Overtagelse:</span>
              <p className="text-slate-800">{new Date(data.property.moveInDate).toLocaleDateString('da-DK')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Economic Summary */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-green-800 mb-4">💰 Økonomisk Oversigt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <h5 className="font-medium text-green-700 mb-3">Månedlige betalinger:</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Husleje:</span>
                <span>{formatCurrency(data.economy.monthlyRent)}</span>
              </div>
              {data.economy.heating > 0 && (
                <div className="flex justify-between">
                  <span>A conto varme:</span>
                  <span>{formatCurrency(data.economy.heating)}</span>
                </div>
              )}
              {data.economy.water > 0 && (
                <div className="flex justify-between">
                  <span>A conto vand:</span>
                  <span>{formatCurrency(data.economy.water)}</span>
                </div>
              )}
              {data.economy.electricity > 0 && (
                <div className="flex justify-between">
                  <span>A conto el:</span>
                  <span>{formatCurrency(data.economy.electricity)}</span>
                </div>
              )}
              {data.economy.other > 0 && (
                <div className="flex justify-between">
                  <span>Øvrige bidrag:</span>
                  <span>{formatCurrency(data.economy.other)}</span>
                </div>
              )}
              <div className="border-t border-green-200 pt-2 font-semibold flex justify-between">
                <span>Total månedligt:</span>
                <span>{formatCurrency(
                  data.economy.monthlyRent + 
                  (data.economy.heating || 0) + 
                  (data.economy.water || 0) + 
                  (data.economy.electricity || 0) + 
                  (data.economy.other || 0)
                )}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <h5 className="font-medium text-green-700 mb-3">Førstegangsbetalinger:</h5>
            <div className="space-y-2 text-sm">
              {data.economy.deposit > 0 && (
                <div className="flex justify-between">
                  <span>Depositum:</span>
                  <span>{formatCurrency(data.economy.deposit)}</span>
                </div>
              )}
              {data.economy.prepaidRent > 0 && (
                <div className="flex justify-between">
                  <span>Forudbetalt leje:</span>
                  <span>{formatCurrency(data.economy.prepaidRent)}</span>
                </div>
              )}
              <div className="border-t border-green-200 pt-2 font-semibold flex justify-between">
                <span>Total ved indflytning:</span>
                <span>{formatCurrency((data.economy.deposit || 0) + (data.economy.prepaidRent || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-800 mb-4">📝 Vilkår Sammenfatning</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-purple-700">Lejeperiode:</span>
              <span className="ml-2">{data.leaseType === 'unlimited' ? 'Tidsubegrænset' : 'Tidsbegrænset'}</span>
            </div>
            <div>
              <span className="font-medium text-purple-700">Vedligeholdelse:</span>
              <span className="ml-2">{getMaintenanceText(data.conditions.maintenanceResponsibility)}</span>
            </div>
            <div>
              <span className="font-medium text-purple-700">Husdyr:</span>
              <span className="ml-2">{data.conditions.petsAllowed ? 'Tilladt' : 'Ikke tilladt'}</span>
            </div>
          </div>
          <div className="space-y-2">
            {data.conditions.heating && (
              <div>
                <span className="font-medium text-purple-700">Opvarmning:</span>
                <span className="ml-2 text-xs">{data.conditions.heating}</span>
              </div>
            )}
            {data.conditions.newlyRenovated && (
              <div>
                <span className="font-medium text-purple-700">Status:</span>
                <span className="ml-2">Nyistandsat</span>
              </div>
            )}
            {data.conditions.inventory?.length > 0 && (
              <div>
                <span className="font-medium text-purple-700">Inventar:</span>
                <span className="ml-2 text-xs">{data.conditions.inventory.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special Conditions */}
      {data.specialConditions && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-amber-800 mb-4">📋 Særlige Vilkår</h4>
          <div className="bg-white border border-amber-200 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="whitespace-pre-line text-sm text-slate-700">
              {data.specialConditions}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h4 className="text-2xl font-bold text-green-800 mb-3">
              {error ? '⚠️ Lejekontrakt Gemt' : '🎉 Lejekontrakt Gemt!'}
            </h4>
            {error && (
              <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <p className="text-green-700 mb-6">
              {error 
                ? 'Din lejekontrakt er blevet gemt som udkast. Du kan prøve at generere PDF igen senere eller fortsætte til dit dashboard.'
                : 'Din lejekontrakt er blevet gemt som udkast på dit dashboard. Du kan nu generere PDF senere, redigere kontrakten eller oprette nye kontrakter.'
              }
            </p>

            <div className="space-y-4">
              {error && (
                <button
                  onClick={() => {
                    setError('')
                    setShowSuccess(false)
                    generatePDF()
                  }}
                  disabled={isGenerating}
                  className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Prøv PDF Generation Igen
                  </div>
                </button>
              )}
              
              <button
                onClick={createNestEscrow}
                className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0 2.08-.402 2.599-1" />
                  </svg>
                  🏦 Opret Nest Deponering
                </div>
              </button>

              <button
                onClick={continueToDashboard}
                className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H19a2 2 0 012 2v0a2 2 0 01-2 2h-5M9 7h6m-6 4h6m-7 4h7" />
                  </svg>
                  Gå til Dashboard
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/lease-contract/create'}
                className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Opret Ny Kontrakt
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation */}
      {!showSuccess && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h4 className="text-2xl font-bold text-slate-800 mb-3">🎉 Klar til Download!</h4>
          <p className="text-slate-600 mb-6">
            Din lejekontrakt er nu klar til at blive genereret som PDF. 
            Kontrakten vil være baseret på Typeformular A10 og indeholde alle dine indtastede oplysninger.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className={`
                w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300
                ${isGenerating 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
                }
              `}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  Genererer PDF...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Lejekontrakt (PDF)
                </div>
              )}
            </button>

            <div className="text-center text-slate-400 text-sm">eller</div>

            {!showEmailForm ? (
              <>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26c.3.16.65.16.95 0L20 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send via Email
                  </div>
                </button>

                <div className="text-center text-slate-400 text-sm">eller</div>

                <button
                  onClick={saveAndContinue}
                  className="w-full px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Gemmer...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gem Kontrakt og Fortsæt
                    </div>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Indtast email adresse"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={sendEmail}
                    disabled={isSendingEmail}
                    className={`
                      flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                      ${isSendingEmail 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    {isSendingEmail ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                        Sender...
                      </div>
                    ) : (
                      'Send Email'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailForm(false)
                      setEmailAddress('')
                      setError('')
                    }}
                    className="px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-4">
            PDF'en vil blive downloadet automatisk eller sendt via email
          </p>
        </div>
      </div>
      )}

      {/* Important Notes */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-red-800 mb-4">⚠️ Vigtige Bemærkninger</h4>
        <div className="space-y-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">📝</span>
            <p>
              <strong>Underskrift:</strong> Den genererede lejekontrakt skal underskrives af både udlejer og lejer(e) 
              for at være juridisk gyldig.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">⚖️</span>
            <p>
              <strong>Juridisk rådgivning:</strong> Denne kontrakt er baseret på standardformularer, 
              men du bør overveje juridisk rådgivning ved komplekse situationer.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">🏦</span>
            <p>
              <strong>Depositum:</strong> Husk at indsætte depositum i fælles Nest 
              efter lejerens valg, hvis depositum er aftalt.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">📊</span>
            <p>
              <strong>Kontrol:</strong> Gennemgå altid kontrakten grundigt inden underskrift 
              og sørg for at alle oplysninger er korrekte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}