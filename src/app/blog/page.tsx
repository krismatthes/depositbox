'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BlogImageWithFallback from '@/components/BlogImageWithFallback'
import { BlogPost, BlogCategory, BlogFilter } from '@/types/blog'
import { getBlogPosts, getBlogCategories, formatDate } from '@/lib/blog'
import Navigation from '@/components/Navigation'
import Head from 'next/head'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BlogFilter>({ status: 'published' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [postsData, categoriesData] = await Promise.all([
        getBlogPosts(filter),
        getBlogCategories()
      ])
      setPosts(postsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilter({ ...filter, search: searchTerm })
  }

  const handleCategoryFilter = (categorySlug: string | undefined) => {
    setFilter({ ...filter, category: categorySlug })
  }

  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

  return (
    <>
      <Head>
        <title>Blog - Tips, guides og nyheder | Project X</title>
        <meta name="description" content="Få de seneste tips, guides og nyheder om boligmarkedet. Ekspertråd til udlejere og lejere fra Project X." />
        <meta property="og:title" content="Blog - Tips, guides og nyheder | Project X" />
        <meta property="og:description" content="Få de seneste tips, guides og nyheder om boligmarkedet. Ekspertråd til udlejere og lejere fra Project X." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://projectx.dk/blog" />
      </Head>

      <Navigation />
      
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Project X Blog
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Tips, guides og ekspertråd til det moderne boligmarked. 
                Alt du behøver at vide om udlejning, lejemål og digitale løsninger.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search and Filter */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-96">
                  <input
                    type="text"
                    placeholder="Søg artikler..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Søg
                </button>
              </form>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCategoryFilter(undefined)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !filter.category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter.category === category.slug 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredPost && (
                <section className="mb-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Fremhævet artikel</h2>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <article className="group cursor-pointer">
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="grid lg:grid-cols-2 gap-0">
                          <div className="relative h-64 lg:h-auto">
                            <BlogImageWithFallback
                              src={featuredPost.featuredImage || '/placeholder-blog.jpg'}
                              alt={featuredPost.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${featuredPost.category.color}`}>
                                {featuredPost.category.name}
                              </span>
                            </div>
                          </div>
                          <div className="p-8 flex flex-col justify-center">
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                              <span>{formatDate(featuredPost.publishedAt || featuredPost.createdAt)}</span>
                              <span>•</span>
                              <span>{featuredPost.readingTime} min læsning</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                              {featuredPost.title}
                            </h3>
                            <p className="text-gray-600 mb-6 line-clamp-3">
                              {featuredPost.excerpt}
                            </p>
                            <div className="flex items-center gap-3">
                              <BlogImageWithFallback
                                src={featuredPost.author.avatar || '/default-avatar.jpg'}
                                alt={featuredPost.author.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <span className="font-medium text-gray-900">{featuredPost.author.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </section>
              )}

              {/* Regular Articles */}
              {regularPosts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Seneste artikler</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`}>
                        <article className="group cursor-pointer">
                          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="relative h-48">
                              <BlogImageWithFallback
                                src={post.featuredImage || '/placeholder-blog.jpg'}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-3 left-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${post.category.color}`}>
                                  {post.category.name}
                                </span>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                <span>•</span>
                                <span>{post.readingTime} min</span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center gap-2">
                                <BlogImageWithFallback
                                  src={post.author.avatar || '/default-avatar.jpg'}
                                  alt={post.author.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                                <span className="text-xs font-medium text-gray-700">{post.author.name}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* No Results */}
              {posts.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen artikler fundet</h3>
                  <p className="text-gray-600">Prøv at justere dine søgekriterier.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Få de seneste artikler direkte i din indbakke
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tilmeld dig vores nyhedsbrev og vær den første til at læse nye guides og tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Din email adresse"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tilmeld
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}