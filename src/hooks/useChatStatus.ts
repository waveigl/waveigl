/**
 * Hook para verificar o status dos módulos de chat
 * Usado para mostrar "Chat Offline" quando o admin desabilita
 */

import { useState, useEffect, useCallback } from 'react'

export interface ChatStatus {
  chat: {
    twitch: boolean
    kick: boolean
    youtube: boolean
  }
  videoPlayer: {
    isOffline: boolean
  }
}

export function useChatStatus() {
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat-status')
      const data = await response.json()

      if (data.success) {
        setStatus(data)
      }
    } catch (error) {
      console.error('[useChatStatus] Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()

    // Atualizar a cada 10 segundos
    const interval = setInterval(loadStatus, 10000)
    return () => clearInterval(interval)
  }, [loadStatus])

  const isChatOnline = (platform: 'twitch' | 'kick' | 'youtube'): boolean => {
    return status?.chat[platform] ?? true
  }

  const isVideoPlayerOnline = (): boolean => {
    return status?.videoPlayer.isOffline !== true
  }

  return {
    status,
    loading,
    isChatOnline,
    isVideoPlayerOnline,
    refetch: loadStatus
  }
}
