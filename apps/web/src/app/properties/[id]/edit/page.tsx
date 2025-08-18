'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
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
  moveInDate?: string
  status: string
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: '🏠 Lejlighed' },
  { value: 'HOUSE', label: '🏡 Hus' },
  { value: 'VILLA', label: '🏘️ Villa' },
  { value: 'TOWNHOUSE', label: '🏘️ Rækkehus' },
  { value: 'STUDIO', label: '🏢 Studio' },
  { value: 'ROOM', label: '🚪 Værelse' }
]

export default function EditPropertyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    address: '',
    propertyType: 'APARTMENT',
    size: '',
    monthlyRent: '',
    depositAmount: '',
    prepaidRent: '',
    currency: 'DKK',
    moveInDate: '',
    status: 'ACTIVE'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && propertyId) {
      fetchProperty()
    }
  }, [user, propertyId])

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/properties/${propertyId}`)
      const prop = response.data.property
      setProperty(prop)
      setFormData({
        address: prop.address || '',
        propertyType: prop.propertyType || 'APARTMENT',
        size: prop.size?.toString() || '',
        monthlyRent: prop.monthlyRent ? Math.round(prop.monthlyRent).toString() : '',
        depositAmount: prop.depositAmount ? Math.round(prop.depositAmount).toString() : '',
        prepaidRent: prop.prepaidRent ? Math.round(prop.prepaidRent).toString() : '',
        currency: prop.currency || 'DKK',
        moveInDate: prop.moveInDate ? prop.moveInDate.split('T')[0] : '',
        status: prop.status || 'ACTIVE'
      })
    } catch (error) {
      console.error('Failed to fetch property:', error)
      setError('Kunne ikke hente boligdata')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Handle price fields - only allow whole numbers
    if (['monthlyRent', 'depositAmount', 'prepaidRent'].includes(name)) {
      // Remove any non-digit characters and ensure it's a valid number
      const numericValue = value.replace(/[^0-9]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = {
        ...formData,
        size: parseInt(formData.size) || null,
        monthlyRent: parseInt(formData.monthlyRent) || 0,
        depositAmount: parseInt(formData.depositAmount) || 0,
        prepaidRent: parseInt(formData.prepaidRent) || 0,
        moveInDate: formData.moveInDate ? new Date(formData.moveInDate).toISOString() : null
      }

      await api.put(`/properties/${propertyId}`, payload)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Failed to update property:', error)
      setError(error.response?.data?.error || 'Kunne ikke opdatere boligen')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Bolig ikke fundet</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Tilbage til dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto py-8 px-4">
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
            <h1 className="text-3xl font-bold text-slate-800">Rediger Bolig</h1>
          </div>
          <p className="text-slate-600">Opdater boligens oplysninger</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Boligtype *
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Størrelse (m²)
                </label>
                <input
                  type="number"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Månedlig husleje * <span className="text-sm text-slate-500">(kun hele kroner)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="10000"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">DKK</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Depositum <span className="text-sm text-slate-500">(kun hele kroner)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="30000"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">DKK</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Forudbetalt leje <span className="text-sm text-slate-500">(kun hele kroner)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="prepaidRent"
                    value={formData.prepaidRent}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">DKK</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planlagt indflytningsdato
                </label>
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="ACTIVE">Aktiv</option>
                  <option value="OCCUPIED">Udlejet</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuller
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className={`
                  px-8 py-3 rounded-lg font-semibold transition-all
                  ${isSaving 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }
                `}
              >
                {isSaving ? 'Gemmer...' : 'Gem Ændringer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}