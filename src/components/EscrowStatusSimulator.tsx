'use client'

import { useEffect } from 'react'

interface EscrowStatusSimulatorProps {
  escrows: any[]
  onStatusUpdate: (escrowId: string, newStatus: string) => void
}

export default function EscrowStatusSimulator({ escrows, onStatusUpdate }: EscrowStatusSimulatorProps) {
  useEffect(() => {
    // Simulate status changes for FUNDED escrows
    const fundedEscrows = escrows.filter(escrow => escrow.status === 'FUNDED')
    
    if (fundedEscrows.length > 0) {
      // After 5 seconds, change FUNDED to ACTIVE (tenant moved in) - faster for demo
      const activeTimer = setTimeout(() => {
        fundedEscrows.forEach(escrow => {
          onStatusUpdate(escrow.id, 'ACTIVE')
        })
      }, 5000) // 5 seconds

      // After 12 seconds, change ACTIVE to RELEASED (lease ended) - faster for demo
      const releasedTimer = setTimeout(() => {
        fundedEscrows.forEach(escrow => {
          onStatusUpdate(escrow.id, 'RELEASED')
        })
      }, 12000) // 12 seconds

      return () => {
        clearTimeout(activeTimer)
        clearTimeout(releasedTimer)
      }
    }
  }, [escrows, onStatusUpdate])

  // This component doesn't render anything - it's just for the simulation
  return null
}