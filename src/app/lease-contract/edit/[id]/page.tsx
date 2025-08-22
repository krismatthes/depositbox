'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import Step1ParterLejemaal from '@/components/lease-contract/Step1ParterLejemaal'
import Step2Lejeperiode from '@/components/lease-contract/Step2Lejeperiode'
import Step3Oekonomi from '@/components/lease-contract/Step3Oekonomi'
import Step4Vilkaar from '@/components/lease-contract/Step4Vilkaar'
import Step5SaerligeVilkaar from '@/components/lease-contract/Step5SaerligeVilkaar'
import Step6Review from '@/components/lease-contract/Step6Review'

export default function EditLeaseContractPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [loadingContract, setLoadingContract] = useState(true)
  const [contractNotFound, setContractNotFound] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isTenantInfoOptional, setIsTenantInfoOptional] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)

  // Initial data structure matching Danish lease contract standard (Typeformular A10)
  const [data, setData] = useState({
    // § 1: Parties & Property
    landlord: {
      name: '',
      address: '',
      cvrCpr: ''
    },
    tenants: [{
      name: '',
      currentAddress: '',
      cpr: '',
      email: ''
    }],
    property: {
      address: '',
      type: 'apartment',
      area: 0,
      rooms: 1,
      moveInDate: '',
      facilities: []
    },
    
    // § 2: Lease period
    leaseType: 'unlimited', // unlimited, fixed_term
    leaseEndDate: '',
    leaseEndReason: '',
    
    // § 3: Economy  
    economy: {
      monthlyRent: 0,
      deposit: 0,
      prepaidRent: 0,
      heating: 0,
      water: 0,
      electricity: 0,
      other: 0
    },
    
    // § 4: Conditions
    conditions: {
      maintenanceResponsibility: 'landlord', // landlord, tenant
      petsAllowed: false,
      smokingAllowed: false,
      heating: '',
      newlyRenovated: false,
      inventory: []
    },
    
    // § 5: Special conditions
    specialConditions: ''
  })

  const STEPS = [
    { number: 1, title: 'Parter & Lejemål', subtitle: 'Udlejer, lejer og lejemålsoplysninger' },
    { number: 2, title: 'Lejeperiode', subtitle: 'Start- og slutdato for lejemålet' },
    { number: 3, title: 'Økonomi', subtitle: 'Husleje, depositum og andre betalinger' },
    { number: 4, title: 'Vilkår', subtitle: 'Vedligeholdelse, dyr og andre betingelser' },
    { number: 5, title: 'Særlige Vilkår', subtitle: 'Yderligere aftaler og betingelser' },
    { number: 6, title: 'Gennemse', subtitle: 'Kontroller og generer kontrakt' }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && params.id) {
      loadContract()
    }
  }, [user, params.id])

  useEffect(() => {
    // Check if we should jump directly to PDF generation
    if (typeof window !== 'undefined' && window.location.hash === '#generate-pdf') {
      setCurrentStep(6)
    }
  }, [])

  const loadContract = async () => {
    try {
      const response = await api.get(`/draft-contracts/${params.id}`)
      const contract = response.data.contract
      
      if (contract.data) {
        const contractData = JSON.parse(contract.data)
        setData(contractData)
      }
      
      setLoadingContract(false)
    } catch (error: any) {
      console.error('Failed to load contract:', error)
      if (error.response?.status === 404) {
        setContractNotFound(true)
      }
      setLoadingContract(false)
    }
  }

  const handleDataUpdate = (newData: any) => {
    setData(newData)
    // Auto-save after data changes
    autoSave(newData)
  }

  const autoSave = async (dataToSave: any) => {
    setAutoSaveStatus('saving')
    try {
      await api.put(`/draft-contracts/${params.id}`, {
        data: JSON.stringify(dataToSave)
      })
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus(null), 2000)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveStatus('error')
      setTimeout(() => setAutoSaveStatus(null), 3000)
    }
  }

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!data.landlord.name || !data.landlord.address || !data.property.address) {
          alert('Udfyld venligst alle obligatoriske felter')
          return false
        }
        // Only validate tenant data if it's not optional
        if (!isTenantInfoOptional) {
          const invalidTenant = data.tenants.some(tenant => !tenant.name || !tenant.cpr || !tenant.email)
          if (invalidTenant) {
            alert('Udfyld venligst alle lejer oplysninger')
            return false
          }
        }
        return true
      case 2:
        if (!data.property.moveInDate) {
          alert('Vælg venligst overtagelsesdato')
          return false
        }
        return true
      case 3:
        if (!data.economy.monthlyRent || data.economy.monthlyRent <= 0) {
          alert('Indtast venligst månedlig husleje')
          return false
        }
        return true
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ParterLejemaal 
            data={data} 
            onUpdate={handleDataUpdate}
            onTenantOptionalChange={setIsTenantInfoOptional}
          />
        )
      case 2:
        return <Step2Lejeperiode data={data} onUpdate={handleDataUpdate} />
      case 3:
        return <Step3Oekonomi data={data} onUpdate={handleDataUpdate} />
      case 4:
        return <Step4Vilkaar data={data} onUpdate={handleDataUpdate} />
      case 5:
        return <Step5SaerligeVilkaar data={data} onUpdate={handleDataUpdate} />
      case 6:
        return <Step6Review data={data} onUpdate={handleDataUpdate} contractId={params.id} />
      default:
        return null
    }
  }

  if (loading || loadingContract || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (contractNotFound) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 mb-3">Kontrakt ikke fundet</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Den lejekontrakt du søger efter findes ikke eller er blevet slettet.
            </p>
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage til Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-800">Rediger Lejekontrakt</h1>
                <p className="text-slate-600">Fortsæt med at udfylde din lejekontrakt baseret på Typeformular A10</p>
              </div>
              {/* Auto-save status */}
              {autoSaveStatus && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  autoSaveStatus === 'saved' ? 'bg-green-100 text-green-800' :
                  autoSaveStatus === 'saving' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {autoSaveStatus === 'saved' && '✓ Gemt'}
                  {autoSaveStatus === 'saving' && '⏳ Gemmer...'}
                  {autoSaveStatus === 'error' && '✗ Fejl ved gemning'}
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex-1 flex items-center">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                      currentStep === step.number
                        ? 'bg-blue-600 text-white border-blue-600'
                        : currentStep > step.number
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}>
                      {currentStep > step.number ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="ml-3 hidden md:block">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${
                        currentStep >= step.number ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep < 6 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                ← Forrige
              </button>
              
              <button
                onClick={nextStep}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Næste →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}