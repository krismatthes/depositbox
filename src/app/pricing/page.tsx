'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'

export default function PricingPage() {
  const [depositAmount, setDepositAmount] = useState<number>(10000)
  
  const calculateFee = (amount: number): number => {
    const percentage = amount * 0.03
    return Math.max(199, Math.min(799, percentage))
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const fee = calculateFee(depositAmount)
  const percentage = ((fee / depositAmount) * 100).toFixed(1)

  const pricingTiers = [
    {
      deposit: 5000,
      fee: calculateFee(5000),
      description: "Små depositum"
    },
    {
      deposit: 15000,
      fee: calculateFee(15000),
      description: "Standard depositum"
    },
    {
      deposit: 30000,
      fee: calculateFee(30000),
      description: "Store depositum"
    }
  ]

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 5px;
          background: linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((depositAmount - 1000) / (50000 - 1000)) * 100}%, #e2e8f0 ${((depositAmount - 1000) / (50000 - 1000)) * 100}%, #e2e8f0 100%);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Priser for BoligDeposit
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
            Simpel og gennemsigtig prissætning. Kun lejeren betaler 3% af depositumbeløbet.
          </p>
          <div className="inline-flex items-center gap-4 bg-green-100 text-green-700 px-6 py-3 rounded-full">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold">Udlejere betaler 0 kr</span>
            </div>
            <div className="w-px h-6 bg-green-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">Lejere betaler for sikkerhed</span>
            </div>
          </div>
        </div>

        {/* Pricing Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              Beregn dit gebyr
            </h2>
            <p className="text-slate-600">
              Indtast dit depositumbeløb og se præcis hvad det koster
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <label htmlFor="deposit" className="block text-sm font-medium text-slate-700 mb-2">
              Depositumbeløb: {formatCurrency(depositAmount)}
            </label>
            <div className="mb-6">
              <input
                type="range"
                id="deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                min="1000"
                max="50000"
                step="100"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1.000 DKK</span>
                <span>50.000 DKK</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(fee)}
              </div>
              <div className="text-sm text-slate-600 mb-1">
                Dit gebyr ({percentage}% af depositum)
              </div>
              <div className="text-xs text-slate-500">
                Minimum 199 DKK • Maksimum 799 DKK
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pricingTiers.map((tier, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {tier.description}
              </h3>
              <div className="text-2xl font-bold text-slate-600 mb-2">
                {formatCurrency(tier.deposit)}
              </div>
              <div className="text-sm text-slate-500 mb-4">Depositum</div>
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(tier.fee)}
                </div>
                <div className="text-xs text-blue-500">Gebyr</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Sådan fungerer vores priser
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                💰 Enkelt gebyrstruktur
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>• 3% af depositumbeløbet</li>
                <li>• Minimum gebyr: 199 DKK</li>
                <li>• Maksimum gebyr: 799 DKK</li>
                <li>• Ingen skjulte omkostninger</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                ✨ Hvad får du for gebyret?
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Sikker opbevaring af depositum</li>
                <li>• Automatisk udbetaling</li>
                <li>• Konfliktløsning</li>
                <li>• 24/7 support</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">
                  Kun lejeren betaler gebyret
                </h3>
                <p className="text-green-600 text-sm">
                  Udlejeren betaler intet for at bruge BoligDeposit
                </p>
              </div>
              <div className="text-2xl">🏠</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Klar til at komme i gang?
          </h2>
          <p className="text-slate-600 mb-6">
            Opret din konto i dag og få sikret dit depositum
          </p>
          <div className="space-x-4">
            <a
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 inline-block"
            >
              Opret konto
            </a>
            <a
              href="/how-it-works"
              className="bg-white hover:bg-slate-50 text-slate-700 px-8 py-3 rounded-lg text-lg font-medium border border-slate-300 transition-all duration-300 inline-block"
            >
              Læs mere
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}