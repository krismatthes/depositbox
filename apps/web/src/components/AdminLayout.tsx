'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login?redirect=/admin')
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Adgang Forbudt</h1>
          <p className="text-slate-600 mb-6">Du har ikke adgang til admin området.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Tilbage til Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const navigation = [
    {
      name: '📊 Dashboard',
      href: '/admin',
      icon: '📊'
    },
    {
      name: '👥 Brugere',
      href: '/admin/users',
      icon: '👥'
    },
    {
      name: '🏠 Nests',
      href: '/admin/nests',
      icon: '🏠'
    },
    {
      name: '💰 Escrows',
      href: '/admin/escrows',
      icon: '💰'
    },
    {
      name: '✅ Verificeringer',
      href: '/admin/verifications',
      icon: '✅'
    },
    {
      name: '📄 Dokumenter',
      href: '/admin/documents',
      icon: '📄'
    },
    {
      name: '📧 Beskeder',
      href: '/admin/messages',
      icon: '📧'
    },
    {
      name: '📈 Rapporter',
      href: '/admin/reports',
      icon: '📈'
    },
    {
      name: '❓ FAQ',
      href: '/admin/faq',
      icon: '❓'
    },
    {
      name: '⚙️ System',
      href: '/admin/system',
      icon: '⚙️'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-800">
          <h1 className="text-xl font-bold text-white">
            🛡️ Admin Panel
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors group"
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span className="text-lg mr-3">🏠</span>
              <span className="font-medium">Bruger Dashboard</span>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors mt-2"
            >
              <span className="text-lg mr-3">🚪</span>
              <span className="font-medium">Log ud</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-600">Administrator</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Sidebar backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}