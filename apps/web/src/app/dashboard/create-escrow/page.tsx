'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function CreateEscrowPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: '',
    propertyTitle: '',
    propertyAddress: '',
    sellerEmail: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      await api.post('/escrow', {
        amount: parseFloat(formData.amount),
        propertyTitle: formData.propertyTitle,
        propertyAddress: formData.propertyAddress,
        sellerEmail: formData.sellerEmail
      })
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create escrow')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-800">
      <Navigation />
      
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white mt-2">Create New Escrow</h1>
            <p className="text-dark-400 mt-1">Set up a secure deposit escrow for your property transaction.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card">
              {error && (
                <div className="mb-6 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="propertyTitle" className="block text-sm font-medium text-dark-300">
                    Property Title
                  </label>
                  <input
                    id="propertyTitle"
                    name="propertyTitle"
                    type="text"
                    required
                    className="mt-1 input"
                    placeholder="e.g., Modern 2-bedroom apartment in Copenhagen"
                    value={formData.propertyTitle}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="propertyAddress" className="block text-sm font-medium text-dark-300">
                    Property Address
                  </label>
                  <textarea
                    id="propertyAddress"
                    name="propertyAddress"
                    rows={3}
                    required
                    className="mt-1 input resize-none"
                    placeholder="Enter the full property address"
                    value={formData.propertyAddress}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-dark-300">
                    Deposit Amount (DKK)
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="mt-1 input"
                    placeholder="e.g., 50000"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="sellerEmail" className="block text-sm font-medium text-dark-300">
                    Seller Email Address
                  </label>
                  <input
                    id="sellerEmail"
                    name="sellerEmail"
                    type="email"
                    required
                    className="mt-1 input"
                    placeholder="seller@example.com"
                    value={formData.sellerEmail}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-dark-400">
                    The seller must have an account with this email address.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/dashboard"
                  className="btn-secondary"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating Escrow...' : 'Create Escrow'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}