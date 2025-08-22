'use client'

interface Step4Props {
  data: any
  onUpdate: (data: any) => void
}

const HEATING_OPTIONS = [
  { value: 'central', label: 'Fjernvarme/centralvarme (inkluderet i husleje)' },
  { value: 'gas', label: 'Gasvarme (lejer betaler)' },
  { value: 'electric', label: 'Elvarme (lejer betaler)' },
  { value: 'oil', label: 'Olievarme (lejer betaler)' },
  { value: 'wood', label: 'Brændeovn/pilleovn' },
  { value: 'other', label: 'Andet' }
]

const WATER_OPTIONS = [
  { value: 'included', label: 'Inkluderet i husleje' },
  { value: 'aconto', label: 'A conto betaling' },
  { value: 'meter', label: 'Efter forbrug (vandmåler)' }
]

const ELECTRICITY_OPTIONS = [
  { value: 'tenant', label: 'Lejer tegner eget el-abonnement' },
  { value: 'included', label: 'Inkluderet i husleje' },
  { value: 'aconto', label: 'A conto betaling' }
]

const INVENTORY_OPTIONS = [
  'Køleskab',
  'Fryser',
  'Komfur/kogeplader',
  'Ovn',
  'Emhætte',
  'Opvaskemaskine',
  'Vaskemaskine',
  'Tørretumbler',
  'Belysning/lamper',
  'Gardiner/persienner',
  'Møbler (specificer i særlige vilkår)'
]

export default function Step4Vilkaar({ data, onUpdate }: Step4Props) {
  const updateConditions = (field: string, value: any) => {
    onUpdate({
      ...data,
      conditions: {
        ...data.conditions,
        [field]: value
      }
    })
  }

  const toggleInventory = (item: string) => {
    const currentInventory = data.conditions.inventory || []
    const newInventory = currentInventory.includes(item)
      ? currentInventory.filter((i: string) => i !== item)
      : [...currentInventory, item]
    
    updateConditions('inventory', newInventory)
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">🏠 § 5-10: Vilkår & Stand</h3>
      
      {/* Heating */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-red-800 mb-4">🔥 § 5: Opvarmning</h4>
        <div className="space-y-3">
          {HEATING_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="heating"
                value={option.value}
                checked={data.conditions.heating === option.value}
                onChange={(e) => updateConditions('heating', e.target.value)}
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="text-slate-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Water */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4">💧 § 6: Vand</h4>
        <div className="space-y-3">
          {WATER_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="water"
                value={option.value}
                checked={data.conditions.water === option.value}
                onChange={(e) => updateConditions('water', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Electricity */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-yellow-800 mb-4">⚡ § 7: El</h4>
        <div className="space-y-3">
          {ELECTRICITY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="electricity"
                value={option.value}
                checked={data.conditions.electricity === option.value}
                onChange={(e) => updateConditions('electricity', e.target.value)}
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
              />
              <span className="text-slate-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Renovation Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-green-800 mb-4">🔨 § 7: Istandsættelse</h4>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.conditions.newlyRenovated || false}
            onChange={(e) => updateConditions('newlyRenovated', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="text-slate-700">Lejemålet er nyistandsat ved overtagelsen</span>
        </label>
        <p className="text-sm text-green-600 mt-2 ml-7">
          Markér hvis lejemålet er blevet renoveret eller malet inden udlejning
        </p>
      </div>

      {/* Maintenance Responsibility - IMPORTANT SECTION */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">🔧 § 8: Vedligeholdelsespligt</h4>
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h5 className="font-medium text-amber-800 mb-1">⚠️ Vigtigt valg!</h5>
              <p className="text-sm text-amber-700">
                Dette valg bestemmer hvem der skal betale for reparationer og vedligeholdelse 
                af lejemålets indvendige dele (vægge, gulve, armaturer, mv.)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className={`
            flex items-start space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-all
            ${data.conditions.maintenanceResponsibility === 'landlord' 
              ? 'border-green-500 bg-green-100' 
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}>
            <input
              type="radio"
              name="maintenance"
              value="landlord"
              checked={data.conditions.maintenanceResponsibility === 'landlord'}
              onChange={(e) => updateConditions('maintenanceResponsibility', e.target.value)}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mt-1"
            />
            <div>
              <span className="font-semibold text-slate-800">✅ Udlejer har vedligeholdelsespligt (Standard)</span>
              <p className="text-sm text-slate-600 mt-1">
                Udlejer betaler for reparationer og indvendig vedligeholdelse. 
                Dette er det normale og anbefalede valg for de fleste udlejninger.
              </p>
            </div>
          </label>

          <label className={`
            flex items-start space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-all
            ${data.conditions.maintenanceResponsibility === 'tenant' 
              ? 'border-red-500 bg-red-100' 
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}>
            <input
              type="radio"
              name="maintenance"
              value="tenant"
              checked={data.conditions.maintenanceResponsibility === 'tenant'}
              onChange={(e) => updateConditions('maintenanceResponsibility', e.target.value)}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 mt-1"
            />
            <div>
              <span className="font-semibold text-slate-800">⚠️ Lejer har vedligeholdelsespligt</span>
              <p className="text-sm text-slate-600 mt-1">
                Lejer betaler for indvendig vedligeholdelse og reparationer. 
                Kræver ofte reduktion i husleje. Bruges sjældent.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-indigo-800 mb-4">📦 § 9: Medfølgende inventar</h4>
        <p className="text-sm text-indigo-600 mb-4">
          Vælg hvilket inventar der medfølger lejemålet:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INVENTORY_OPTIONS.map((item) => (
            <label key={item} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.conditions.inventory?.includes(item) || false}
                onChange={() => toggleInventory(item)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pets */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-orange-800 mb-4">🐕 § 10: Husdyr</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="pets"
              value="true"
              checked={data.conditions.petsAllowed === true}
              onChange={() => updateConditions('petsAllowed', true)}
              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
            />
            <span className="text-slate-700">✅ Husdyr er tilladt</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="pets"
              value="false"
              checked={data.conditions.petsAllowed === false}
              onChange={() => updateConditions('petsAllowed', false)}
              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
            />
            <span className="text-slate-700">❌ Husdyr er ikke tilladt</span>
          </label>
        </div>
        <p className="text-sm text-orange-600 mt-3">
          Bemærk: Et generelt forbud mod husdyr kan ikke håndhæves, 
          men udlejer kan forbyde specifikke dyrearter eller kræve depositum.
        </p>
      </div>

      {/* Legal Info */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">📚 Juridisk vejledning</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Vedligeholdelsespligt:</strong> Standardvalget er at udlejer har vedligeholdelsespligten. Dette giver lejer mere sikkerhed.</p>
              <p><strong>Inventar:</strong> Alt medfølgende inventar skal specificeres. Udlejer er ansvarlig for reparation af medfølgende inventar.</p>
              <p><strong>Husdyr:</strong> Udlejer kan ikke generelt forbyde alle husdyr, men kan stille rimelige krav.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}