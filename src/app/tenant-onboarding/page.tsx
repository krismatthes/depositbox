'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

export default function TenantOnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      router.push('/dashboard')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const skipToCreate = () => {
    router.push('/dashboard')
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Floating Progress */}
          <div className="fixed top-24 right-8 z-50">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col space-y-3">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center space-x-3">
                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step <= currentStep 
                        ? 'bg-cyan-600 text-white shadow-lg scale-110' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step <= currentStep && (
                        <div className="absolute inset-0 bg-cyan-600 rounded-full animate-ping opacity-25"></div>
                      )}
                      <span className="relative">{step}</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-xs font-medium transition-colors duration-300 ${
                        step <= currentStep ? 'text-cyan-600' : 'text-gray-400'
                      }`}>
                        {step === 1 && 'Intro'}
                        {step === 2 && 'Proces'}
                        {step === 3 && 'Fordele'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
            
            {/* Step 1: What is NEST for tenants? */}
            {currentStep === 1 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-2xl">🛡️</span>
                      </div>
                    </div>
                    <div className="absolute -inset-2 bg-cyan-100 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    Velkommen til <span className="font-semibold text-cyan-600">NEST</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Danmarks mest sikre måde at betale depositum og leje på
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {[
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ),
                      title: "100% Beskyttet",
                      description: "Dine penge er sikre indtil du flytter ind og alle betingelser er opfyldt"
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      ),
                      title: "Ingen Bedrageri",
                      description: "Beskyttelse mod falske udlejere og svindel - vi verificerer alt"
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      ),
                      title: "Automatisk Retur",
                      description: "Få dit depositum tilbage automatisk når du flytter ud"
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
                        </svg>
                      ),
                      title: "Juridisk Support",
                      description: "Professionel hjælp hvis der opstår konflikter med udlejer"
                    }
                  ].map((feature, index) => (
                    <div 
                      key={index} 
                      className="group p-8 rounded-3xl bg-gray-50/50 hover:bg-cyan-50/50 border border-gray-100 hover:border-cyan-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 text-gray-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-16 p-8 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-3xl text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🏆</span>
                    </div>
                    <h3 className="text-xl font-semibold">Betroet af 100.000+ lejere</h3>
                  </div>
                  <p className="text-cyan-100 text-lg">
                    Vi beskytter milliarder af kroner i depositum for lejere hver måned
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: How does it work for tenants? */}
            {currentStep === 2 && (
              <div className="text-center max-w-4xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚙️</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    Sådan <span className="font-semibold text-cyan-600">Virker Det</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    En sikker 4-trins proces der beskytter dig som lejer
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    {
                      step: "01",
                      title: "Du modtager invitation",
                      description: "Din udlejer sender dig en sikker NEST invitation via email.",
                      detail: "Vi verificerer at udlejer er ægte og ejendommen eksisterer.",
                      icon: "📧"
                    },
                    {
                      step: "02", 
                      title: "Du betaler sikkert",
                      description: "Overfør depositum og leje sikkert til NEST - ikke direkte til udlejer.",
                      detail: "Dine penge holdes sikre indtil du er flyttet ind og alt er som aftalt.",
                      icon: "💳"
                    },
                    {
                      step: "03",
                      title: "Du flytter ind", 
                      description: "Når du er flyttet ind og tilfreds, frigives første måneds leje til udlejer.",
                      detail: "Dit depositum forbliver beskyttet i NEST gennem hele lejeperioden.",
                      icon: "🏠"
                    },
                    {
                      step: "04",
                      title: "Du flytter ud",
                      description: "Når du flytter ud, får du automatisk dit depositum tilbage.",
                      detail: "Kun berettigede skader kan trækkes fra - du har fuld gennemsigtighed.",
                      icon: "🚪"
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg max-w-3xl mx-auto group hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start text-left">
                        <div className="flex-shrink-0 mr-8">
                          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center relative group-hover:bg-cyan-100 transition-colors duration-300">
                            <span className="text-2xl">{item.icon}</span>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {item.step}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 pt-2">
                          <h3 className="text-2xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                          <p className="text-lg text-gray-600 leading-relaxed mb-3">{item.description}</p>
                          <p className="text-sm text-cyan-600 bg-cyan-50 inline-block px-4 py-2 rounded-full">
                            🛡️ {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 p-8 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-3xl text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">💰</span>
                    </div>
                    <h3 className="text-xl font-semibold">Lille gebyr, stor sikkerhed</h3>
                  </div>
                  <p className="text-cyan-100 text-lg">
                    Du betaler kun et lille gebyr for den bedste beskyttelse på markedet.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Why use NEST as tenant? */}
            {currentStep === 3 && (
              <div className="text-center max-w-4xl mx-auto">
                <div className="mb-16">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
                    Hvorfor Vælge <span className="font-semibold text-cyan-600">NEST?</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Se forskellen mellem traditionel udlejning og NEST
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                  <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-red-600">❌</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 ml-4">Uden NEST</h3>
                    </div>
                    <ul className="space-y-4 text-left">
                      {[
                        "Risiko for bedrageri og falske udlejere",
                        "Ingen beskyttelse af dit depositum", 
                        "Svært at få penge tilbage ved fraflytning",
                        "Ingen hjælp hvis der opstår konflikter",
                        "Overførsler direkte til ukende udlejere"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start text-gray-600">
                          <span className="text-red-400 mr-3 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 bg-cyan-50/50 border border-cyan-100 rounded-3xl">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-cyan-600">✅</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 ml-4">Med NEST</h3>
                    </div>
                    <ul className="space-y-4 text-left">
                      {[
                        "Fuld beskyttelse mod bedrageri og svindel",
                        "100% sikkerhed for dit depositum",
                        "Automatisk retur af penge ved fraflytning", 
                        "Professionel juridisk support og hjælp",
                        "Verificerede udlejere og ejendomme"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start text-gray-600">
                          <span className="text-cyan-400 mr-3 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                  {[
                    {
                      icon: "🛡️",
                      title: "Maksimal Sikkerhed",
                      description: "Beskyttet mod alle former for udlejningssvindel"
                    },
                    {
                      icon: "💸", 
                      title: "Spar Penge",
                      description: "Undgå at miste tusindvis på falske udlejere"
                    },
                    {
                      icon: "😌",
                      title: "Fred i Sindet", 
                      description: "Fokuser på at finde det perfekte hjem"
                    }
                  ].map((benefit, index) => (
                    <div key={index} className="p-6 bg-gray-50 rounded-2xl text-center">
                      <div className="text-3xl mb-4">{benefit.icon}</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-3xl text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🚀</span>
                    </div>
                    <h3 className="text-2xl font-semibold">Klar til at leje sikkert?</h3>
                  </div>
                  <p className="text-cyan-100 text-lg">
                    Start med at acceptere NEST invitationer fra verificerede udlejere
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-16 flex items-center justify-between">
              <div className="flex space-x-4">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors rounded-xl hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Tilbage
                  </button>
                )}
                
                <button
                  onClick={goToDashboard}
                  className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors rounded-xl hover:bg-gray-50"
                >
                  Spring over
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Næste
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={skipToCreate}
                    className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span className="text-xl">🚀</span>
                    Gå Til Dashboard
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}