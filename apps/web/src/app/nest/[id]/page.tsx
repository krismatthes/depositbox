'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DeprecatedNestPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the correct escrow details page
    router.replace(`/nest/escrows/${params.id}`)
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Omdirigerer til korrekt side...</p>
      </div>
    </div>
  )
}