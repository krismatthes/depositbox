'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

export default function ContractInfoPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cprNumber: ''
  })

  useEffect(() => {
    if (params.id) {
      // Load contract from localStorage - no login required
      const contractId = params.id as string
      const createdContracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
      const foundContract = createdContracts.find((c: any) => c.id === contractId)
      
      if (foundContract) {
        setContract(foundContract)
        // Pre-fill with user data if available and user is logged in
        if (user) {
          setFormData({
            firstName: foundContract.tenant?.firstName || user.firstName || '',
            lastName: foundContract.tenant?.lastName || user.lastName || '',
            phone: foundContract.tenant?.phone || '',
            address: foundContract.tenant?.address || '',
            cprNumber: foundContract.tenant?.cprNumber || ''
          })
        } else if (foundContract.tenant) {
          // Pre-fill with existing tenant data if available
          setFormData({
            firstName: foundContract.tenant.firstName || '',
            lastName: foundContract.tenant.lastName || '',
            phone: foundContract.tenant.phone || '',
            address: foundContract.tenant.address || '',
            cprNumber: foundContract.tenant.cprNumber || ''
          })
        }
      } else {
        // Contract not found
        setContract(null)
      }
    }
  }, [user, loading, router, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract) return
    
    setSaving(true)
    
    try {
      // Update contract with tenant info
      const updatedContract = {
        ...contract,
        tenant: {
          ...contract.tenant,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: user?.email || '', // Use user email if logged in, otherwise empty
          phone: formData.phone,
          address: formData.address,
          cprNumber: formData.cprNumber
        },
        status: 'AWAITING_SIGNATURES',
        tenantInfoMissing: false,
        tenantInfoFilledAt: new Date().toISOString()
      }
      
      // Update in localStorage
      const createdContracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
      const updatedContracts = createdContracts.map((c: any) => 
        c.id === contract.id ? updatedContract : c
      )
      localStorage.setItem('created_contracts', JSON.stringify(updatedContracts))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message instead of redirecting
      alert('Dine oplysninger er gemt! Udlejeren kan nu se den opdaterede kontrakt.')
      
      // Redirect to a thank you page or show success state
      setContract(null) // Clear form
      
    } catch (error) {
      console.error('Failed to save tenant info:', error)
      alert('Der opstod en fejl ved gemning. Prøv igen.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }
  
  if (!contract) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Kontrakt ikke fundet</h1>
            <p className="text-slate-600 mb-6">Kontrakten med ID "{params.id}" kunne ikke findes.</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-blue-800 mb-2">Mulige årsager:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Kontrakten blev oprettet på en anden enhed</li>
                <li>• Linket er ikke korrekt</li>
                <li>• Kontrakten blev slettet</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => {
                  const contracts = JSON.parse(localStorage.getItem('created_contracts') || '[]')
                  console.log('All contracts in localStorage:', contracts)
                  alert(`Fandt ${contracts.length} kontrakter i localStorage. Tjek konsollen for detaljer.`)
                }}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Debug: Vis alle kontrakter
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Udfyld Personlige Oplysninger</h1>
                <p className="text-slate-600 mt-1">{contract.propertyAddress}</p>
              </div>
            </div>
            
{!contract.tenantInfoMissing && contract.tenant?.firstName ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-green-800 mb-2">Oplysninger allerede udfyldt</div>
                    <div className="text-green-700 text-sm">
                      Denne kontrakt har allerede tenant oplysninger. Du kan stadig opdatere dem nedenfor hvis nødvendigt.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-800 mb-2">Udlejer har anmodet om dine oplysninger</div>
                    <div className="text-blue-700 text-sm">
                      <strong>{contract.landlord?.firstName} {contract.landlord?.lastName}</strong> har sendt dig en lejekontrakt og beder dig udfylde dine personlige oplysninger inden underskrift.
                    </div>
                    {!user && (
                      <div className="text-blue-600 text-sm mt-2">
                        Du behøver ikke at oprette en konto - udfyld blot formularen nedenfor.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Personlige Oplysninger</h2>
              <p className="text-purple-100 text-sm">Disse oplysninger vil blive indsat i lejekontrakten</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dit fornavn"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Efternavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dit efternavn"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="20 12 34 56"
                />
              </div>

              {/* Current Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nuværende adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Din nuværende bopælsadresse"
                />
              </div>

              {/* CPR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CPR-nummer *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cprNumber}
                  onChange={(e) => setFormData({...formData, cprNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123456-7890"
                  maxLength={11}
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.182 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div className="font-medium text-amber-800 mb-1">Datasikkerhed</div>
                    <div className="text-amber-700 text-sm">
                      Dine personlige oplysninger behandles i henhold til GDPR og anvendes kun til denne lejekontrakt.
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {saving ? 'Gemmer...' : 'Gem og Fortsæt til Kontrakt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}