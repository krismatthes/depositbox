'use client'

import { useState, useRef, useEffect } from 'react'

interface DigitalSignatureProps {
  onSign: (signatureData: string) => void
  onCancel: () => void
  signerName: string
  documentTitle: string
}

export default function DigitalSignature({ 
  onSign, 
  onCancel, 
  signerName, 
  documentTitle 
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw')
  const [typedSignature, setTypedSignature] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 200

    // Set drawing styles
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = clientX - rect.left
    const y = clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = clientX - rect.left
    const y = clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    setHasSignature(false)
  }

  const handleSign = () => {
    if (signatureType === 'draw') {
      const canvas = canvasRef.current
      if (!canvas) return
      const signatureData = canvas.toDataURL()
      onSign(signatureData)
    } else {
      // Create typed signature
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#000000'
        ctx.font = '32px "Dancing Script", cursive'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)
        
        const signatureData = canvas.toDataURL()
        onSign(signatureData)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 text-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Digital Underskrift</h2>
              <p className="text-green-100">{documentTitle}</p>
              <p className="text-green-200 text-sm">Underskriver: {signerName}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Signature Type Selection */}
          <div>
            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setSignatureType('draw')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  signatureType === 'draw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✏️ Tegn underskrift
              </button>
              <button
                onClick={() => setSignatureType('type')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  signatureType === 'type'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                📝 Skriv underskrift
              </button>
            </div>
          </div>

          {signatureType === 'draw' ? (
            /* Drawing Pad */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tegn din underskrift i boksen nedenfor:
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  className="border border-slate-200 rounded-lg cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-slate-500">
                    Tegn din underskrift med mus eller finger på touch-enheder
                  </p>
                  <button
                    onClick={clearSignature}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Ryd
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Typed Signature */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Skriv dit fulde navn:
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => {
                  setTypedSignature(e.target.value)
                  setHasSignature(e.target.value.length > 0)
                }}
                placeholder="Dit fulde navn"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              {typedSignature && (
                <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-500 mb-2">Forhåndsvisning:</div>
                  <div 
                    className="text-3xl text-center py-4" 
                    style={{ fontFamily: '"Dancing Script", cursive' }}
                  >
                    {typedSignature}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legal Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-blue-800 text-sm mb-2">Juridisk gyldighed</div>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>• Din digitale underskrift har samme juridiske gyldighed som en håndskrevet underskrift</p>
                  <p>• Underskriften bliver tidsstemplet og kryptografisk sikret</p>
                  <p>• Du bekræfter hermed at du har læst og accepteret kontraktens vilkår</p>
                  <p>• Underskriften kan ikke ændres efter afgivelse</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp Info */}
          <div className="text-xs text-slate-500 text-center">
            Underskrift vil blive tidsstemplet: {new Date().toLocaleString('da-DK')}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={handleSign}
              disabled={!hasSignature}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {hasSignature ? 'Underskriv Kontrakt' : 'Tilføj underskrift først'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}