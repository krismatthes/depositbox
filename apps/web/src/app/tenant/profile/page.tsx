'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import MitIDVerification from '@/components/MitIDVerification'

interface TenantProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  
  // Extended profile fields
  cprNumber?: string
  dateOfBirth?: string
  nationality?: string
  currentAddress?: string
  
  // Employment
  monthlyIncome?: number
  employer?: string
  employmentType?: string
  employmentStartDate?: string
  
  // Household
  householdSize?: number
  hasPets?: boolean
  isSmoker?: boolean
  
  // Verification status
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  incomeVerified: boolean
  creditChecked: boolean
  creditScore?: number
  mitIdVerified: boolean
  mitIdData?: string
  
  profileCompleteness: number
  documents: any[]
}

export default function TenantProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<TenantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Form data for all sections
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cprNumber: '',
    dateOfBirth: '',
    nationality: '',
    currentAddress: '',
    monthlyIncome: '',
    employer: '',
    employmentType: 'FULL_TIME',
    employmentStartDate: '',
    householdSize: 1,
    hasPets: false,
    isSmoker: false
  })

  // Password change form data
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [user, router])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/tenant/profile')
      const profileData = response.data
      setProfile(profileData)
      
      // Populate form data
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        cprNumber: profileData.cprNumber || '',
        dateOfBirth: profileData.dateOfBirth || '',
        nationality: profileData.nationality || '',
        currentAddress: profileData.currentAddress || '',
        monthlyIncome: profileData.monthlyIncome ? Math.round(profileData.monthlyIncome / 100).toString() : '',
        employer: profileData.employer || '',
        employmentType: profileData.employmentType || 'FULL_TIME',
        employmentStartDate: profileData.employmentStartDate || '',
        householdSize: profileData.householdSize || 1,
        hasPets: profileData.hasPets || false,
        isSmoker: profileData.isSmoker || false
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: any) => {
    setSaving(true)
    try {
      await api.put('/tenant/profile', updates)
      await fetchProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert('Fejl ved opdatering af profil')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    const updates = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      cprNumber: formData.cprNumber,
      dateOfBirth: formData.dateOfBirth,
      nationality: formData.nationality,
      currentAddress: formData.currentAddress,
      monthlyIncome: formData.monthlyIncome ? parseInt(formData.monthlyIncome) * 100 : undefined,
      employer: formData.employer,
      employmentType: formData.employmentType,
      employmentStartDate: formData.employmentStartDate,
      householdSize: formData.householdSize,
      hasPets: formData.hasPets,
      isSmoker: formData.isSmoker
    }
    
    await updateProfile(updates)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('De nye kodeord matcher ikke')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert('Det nye kodeord skal være mindst 6 tegn')
      return
    }

    setChangingPassword(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      alert('Kodeord ændret succesfuldt!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Fejl ved ændring af kodeord')
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateProfileCompleteness = (profileData: TenantProfile) => {
    let totalPoints = 0
    let maxPoints = 0

    // Core Information (30 points total - most important)
    const coreFields = [
      { field: profileData.firstName, points: 5 },
      { field: profileData.lastName, points: 5 },
      { field: profileData.email, points: 5 },
      { field: profileData.phone, points: 5 },
      { field: profileData.currentAddress, points: 5 },
      { field: profileData.cprNumber, points: 5 }
    ]

    coreFields.forEach(({ field, points }) => {
      maxPoints += points
      if (field && field.trim()) {
        totalPoints += points
      }
    })

    // Personal Details (15 points total)
    const personalFields = [
      { field: profileData.dateOfBirth, points: 5 },
      { field: profileData.nationality, points: 5 },
      { field: profileData.householdSize && profileData.householdSize > 0, points: 5 }
    ]

    personalFields.forEach(({ field, points }) => {
      maxPoints += points
      if (field) {
        totalPoints += points
      }
    })

    // Employment Information (25 points total - very important for landlords)
    const employmentFields = [
      { field: profileData.monthlyIncome && profileData.monthlyIncome > 0, points: 10 }, // Most important
      { field: profileData.employer, points: 5 },
      { field: profileData.employmentType, points: 5 },
      { field: profileData.employmentStartDate, points: 5 }
    ]

    employmentFields.forEach(({ field, points }) => {
      maxPoints += points
      if (field && (typeof field === 'boolean' ? field : field.trim())) {
        totalPoints += points
      }
    })

    // Lifestyle Information (10 points total)
    const lifestyleFields = [
      { field: profileData.hasPets !== undefined, points: 3 },
      { field: profileData.isSmoker !== undefined, points: 2 },
      { field: profileData.householdSize, points: 5 }
    ]

    lifestyleFields.forEach(({ field, points }) => {
      maxPoints += points
      if (field) {
        totalPoints += points
      }
    })

    // Verification Status (20 points total - builds trust)
    const verificationFields = [
      { field: profileData.emailVerified, points: 3 },
      { field: profileData.phoneVerified, points: 3 },
      { field: profileData.mitIdVerified, points: 5 }, // Most important verification
      { field: profileData.identityVerified, points: 4 },
      { field: profileData.incomeVerified, points: 3 },
      { field: profileData.creditChecked, points: 2 }
    ]

    verificationFields.forEach(({ field, points }) => {
      maxPoints += points
      if (field) {
        totalPoints += points
      }
    })

    // Calculate percentage (round to whole number)
    const percentage = Math.round((totalPoints / maxPoints) * 100)
    return Math.min(percentage, 100) // Cap at 100%
  }

  const getProfileBreakdown = (profileData: TenantProfile) => {
    const categories = [
      {
        name: 'Grundoplysninger',
        description: 'Navn, email, telefon, adresse, CPR',
        maxPoints: 30,
        currentPoints: [
          profileData.firstName?.trim() ? 5 : 0,
          profileData.lastName?.trim() ? 5 : 0,
          profileData.email?.trim() ? 5 : 0,
          profileData.phone?.trim() ? 5 : 0,
          profileData.currentAddress?.trim() ? 5 : 0,
          profileData.cprNumber?.trim() ? 5 : 0
        ].reduce((sum, val) => sum + val, 0)
      },
      {
        name: 'Arbejde & Økonomi',
        description: 'Indkomst, arbejdsplads, ansættelse',
        maxPoints: 25,
        currentPoints: [
          profileData.monthlyIncome && profileData.monthlyIncome > 0 ? 10 : 0,
          profileData.employer?.trim() ? 5 : 0,
          profileData.employmentType ? 5 : 0,
          profileData.employmentStartDate ? 5 : 0
        ].reduce((sum, val) => sum + val, 0)
      },
      {
        name: 'Verificering',
        description: 'Email, telefon, MitID, identitet',
        maxPoints: 20,
        currentPoints: [
          profileData.emailVerified ? 3 : 0,
          profileData.phoneVerified ? 3 : 0,
          profileData.mitIdVerified ? 5 : 0,
          profileData.identityVerified ? 4 : 0,
          profileData.incomeVerified ? 3 : 0,
          profileData.creditChecked ? 2 : 0
        ].reduce((sum, val) => sum + val, 0)
      },
      {
        name: 'Personlige Detaljer',
        description: 'Alder, nationalitet, husstand',
        maxPoints: 15,
        currentPoints: [
          profileData.dateOfBirth ? 5 : 0,
          profileData.nationality?.trim() ? 5 : 0,
          profileData.householdSize ? 5 : 0
        ].reduce((sum, val) => sum + val, 0)
      },
      {
        name: 'Livsstil',
        description: 'Kæledyr, rygning, husstandsstørrelse',
        maxPoints: 10,
        currentPoints: [
          profileData.hasPets !== undefined ? 3 : 0,
          profileData.isSmoker !== undefined ? 2 : 0,
          profileData.householdSize ? 5 : 0
        ].reduce((sum, val) => sum + val, 0)
      }
    ]

    return categories
  }

  const getVerificationIcon = (verified: boolean) => {
    return verified ? (
      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ) : (
      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil ikke fundet</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Tilbage til dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
              <div className="absolute -inset-2 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            </div>
            <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
              <span className="font-semibold text-blue-600">Min Profil</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Udfyld og administrer dine oplysninger for at skabe tillid hos udlejere
            </p>
            
            {/* Back to Dashboard Button */}
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage til Dashboard
            </button>
          </div>

          {/* Profile Completeness */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Profil Komplethed</h2>
              <span className="text-2xl font-bold text-blue-600">
                {calculateProfileCompleteness(profile)}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${calculateProfileCompleteness(profile)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              En komplet profil øger dine chancer for at blive accepteret som lejer
            </p>
            
            {/* Profile Breakdown */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Breakdown:</div>
              {getProfileBreakdown(profile).map((category) => (
                <div key={category.name} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      <span className="text-xs text-gray-500">
                        {category.currentPoints}/{category.maxPoints}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(category.currentPoints / category.maxPoints) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Completeness Tips */}
            {calculateProfileCompleteness(profile) < 100 && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Næste skridt</div>
                    <div className="text-blue-700 text-xs mt-1">
                      {calculateProfileCompleteness(profile) < 50 
                        ? 'Udfyld grundoplysninger og arbejdsforhold for at øge tilliden'
                        : calculateProfileCompleteness(profile) < 80 
                        ? 'Tilføj verificering og flere detaljer for en stærkere profil'
                        : 'Få din profil verificeret for maksimal troværdighed'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="space-y-8">
            
            {/* Personal Information Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  Personlige Oplysninger
                </h2>
                <p className="text-blue-100 text-sm mt-1">Grundlæggende information om dig</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fornavn *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Efternavn *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPR Nummer
                    </label>
                    <input
                      type="text"
                      value={formData.cprNumber}
                      onChange={(e) => handleInputChange('cprNumber', e.target.value)}
                      placeholder="123456-7890"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fødselsdato
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationalitet
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder="Dansk"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuværende Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.currentAddress}
                      onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                      placeholder="Eksempel Vej 123, 2100 København Ø"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">💼</span>
                  Arbejde & Indkomst
                </h2>
                <p className="text-emerald-100 text-sm mt-1">Din økonomiske situation og betalingsevne</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Månedlig Indkomst (DKK)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                      placeholder="35000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arbejdsplads
                    </label>
                    <input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => handleInputChange('employer', e.target.value)}
                      placeholder="Virksomhedens navn"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ansættelsestype
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => handleInputChange('employmentType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="FULL_TIME">Fuldtid</option>
                      <option value="PART_TIME">Deltid</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="UNEMPLOYED">Arbejdsløs</option>
                      <option value="STUDENT">Studerende</option>
                      <option value="PENSIONER">Pensionist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ansættelsesstartdato
                    </label>
                    <input
                      type="date"
                      value={formData.employmentStartDate}
                      onChange={(e) => handleInputChange('employmentStartDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Household Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">🏠</span>
                  Husstand Information
                </h2>
                <p className="text-purple-100 text-sm mt-1">Information om din husstand og særlige forhold</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Antal personer i husstanden
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.householdSize}
                      onChange={(e) => handleInputChange('householdSize', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kæledyr
                    </label>
                    <select
                      value={formData.hasPets ? 'yes' : 'no'}
                      onChange={(e) => handleInputChange('hasPets', e.target.value === 'yes')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="no">Nej, ingen kæledyr</option>
                      <option value="yes">Ja, har kæledyr</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ryger
                    </label>
                    <select
                      value={formData.isSmoker ? 'yes' : 'no'}
                      onChange={(e) => handleInputChange('isSmoker', e.target.value === 'yes')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="no">Nej, ryger ikke</option>
                      <option value="yes">Ja, ryger</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">🔐</span>
                  Verificering & Dokumenter
                </h2>
                <p className="text-green-100 text-sm mt-1">Bekræft din identitet for at øge tilliden hos udlejere</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Verification Status Grid */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Verificeringsstatus</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.emailVerified)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">Email</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.emailVerified ? 'Verificeret' : 'Ikke verificeret'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.phoneVerified)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">Telefon</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.phoneVerified ? 'Verificeret' : 'Ikke verificeret'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.mitIdVerified)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">MitID</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.mitIdVerified ? 'Verificeret' : 'Ikke verificeret'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.identityVerified)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">Identitet</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.identityVerified ? 'Verificeret' : 'Ikke verificeret'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.incomeVerified)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">Indkomst</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.incomeVerified ? 'Verificeret' : 'Ikke verificeret'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {getVerificationIcon(profile.creditChecked)}
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-800">Kredit</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {profile.creditChecked ? 'Tjekket' : 'Ikke tjekket'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MitID Verification */}
                <MitIDVerification 
                  isVerified={profile.mitIdVerified} 
                  onVerificationComplete={fetchProfile}
                />

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Dokumenter</h3>
                  {profile.documents && profile.documents.length > 0 ? (
                    <div className="space-y-3">
                      {profile.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-800">{doc.title}</p>
                            <p className="text-sm text-gray-600">{doc.type}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            doc.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.verified ? 'Verificeret' : 'Afventer'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <p className="text-gray-600 mb-4">Ingen dokumenter uploadet endnu</p>
                      <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105">
                        Upload Dokument
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  Sikkerhed
                </h2>
                <p className="text-red-100 text-sm mt-1">Administrer dit kodeord og kontoindstillinger</p>
              </div>
              
              <div className="p-6">
                <div className="max-w-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Skift Kodeord</h3>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nuværende Kodeord *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nyt Kodeord *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Mindst 6 tegn</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bekræft Nyt Kodeord *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        minLength={6}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Ændrer Kodeord...
                        </span>
                      ) : (
                        'Skift Kodeord'
                      )}
                    </button>
                  </form>
                </div>

                {/* Security Notice */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <div className="font-medium text-amber-800 mb-1">Sikkerhedstip</div>
                      <div className="text-amber-700 text-sm">
                        Brug et stærkt kodeord med mindst 8 tegn, som indeholder store og små bogstaver, tal og specialtegn. 
                        Undgå at bruge samme kodeord på andre hjemmesider.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center pb-8">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Gemmer Profil...
                  </span>
                ) : (
                  'Gem Alle Ændringer'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}