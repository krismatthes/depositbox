'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              <Link href="/" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Hjem
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                    <Link href="/nest" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                      🏦 Nest
                    </Link>
                  )}
                  {(user.role === 'TENANT' || user.role === 'USER') && (
                    <>
                      <Link href="/tenant/profile" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        👤 Min Profil
                      </Link>
                      <Link href="/tenant/nest/proposals" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                        📧 Mine Invitationer
                      </Link>
                    </>
                  )}
                </>
              )}
              <Link href="/how-it-works" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Sådan virker det
              </Link>
              <Link href="/#features" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Funktioner
              </Link>
              <Link href="/faq" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <span className="text-slate-600 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={logout}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Log ud
                </button>
              </>
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
              <Link href="/" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Hjem
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                    Dashboard
                  </Link>
                  {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                    <Link href="/nest" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                      🏦 Nest
                    </Link>
                  )}
                  {(user.role === 'TENANT' || user.role === 'USER') && (
                    <>
                      <Link href="/tenant/profile" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                        👤 Min Profil
                      </Link>
                      <Link href="/tenant/nest/proposals" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                        📧 Mine Invitationer
                      </Link>
                    </>
                  )}
                </>
              )}
              <Link href="/how-it-works" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Sådan virker det
              </Link>
              <Link href="/#features" className="block text-dark-300 hover:text-primary-400 px-3 py-2 text-base font-medium">
                Funktioner
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