'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Step1Props {
  data: any
  onUpdate: (data: any) => void
  onTenantOptionalChange?: (optional: boolean) => void
}

const FACILITY_OPTIONS = [
  'Vaskeri',
  'Kælder',
  'Cykelparkering', 
  'Bil-/garageplads',
  'Have/terrasse',
  'Tagterrasse',
  'Altan',
  'Tørreloft'
]

const PROPERTY_TYPES = [
  { value: 'apartment', label: '🏠 Lejlighed' },
  { value: 'house', label: '🏡 Hus' },
  { value: 'room', label: '🚪 Værelse' },
  { value: 'studio', label: '🏢 Studio' }
]

const ROOM_OPTIONS = [
  { value: 1, label: '1 værelse' },
  { value: 2, label: '2 værelser' },
  { value: 3, label: '3 værelser' },
  { value: 4, label: '4 værelser' },
  { value: 5, label: '5 værelser' },
  { value: 6, label: '6 værelser' },
  { value: 7, label: '7 værelser' },
  { value: 8, label: '8 værelser' },
  { value: 9, label: '9 værelser' },
  { value: 10, label: '10+ værelser' }
]

export default function Step1ParterLejemaal({ data, onUpdate, onTenantOptionalChange }: Step1Props) {
  const [tenantInfoOptional, setTenantInfoOptional] = useState(false)
  const [landlordAddresses, setLandlordAddresses] = useState<string[]>([])

  useEffect(() => {
    fetchLandlordAddresses()
  }, [])

  const fetchLandlordAddresses = async () => {
    try {
      const response = await api.get('/properties')
      const addresses = response.data.properties?.map((prop: any) => prop.address).filter(Boolean) || []
      setLandlordAddresses([...new Set(addresses)]) // Remove duplicates
    } catch (error) {
      console.error('Failed to fetch landlord addresses:', error)
    }
  }

  const addTenant = () => {
    const newTenants = [...data.tenants, {
      name: '',
      currentAddress: '',
      cpr: '',
      email: ''
    }]
    onUpdate({
      ...data,
      tenants: newTenants
    })
  }

  const removeTenant = (index: number) => {
    if (data.tenants.length > 1) {
      const newTenants = data.tenants.filter((_: any, i: number) => i !== index)
      onUpdate({
        ...data,
        tenants: newTenants
      })
    }
  }

  const updateTenant = (index: number, field: string, value: string) => {
    const newTenants = [...data.tenants]
    newTenants[index] = { ...newTenants[index], [field]: value }
    
    const updatedData = {
      ...data,
      tenants: newTenants
    }
    
    // Sync with Danish format
    const newLejer = [...(updatedData.lejer || [])]
    if (!newLejer[index]) {
      newLejer[index] = { navn: '', adresse: '', cpr: '', email: '' }
    }
    
    if (field === 'name') {
      newLejer[index].navn = value
    } else if (field === 'currentAddress') {
      newLejer[index].adresse = value
    } else if (field === 'cpr') {
      newLejer[index].cpr = value
    } else if (field === 'email') {
      newLejer[index].email = value
    }
    
    updatedData.lejer = newLejer
    
    onUpdate(updatedData)
  }

  const updateLandlord = (field: string, value: string) => {
    const updatedData = {
      ...data,
      landlord: { ...data.landlord, [field]: value }
    }
    
    // Sync with Danish format
    if (field === 'name') {
      updatedData.udlejer = { ...updatedData.udlejer, navn: value }
    } else if (field === 'address') {
      updatedData.udlejer = { ...updatedData.udlejer, adresse: value }
    } else if (field === 'cvrCpr') {
      updatedData.udlejer = { ...updatedData.udlejer, cvr: value }
    }
    
    onUpdate(updatedData)
  }

  const updateProperty = (field: string, value: any) => {
    const updatedData = {
      ...data,
      property: { ...data.property, [field]: value }
    }
    
    // Sync with Danish format
    if (field === 'address') {
      updatedData.ejendom = { ...updatedData.ejendom, adresse: value }
    } else if (field === 'area') {
      updatedData.ejendom = { ...updatedData.ejendom, areal_m2: value }
    } else if (field === 'rooms') {
      updatedData.ejendom = { ...updatedData.ejendom, rum: value }
    } else if (field === 'moveInDate') {
      updatedData.startdato = value
    }
    
    onUpdate(updatedData)
  }

  const toggleFacility = (facility: string) => {
    const currentFacilities = data.property.facilities || []
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter((f: string) => f !== facility)
      : [...currentFacilities, facility]
    
    updateProperty('facilities', newFacilities)
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">📋 § 1: Parter & Lejemål</h3>
      
      {/* Udlejer Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4">👤 Udlejer Oplysninger</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fulde navn *
            </label>
            <input
              type="text"
              value={data.landlord.name}
              onChange={(e) => updateLandlord('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fornavn Efternavn"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CVR/CPR nummer *
            </label>
            <input
              type="text"
              value={data.landlord.cvrCpr}
              onChange={(e) => updateLandlord('cvrCpr', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="XXXXXX-XXXX eller XXXXXXXX"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adresse *
            </label>
            {landlordAddresses.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={data.landlord.address}
                  onChange={(e) => updateLandlord('address', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Vælg tidligere indtastet adresse eller indtast ny nedenfor</option>
                  {landlordAddresses.map((address, index) => (
                    <option key={index} value={address}>{address}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={data.landlord.address}
                  onChange={(e) => updateLandlord('address', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Eller indtast ny adresse: Gade og nummer, postnummer by"
                  required
                />
              </div>
            ) : (
              <input
                type="text"
                value={data.landlord.address}
                onChange={(e) => updateLandlord('address', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Gade og nummer, postnummer by"
                required
              />
            )}
          </div>
        </div>
      </div>

      {/* Lejer Information */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-green-800">👥 Lejer Oplysninger</h4>
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tenantInfoOptional}
                onChange={(e) => {
                  setTenantInfoOptional(e.target.checked)
                  onTenantOptionalChange?.(e.target.checked)
                }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-green-700 font-medium">Gør lejer-info valgfri</span>
            </label>
            {!tenantInfoOptional && (
              <button
                onClick={addTenant}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Tilføj Lejer
              </button>
            )}
          </div>
        </div>
        
        {tenantInfoOptional ? (
          <div className="p-4 bg-white rounded-lg border border-green-100">
            <div className="flex items-center gap-3 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">
                <strong>Lejer information er gjort valgfri.</strong> Lejeren kan selv udfylde disse oplysninger når vedkommende modtager kontrakten.
              </p>
            </div>
          </div>
        ) : (
          data.tenants.map((tenant: any, index: number) => (
            <div key={index} className="mb-6 p-4 bg-white rounded-lg border border-green-100">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-green-800">Lejer {index + 1}</h5>
                {data.tenants.length > 1 && (
                  <button
                    onClick={() => removeTenant(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Fjern
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fulde navn *
                  </label>
                  <input
                    type="text"
                    value={tenant.name}
                    onChange={(e) => updateTenant(index, 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Fornavn Efternavn"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPR nummer *
                  </label>
                  <input
                    type="text"
                    value={tenant.cpr}
                    onChange={(e) => updateTenant(index, 'cpr', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="XXXXXX-XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={tenant.email}
                    onChange={(e) => updateTenant(index, 'email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nuværende adresse *
                  </label>
                  <input
                    type="text"
                    value={tenant.currentAddress}
                    onChange={(e) => updateTenant(index, 'currentAddress', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Gade og nummer, postnummer by"
                    required
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lejemål Information */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-800 mb-4">🏠 Lejemål Oplysninger</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lejemålets adresse *
            </label>
            <input
              type="text"
              value={data.property.address}
              onChange={(e) => updateProperty('address', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Gade og nummer, postnummer by"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lejemålets art *
            </label>
            <select
              value={data.property.type}
              onChange={(e) => updateProperty('type', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📅 Overtagelsesdato *
            </label>
            <div className="relative">
              <input
                type="date"
                value={data.property.moveInDate}
                onChange={(e) => updateProperty('moveInDate', e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gradient-to-r from-white to-purple-50/30 hover:shadow-md cursor-pointer"
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center pointer-events-none">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Hvornår kan lejeren flytte ind og få adgang til boligen</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Areal (m²) *
            </label>
            <input
              type="number"
              value={data.property.area}
              onChange={(e) => updateProperty('area', Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="85"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Antal værelser *
            </label>
            <select
              value={data.property.rooms}
              onChange={(e) => updateProperty('rooms', Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Vælg antal værelser</option>
              {ROOM_OPTIONS.map(room => (
                <option key={room.value} value={room.value}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brugsret Facilities */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Brugsret til følgende (valgfrit):
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FACILITY_OPTIONS.map(facility => (
              <label key={facility} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.property.facilities?.includes(facility) || false}
                  onChange={() => toggleFacility(facility)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">{facility}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-medium text-blue-800 mb-1">💡 Hjælpetekst</h5>
            <p className="text-sm text-blue-700">
              Alle felter markeret med * er obligatoriske. CVR-nummer bruges hvis udlejer er en virksomhed, 
              ellers bruges CPR-nummer. Sørg for at alle oplysninger er korrekte, da de vil fremgå af lejekontrakten.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}