'use client'

import AdminLayout from '@/components/AdminLayout'

export default function AdminSystemPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">⚙️ System Administration</h1>
            <p className="text-slate-600 mt-1">Administrer system indstillinger, logs og konfiguration</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Kommer Snart</h2>
          <p className="text-slate-600 mb-6">
            System administration funktionalitet er under udvikling og vil snart være tilgængelig.
          </p>
          <div className="text-left max-w-md mx-auto">
            <h3 className="font-semibold text-slate-800 mb-3">Planlagte funktioner:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                System logs og debugging
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Database backup og restore
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Configuration management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Performance monitoring
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Security audit trails
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}