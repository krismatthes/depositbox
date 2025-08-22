'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { BlogPost, BlogCategory, BlogStats } from '@/types/blog'
import { getBlogPosts, getBlogCategories, formatDate } from '@/lib/blog'
import AdminLayout from '@/components/AdminLayout'
import AdminChart from '@/components/AdminChart'

export default function AdminBlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [stats, setStats] = useState<BlogStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    categoryCounts: {}
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    // Check if user is admin (in real app, this would be more secure)
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allPosts, categoriesData] = await Promise.all([
        getBlogPosts({}), // Get all posts including drafts
        getBlogCategories()
      ])

      setPosts(allPosts)
      setCategories(categoriesData)

      // Calculate stats
      const published = allPosts.filter(p => p.status === 'published')
      const drafts = allPosts.filter(p => p.status === 'draft')
      const totalViews = allPosts.reduce((sum, post) => sum + post.viewCount, 0)

      const categoryCounts: { [key: string]: number } = {}
      allPosts.forEach(post => {
        categoryCounts[post.category.id] = (categoryCounts[post.category.id] || 0) + 1
      })

      setStats({
        totalPosts: allPosts.length,
        publishedPosts: published.length,
        draftPosts: drafts.length,
        totalViews,
        categoryCounts
      })
    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredPosts = () => {
    switch (filter) {
      case 'published':
        return posts.filter(p => p.status === 'published')
      case 'draft':
        return posts.filter(p => p.status === 'draft')
      default:
        return posts
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne artikel?')) return
    
    // TODO: Implement delete functionality
    alert('Delete funktionalitet ville blive implementeret her')
  }

  const handlePublishPost = async (postId: string) => {
    // TODO: Implement publish functionality
    alert('Publish funktionalitet ville blive implementeret her')
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

  const filteredPosts = getFilteredPosts()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📝 Blog Administration</h1>
            <p className="text-slate-600 mt-1">Administrer blog artikler, kategorier og indhold</p>
          </div>
          <Link
            href="/admin/blog/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ny Artikel
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Artikler</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Publiceret</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.publishedPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Kladder</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.draftPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Visninger</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

        {/* Blog Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminChart
            title="📊 Artikler efter Kategori"
            type="pie"
            data={Object.entries(stats.categoryCounts).map(([categoryId, count]) => {
              const category = categories.find(c => c.id === categoryId)
              return {
                label: category?.name || categoryId,
                value: count,
                color: category?.color?.replace('bg-', '#') === category?.color ? '#3b82f6' : 
                       category?.color === 'bg-blue-500' ? '#3b82f6' :
                       category?.color === 'bg-green-500' ? '#10b981' :
                       category?.color === 'bg-red-500' ? '#ef4444' :
                       category?.color === 'bg-purple-500' ? '#8b5cf6' :
                       category?.color === 'bg-orange-500' ? '#f97316' : '#6b7280'
              }
            })}
            height={300}
          />
          
          <AdminChart
            title="👁️ Visninger per Artikel (Top 5)"
            type="bar"
            data={posts
              .sort((a, b) => b.viewCount - a.viewCount)
              .slice(0, 5)
              .map(post => ({
                label: post.title.length > 20 ? post.title.substring(0, 20) + '...' : post.title,
                value: post.viewCount,
                color: '#8b5cf6'
              }))}
            height={300}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Alle ({stats.totalPosts})
                </button>
                <button
                  onClick={() => setFilter('published')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'published' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Publiceret ({stats.publishedPosts})
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Kladder ({stats.draftPosts})
                </button>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/admin/blog/categories"
                  className="text-slate-600 hover:text-slate-800 font-medium"
                >
                  Administrer Kategorier
                </Link>
              </div>
            </div>
          </div>

        {/* Posts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Artikel</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Kategori</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Visninger</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Dato</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-900">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          {post.featuredImage && (
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              width={64}
                              height={64}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-slate-900 mb-1">{post.title}</h3>
                            <p className="text-sm text-slate-600 line-clamp-2">{post.excerpt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${post.category.color}`}>
                          {post.category.name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : post.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status === 'published' ? 'Publiceret' : 
                           post.status === 'draft' ? 'Kladde' : 'Arkiveret'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {post.viewCount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/blog/edit/${post.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Rediger"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Vis"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          {post.status === 'draft' && (
                            <button
                              onClick={() => handlePublishPost(post.id)}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Publicer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Slet"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Ingen artikler</h3>
                <p className="text-slate-600 mb-6">Kom i gang med at oprette din første blog artikel.</p>
                <Link
                  href="/admin/blog/create"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Opret Artikel
                </Link>
              </div>
            )}
          </div>
      </div>
    </AdminLayout>
  )
}