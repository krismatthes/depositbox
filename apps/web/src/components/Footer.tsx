'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                BoligDeposit
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sikker håndtering af depositum mellem udlejere og lejere i Danmark. 
              GDPR-compliant og lovligt escrow-service.
            </p>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                GDPR Compliant
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Sådan virker det
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Priser
                </Link>
              </li>
              <li>
                <Link href="/nest" className="text-slate-300 hover:text-white transition-colors text-sm">
                  NEST Escrow
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Ofte stillede spørgsmål
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Kontakt os
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Hjælp og support
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Blog og guides
                </Link>
              </li>
              <li>
                <a href="mailto:support@boligdeposit.dk" className="text-slate-300 hover:text-white transition-colors text-sm">
                  support@boligdeposit.dk
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Juridisk</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Servicevilkår
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Privatlivspolitik
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Cookie Politik
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-slate-300 hover:text-white transition-colors text-sm">
                  GDPR Information
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              <p>© {new Date().getFullYear()} BoligDeposit ApS. Alle rettigheder forbeholdes.</p>
              <p className="text-xs mt-1">CVR: [CVR-NUMMER] | Registreret i Danmark</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  SSL Sikret
                </div>
              </div>
              <div className="text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  256-bit Kryptering
                </div>
              </div>
              <div className="text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  GDPR Compliant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Preferences */}
        <div className="border-t border-slate-700 mt-6 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <div className="mb-2 md:mb-0">
              <Link href="/cookie-policy" className="hover:text-white transition-colors">
                🍪 Administrer cookie-indstillinger
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span>Platformen kører på sikre servere i EU</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Alle systemer operationelle</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}