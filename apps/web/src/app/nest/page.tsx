'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import NestEscrowDashboard from '@/components/nest-escrow/NestEscrowDashboard'

export default function NestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user) {
      // Redirect to dashboard instead - the new integrated Nest view
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // This should never render now, but keep as fallback
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Redirecter til Dashboard...</h1>
          <p className="text-slate-600">Depositums Box funktionalitet er nu integreret i Dashboard.</p>
        </div>
      </div>
    </div>
  )
}