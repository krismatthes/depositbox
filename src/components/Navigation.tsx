'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export default function Navigation() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                BoligDeposit
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {user && (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="text-slate-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                      🛠️ Admin Panel
                    </Link>
                  )}
                </>
              )}
              <Link href="/how-it-works" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Sådan virker det
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Priser
              </Link>
              <Link href="/blog" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Blog
              </Link>
              <Link href="/faq" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <span>{user.firstName} {user.lastName}</span>
                  <svg className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/tenant/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Min Profil
                    </Link>

                    <Link
                      href="/onboarding"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Kom godt i gang
                    </Link>

                    <Link
                      href="/chat"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {user?.role === 'TENANT' ? 'Chat med udlejer' : 'Chat med lejer'}
                    </Link>

                    <Link
                      href="/settings/2fa"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      To-faktor (2FA)
                    </Link>

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          logout()
                          setProfileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log ud
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Log ind
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300">
                  Opret konto
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-dark-300 hover:text-primary-400 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-700/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && (
                <>
                  <Link href="/dashboard" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block text-dark-300 hover:text-red-400 px-3 py-2 text-base font-medium">
                      🛠️ Admin Panel
                    </Link>
                  )}
                </>
              )}
              <Link href="/how-it-works" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Sådan virker det
              </Link>
              <Link href="/pricing" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Priser
              </Link>
              <Link href="/blog" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Blog
              </Link>
              <Link href="/faq" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                FAQ
              </Link>
              
              <div className="border-t border-dark-700/50 pt-4 mt-4">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-dark-300 text-sm">
                      {user.firstName} {user.lastName}
                    </div>
                    <button
                      onClick={logout}
                      className="block w-full text-left text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium"
                    >
                      Log ud
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                      Log ind
                    </Link>
                    <Link href="/register" className="block text-primary-400 hover:text-primary-300 px-3 py-2 text-base font-medium">
                      Opret konto
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}