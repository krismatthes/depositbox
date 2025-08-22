'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { validateUserAccess, validateContractAccess } from '@/lib/security'

interface SecurityWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: 'TENANT' | 'LANDLORD'
  contractId?: string
  conversationId?: string
  fallbackPath?: string
}

export default function SecurityWrapper({ 
  children, 
  requireAuth = true, 
  requireRole,
  contractId,
  conversationId,
  fallbackPath = '/login'
}: SecurityWrapperProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      // Check basic authentication
      if (requireAuth && !validateUserAccess(user)) {
        router.push('/login')
        return
      }

      // Check role requirement
      if (requireRole && user?.role !== requireRole) {
        router.push('/dashboard')
        return
      }

      // Check contract access
      if (contractId && user && !validateContractAccess(contractId, user.id)) {
        alert('Du har ikke adgang til denne kontrakt.')
        router.push('/dashboard')
        return
      }

      // Check conversation access
      if (conversationId && user) {
        const { validateConversationAccess } = await import('@/lib/security')
        if (!validateConversationAccess(conversationId, user.id)) {
          alert('Du har ikke adgang til denne samtale.')
          router.push('/chat')
          return
        }
      }

      setAuthorized(true)
      setLoading(false)
    }

    checkAccess()
  }, [user, router, requireAuth, requireRole, contractId, conversationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Adgang Nægtet</h2>
          <p className="text-slate-600 mb-6">Du har ikke tilladelse til at se denne side.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Gå til Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook for easy security checks in components
export function useSecurityCheck(contractId?: string, conversationId?: string) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (!user) {
      setHasAccess(false)
      return
    }

    let access = true

    if (contractId) {
      access = access && validateContractAccess(contractId, user.id)
    }

    if (conversationId) {
      const { validateConversationAccess } = require('@/lib/security')
      access = access && validateConversationAccess(conversationId, user.id)
    }

    setHasAccess(access)
  }, [user, contractId, conversationId])

  return { hasAccess, user }
}