'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMitID, MitIDUser } from '@/lib/mitid'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function MitIDCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleCallback } = useMitID()
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleMitIDCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`MitID authentication failed: ${error}`)
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter')
        }

        setMessage('Behandler MitID svar...')

        // Handle the callback and get user data
        const { tokens, userInfo } = await handleCallback(code, state)

        setMessage('Opdaterer din profil...')

        // Send the verification data to our backend
        await api.post('/auth/mitid/verify', {
          userInfo,
          accessToken: tokens.accessToken,
          idToken: tokens.idToken
        })

        setMessage('MitID verificering gennemført!')
        setStatus('success')

        // Refresh user data to reflect verification
        if (refreshUser) {
          await refreshUser()
        }

        // Redirect to profile after a short delay
        setTimeout(() => {
          router.push('/tenant/profile?verified=true')
        }, 2000)

      } catch (error) {
        console.error('MitID callback error:', error)
        setMessage(error instanceof Error ? error.message : 'Der opstod en fejl under MitID verificering')
        setStatus('error')
        
        // Redirect back to profile after error
        setTimeout(() => {
          router.push('/tenant/profile?error=mitid_failed')
        }, 3000)
      }
    }

    handleMitIDCallback()
  }, [searchParams, handleCallback, router, refreshUser])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-4">MitID Verificering</h1>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-800 mb-4">Verificering Gennemført!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <p className="text-sm text-slate-500">Du omdirigeres automatisk til din profil...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-800 mb-4">Verificering Fejlede</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <p className="text-sm text-slate-500">Du omdirigeres tilbage til din profil...</p>
              <button
                onClick={() => router.push('/tenant/profile')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Tilbage til Profil
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}