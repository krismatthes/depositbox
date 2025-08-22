'use client'

import AdminLayout from '@/components/AdminLayout'

export default function AdminReportsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📈 Rapporter & Analytics</h1>
            <p className="text-slate-600 mt-1">Generér rapporter og se detaljeret platform analytics</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Kommer Snart</h2>
          <p className="text-slate-600 mb-6">
            Rapport og analytics funktionalitet er under udvikling og vil snart være tilgængelig.
          </p>
          <div className="text-left max-w-md mx-auto">
            <h3 className="font-semibold text-slate-800 mb-3">Planlagte funktioner:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Bruger aktivitets rapporter
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Escrow transaktions analytics
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Platform vækst metrics
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Konvertering og engagement statistikker
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Export til Excel og PDF
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}