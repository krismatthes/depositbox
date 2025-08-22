'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlogCategory } from '@/types/blog'
import { getBlogCategories, createSlug } from '@/lib/blog'
import AdminLayout from '@/components/AdminLayout'

export default function CreateBlogPostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    categoryId: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      keywords: ''
    }
  })

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    loadCategories()
  }, [user, router])

  const loadCategories = async () => {
    try {
      const categoriesData = await getBlogCategories()
      setCategories(categoriesData)
      if (categoriesData.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('seo.')) {
      const seoField = field.replace('seo.', '')
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, [seoField]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Auto-generate slug from title
    if (field === 'title' && value) {
      const slug = createSlug(value)
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      alert('Titel er påkrævet')
      return
    }

    if (!formData.excerpt.trim()) {
      alert('Uddrag er påkrævet')
      return
    }

    if (!formData.content.trim()) {
      alert('Indhold er påkrævet')
      return
    }

    setLoading(true)
    
    try {
      // TODO: Implement save functionality
      // In a real app, this would send data to an API endpoint
      
      const postData = {
        ...formData,
        status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      console.log('Saving blog post:', postData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`Artikel ${status === 'draft' ? 'gemt som kladde' : 'publiceret'} succesfuldt!`)
      router.push('/admin/blog')
      
    } catch (error) {
      console.error('Error saving blog post:', error)
      alert('Fejl ved gemning af artikel')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/blog"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📝 Opret Ny Artikel</h1>
              <p className="text-slate-600 mt-1">Skriv og publicer en ny blog artikel</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Grundlæggende Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Titel *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Indtast artikel titel..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="text-slate-500 bg-slate-100 px-3 py-3 rounded-l-lg border border-r-0 border-slate-300">
                        projectx.dk/blog/
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="url-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Uddrag *
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Kort beskrivelse der vises på blog oversigten..."
                      required
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.excerpt.length}/200 tegn (anbefalet: 120-160)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.featuredImage}
                      onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.featuredImage && (
                      <div className="mt-2 relative h-32 rounded-lg overflow-hidden">
                        <img
                          src={formData.featuredImage}
                          alt="Featured image preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Artikel Indhold</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Indhold *
                  </label>
                  <div className="border border-slate-300 rounded-lg">
                    {/* Rich Text Editor Placeholder */}
                    <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                      <p className="text-yellow-800 text-sm font-medium">Demo Editor</p>
                      <p className="text-yellow-700 text-xs">
                        I det rigtige system ville der være en rich text editor (som TinyMCE eller Quill) her
                      </p>
                    </div>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none resize-none rounded-b-lg"
                      placeholder="Skriv dit artikel indhold her... (I det rigtige system ville dette være en rich text editor)"
                      required
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Tip: Brug overskrifter, lister og billeder for at gøre artiklen mere læsevenlig
                  </p>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">SEO Indstillinger</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Titel
                    </label>
                    <input
                      type="text"
                      value={formData.seo.metaTitle}
                      onChange={(e) => handleInputChange('seo.metaTitle', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Efterlad tom for at bruge artikel titel"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.seo.metaTitle.length}/60 tegn (anbefalet: under 60)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Beskrivelse
                    </label>
                    <textarea
                      value={formData.seo.metaDescription}
                      onChange={(e) => handleInputChange('seo.metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Efterlad tom for at bruge artikel uddrag"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.seo.metaDescription.length}/160 tegn (anbefalet: 120-160)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nøgleord
                    </label>
                    <input
                      type="text"
                      value={formData.seo.keywords}
                      onChange={(e) => handleInputChange('seo.keywords', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="nøgleord1, nøgleord2, nøgleord3"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Adskil nøgleord med komma
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Social Media Billede URL
                    </label>
                    <input
                      type="url"
                      value={formData.seo.ogImage}
                      onChange={(e) => handleInputChange('seo.ogImage', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Efterlad tom for at bruge featured image"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Publicering</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave('draft')}
                      disabled={loading}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {loading ? 'Gemmer...' : 'Gem som Kladde'}
                    </button>
                    <button
                      onClick={() => handleSave('published')}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {loading ? 'Publicerer...' : 'Publicer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Kategori</h3>
                
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {selectedCategory && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedCategory.color}`}></div>
                    <span className="text-sm text-slate-600">{selectedCategory.description}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Tags</h3>
                
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Adskil tags med komma. Max 10 tags.
                </p>
                
                {formData.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Forhåndsvisning</h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-2">Google resultat:</p>
                    <div className="space-y-1">
                      <div className="text-blue-600 text-sm font-medium line-clamp-1">
                        {formData.seo.metaTitle || formData.title || 'Artikel titel'}
                      </div>
                      <div className="text-green-600 text-xs">
                        projectx.dk/blog/{formData.slug || 'artikel-slug'}
                      </div>
                      <div className="text-slate-600 text-sm line-clamp-2">
                        {formData.seo.metaDescription || formData.excerpt || 'Artikel beskrivelse...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </AdminLayout>
  )
}