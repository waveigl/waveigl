'use client'

import { useEffect, useState } from 'react'
import { UnifiedMessage } from '@/types'

export interface YouTubeStatus {
  isLive: boolean
  videoId: string | null
  liveChatId: string | null
}

export function useChatStream() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>({
    isLive: false,
    videoId: null,
    liveChatId: null,
  })

  useEffect(() => {
    let es: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      if (es) es.close()

      es = new EventSource('/api/chat/stream')

      es.onopen = () => {
        console.log('[Live] ✅ Conexão SSE estabelecida')
      }

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)

          // Evento de status do YouTube (live on/off)
          if (payload.eventType === 'youtube_status') {
            setYoutubeStatus({
              isLive: payload.isLive,
              videoId: payload.videoId,
              liveChatId: payload.liveChatId,
            })
            return
          }

          // Mensagem de chat
          if (payload && payload.message && payload.platform) {
            const messageId = String(payload.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
            const newMessage: UnifiedMessage = {
              id: messageId,
              platform: payload.platform,
              username: payload.username || 'user',
              userId: payload.userId || 'unknown',
              message: payload.message,
              timestamp: payload.timestamp || Date.now(),
              badges: payload.badges || [],
            }

            setMessages((curr) => {
              if (curr.some(m => m.id === messageId)) return curr
              return [...curr.slice(-200), newMessage]
            })
          }
        } catch {
          // Ignorar erros de parse
        }
      }

      es.onerror = () => {
        console.error('[Live] ❌ Erro no SSE')
        if (es) es.close()
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    // Reconectar quando a aba voltar a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!es || es.readyState === EventSource.CLOSED)) {
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (es) es.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { messages, youtubeStatus }
}
