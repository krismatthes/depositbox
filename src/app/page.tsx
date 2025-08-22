'use client'

import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 overflow-hidden">
        {/* Soft background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Sikker depositum betaling
              <span className="block text-blue-600 mt-2">med Depositums Box</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Revolutionér boligudlejning med vores professionelle Depositums Box. Pengene er sikre 
              hos PayProff og frigives først når begge parter er tilfredse.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              {user ? (
                <>
                  <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Gå til Dashboard
                  </Link>
                  <div className="flex flex-col gap-3">
                    <Link href="/nest/create-simple" className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 text-center">
                      📦 Opret Depositums Box
                    </Link>
                    
                    <div className="flex justify-center">
                      <Link 
                        href="/properties/create"
                        className="text-sm text-slate-600 hover:text-slate-800 underline decoration-dotted transition-colors"
                      >
                        Opret bolig uden Depositums Box
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="group h-full">
                    <Link href="/register?role=LANDLORD" className="flex flex-col h-full bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:border-blue-400 hover:bg-white hover:-translate-y-2 hover:scale-105">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                        <svg className="w-8 h-8 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">Jeg er udlejer</h3>
                      <div className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 mx-auto inline-block">
                        ✨ 100% GRATIS for udlejere
                      </div>
                      <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                        Skab tillid og virk professionel overfor potentielle lejere. Få sikker deponering uden omkostninger.
                      </p>
                      <div className="text-sm text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                        Kom i gang →
                      </div>
                    </Link>
                  </div>
                  
                  <div className="group h-full">
                    <Link href="/register?role=TENANT" className="flex flex-col h-full bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:border-green-400 hover:bg-white hover:-translate-y-2 hover:scale-105">
                      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-100 group-hover:scale-110 transition-all duration-300">
                        <svg className="w-8 h-8 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-green-700 transition-colors">Jeg er lejer</h3>
                      <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 mx-auto inline-block">
                        🔒 Få sikkerhed fra kun 199,-
                      </div>
                      <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                        Betal dit depositum sikkert og få beskyttelse af dine penge
                      </p>
                      <div className="text-sm text-green-600 font-semibold group-hover:text-green-700 transition-colors">
                        Kom i gang →
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">100% sikker</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">PayProff certificeret</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Lynhurtig opsætning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Sådan virker det
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              En simpel proces der skaber tryghed for både udlejer og lejer
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200"></div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Opret Depositums Box</h3>
              <p className="text-slate-600 leading-relaxed">
                Udlejer eller lejer opretter en fælles Depositums Box til pengene med boligoplysninger og depositum beløb
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Sikker betaling</h3>
              <p className="text-slate-600 leading-relaxed">
                Lejer betaler depositum til PayProff Depositums Box - pengene er nu sikret og holdes i fælles neutral depot
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Automatisk frigivelse</h3>
              <p className="text-slate-600 leading-relaxed">
                → Udbetales når begge parter er tilfredse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Private Landlords */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Privat udlejer</h3>
              <p className="text-lg text-blue-700 font-semibold mb-4">Beskyt dig selv mod usikre betalinger</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Slip for usikre bankoverførsler</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Virk professionel og seriøs</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Hurtigere udlejning</span>
                </li>
              </ul>
            </div>

            {/* Tenants */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Lejer</h3>
              <p className="text-lg text-green-700 font-semibold mb-4">Betal trygt og få sikkerhed for din indbetaling</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Dit depositum er beskyttet</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Gennemsigtig process</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600">Automatisk tilbagebetaling</span>
                </li>
              </ul>
            </div>

            {/* Property Administrators */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200 opacity-60 relative">
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                🚧 Kommer snart
              </div>
              <div className="w-16 h-16 bg-slate-400 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-500 mb-4">Ejendomsadministrator</h3>
              <p className="text-lg text-slate-500 font-semibold mb-4">Automatiser og gør processen effektiv</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-500">Håndter flere lejemål samtidigt</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-500">Automatiseret workflow</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-500">Komplet dokumentation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Enkle og gennemsigtige priser
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Kun lejeren betaler et gebyr. Udlejeren betaler intet for at bruge BoligDeposit.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
                <span className="text-2xl font-bold text-white">3%</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-4">
                3% af depositumbeløbet
              </h3>
              <p className="text-lg text-slate-600">
                Minimum 199 DKK • Maksimum 799 DKK
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 bg-slate-50 rounded-2xl">
                <div className="text-2xl font-bold text-slate-800 mb-2">5.000 DKK</div>
                <div className="text-sm text-slate-600 mb-3">Depositum</div>
                <div className="text-xl font-bold text-blue-600">199 DKK</div>
                <div className="text-xs text-blue-500">Minimum gebyr</div>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="text-2xl font-bold text-slate-800 mb-2">15.000 DKK</div>
                <div className="text-sm text-slate-600 mb-3">Depositum</div>
                <div className="text-xl font-bold text-blue-600">450 DKK</div>
                <div className="text-xs text-blue-500">Standard gebyr</div>
              </div>

              <div className="text-center p-6 bg-slate-50 rounded-2xl">
                <div className="text-2xl font-bold text-slate-800 mb-2">30.000 DKK</div>
                <div className="text-sm text-slate-600 mb-3">Depositum</div>
                <div className="text-xl font-bold text-blue-600">799 DKK</div>
                <div className="text-xs text-blue-500">Maksimum gebyr</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800">Hvad inkluderer gebyret?</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Sikker opbevaring hos PayProff</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Automatisk udbetaling</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Konfliktløsning</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800">Gratis for udlejere</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Ingen setup-omkostninger</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Ingen månedlige gebyrer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Ubegrænset antal boliger</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link 
                href="/pricing" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 mr-4"
              >
                Se detaljerede priser
              </Link>
              <Link 
                href="/register" 
                className="inline-block bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300"
              >
                Kom i gang
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}