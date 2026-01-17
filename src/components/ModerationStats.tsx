'use client'

import { useMemo } from 'react'
import { Ban, Clock } from 'lucide-react'

interface ModerationAction {
  id: string
  userId: string
  username: string
  platform: string
  action: 'ban' | 'timeout'
  reason?: string
  duration?: number
  appliedAt: number
  expiresAt?: number
}

interface ModerationStatsProps {
  actions: ModerationAction[]
  compact?: boolean
}

/**
 * Componente que exibe contadores de banimentos e timeouts
 * Pode ser usado ao lado do chat para mostrar estatísticas em tempo real
 */
export function ModerationStats({ actions, compact = false }: ModerationStatsProps) {
  const { banCount, timeoutCount } = useMemo(() => {
    const now = Date.now()
    const activeBans = actions.filter(
      a => a.action === 'ban' && (!a.expiresAt || a.expiresAt > now)
    ).length
    const activeTimeouts = actions.filter(
      a => a.action === 'timeout' && (!a.expiresAt || a.expiresAt > now)
    ).length

    return {
      banCount: activeBans,
      timeoutCount: activeTimeouts
    }
  }, [actions])

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Bans */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
          <Ban className="w-4 h-4 text-red-400" />
          <span className="text-sm font-bold text-red-400">{banCount}</span>
        </div>

        {/* Timeouts */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">{timeoutCount}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Bans */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
        <Ban className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-xs text-red-400/70">Banimentos</p>
          <p className="text-lg font-bold text-red-400">{banCount}</p>
        </div>
      </div>

      {/* Timeouts */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <Clock className="w-5 h-5 text-yellow-400" />
        <div>
          <p className="text-xs text-yellow-400/70">Timeouts</p>
          <p className="text-lg font-bold text-yellow-400">{timeoutCount}</p>
        </div>
      </div>
    </div>
  )
}
