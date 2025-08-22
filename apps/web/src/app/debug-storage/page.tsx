'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

export default function DebugStoragePage() {
  const { user, loading } = useAuth()
  const [storageData, setStorageData] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data: {[key: string]: string} = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          data[key] = localStorage.getItem(key) || ''
        }
      }
      setStorageData(data)
    }
  }, [])

  const clearAll = () => {
    localStorage.clear()
    setStorageData({})
  }

  const clearEscrows = () => {
    if (user) {
      localStorage.removeItem(`escrows_${user.id}`)
      const newData = {...storageData}
      delete newData[`escrows_${user.id}`]
      setStorageData(newData)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Debug Storage</h1>
          
          {user && (
            <div className="bg-blue-100 p-4 rounded-lg mb-6">
              <h2 className="font-bold text-blue-800">Current User</h2>
              <p className="text-blue-700">ID: {user.id}</p>
              <p className="text-blue-700">Email: {user.email}</p>
              <p className="text-blue-700">Role: {user.role}</p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button 
              onClick={clearAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear All Storage
            </button>
            {user && (
              <button 
                onClick={clearEscrows}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                Clear User Escrows
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">LocalStorage Contents</h2>
            
            {Object.keys(storageData).length === 0 ? (
              <p className="text-slate-600">No data in localStorage</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(storageData).map(([key, value]) => (
                  <div key={key} className="border-b border-slate-200 pb-4">
                    <h3 className="font-semibold text-slate-800 mb-2">{key}</h3>
                    <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {typeof value === 'string' && value.startsWith('{') || value.startsWith('[') 
                        ? JSON.stringify(JSON.parse(value), null, 2)
                        : value
                      }
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}