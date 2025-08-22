'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800">Indlæser...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isLandlord = user.role === 'LANDLORD'
  const isTenant = user.role === 'TENANT'

  const landlordSteps = [
    {
      id: 1,
      title: "Opret din første Nest Escrow",
      description: "Start med at oprette en sikker deponering for dit første lejeforhold",
      action: "Opret Nest Escrow",
      link: "/nest/create-simple",
      icon: "🪺",
      details: [
        "Indtast ejendomsoplysninger",
        "Angiv depositum beløb",
        "Inviter lejer via email",
        "Pengene holdes sikkert hos PayProff"
      ]
    },
    {
      id: 2,
      title: "Opsæt digital huslejemodtagelse",
      description: "Modtag huslejen automatisk hver måned",
      action: "Opsæt huslejemodtagelse",
      link: "/rent-payments/dashboard",
      icon: "💳",
      details: [
        "Vælg din foretrukne betalingsmetode",
        "Opsæt automatiske påmindelser",
        "Se betalingsoversigt og kvitteringer",
        "Få notifikationer ved betalinger"
      ]
    },
    {
      id: 3,
      title: "Kommuniker med dine lejere",
      description: "Brug den indbyggede chat til at kommunikere sikkert",
      action: "Se Chat",
      link: "/chat",
      icon: "💬",
      details: [
        "Sikker kommunikation knyttet til kontrakter",
        "Send beskeder og vedhæftninger",
        "Se læse-kvitteringer",
        "Escaler til support ved uenighed"
      ]
    },
    {
      id: 4,
      title: "Generer professionelle kontrakter",
      description: "Opret roomie-aftaler og lejekontrakter nemt",
      action: "Se kontraktgenerator",
      link: "/roomie-agreement/create",
      icon: "📄",
      details: [
        "A10 standard lejekontrakter",
        "Roomie- og samboaftaler",
        "Automatisk udfyldning med dine data",
        "PDF generering og digital underskrift"
      ]
    }
  ]

  const tenantSteps = [
    {
      id: 1,
      title: "Betal depositum sikkert med Nest",
      description: "Beskyt dine penge med vores sikre deponeringsservice",
      action: "Se Nest Escrows",
      link: "/dashboard",
      icon: "🪺",
      details: [
        "Depositum holdes sikkert hos PayProff",
        "Kun frigivet når begge parter er enige",
        "Transparent proces og dokumentation",
        "Fuld beskyttelse mod svindel"
      ]
    },
    {
      id: 2,
      title: "Opsæt automatisk huslejebetaling",
      description: "Betal huslejen nemt og automatisk hver måned",
      action: "Inviter udlejer",
      link: "/rent-payments/invite",
      icon: "💳",
      details: [
        "Vælg betalingsmetode (kort, MobilePay, etc.)",
        "Automatiske månedlige betalinger",
        "Få kvitteringer og oversigt",
        "Påmindelser før forfaldsdato"
      ]
    },
    {
      id: 3,
      title: "Kommuniker med din udlejer",
      description: "Brug den indbyggede chat til sikker kommunikation",
      action: "Se Chat",
      link: "/chat",
      icon: "💬",
      details: [
        "Sikker kommunikation knyttet til dit lejeforhold",
        "Send beskeder og vedhæftninger",
        "Dokumentér alle aftaler",
        "Få hjælp fra support ved behov"
      ]
    },
    {
      id: 4,
      title: "Få hjælp til kontrakter",
      description: "Inviter din udlejer til at oprette professionelle kontrakter",
      action: "Inviter til lejekontrakt",
      link: "/lease-contract/invite-landlord",
      icon: "📄",
      details: [
        "Bed udlejer om A10 standardkontrakt",
        "Opret roomie-aftaler for delt bolig",
        "Digital underskrift og arkivering",
        "Alle juridiske krav opfyldt"
      ]
    }
  ]

  const steps = isLandlord ? landlordSteps : tenantSteps

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="text-2xl">👋</div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              Velkommen til BoligDeposit, {user.firstName}!
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {isLandlord 
                ? "Som udlejer får du adgang til professionelle værktøjer der gør udlejning nemmere og sikrere"
                : "Som lejer får du beskyttelse af dine penge og nem adgang til digitale betalingsløsninger"
              }
            </p>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              isLandlord 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {isLandlord ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Udlejer • 100% gratis at bruge
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Lejer • Sikkerhed fra kun 199 kr
                </>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      activeStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {step.id}
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-12 h-1 bg-slate-200 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`transition-all duration-300 ${
                  activeStep === step.id ? 'block' : 'hidden'
                }`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{step.icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Skridt {step.id}: {step.title}</h2>
                      <p className="text-blue-100 text-lg">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Hvad kan du forvente?</h3>
                      <ul className="space-y-3">
                        {step.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-slate-600">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <h4 className="font-semibold text-slate-800 mb-4">Klar til at komme i gang?</h4>
                        <Link
                          href={step.link}
                          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                        >
                          {step.action}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                      disabled={activeStep === 1}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Forrige
                    </button>
                    
                    <button
                      onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
                      disabled={activeStep === steps.length}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Næste
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">FAQ</h3>
              <p className="text-slate-600 text-sm mb-4">Find svar på almindelige spørgsmål</p>
              <Link href="/faq" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Se FAQ →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Support</h3>
              <p className="text-slate-600 text-sm mb-4">Få personlig hjælp via chat</p>
              <Link href="/chat" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Kontakt support →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Guides</h3>
              <p className="text-slate-600 text-sm mb-4">Dybdegående vejledninger</p>
              <Link href="/how-it-works" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                Se guides →
              </Link>
            </div>
          </div>

          {/* Quick Action */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3" />
              </svg>
              Gå til Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}