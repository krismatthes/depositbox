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
  previousAddresses?: Array<{
    address: string
    period: string
    landlord?: string
  }>
  
  // Employment
  monthlyIncome?: number
  employer?: string
  employmentType?: string
  employmentStartDate?: string
  
  // References
  previousLandlords?: Array<{
    name: string
    email: string
    phone?: string
    address: string
    period: string
  }>
  personalReferences?: Array<{
    name: string
    email: string
    phone: string
    relation: string
  }>
  hasGuarantor?: boolean
  guarantorInfo?: {
    name: string
    email: string
    phone: string
    cprNumber?: string
    income: number
  }
  
  // Household
  householdSize?: number
  hasPets?: boolean
  petInfo?: Array<{
    type: string
    breed?: string
    age?: number
    name: string
  }>
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
  const [activeTab, setActiveTab] = useState('personal')

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
      setProfile(response.data)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<TenantProfile>) => {
    setSaving(true)
    try {
      await api.put('/tenant/profile', updates)
      await fetchProfile() // Refresh profile to get updated completeness
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert('Fejl ved opdatering af profil')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('da-DK')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const getVerificationIcon = (verified: boolean) => {
    return verified ? '✅' : '❌'
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage < 30) return 'text-red-600'
    if (percentage < 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Profil ikke fundet</h1>
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                👤 Min Lejer Profil
              </h1>
              <p className="text-slate-600 mt-1">
                Administrer dine oplysninger for at gøre det nemt for udlejere at lære dig at kende
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/tenant/nest"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Inviter Udlejer
              </Link>
              <Link
                href="/tenant/nest/proposals"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📧 Mine Invitationer
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">📊 Profil Komplethed</h2>
              <span className={`text-2xl font-bold ${getCompletenessColor(profile.profileCompleteness)}`}>
                {profile.profileCompleteness}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${profile.profileCompleteness}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600">
              En komplet profil hjælper udlejere med at vurdere din ansøgning hurtigere
            </p>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">🔐 Verificering Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.emailVerified)}</div>
                <span className="text-xs text-slate-600">Email</span>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.phoneVerified)}</div>
                <span className="text-xs text-slate-600">Telefon</span>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.mitIdVerified)}</div>
                <span className="text-xs text-slate-600">MitID</span>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.identityVerified)}</div>
                <span className="text-xs text-slate-600">Identitet</span>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.incomeVerified)}</div>
                <span className="text-xs text-slate-600">Indkomst</span>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{getVerificationIcon(profile.creditChecked)}</div>
                <span className="text-xs text-slate-600">Kredit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'personal', label: '👤 Personligt', icon: '👤' },
                { key: 'employment', label: '💼 Arbejde', icon: '💼' },
                { key: 'household', label: '🏠 Husstand', icon: '🏠' },
                { key: 'references', label: '📋 Referencer', icon: '📋' },
                { key: 'documents', label: '📄 Dokumenter', icon: '📄' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'personal' && (
            <PersonalInfoTab 
              profile={profile} 
              onUpdate={updateProfile} 
              saving={saving} 
            />
          )}
          {activeTab === 'employment' && (
            <EmploymentTab 
              profile={profile} 
              onUpdate={updateProfile} 
              saving={saving} 
            />
          )}
          {activeTab === 'household' && (
            <HouseholdTab 
              profile={profile} 
              onUpdate={updateProfile} 
              saving={saving} 
            />
          )}
          {activeTab === 'references' && (
            <ReferencesTab 
              profile={profile} 
              onUpdate={updateProfile} 
              saving={saving} 
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab 
              profile={profile} 
              onRefresh={fetchProfile} 
            />
          )}
        </div>
        </div>
      </div>
    </>
  )
}

// Personal Information Tab Component
function PersonalInfoTab({ profile, onUpdate, saving }: { 
  profile: TenantProfile, 
  onUpdate: (updates: any) => void, 
  saving: boolean 
}) {
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    cprNumber: profile.cprNumber || '',
    dateOfBirth: profile.dateOfBirth || '',
    nationality: profile.nationality || '',
    currentAddress: profile.currentAddress || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">👤 Personlige Oplysninger</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fornavn *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Efternavn *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Telefonnummer
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CPR Nummer
            </label>
            <input
              type="text"
              value={formData.cprNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, cprNumber: e.target.value }))}
              placeholder="123456-7890"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fødselsdato
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nationalitet
            </label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
              placeholder="Dansk"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuværende Adresse
            </label>
            <input
              type="text"
              value={formData.currentAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, currentAddress: e.target.value }))}
              placeholder="Eksempel Vej 123, 2100 København Ø"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {saving ? 'Gemmer...' : 'Gem Ændringer'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Employment Tab Component
function EmploymentTab({ profile, onUpdate, saving }: { 
  profile: TenantProfile, 
  onUpdate: (updates: any) => void, 
  saving: boolean 
}) {
  const [formData, setFormData] = useState({
    monthlyIncome: profile.monthlyIncome ? Math.round(profile.monthlyIncome / 100) : '',
    employer: profile.employer || '',
    employmentType: profile.employmentType || 'FULL_TIME',
    employmentStartDate: profile.employmentStartDate || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...formData,
      monthlyIncome: formData.monthlyIncome ? parseInt(formData.monthlyIncome.toString()) : undefined
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">💼 Arbejde og Indkomst</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Månedlig Indkomst (DKK)
            </label>
            <input
              type="number"
              value={formData.monthlyIncome}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
              placeholder="35000"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Arbejdsplads
            </label>
            <input
              type="text"
              value={formData.employer}
              onChange={(e) => setFormData(prev => ({ ...prev, employer: e.target.value }))}
              placeholder="Virksomhedens navn"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ansættelsestype
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ansættelsesstartdato
            </label>
            <input
              type="date"
              value={formData.employmentStartDate}
              onChange={(e) => setFormData(prev => ({ ...prev, employmentStartDate: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {saving ? 'Gemmer...' : 'Gem Ændringer'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Household Tab Component
function HouseholdTab({ profile, onUpdate, saving }: { 
  profile: TenantProfile, 
  onUpdate: (updates: any) => void, 
  saving: boolean 
}) {
  const [formData, setFormData] = useState({
    householdSize: profile.householdSize || 1,
    hasPets: profile.hasPets || false,
    isSmoker: profile.isSmoker || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">🏠 Husstand Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Antal personer i husstanden
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.householdSize}
              onChange={(e) => setFormData(prev => ({ ...prev, householdSize: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kæledyr
            </label>
            <select
              value={formData.hasPets ? 'yes' : 'no'}
              onChange={(e) => setFormData(prev => ({ ...prev, hasPets: e.target.value === 'yes' }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="no">Nej, ingen kæledyr</option>
              <option value="yes">Ja, har kæledyr</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ryger
            </label>
            <select
              value={formData.isSmoker ? 'yes' : 'no'}
              onChange={(e) => setFormData(prev => ({ ...prev, isSmoker: e.target.value === 'yes' }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="no">Nej, ryger ikke</option>
              <option value="yes">Ja, ryger</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {saving ? 'Gemmer...' : 'Gem Ændringer'}
          </button>
        </div>
      </form>
    </div>
  )
}

// References Tab Component
function ReferencesTab({ profile, onUpdate, saving }: { 
  profile: TenantProfile, 
  onUpdate: (updates: any) => void, 
  saving: boolean 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">📋 Referencer</h3>
      <p className="text-slate-600">
        Referencer funktionalitet kommer snart...
      </p>
    </div>
  )
}

// Documents Tab Component  
function DocumentsTab({ profile, onRefresh }: { 
  profile: TenantProfile, 
  onRefresh: () => void 
}) {
  return (
    <div className="space-y-6">
      {/* MitID Verification Section */}
      <MitIDVerification 
        isVerified={profile.mitIdVerified} 
        onVerificationComplete={onRefresh}
      />

      {/* Documents Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">📄 Dokumenter</h3>
        
        {profile.documents && profile.documents.length > 0 ? (
          <div className="space-y-3">
            {profile.documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{doc.title}</p>
                  <p className="text-sm text-slate-600">{doc.type}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    doc.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {doc.verified ? 'Verificeret' : 'Afventer verificering'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">Ingen dokumenter uploadet endnu</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Upload Dokument
            </button>
          </div>
        )}
      </div>
    </div>
  )
}