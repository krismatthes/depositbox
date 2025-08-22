'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

interface RentAgreement {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  landlordId: string
  landlordName: string
  landlordEmail: string
  propertyAddress: string
  monthlyRent: number
  dueDate: number
  isActive: boolean
  createdAt: string
  acceptedAt?: string
  invitationId?: string
}

export default function RentPaymentsSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [agreements, setAgreements] = useState<RentAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [agreementToDelete, setAgreementToDelete] = useState<RentAgreement | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    emailAddress: '',
    sms: false,
    phoneNumber: '',
    reminderDays: 5
  })
  
  const [paymentSettings, setPaymentSettings] = useState({
    autoPayEnabled: false,
    defaultPaymentMethod: 'card',
    preferredPaymentMethods: {
      card: true,
      mobilepay: true,
      bank: false
    }
  })

  const [bankSettings, setBankSettings] = useState({
    bankAccount: '',
    mobilepayBusiness: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadSettings()
  }, [user, router])

  const loadSettings = () => {
    if (typeof window !== 'undefined' && user) {
      // Load rent agreements
      const savedAgreements = localStorage.getItem('rent_agreements') || '[]'
      const allAgreements = JSON.parse(savedAgreements)
      
      let filteredAgreements: RentAgreement[] = []
      if (user.role === 'TENANT') {
        filteredAgreements = allAgreements.filter((a: RentAgreement) => a.tenantId === user.id)
      } else if (user.role === 'LANDLORD') {
        filteredAgreements = allAgreements.filter((a: RentAgreement) => a.landlordId === user.id)
      }
      
      setAgreements(filteredAgreements)

      // Load saved settings
      const savedNotificationSettings = localStorage.getItem(`rent_notification_settings_${user.id}`)
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings))
      } else {
        // Set default email and phone from user profile
        setNotificationSettings(prev => ({
          ...prev,
          emailAddress: user.email || '',
          phoneNumber: user.phone || ''
        }))
      }

      const savedPaymentSettings = localStorage.getItem(`rent_payment_settings_${user.id}`)
      if (savedPaymentSettings) {
        setPaymentSettings(JSON.parse(savedPaymentSettings))
      }

      const savedBankSettings = localStorage.getItem(`rent_bank_settings_${user.id}`)
      if (savedBankSettings) {
        setBankSettings(JSON.parse(savedBankSettings))
      }
    }
    setLoading(false)
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

  const saveNotificationSettings = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`rent_notification_settings_${user.id}`, JSON.stringify(notificationSettings))
    }
  }

  const handleNotificationChange = (field: string, value: any) => {
    const updated = { ...notificationSettings, [field]: value }
    setNotificationSettings(updated)
    // Save immediately with the updated state
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`rent_notification_settings_${user.id}`, JSON.stringify(updated))
    }
  }

  const savePaymentSettings = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`rent_payment_settings_${user.id}`, JSON.stringify(paymentSettings))
    }
  }

  const saveBankSettings = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`rent_bank_settings_${user.id}`, JSON.stringify(bankSettings))
    }
  }

  const handleDeleteAgreement = (agreement: RentAgreement) => {
    setAgreementToDelete(agreement)
    setShowDeleteModal(true)
  }

  const confirmDeleteAgreement = async () => {
    if (!agreementToDelete || !user) return

    setDeleting(true)

    try {
      if (typeof window !== 'undefined') {
        // Remove agreement
        const savedAgreements = localStorage.getItem('rent_agreements')
        if (savedAgreements) {
          const agreements = JSON.parse(savedAgreements)
          const updatedAgreements = agreements.filter((a: RentAgreement) => a.id !== agreementToDelete.id)
          localStorage.setItem('rent_agreements', JSON.stringify(updatedAgreements))
        }

        // Remove related payments
        const savedPayments = localStorage.getItem('rent_payments')
        if (savedPayments) {
          const payments = JSON.parse(savedPayments)
          const updatedPayments = payments.filter((p: any) => 
            !(p.tenantId === agreementToDelete.tenantId && p.landlordId === agreementToDelete.landlordId)
          )
          localStorage.setItem('rent_payments', JSON.stringify(updatedPayments))
        }

        // Remove invitations if exists
        if (agreementToDelete.invitationId) {
          const savedInvitations = localStorage.getItem('rent_invitations')
          if (savedInvitations) {
            const invitations = JSON.parse(savedInvitations)
            const updatedInvitations = invitations.filter((i: any) => i.id !== agreementToDelete.invitationId)
            localStorage.setItem('rent_invitations', JSON.stringify(updatedInvitations))
          }
        }
      }

      // Reload settings
      loadSettings()
      
      setShowDeleteModal(false)
      setAgreementToDelete(null)
    } catch (error) {
      console.error('Error deleting agreement:', error)
      alert('Fejl ved sletning af aftale')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-3xl font-bold text-slate-800">Husleje Indstillinger</h1>
                <p className="text-slate-600 mt-1">Administrer dine digital husleje indstillinger</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Active Agreements */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Aktive Aftaler</h2>
              </div>
              
              <div className="p-6">
                {agreements.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Ingen aktive aftaler</h3>
                    <p className="text-slate-600 mb-4">
                      Du har ikke opsæt digital husleje endnu.
                    </p>
                    <button
                      onClick={() => router.push('/rent-payments/invite')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {user?.role === 'TENANT' ? 'Inviter Udlejer' : 'Inviter Lejer'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agreements.map((agreement) => (
                      <div key={agreement.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">
                              {agreement.propertyAddress}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">
                                  {user?.role === 'TENANT' ? 'Udlejer:' : 'Lejer:'}
                                </span>{' '}
                                {user?.role === 'TENANT' ? agreement.landlordName : agreement.tenantName}
                              </div>
                              <div>
                                <span className="font-medium">Månedlig husleje:</span> {formatCurrency(agreement.monthlyRent)}
                              </div>
                              <div>
                                <span className="font-medium">Forfald:</span> Den {agreement.dueDate}. i måneden
                              </div>
                              <div>
                                <span className="font-medium">Oprettet:</span> {formatDate(agreement.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleDeleteAgreement(agreement)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Slet
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Notifikationer</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        className="mr-3 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium mb-1">Email notifikationer</div>
                        <div className="text-sm text-slate-600 mb-3">
                          {user?.role === 'TENANT' 
                            ? 'Få påmindelser om kommende betalinger og bekræftelser'
                            : 'Få besked når betalinger modtages eller mangler'}
                        </div>
                        <div className="ml-0">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email adresse
                          </label>
                          <input
                            type="email"
                            value={notificationSettings.emailAddress}
                            onChange={(e) => handleNotificationChange('emailAddress', e.target.value)}
                            disabled={!notificationSettings.email}
                            className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                            placeholder="din@email.dk"
                          />
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={notificationSettings.sms}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                        className="mr-3 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium mb-1">SMS notifikationer</div>
                        <div className="text-sm text-slate-600 mb-3">
                          {user?.role === 'TENANT' 
                            ? 'Modtag SMS påmindelser før forfald'
                            : 'Modtag SMS når betalinger mangler eller er forsinkede'}
                        </div>
                        <div className="ml-0">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            value={notificationSettings.phoneNumber}
                            onChange={(e) => handleNotificationChange('phoneNumber', e.target.value)}
                            disabled={!notificationSettings.sms}
                            className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                            placeholder="+45 12 34 56 78"
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {user?.role === 'TENANT' && (
                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Påmindelse sendes
                    </label>
                    <select
                      value={notificationSettings.reminderDays}
                      onChange={(e) => handleNotificationChange('reminderDays', Number(e.target.value))}
                      className="w-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 dag før forfald</option>
                      <option value={3}>3 dage før forfald</option>
                      <option value={5}>5 dage før forfald</option>
                      <option value={7}>7 dage før forfald</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Settings (Tenant only) */}
            {user?.role === 'TENANT' && agreements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Betalingsindstillinger</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Foretrukne betalingsmetoder</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.preferredPaymentMethods.card}
                          onChange={(e) => {
                            const updated = {
                              ...paymentSettings,
                              preferredPaymentMethods: {
                                ...paymentSettings.preferredPaymentMethods,
                                card: e.target.checked
                              }
                            }
                            setPaymentSettings(updated)
                            savePaymentSettings()
                          }}
                          className="mr-3"
                        />
                        Betalingskort (Visa, Mastercard)
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.preferredPaymentMethods.mobilepay}
                          onChange={(e) => {
                            const updated = {
                              ...paymentSettings,
                              preferredPaymentMethods: {
                                ...paymentSettings.preferredPaymentMethods,
                                mobilepay: e.target.checked
                              }
                            }
                            setPaymentSettings(updated)
                            savePaymentSettings()
                          }}
                          className="mr-3"
                        />
                        MobilePay
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.preferredPaymentMethods.bank}
                          onChange={(e) => {
                            const updated = {
                              ...paymentSettings,
                              preferredPaymentMethods: {
                                ...paymentSettings.preferredPaymentMethods,
                                bank: e.target.checked
                              }
                            }
                            setPaymentSettings(updated)
                            savePaymentSettings()
                          }}
                          className="mr-3"
                        />
                        Bankoverførsel
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Standard betalingsmetode
                    </label>
                    <select
                      value={paymentSettings.defaultPaymentMethod}
                      onChange={(e) => {
                        const updated = { ...paymentSettings, defaultPaymentMethod: e.target.value }
                        setPaymentSettings(updated)
                        savePaymentSettings()
                      }}
                      className="w-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="card">Betalingskort</option>
                      <option value="mobilepay">MobilePay</option>
                      <option value="bank">Bankoverførsel</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Settings (Landlord only) */}
            {user?.role === 'LANDLORD' && agreements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Modtageroplysninger</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bankkonto (kontonummer)
                    </label>
                    <input
                      type="text"
                      value={bankSettings.bankAccount}
                      onChange={(e) => setBankSettings({ ...bankSettings, bankAccount: e.target.value })}
                      onBlur={saveBankSettings}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="1234-567890123"
                    />
                    <p className="text-xs text-slate-500 mt-1">Til modtagelse af huslejebetalinger</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      MobilePay Erhverv nummer
                    </label>
                    <input
                      type="text"
                      value={bankSettings.mobilepayBusiness}
                      onChange={(e) => setBankSettings({ ...bankSettings, mobilepayBusiness: e.target.value })}
                      onBlur={saveBankSettings}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="12345678"
                    />
                    <p className="text-xs text-slate-500 mt-1">Valgfrit - til MobilePay betalinger</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <div className="font-medium text-amber-800 mb-2">Sikkerhed og privatlivn</div>
                  <div className="text-amber-700 text-sm">
                    Alle dine oplysninger opbevares sikkert og krypteret. Vi deler aldrig dine finansielle oplysninger 
                    med tredjeparter uden dit samtykke. Du kan til enhver tid slette dine aftaler og data.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && agreementToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Slet Husleje Aftale</h3>
                  <p className="text-slate-600 text-sm">Dette kan ikke fortrydes</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-slate-700 mb-4">
                  Er du sikker på at du vil slette aftalen for:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="font-medium text-slate-800">{agreementToDelete.propertyAddress}</div>
                  <div className="text-sm text-slate-600">
                    {user?.role === 'TENANT' 
                      ? `Udlejer: ${agreementToDelete.landlordName}`
                      : `Lejer: ${agreementToDelete.tenantName}`
                    }
                  </div>
                </div>
                <p className="text-red-600 text-sm mt-3">
                  <strong>Advarsel:</strong> Dette vil også slette alle relaterede betalinger og historik.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setAgreementToDelete(null)
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Annuller
                </button>
                <button
                  onClick={confirmDeleteAgreement}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sletter...
                    </>
                  ) : (
                    'Slet Aftale'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}