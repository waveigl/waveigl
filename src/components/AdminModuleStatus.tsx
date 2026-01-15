'use client'

import { FC, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

/**
 * Mostra o status dos módulos de chat
 * Útil para debug e monitoramento
 */
export const AdminModuleStatus: FC = () => {
  const [status, setStatus] = useState<{
    twitch: boolean
    kick: boolean
    youtube: boolean
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/admin/modules')
        const data = await response.json()

        if (data.success) {
          setStatus({
            twitch: data.modules.chat_twitch,
            kick: data.modules.chat_kick,
            youtube: data.modules.chat_youtube
          })
        }
      } catch (error) {
        console.error('[AdminModuleStatus] Erro ao carregar status:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStatus()

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !status) {
    return null
  }

  return (
    <div className="flex gap-2">
      <Badge variant={status.twitch ? 'default' : 'destructive'}>
        {status.twitch ? '✓' : '✕'} Twitch
      </Badge>
      <Badge variant={status.kick ? 'default' : 'destructive'}>
        {status.kick ? '✓' : '✕'} Kick
      </Badge>
      <Badge variant={status.youtube ? 'default' : 'destructive'}>
        {status.youtube ? '✓' : '✕'} YouTube
      </Badge>
    </div>
  )
}
