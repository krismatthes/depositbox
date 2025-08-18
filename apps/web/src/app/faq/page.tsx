'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  order: number
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const fetchFaqs = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/faq')

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
    fetchFaqs()
  }, [])

  // Get unique categories
  const categories = Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean))) as string[]

  // Filter FAQs based on search term and selected category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = !searchTerm || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
              Ofte stillede spørgsmål
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Find svar på de mest almindelige spørgsmål om Housing Escrow Service
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Søg i FAQ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {categories.length > 0 && (
                <div className="md:w-64">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Alle kategorier</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
              {error}
            </div>
          )}

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {searchTerm || selectedCategory ? 'Ingen resultater fundet' : 'Ingen FAQs endnu'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm || selectedCategory 
                  ? 'Prøv at justere dine søgekriterier'
                  : 'Vi arbejder på at tilføje ofte stillede spørgsmål'
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ryd filtere
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-left">
                          {faq.question}
                        </h3>
                        {faq.category && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {faq.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-slate-400 transform transition-transform duration-200 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-6 pt-2">
                      <div className="ml-12 prose prose-slate max-w-none">
                        <div 
                          className="text-slate-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search Results Info */}
          {(searchTerm || selectedCategory) && filteredFaqs.length > 0 && (
            <div className="mt-8 text-center text-sm text-slate-600">
              Viser {filteredFaqs.length} af {faqs.length} spørgsmål
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory && ` i kategorien "${selectedCategory}"`}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6">
            Fandt du ikke svar på dit spørgsmål?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Vores supportteam står klar til at hjælpe dig med alle dine spørgsmål om Housing Escrow Service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@housingescrow.dk"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              📧 Send os en email
            </a>
            <a
              href="tel:+4512345678"
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-8 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              📞 Ring til os
            </a>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Vi svarer normalt inden for 24 timer på hverdage
          </p>
        </div>
      </section>
    </div>
  )
}