'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import { createConversationFromContract } from '@/lib/chatUtils'

interface RoomieData {
  // Property Information
  propertyAddress: string
  propertyType: string
  totalRent: number
  totalUtilities: number
  
  // Main Tenant
  mainTenantName: string
  mainTenantEmail: string
  mainTenantPhone: string
  
  // Roommates
  roommates: Array<{
    name: string
    email: string
    phone: string
    rentShare: number
    utilitiesShare: number
    room: string
  }>
  
  // Agreement Details
  agreementType: 'all_on_lease' | 'main_tenant_only'
  agreementStartDate: string
  agreementEndDate: string
  depositAmount: number
  depositSplit: 'equal' | 'by_rent_share' | 'main_tenant_only'
  
  // House Rules
  quietHours: { start: string, end: string }
  smokingPolicy: 'no_smoking' | 'designated_areas' | 'allowed'
  petsPolicy: 'no_pets' | 'with_permission' | 'allowed'
  guestPolicy: string
  cleaningSchedule: string
  shoppingArrangement: string
  
  // Shared Spaces
  kitchenRules: string
  bathroomRules: string
  livingRoomRules: string
  storageRules: string
  
  // Financial Arrangements
  rentDueDate: number
  utilitiesSplitMethod: 'equal' | 'by_usage' | 'by_room_size'
  sharedExpenses: string
  
  // Early Departure
  noticeRequired: number
  findReplacementRule: boolean
  subletAllowed: boolean
  
  // Additional Terms
  additionalRules: string
}

export default function CreateRoomieAgreementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  const [formData, setFormData] = useState<RoomieData>({
    propertyAddress: '',
    propertyType: 'apartment',
    totalRent: 0,
    totalUtilities: 0,
    
    mainTenantName: user?.firstName + ' ' + user?.lastName || '',
    mainTenantEmail: user?.email || '',
    mainTenantPhone: '',
    
    roommates: [
      { name: '', email: '', phone: '', rentShare: 50, utilitiesShare: 50, room: '' }
    ],
    
    agreementType: 'all_on_lease',
    agreementStartDate: '',
    agreementEndDate: '',
    depositAmount: 0,
    depositSplit: 'equal',
    
    quietHours: { start: '22:00', end: '07:00' },
    smokingPolicy: 'no_smoking',
    petsPolicy: 'no_pets',
    guestPolicy: 'Gæster må maksimalt overnatte 3 nætter i træk og maksimalt 10 nætter per måned.',
    cleaningSchedule: 'Ugentlig skema roterer mellem alle beboere',
    shoppingArrangement: 'Fælles indkøb af basisfornødenheder deles ligeligt',
    
    kitchenRules: 'Ryd op efter sig selv. Fælles køkkengrej vaskes straks efter brug.',
    bathroomRules: 'Maksimum 20 minutter ad gangen i myldretid (7-9 og 17-19).',
    livingRoomRules: 'Fælles afstemning om TV-programmer. Ingen højlydt musik efter kl. 21.',
    storageRules: 'Hver beboer får tildelt specificerede skabe og hylder.',
    
    rentDueDate: 1,
    utilitiesSplitMethod: 'equal',
    sharedExpenses: 'Internet, rengøringsmidler, toiletpapir',
    
    noticeRequired: 30,
    findReplacementRule: true,
    subletAllowed: false,
    
    additionalRules: ''
  })

  const handleInputChange = (field: keyof RoomieData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRoommateChange = (index: number, field: string, value: any) => {
    const newRoommates = [...formData.roommates]
    newRoommates[index] = { ...newRoommates[index], [field]: value }
    setFormData(prev => ({ ...prev, roommates: newRoommates }))
  }

  const addRoommate = () => {
    setFormData(prev => ({
      ...prev,
      roommates: [...prev.roommates, { name: '', email: '', phone: '', rentShare: 0, utilitiesShare: 0, room: '' }]
    }))
  }

  const removeRoommate = (index: number) => {
    if (formData.roommates.length > 1) {
      const newRoommates = formData.roommates.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, roommates: newRoommates }))
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateDocument = () => {
    // Create roomie agreement data
    const agreementData = {
      ...formData,
      id: `roomie-agreement-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user?.id
    }

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const existingAgreements = localStorage.getItem('roomie_agreements') || '[]'
      const agreements = JSON.parse(existingAgreements)
      agreements.push(agreementData)
      localStorage.setItem('roomie_agreements', JSON.stringify(agreements))
      
      // Also save to user-specific key
      localStorage.setItem(`roomie_agreements_${user?.id}`, JSON.stringify(agreements.filter((a: any) => a.createdBy === user?.id)))
      
      // Create chat conversation for roomie agreement (include all roommates)
      if (user) {
        // Create conversation with main tenant and first roommate
        const firstRoommate = formData.roommates[0]
        if (firstRoommate?.email) {
          createConversationFromContract({
            contractId: agreementData.id,
            contractType: 'roomie_agreement',
            propertyAddress: formData.propertyAddress,
            tenantId: user.id,
            tenantName: formData.mainTenantName,
            tenantEmail: formData.mainTenantEmail,
            landlordId: 'roommate-1',
            landlordName: firstRoommate.name,
            landlordEmail: firstRoommate.email
          })
        }
      }
    }

    // Redirect to generated document
    router.push(`/roomie-agreement/${agreementData.id}`)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ejendom Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ejendomsadresse *
                  </label>
                  <input
                    type="text"
                    value={formData.propertyAddress}
                    onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Eksempel Vej 123, 2100 København Ø"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ejendomstype *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="apartment">Lejlighed</option>
                    <option value="house">Hus</option>
                    <option value="room">Værelse</option>
                    <option value="other">Andet</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total husleje (DKK) *
                    </label>
                    <input
                      type="number"
                      value={formData.totalRent}
                      onChange={(e) => handleInputChange('totalRent', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total forbrug (DKK)
                    </label>
                    <input
                      type="number"
                      value={formData.totalUtilities}
                      onChange={(e) => handleInputChange('totalUtilities', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Aftale Type</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="agreementType"
                    value="all_on_lease"
                    checked={formData.agreementType === 'all_on_lease'}
                    onChange={(e) => handleInputChange('agreementType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Alle står på A10 kontrakten</div>
                    <div className="text-sm text-slate-600">Alle beboere er juridisk ansvarlige overfor udlejer</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="agreementType"
                    value="main_tenant_only"
                    checked={formData.agreementType === 'main_tenant_only'}
                    onChange={(e) => handleInputChange('agreementType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Kun hovedlejer står på kontrakten</div>
                    <div className="text-sm text-slate-600">Andre beboere er underlejere/roomies</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Hovedlejer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fulde navn *
                  </label>
                  <input
                    type="text"
                    value={formData.mainTenantName}
                    onChange={(e) => handleInputChange('mainTenantName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.mainTenantEmail}
                    onChange={(e) => handleInputChange('mainTenantEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    value={formData.mainTenantPhone}
                    onChange={(e) => handleInputChange('mainTenantPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+45 12 34 56 78"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Roomies/Sambeboere</h3>
                <button
                  type="button"
                  onClick={addRoommate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Tilføj Roomie
                </button>
              </div>
              
              {formData.roommates.map((roommate, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">Roomie #{index + 1}</h4>
                    {formData.roommates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoommate(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Fjern
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fulde navn *
                      </label>
                      <input
                        type="text"
                        value={roommate.name}
                        onChange={(e) => handleRoommateChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Værelse
                      </label>
                      <input
                        type="text"
                        value={roommate.room}
                        onChange={(e) => handleRoommateChange(index, 'room', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Værelse 1, Hovedsoveværelse etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={roommate.email}
                        onChange={(e) => handleRoommateChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Telefonnummer
                      </label>
                      <input
                        type="tel"
                        value={roommate.phone}
                        onChange={(e) => handleRoommateChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Andel af husleje (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={roommate.rentShare}
                        onChange={(e) => handleRoommateChange(index, 'rentShare', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Andel af forbrug (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={roommate.utilitiesShare}
                        onChange={(e) => handleRoommateChange(index, 'utilitiesShare', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Aftale Detaljer</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Aftale startdato *
                </label>
                <input
                  type="date"
                  value={formData.agreementStartDate}
                  onChange={(e) => handleInputChange('agreementStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Aftale slutdato
                </label>
                <input
                  type="date"
                  value={formData.agreementEndDate}
                  onChange={(e) => handleInputChange('agreementEndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Lad være tom hvis aftalen løber på ubestemt tid</p>
              </div>
            </div>
            
            <SmartDepositField
              value={formData.depositAmount}
              rentValue={formData.totalRent}
              onChange={(value) => handleInputChange('depositAmount', Number(value))}
              label="Total depositum (DKK)"
              placeholder="75000"
              required={false}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Hvordan skal depositum deles? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="depositSplit"
                    value="equal"
                    checked={formData.depositSplit === 'equal'}
                    onChange={(e) => handleInputChange('depositSplit', e.target.value)}
                    className="mr-3"
                  />
                  Deles ligeligt mellem alle beboere
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="depositSplit"
                    value="by_rent_share"
                    checked={formData.depositSplit === 'by_rent_share'}
                    onChange={(e) => handleInputChange('depositSplit', e.target.value)}
                    className="mr-3"
                  />
                  Deles efter huslejeandel
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="depositSplit"
                    value="main_tenant_only"
                    checked={formData.depositSplit === 'main_tenant_only'}
                    onChange={(e) => handleInputChange('depositSplit', e.target.value)}
                    className="mr-3"
                  />
                  Kun hovedlejer betaler depositum
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Husleje forfalder den (dag i måneden) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.rentDueDate}
                onChange={(e) => handleInputChange('rentDueDate', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Husorden & Regler</h3>
            
            <div>
              <h4 className="font-medium text-slate-700 mb-3">Ro-tider</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ro-tid starter
                  </label>
                  <input
                    type="time"
                    value={formData.quietHours.start}
                    onChange={(e) => handleInputChange('quietHours', { ...formData.quietHours, start: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ro-tid slutter
                  </label>
                  <input
                    type="time"
                    value={formData.quietHours.end}
                    onChange={(e) => handleInputChange('quietHours', { ...formData.quietHours, end: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Rygepolitik *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="smokingPolicy"
                    value="no_smoking"
                    checked={formData.smokingPolicy === 'no_smoking'}
                    onChange={(e) => handleInputChange('smokingPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Rygning forbudt overalt
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="smokingPolicy"
                    value="designated_areas"
                    checked={formData.smokingPolicy === 'designated_areas'}
                    onChange={(e) => handleInputChange('smokingPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Kun i udpegede områder (fx altaner)
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="smokingPolicy"
                    value="allowed"
                    checked={formData.smokingPolicy === 'allowed'}
                    onChange={(e) => handleInputChange('smokingPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Rygning tilladt
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Kæledyr politik *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petsPolicy"
                    value="no_pets"
                    checked={formData.petsPolicy === 'no_pets'}
                    onChange={(e) => handleInputChange('petsPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Ingen kæledyr tilladt
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petsPolicy"
                    value="with_permission"
                    checked={formData.petsPolicy === 'with_permission'}
                    onChange={(e) => handleInputChange('petsPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Kun med alle beboeres samtykke
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petsPolicy"
                    value="allowed"
                    checked={formData.petsPolicy === 'allowed'}
                    onChange={(e) => handleInputChange('petsPolicy', e.target.value)}
                    className="mr-3"
                  />
                  Kæledyr tilladt
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gæsteregler
              </label>
              <textarea
                value={formData.guestPolicy}
                onChange={(e) => handleInputChange('guestPolicy', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beskriver regler for gæster og overnatning..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rengøring og vagter
              </label>
              <textarea
                value={formData.cleaningSchedule}
                onChange={(e) => handleInputChange('cleaningSchedule', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beskriver hvordan rengøring af fællesarealer organiseres..."
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Fællesarealer & Regler</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Køkkenregler
              </label>
              <textarea
                value={formData.kitchenRules}
                onChange={(e) => handleInputChange('kitchenRules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Regler for brug af køkkenet..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Badeværelsesregler
              </label>
              <textarea
                value={formData.bathroomRules}
                onChange={(e) => handleInputChange('bathroomRules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Regler for brug af badeværelse..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stue/fællesrum regler
              </label>
              <textarea
                value={formData.livingRoomRules}
                onChange={(e) => handleInputChange('livingRoomRules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Regler for brug af stue og fællesrum..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Opbevaring og skabe
              </label>
              <textarea
                value={formData.storageRules}
                onChange={(e) => handleInputChange('storageRules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hvordan skabe, køleskab og opbevaring fordeles..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Hvordan deles forbrug? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="utilitiesSplitMethod"
                    value="equal"
                    checked={formData.utilitiesSplitMethod === 'equal'}
                    onChange={(e) => handleInputChange('utilitiesSplitMethod', e.target.value)}
                    className="mr-3"
                  />
                  Ligeligt mellem alle
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="utilitiesSplitMethod"
                    value="by_usage"
                    checked={formData.utilitiesSplitMethod === 'by_usage'}
                    onChange={(e) => handleInputChange('utilitiesSplitMethod', e.target.value)}
                    className="mr-3"
                  />
                  Efter forbrug (afregnes bagud)
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="utilitiesSplitMethod"
                    value="by_room_size"
                    checked={formData.utilitiesSplitMethod === 'by_room_size'}
                    onChange={(e) => handleInputChange('utilitiesSplitMethod', e.target.value)}
                    className="mr-3"
                  />
                  Efter værelsesstørrelse
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fælles udgifter
              </label>
              <textarea
                value={formData.sharedExpenses}
                onChange={(e) => handleInputChange('sharedExpenses', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hvilke udgifter deles mellem beboere (internet, rengøringsmidler etc.)..."
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Fraflytning & Særlige Bestemmelser</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Opsigelsesvarsel (dage) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.noticeRequired}
                onChange={(e) => handleInputChange('noticeRequired', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Hvor mange dages varsel skal der gives ved fraflytning</p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.findReplacementRule}
                  onChange={(e) => handleInputChange('findReplacementRule', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Pligt til at finde erstatning</div>
                  <div className="text-sm text-slate-600">Beboer der flytter skal hjælpe med at finde ny roomie</div>
                </div>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.subletAllowed}
                  onChange={(e) => handleInputChange('subletAllowed', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Fremlelje tilladt</div>
                  <div className="text-sm text-slate-600">Beboere må udleje deres værelse videre (kræver udlejers tilladelse)</div>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Yderligere regler og bestemmelser
              </label>
              <textarea
                value={formData.additionalRules}
                onChange={(e) => handleInputChange('additionalRules', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tilføj eventuelle yderligere regler eller særlige bestemmelser..."
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-blue-800 mb-1">Vigtig bemærkning</div>
                  <div className="text-blue-700 text-sm">
                    Denne roomie-aftale er et supplement til A10 lejekontrakten og kan ikke erstatte den juridiske lejekontrakt. 
                    Sørg for at alle parter forstår og accepterer vilkårene før underskrift.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Roomie-/Samboaftale</h1>
                <p className="text-slate-600 mt-1">Opret en aftale for delt beboelse</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Skridt {currentStep} af {totalSteps}</span>
                <span className="text-sm text-slate-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 && "Ejendom & Aftale Type"}
                {currentStep === 2 && "Beboer Information"}
                {currentStep === 3 && "Aftale Detaljer"}
                {currentStep === 4 && "Husorden"}
                {currentStep === 5 && "Fællesarealer"}
                {currentStep === 6 && "Fraflytning & Særlige Vilkår"}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {currentStep === 1 && "Grundlæggende information om ejendommen og aftaletype"}
                {currentStep === 2 && "Information om alle beboere og deres andele"}
                {currentStep === 3 && "Datoer, depositum og betalingsforhold"}
                {currentStep === 4 && "Regler for ro-tider, rygning og gæster"}
                {currentStep === 5 && "Brug af køkken, bad og andre fællesområder"}
                {currentStep === 6 && "Regler for fraflytning og særlige bestemmelser"}
              </p>
            </div>
            
            <div className="p-8">
              {renderStep()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Forrige
                </button>
                
                {currentStep === totalSteps ? (
                  <button
                    onClick={generateDocument}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
                  >
                    Generer Roomie-aftale
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Næste
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