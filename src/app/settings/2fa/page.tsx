'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { api } from '@/lib/api'

interface TwoFactorStatus {
  enabled: boolean
  verifiedAt: string | null
  backupCodesRemaining: number
}

interface SetupResponse {
  secret: string
  qrCode: string
  manualEntryKey: string
  issuer: string
  accountName: string
}

export default function TwoFactorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [setupData, setSetupData] = useState<SetupResponse | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'complete'>('status')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      fetchStatus()
    }
  }, [user, loading, router])

  const fetchStatus = async () => {
    try {
      const response = await api.get('/auth/2fa/status')
      setStatus(response.data)
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
      setError('Fejl ved hentning af 2FA status')
    }
  }

  const startSetup = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/2fa/setup')
      setSetupData(response.data)
      setStep('setup')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fejl ved opsætning af 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const verifySetup = async () => {
    if (!setupData || !verificationCode) {
      setError('Indtast venligst verifikationskoden')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/2fa/verify-setup', {
        token: verificationCode,
        secret: setupData.secret
      })
      
      setBackupCodes(response.data.backupCodes)
      setStep('complete')
      await fetchStatus()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fejl ved verifikation af 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    const token = prompt('Indtast din 2FA kode for at deaktivere:')
    if (!token) return

    setIsLoading(true)
    setError('')
    try {
      await api.post('/auth/2fa/disable', { token })
      await fetchStatus()
      setStep('status')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fejl ved deaktivering af 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const generateBackupCodes = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/2fa/backup-codes')
      setBackupCodes(response.data.backupCodes)
      setShowBackupCodes(true)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fejl ved generering af backup koder')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">To-faktor autentifikation (2FA)</h1>
            <p className="text-slate-600 mt-2">Beskyt din konto med ekstra sikkerhed</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Status Overview */}
          {step === 'status' && status && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">2FA Status</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {status.enabled ? '✓ Aktiveret' : '⚠️ Ikke aktiveret'}
                </div>
              </div>

              {status.enabled ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-green-800">2FA er aktiveret</span>
                    </div>
                    <p className="text-green-700 text-sm">Din konto er beskyttet med to-faktor autentifikation.</p>
                    {status.verifiedAt && (
                      <p className="text-green-600 text-xs mt-1">
                        Aktiveret: {new Date(status.verifiedAt).toLocaleDateString('da-DK')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-800">Backup koder tilbage</span>
                      <p className="text-slate-600 text-sm">Til brug hvis du mister adgang til din authenticator</p>
                    </div>
                    <span className="text-lg font-bold text-slate-800">{status.backupCodesRemaining}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={generateBackupCodes}
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Generer nye backup koder
                    </button>
                    <button
                      onClick={disable2FA}
                      disabled={isLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Deaktiver 2FA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-medium text-yellow-800">Din konto er ikke fuldt beskyttet</span>
                    </div>
                    <p className="text-yellow-700 text-sm">Aktiver 2FA for ekstra sikkerhed ved login.</p>
                  </div>

                  <button
                    onClick={startSetup}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Indlæser...' : 'Aktiver 2FA'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Setup Step */}
          {step === 'setup' && setupData && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Opsæt 2FA</h2>
              
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="font-medium text-slate-800 mb-2">Scan QR koden med din authenticator app</h3>
                  <div className="bg-white p-4 border border-slate-200 rounded-lg inline-block">
                    <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-2">Manuel indtastning</h4>
                  <p className="text-slate-600 text-sm mb-2">Hvis du ikke kan scanne QR koden, indtast denne nøgle manuelt:</p>
                  <div className="bg-white border border-slate-200 rounded p-2 font-mono text-sm break-all">
                    {setupData.manualEntryKey}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Anbefalede authenticator apps:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Google Authenticator</li>
                    <li>• Microsoft Authenticator</li>
                    <li>• Authy</li>
                  </ul>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Næste: Verificer opsætning
                </button>
              </div>
            </div>
          )}

          {/* Verification Step */}
          {step === 'verify' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Verificer opsætning</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Indtast koden fra din authenticator app
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-slate-500 text-sm mt-1">
                    Til test: brug koden "123456"
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('setup')}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Tilbage
                  </button>
                  <button
                    onClick={verifySetup}
                    disabled={isLoading || !verificationCode}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Verificerer...' : 'Verificer og aktiver'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Completion Step */}
          {step === 'complete' && backupCodes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">2FA er nu aktiveret!</h2>
                <p className="text-slate-600">Din konto er nu beskyttet med to-faktor autentifikation.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ Gem dine backup koder</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Disse koder kan bruges til at få adgang til din konto hvis du mister din authenticator app.
                  Gem dem et sikkert sted!
                </p>
                
                <div className="bg-white border border-yellow-200 rounded p-3 grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const text = backupCodes.join('\n')
                    navigator.clipboard.writeText(text)
                    alert('Backup koder kopieret til clipboard!')
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Kopier backup koder
                </button>
                <button
                  onClick={() => {
                    setStep('status')
                    setBackupCodes([])
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Færdig
                </button>
              </div>
            </div>
          )}

          {/* Backup Codes Display */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Nye backup koder</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-700 text-sm">
                  Dine gamle backup koder er nu ugyldige. Gem disse nye koder et sikkert sted!
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-2 gap-2 font-mono text-sm mb-4">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const text = backupCodes.join('\n')
                    navigator.clipboard.writeText(text)
                    alert('Backup koder kopieret til clipboard!')
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Kopier koder
                </button>
                <button
                  onClick={() => {
                    setShowBackupCodes(false)
                    setBackupCodes([])
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Luk
                </button>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Om to-faktor autentifikation</h3>
            <p className="text-blue-700 text-sm">
              2FA tilføjer et ekstra sikkerhedslag til din konto. Selv hvis nogen får adgang til dit password, 
              vil de stadig have brug for adgang til din telefon eller authenticator app for at logge ind.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}