'use client'

import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
            Sådan virker
            <span className="block text-blue-600 mt-2">Housing Escrow</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            En sikker og gennemsigtig proces der beskytter både udlejer og lejer gennem hele depositum processen
          </p>
        </div>
      </section>

      {/* Detailed Process Timeline */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
              Fra invitation til tilbagebetaling
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              En komplet gennemgang af processen trin for trin
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-200 via-green-200 via-purple-200 to-emerald-200 hidden lg:block"></div>

            <div className="space-y-24">
              
              {/* Step 1: Landlord creates or tenant initiates */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  {/* Left side content */}
                  <div className="lg:text-right lg:pr-16">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 p-8 lg:p-10 border border-blue-100 relative">
                      {/* Floating step number */}
                      <div className="absolute -top-6 left-8 lg:left-auto lg:-right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-2xl font-bold text-white">1</span>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6 flex items-center lg:justify-end">
                          <svg className="w-8 h-8 text-blue-600 mr-3 lg:mr-0 lg:ml-3 lg:order-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          Oprettelse af Nest
                        </h3>
                        
                        <div className="space-y-4 text-lg text-slate-600">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <p><strong className="text-blue-700">Udlejer sender invitation:</strong> Udlejer opretter en sikker "Nest" med boligoplysninger og depositum beløb.</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p><strong className="text-slate-700">Alternativt:</strong> Lejer kan selv oprette Nest og invitere udlejer - begge parter har kontrol.</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                          <p className="font-medium flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Nest fungerer som en fælles "pengekasse"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side mockup */}
                  <div className="mt-8 lg:mt-0 lg:pl-16">
                    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl p-8 shadow-xl">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-6 text-lg">🪺 Ny Nest Oprettet</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600 text-sm">Bolig:</span>
                            <span className="font-medium text-sm">Nørrebrogade 123</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600 text-sm">Depositum:</span>
                            <span className="font-bold text-blue-600">25.000 kr</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-slate-600 text-sm">Status:</span>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-amber-600 font-medium text-sm">Venter på accept</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Tenant accepts and pays */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  {/* Left side mockup */}
                  <div className="lg:order-1">
                    <div className="bg-gradient-to-br from-green-50 via-white to-green-100 rounded-3xl p-8 shadow-xl">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-6 text-lg">💳 PayProff Betaling</h4>
                        <div className="space-y-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-green-700 font-medium">Beløb modtaget:</span>
                              <span className="font-bold text-green-600 text-lg">25.000 kr</span>
                            </div>
                          </div>
                          <div className="flex items-center py-2">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-600 font-medium">Sikret hos PayProff</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side content */}
                  <div className="mt-8 lg:mt-0 lg:order-2 lg:pl-16">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-green-500/10 p-8 lg:p-10 border border-green-100 relative">
                      {/* Floating step number */}
                      <div className="absolute -top-6 right-8 lg:right-auto lg:-left-6 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                        <span className="text-2xl font-bold text-white">2</span>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6 flex items-center">
                          <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Sikker betaling
                        </h3>
                        
                        <div className="space-y-4 text-lg text-slate-600">
                          <div className="bg-green-50 rounded-xl p-4">
                            <p><strong className="text-green-700">Beskyttelse:</strong> Lejer betaler til neutral PayProff Nest - pengene er nu sikret.</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p><strong className="text-slate-700">Gennemsigtighed:</strong> Begge parter kan følge betalingen i realtid.</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                          <p className="font-medium flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            100% sikret og kan kun frigives sammen
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Both parties confirmed */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  {/* Left side content */}
                  <div className="lg:text-right lg:pr-16">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-purple-500/10 p-8 lg:p-10 border border-purple-100 relative">
                      {/* Floating step number */}
                      <div className="absolute -top-6 left-8 lg:left-auto lg:-right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-2xl font-bold text-white">3</span>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6 flex items-center lg:justify-end">
                          <svg className="w-8 h-8 text-purple-600 mr-3 lg:mr-0 lg:ml-3 lg:order-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          Gensidig bekræftelse
                        </h3>
                        
                        <div className="space-y-4 text-lg text-slate-600">
                          <div className="bg-purple-50 rounded-xl p-4">
                            <p><strong className="text-purple-700">Udlejer bekræfter:</strong> Lejemålet er overtaget korrekt og alt er i orden.</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p><strong className="text-slate-700">Lejer bekræfter:</strong> Boligen er modtaget som aftalt.</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                          <p className="font-medium flex items-center lg:justify-end">
                            <svg className="w-5 h-5 mr-2 lg:mr-0 lg:ml-2 lg:order-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M صل 8a4 4 0 000 8 4 4 0 000-8zM2 8a4 4 0 118 0 4 4 0 01-8 0zM2 8h18" />
                            </svg>
                            <span className="lg:order-1">Kræver begge parters accept</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side mockup */}
                  <div className="mt-8 lg:mt-0 lg:pl-16">
                    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-100 rounded-3xl p-8 shadow-xl">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-200">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-6 text-lg">✅ Bekræftelser</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3 bg-green-50 rounded-lg px-4">
                            <span className="text-slate-700 flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                              Udlejer
                            </span>
                            <span className="text-green-600 font-bold">✓</span>
                          </div>
                          <div className="flex items-center justify-between py-3 bg-green-50 rounded-lg px-4">
                            <span className="text-slate-700 flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              Lejer
                            </span>
                            <span className="text-green-600 font-bold">✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Automatic release scenarios */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  {/* Left side mockup */}
                  <div className="lg:order-1">
                    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100 rounded-3xl p-8 shadow-xl">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-6 text-lg">💸 Automatisk udbetaling</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b border-emerald-100">
                            <span className="text-slate-600 flex items-center">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              Til lejer
                            </span>
                            <span className="font-bold text-green-600">20.000 kr</span>
                          </div>
                          <div className="flex justify-between items-center py-3">
                            <span className="text-slate-600 flex items-center">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                              Til udlejer
                            </span>
                            <span className="font-bold text-blue-600">5.000 kr</span>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3 mt-4">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-emerald-700 font-medium text-sm">Udbetalt automatisk</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side content */}
                  <div className="mt-8 lg:mt-0 lg:order-2 lg:pl-16">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 p-8 lg:p-10 border border-emerald-100 relative">
                      {/* Floating step number */}
                      <div className="absolute -top-6 right-8 lg:right-auto lg:-left-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-2xl font-bold text-white">4</span>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6 flex items-center">
                          <svg className="w-8 h-8 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Automatisk frigivelse
                        </h3>
                        
                        <div className="space-y-4 text-lg text-slate-600">
                          <div className="bg-emerald-50 rounded-xl p-4">
                            <p><strong className="text-emerald-700">Fleksible løsninger:</strong> Fuld tilbagebetaling, deling eller overførsel til udlejer.</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p><strong className="text-slate-700">Øjeblikkelig:</strong> Penge overføres automatisk når begge er enige.</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                          <p className="font-medium flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Lynhurtig og sikker afslutning
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This is Good */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Derfor er Housing Escrow den rigtige løsning
            </h2>
            <p className="text-xl text-slate-600">
              Sammenlign med traditionelle metoder og se fordelene
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
            <div className="grid lg:grid-cols-3 divide-x divide-slate-200">
              {/* Traditional Method */}
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L4.982 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Traditionel bankoverførsel</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Ingen sikkerhed for pengene</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Risiko for svindel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Manglende dokumentation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Uklare tilbagebetalingsregler</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Potentielle konflikter</span>
                  </li>
                </ul>
              </div>

              {/* Bank Escrow */}
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Bank escrow</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Sikker opbevaring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Meget dyr (500-2000 kr)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Langsom proces (uger)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Kompliceret papirarbejde</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-600">Ingen digital platform</span>
                  </li>
                </ul>
              </div>

              {/* Housing Escrow */}
              <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Housing Escrow</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">100% sikker PayProff integration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Konkurrencedygtige priser</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Opsætning på få minutter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Fuldt digital platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Automatisk dokumentation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">100% Sikkerhed</h3>
              <p className="text-slate-600 text-sm">
                Pengene opbevares sikkert hos PayProff og kan kun frigives når begge parter er enige
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Lynhurtig proces</h3>
              <p className="text-slate-600 text-sm">
                Opret Nest på minutter og få betaling samme dag - ingen lang ventetid
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4h.01M9 11H7.5m3 4H9m2.5 0H13" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Gennemsigtig</h3>
              <p className="text-slate-600 text-sm">
                Begge parter kan følge processen i realtid og har fuld indsigt i alle trin
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Prisvenlig</h3>
              <p className="text-slate-600 text-sm">
                Meget lavere omkostninger end traditionelle bank escrow løsninger
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Komplet dokumentation</h3>
              <p className="text-slate-600 text-sm">
                Automatisk generering af alle nødvendige dokumenter og kvitteringer
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.944l5.657 5.656L12 14.257 6.343 8.6 12 2.944z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Konfliktløsning</h3>
              <p className="text-slate-600 text-sm">
                Indbygget system til håndtering af uenigheder med neutral mægling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Klar til at komme i gang?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Opret din første Nest på under 5 minutter og oplev trygheden ved sikker depositum håndtering
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=LANDLORD" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
              Start som udlejer
            </Link>
            <Link href="/register?role=TENANT" className="bg-blue-500 hover:bg-blue-400 text-white border-2 border-blue-400 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300">
              Start som lejer
            </Link>
          </div>

          <p className="text-blue-200 text-sm mt-6">
            Ingen binding • Gratis at prøve • Support på dansk
          </p>
        </div>
      </section>
    </div>
  )
}