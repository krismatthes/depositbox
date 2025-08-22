'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [selectedRole, setSelectedRole] = useState<'LANDLORD' | 'TENANT' | null>(null)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const role = searchParams.get('role')
    if (role === 'LANDLORD' || role === 'TENANT') {
      setSelectedRole(role)
      setStep('details')
    }
  }, [searchParams])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '+45 '
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Adgangskoderne stemmer ikke overens')
      setLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError('Du skal acceptere vilkår og betingelser for at oprette en konto')
      setLoading(false)
      return
    }

    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName, formData.phone, selectedRole)
      // Redirect landlords and tenants to their respective onboarding
      if (selectedRole === 'LANDLORD') {
        router.push('/nest/onboarding')
      } else {
        router.push('/tenant-onboarding')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      // Ensure phone always starts with +45 and format properly
      let formatted = value
      if (!formatted.startsWith('+45')) {
        formatted = '+45 ' + formatted.replace(/^\+45\s*/, '')
      }
      // Remove non-digits after +45
      const phoneNumber = formatted.substring(4).replace(/\D/g, '')
      // Format as +45 XX XX XX XX
      if (phoneNumber.length > 0) {
        const groups = phoneNumber.match(/.{1,2}/g) || []
        formatted = '+45 ' + groups.join(' ')
      } else {
        formatted = '+45 '
      }
      // Limit to Danish phone number length (+45 XX XX XX XX = 8 digits)
      if (phoneNumber.length <= 8) {
        setFormData(prev => ({ ...prev, [name]: formatted }))
      }
    } else if (name === 'password') {
      setFormData(prev => ({ ...prev, [name]: value }))
      // Check password requirements
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value)
      })
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleRoleSelect = (role: 'LANDLORD' | 'TENANT') => {
    setSelectedRole(role)
    setStep('details')
  }

  const handleBack = () => {
    setStep('role')
    setSelectedRole(null)
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Opret din konto</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Vælg din rolle for at komme i gang med Housing Escrow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Landlord Card */}
            <div 
              onClick={() => handleRoleSelect('LANDLORD')}
              className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 group h-full flex flex-col"
            >
              <div className="text-center flex-1 flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Jeg er udlejer</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Jeg udlejer boliger og vil bruge Housing Escrow til at modtage sikre depositum fra lejere.
                </p>
                
                <div className="space-y-3 text-left flex-1">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Opret og administrer boliger</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Inviter lejere via sikker link</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Modtag depositum når lejer flytter ind</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300">
                    Vælg som udlejer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Card */}
            <div 
              onClick={() => handleRoleSelect('TENANT')}
              className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 group h-full flex flex-col"
            >
              <div className="text-center flex-1 flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Jeg er lejer</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Jeg lejer bolig og vil bruge Housing Escrow til at betale depositum sikkert.
                </p>
                
                <div className="space-y-3 text-left flex-1">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Sikker depositum betaling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Beskyttelse mod bedrageri</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">Inviter udlejere til platformen</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 group-hover:from-cyan-700 group-hover:to-cyan-800 transition-all duration-300">
                    Vælg som lejer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="text-center mt-12">
            <p className="text-slate-600">
              Har du allerede en konto?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Log ind her
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage til rolle-valg
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedRole === 'LANDLORD' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {selectedRole === 'LANDLORD' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  )}
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Opret {selectedRole === 'LANDLORD' ? 'udlejer' : 'lejer'} konto
                </h1>
                <p className="text-slate-600">Udfyld dine oplysninger for at komme i gang</p>
              </div>
            </div>
          </div>
        </div>

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
                  placeholder="Indtast dit fornavn"
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
                  placeholder="Indtast dit efternavn"
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
                placeholder="din@email.dk"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                🇩🇰 Telefonnummer
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+45 12 34 56 78"
              />
              <p className="text-sm text-slate-500 mt-1">
                Danske telefonnumre med landekode (+45)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Adgangskode *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Vælg en sikker adgangskode"
              />
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${passwordRequirements.length ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${passwordRequirements.length ? 'text-green-600' : 'text-slate-500'}`}>
                    Mindst 8 tegn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${passwordRequirements.uppercase ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${passwordRequirements.uppercase ? 'text-green-600' : 'text-slate-500'}`}>
                    Mindst ét stort bogstav
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${passwordRequirements.lowercase ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${passwordRequirements.lowercase ? 'text-green-600' : 'text-slate-500'}`}>
                    Mindst ét lille bogstav
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${passwordRequirements.number ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${passwordRequirements.number ? 'text-green-600' : 'text-slate-500'}`}>
                    Mindst ét tal
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Gentag adgangskode *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-300'
                }`}
                placeholder="Gentag din adgangskode"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Adgangskoderne stemmer ikke overens</p>
              )}
            </div>

            {/* Terms and Conditions Acceptance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="acceptTerms" className="text-sm text-slate-700 leading-relaxed">
                  Jeg accepterer BoligDeposits{' '}
                  <Link href="/terms-of-service" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    Servicevilkår
                  </Link>{' '}
                  og{' '}
                  <Link href="/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    Privatlivspolitik
                  </Link>
                  . Jeg forstår, at mine personoplysninger vil blive behandlet i overensstemmelse med GDPR-lovgivningen.
                </label>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  selectedRole === 'LANDLORD'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Opretter konto...
                  </div>
                ) : (
                  'Opret konto'
                )}
              </button>
              {!acceptedTerms && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Du skal acceptere vilkår og betingelser for at fortsætte
                </p>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Har du allerede en konto?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Log ind her
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}