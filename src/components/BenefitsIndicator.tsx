'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Sparkles } from 'lucide-react'

interface BenefitsIndicatorProps {
  hasPendingBenefits: boolean
  onClick: () => void
}

export default function BenefitsIndicator({ hasPendingBenefits, onClick }: BenefitsIndicatorProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (hasPendingBenefits) {
      // Pulsar a cada 3 segundos quando há benefícios pendentes
      const interval = setInterval(() => {
        setPulse(true)
        setTimeout(() => setPulse(false), 1000)
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [hasPendingBenefits])

  if (!hasPendingBenefits) {
    return null
  }

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 rounded-lg bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="relative">
        <Gift size={20} />
        
        {/* Sparkle animation */}
        <motion.div
          animate={pulse ? { 
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1]
          } : {}}
          transition={{ duration: 0.5 }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles size={12} className="text-yellow-300" />
        </motion.div>
      </div>

      {/* Notification dot */}
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

      {/* Tooltip */}
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-zinc-800 text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
        Benefícios disponíveis!
      </span>
    </motion.button>
  )
}

// Versão simples para exibir no header quando não há benefícios pendentes mas o usuário é SUB
export function SubBadge() {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-linear-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-lg">
      <Gift size={14} className="text-orange-400" />
      <span className="text-xs font-medium text-orange-400">SUB</span>
    </div>
  )
}

