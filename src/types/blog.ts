export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  author: {
    id: string
    name: string
    avatar?: string
    bio?: string
  }
  category: BlogCategory
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  seo: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: string
    keywords?: string[]
  }
  readingTime: number
  viewCount: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
}

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  categoryCounts: { [categoryId: string]: number }
}

export interface BlogFilter {
  category?: string
  tag?: string
  status?: 'draft' | 'published' | 'archived'
  search?: string
  author?: string
}