'use client'

import { useMemo } from 'react'

interface Step3Props {
  data: any
  onUpdate: (data: any) => void
}

export default function Step3Oekonomi({ data, onUpdate }: Step3Props) {
  const updateEconomy = (field: string, value: number | boolean) => {
    const updatedData = {
      ...data,
      economy: {
        ...data.economy,
        [field]: value
      }
    }
    
    // Sync with Danish format
    if (field === 'monthlyRent') {
      updatedData.maanedsleje_ex_forbrug = Number(value)
    } else if (field === 'heating') {
      updatedData.aconto = { ...updatedData.aconto, varme: Number(value) }
    } else if (field === 'water') {
      updatedData.aconto = { ...updatedData.aconto, vand: Number(value) }
    } else if (field === 'electricity') {
      updatedData.aconto = { ...updatedData.aconto, el: Number(value) }
    } else if (field === 'other') {
      updatedData.aconto = { ...updatedData.aconto, internet_tv: Number(value) }
    } else if (field === 'deposit') {
      const monthlyRent = updatedData.economy.monthlyRent || updatedData.maanedsleje_ex_forbrug || 0
      updatedData.depositum_maaneder = monthlyRent > 0 ? Number(value) / monthlyRent : 0
    } else if (field === 'prepaidRent') {
      const monthlyRent = updatedData.economy.monthlyRent || updatedData.maanedsleje_ex_forbrug || 0
      updatedData.forudbetalt_leje_maaneder = monthlyRent > 0 ? Number(value) / monthlyRent : 0
    }
    
    onUpdate(updatedData)
  }

  // Automatic calculations
  const totalMonthlyPayment = useMemo(() => {
    const { monthlyRent, heating, water, electricity, other } = data.economy
    return Number(monthlyRent || 0) + Number(heating || 0) + Number(water || 0) + Number(electricity || 0) + Number(other || 0)
  }, [data.economy])

  const totalFirstPayment = useMemo(() => {
    const { deposit, prepaidRent } = data.economy
    return Number(deposit || 0) + Number(prepaidRent || 0)
  }, [data.economy])

  const totalEscrowPayment = useMemo(() => {
    const base = totalFirstPayment
    const includeFirstMonth = data.economy.includeFirstMonthInEscrow
    return includeFirstMonth ? base + totalMonthlyPayment : base
  }, [totalFirstPayment, totalMonthlyPayment, data.economy.includeFirstMonthInEscrow])

  const maxDepositAndPrepaid = useMemo(() => {
    return Number(data.economy.monthlyRent || 0) * 3
  }, [data.economy.monthlyRent])

  // Validation
  const isDepositValid = Number(data.economy.deposit || 0) <= maxDepositAndPrepaid
  const isPrepaidValid = Number(data.economy.prepaidRent || 0) <= maxDepositAndPrepaid
  const isTotalValid = totalFirstPayment <= maxDepositAndPrepaid

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">💰 § 3-4: Økonomi</h3>
      
      {/* Monthly Payments */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4">🏠 Månedlige Betalinger</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Månedlig husleje *
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.monthlyRent || ''}
                onChange={(e) => updateEconomy('monthlyRent', Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="15000"
                min="0"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              A conto varme
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.heating || ''}
                onChange={(e) => updateEconomy('heating', Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              A conto vand
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.water || ''}
                onChange={(e) => updateEconomy('water', Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              A conto el
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.electricity || ''}
                onChange={(e) => updateEconomy('electricity', Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Øvrige bidrag
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.other || ''}
                onChange={(e) => updateEconomy('other', Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
          </div>
        </div>

        {/* Monthly Total */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-800">Total månedlig betaling:</span>
            <span className="text-2xl font-bold text-blue-900">
              {totalMonthlyPayment.toLocaleString()} DKK
            </span>
          </div>
        </div>
      </div>

      {/* First Payment */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-green-800 mb-4">💳 Førstegangsbetalinger</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Depositum
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.deposit || ''}
                onChange={(e) => updateEconomy('deposit', Number(e.target.value))}
                className={`
                  w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500
                  ${isDepositValid ? 'border-slate-300' : 'border-red-300 bg-red-50'}
                `}
                placeholder="45000"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
            {!isDepositValid && (
              <p className="text-xs text-red-600 mt-1">
                Depositum må ikke overstige 3 gange månedlig husleje ({maxDepositAndPrepaid.toLocaleString()} DKK)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Forudbetalt leje
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.economy.prepaidRent || ''}
                onChange={(e) => updateEconomy('prepaidRent', Number(e.target.value))}
                className={`
                  w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500
                  ${isPrepaidValid ? 'border-slate-300' : 'border-red-300 bg-red-50'}
                `}
                placeholder="15000"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">DKK</span>
            </div>
            {!isPrepaidValid && (
              <p className="text-xs text-red-600 mt-1">
                Forudbetalt leje må ikke overstige 3 gange månedlig husleje ({maxDepositAndPrepaid.toLocaleString()} DKK)
              </p>
            )}
          </div>
        </div>

        {/* First Payment Total */}
        <div className={`
          rounded-lg p-4 border-2
          ${isTotalValid ? 'bg-white border-green-200' : 'bg-red-50 border-red-300'}
        `}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-green-800">Total førstegangsbetalinger:</span>
            <span className={`
              text-2xl font-bold
              ${isTotalValid ? 'text-green-900' : 'text-red-800'}
            `}>
              {totalFirstPayment.toLocaleString()} DKK
            </span>
          </div>
          <div className="text-sm text-slate-600">
            + Månedlig betaling: {totalMonthlyPayment.toLocaleString()} DKK
          </div>
          {!isTotalValid && (
            <div className="mt-2 text-sm text-red-700 font-medium">
              ⚠️ Total depositum + forudbetalt leje må ikke overstige 3 gange månedlig husleje
            </div>
          )}
        </div>
      </div>

      {/* Escrow Payment Options */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-lg font-semibold text-purple-800">🏦 Escrow Betaling</h4>
          <div className="group relative">
            <svg className="w-4 h-4 text-purple-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-80 p-3 bg-white border border-purple-200 rounded-lg shadow-lg text-sm text-purple-700">
              <strong>Escrow service:</strong> En neutral tredjepartstjeneste som holder depositum og første måned's husleje, indtil lejemålet er overtaget. Dette beskytter både udlejer og lejer.
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.economy.includeFirstMonthInEscrow || false}
              onChange={(e) => updateEconomy('includeFirstMonthInEscrow', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-purple-800">Inkluder første måneds husleje i escrow</span>
              <p className="text-sm text-purple-600 mt-1">
                Første måneds husleje ({totalMonthlyPayment.toLocaleString()} DKK) tilbageholdes i escrow indtil lejemålet er overtaget.
              </p>
            </div>
          </label>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-purple-800">Total escrow betaling:</span>
              <span className="text-2xl font-bold text-purple-900">
                {totalEscrowPayment.toLocaleString()} DKK
              </span>
            </div>
            <div className="text-sm text-purple-600">
              {data.economy.includeFirstMonthInEscrow ? (
                <>
                  Depositum + forudbetalt leje + første måned ({totalFirstPayment.toLocaleString()} + {totalMonthlyPayment.toLocaleString()})
                </>
              ) : (
                <>
                  Kun depositum + forudbetalt leje ({totalFirstPayment.toLocaleString()})
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legal Guidelines */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-orange-800 mb-3">📋 Retningslinjer for betaling</h4>
        <div className="space-y-3 text-sm text-orange-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">💰</span>
            <p>
              <strong>Depositum:</strong> Kan maksimalt være 3 gange den månedlige husleje. 
              Depositum skal stå på særlig konto og forrentes.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">📅</span>
            <p>
              <strong>Forudbetalt leje:</strong> Kan maksimalt være 3 gange den månedlige husleje. 
              Typisk bruges til første måned eller ved usikkerhed om lejerens økonomi.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">⚖️</span>
            <p>
              <strong>Samlet regel:</strong> Depositum + forudbetalt leje må tilsammen ikke overstige 
              3 gange månedlig husleje (inkl. a conto betalinger).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">🔥</span>
            <p>
              <strong>A conto betalinger:</strong> Varme, vand og el kan opkræves a conto baseret 
              på forventet forbrug. Der skal ske efterregulering.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {data.economy.monthlyRent > 0 && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <h5 className="font-medium text-blue-800 mb-2">📊 Økonomisk oversigt</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <strong>Maksimalt tilladt depositum + forudbetalt:</strong><br/>
                {maxDepositAndPrepaid.toLocaleString()} DKK (3 × {Number(data.economy.monthlyRent).toLocaleString()} DKK)
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <strong>Aktuelt depositum + forudbetalt:</strong><br/>
                {totalFirstPayment.toLocaleString()} DKK
                {isTotalValid 
                  ? <span className="text-green-600 ml-2">✅ OK</span>
                  : <span className="text-red-600 ml-2">❌ For højt</span>
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}