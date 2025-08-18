'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/lib/auth-context'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  order: number
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminFAQPage() {
  const { user } = useAuth()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    published: true
  })

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3005/api/admin/faq', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch FAQs')
      }

      const data = await response.json()
      setFaqs(data)
    } catch (err: any) {
      console.error('Error fetching FAQs:', err)
      setError(err.message || 'Failed to fetch FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchFaqs()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = editingFaq 
        ? `http://localhost:3005/api/admin/faq/${editingFaq.id}`
        : 'http://localhost:3005/api/admin/faq'
      
      const method = editingFaq ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingFaq ? 'update' : 'create'} FAQ`)
      }

      await fetchFaqs()
      resetForm()
    } catch (err: any) {
      console.error('Error saving FAQ:', err)
      setError(err.message || 'Failed to save FAQ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne FAQ?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3005/api/admin/faq/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete FAQ')
      }

      await fetchFaqs()
    } catch (err: any) {
      console.error('Error deleting FAQ:', err)
      setError(err.message || 'Failed to delete FAQ')
    }
  }

  const startEditing = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      order: faq.order,
      published: faq.published
    })
    setIsCreating(false)
  }

  const resetForm = () => {
    setEditingFaq(null)
    setIsCreating(false)
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: 0,
      published: true
    })
  }

  const startCreating = () => {
    setIsCreating(true)
    setEditingFaq(null)
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: faqs.length,
      published: true
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">FAQ Administration</h1>
          <button
            onClick={startCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ➕ Opret ny FAQ
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingFaq) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              {editingFaq ? 'Rediger FAQ' : 'Opret ny FAQ'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Spørgsmål *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Indtast spørgsmålet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Svar *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Indtast svaret... (HTML og markdown understøttes)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="fx. Betalinger, Sikkerhed..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rækkefølge
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.published ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, published: e.target.value === 'true' })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Publiceret</option>
                    <option value="false">Kladde</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {editingFaq ? '💾 Gem ændringer' : '➕ Opret FAQ'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  ❌ Annuller
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQ List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              Alle FAQs ({faqs.length})
            </h2>
          </div>

          {faqs.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <div className="text-6xl mb-4">❓</div>
              <p className="text-lg mb-2">Ingen FAQs endnu</p>
              <p className="text-sm">Opret den første FAQ for at komme i gang.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">{faq.question}</h3>
                        <div className="flex items-center gap-2">
                          {faq.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {faq.category}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            faq.published 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {faq.published ? '✅ Publiceret' : '📝 Kladde'}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            #{faq.order}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-3">
                        {faq.answer.length > 150 
                          ? `${faq.answer.substring(0, 150)}...` 
                          : faq.answer
                        }
                      </p>
                      <div className="text-xs text-slate-400">
                        Oprettet: {new Date(faq.createdAt).toLocaleDateString('da-DK')}
                        {faq.updatedAt !== faq.createdAt && (
                          <> • Opdateret: {new Date(faq.updatedAt).toLocaleDateString('da-DK')}</>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(faq)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Rediger"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Slet"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        {faqs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total FAQs</p>
                  <p className="text-2xl font-bold text-slate-800">{faqs.length}</p>
                </div>
                <div className="text-3xl">❓</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Publiceret</p>
                  <p className="text-2xl font-bold text-green-600">
                    {faqs.filter(faq => faq.published).length}
                  </p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Kladder</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {faqs.filter(faq => !faq.published).length}
                  </p>
                </div>
                <div className="text-3xl">📝</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}