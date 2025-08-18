'use client'

interface Step2Props {
  data: any
  onUpdate: (data: any) => void
}

const COMMON_LIMITED_REASONS = [
  'Udlejer skal selv bo i lejemålet efter udløb',
  'Lejemålet skal omfattende renoveres',
  'Lejemålet skal nedrives',
  'Udlejers børn skal bo i lejemålet',
  'Lejemålet skal sælges som ejerlejlighed',
  'Midlertidig udlejning under udlejers fravær'
]

export default function Step2Lejeperiode({ data, onUpdate }: Step2Props) {
  const updateLeaseType = (type: 'unlimited' | 'limited') => {
    onUpdate({
      ...data,
      leaseType: type,
      limitedReason: type === 'unlimited' ? '' : data.limitedReason
    })
  }

  const updateLimitedReason = (reason: string) => {
    onUpdate({
      ...data,
      limitedReason: reason
    })
  }

  const insertCommonReason = (reason: string) => {
    const currentReason = data.limitedReason || ''
    const newReason = currentReason ? `${currentReason}\n\n${reason}` : reason
    updateLimitedReason(newReason)
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">⏰ § 2: Lejeperiode</h3>
      
      {/* Lease Type Selection */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-slate-700">Vælg lejeperiode:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unlimited Lease */}
          <label className={`
            relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all
            ${data.leaseType === 'unlimited' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-green-300'
            }
          `}>
            <input
              type="radio"
              name="leaseType"
              value="unlimited"
              checked={data.leaseType === 'unlimited'}
              onChange={(e) => updateLeaseType(e.target.value as 'unlimited')}
              className="sr-only"
            />
            <div className="flex items-center mb-3">
              <div className={`
                w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                ${data.leaseType === 'unlimited' ? 'border-green-500' : 'border-gray-300'}
              `}>
                {data.leaseType === 'unlimited' && (
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                )}
              </div>
              <span className="text-lg font-semibold text-slate-800">✅ Tidsubegrænset</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Lejemålet udlejes på ubestemt tid. Dette er det normale for boligudlejning. 
              Lejeren har ret til at bo der, så længe lejekontrakten overholdes.
            </p>
          </label>

          {/* Limited Lease */}
          <label className={`
            relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all
            ${data.leaseType === 'limited' 
              ? 'border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 bg-white hover:border-yellow-300'
            }
          `}>
            <input
              type="radio"
              name="leaseType"
              value="limited"
              checked={data.leaseType === 'limited'}
              onChange={(e) => updateLeaseType(e.target.value as 'limited')}
              className="sr-only"
            />
            <div className="flex items-center mb-3">
              <div className={`
                w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                ${data.leaseType === 'limited' ? 'border-yellow-500' : 'border-gray-300'}
              `}>
                {data.leaseType === 'limited' && (
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                )}
              </div>
              <span className="text-lg font-semibold text-slate-800">⚠️ Tidsbegrænset</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Lejemålet udlejes for en bestemt periode. Kræver saglig begrundelse 
              og skal være i udlejers interesse. Bruges kun i særlige tilfælde.
            </p>
          </label>
        </div>
      </div>

      {/* Limited Lease Reason */}
      {data.leaseType === 'limited' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-4">📝 Begrundelse for tidsbegrænsning</h4>
          
          {/* Common Reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Almindelige begrundelser (klik for at indsætte):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {COMMON_LIMITED_REASONS.map((reason, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertCommonReason(reason)}
                  className="text-left p-3 bg-white border border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-sm"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Text Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Detaljeret begrundelse *
            </label>
            <textarea
              value={data.limitedReason || ''}
              onChange={(e) => updateLimitedReason(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Beskriv detaljeret hvorfor lejemålet skal tidsbegrænses. Begrundelsen skal være saglig og i udlejers interesse..."
              required={data.leaseType === 'limited'}
            />
            <p className="text-xs text-slate-500 mt-1">
              Begrundelsen vil blive indsat i lejekontrakten og skal være juridisk holdbar.
            </p>
          </div>
        </div>
      )}

      {/* Legal Info Box */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">⚖️ Juridisk vejledning</h5>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>Tidsubegrænset:</strong> Dette er standardvalget for almindelig boligudlejning. 
                Lejeren får opsigelsesbesyttelse og kan kun opsiges under særlige omstændigheder.
              </p>
              <p>
                <strong>Tidsbegrænset:</strong> Kan kun bruges hvis der er en saglig begrundelse i udlejers forhold. 
                Begrundelsen skal eksistere på kontrakttidspunktet og være dokumenterbar. 
                Eksempler inkluderer planlagt egenbrug, renovering eller nedrivning.
              </p>
              <p className="font-medium">
                💡 Tip: Vælg kun tidsbegrænset hvis du har en konkret, dokumenterbar grund. 
                Falske begrundelser kan få juridiske konsekvenser.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {data.leaseType === 'limited' && !data.limitedReason?.trim() && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              Du skal angive en begrundelse for tidsbegrænsningen før du kan fortsætte.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}