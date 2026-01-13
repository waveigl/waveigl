'use client'

import { useEffect, useCallback, useRef } from 'react'

// Canal de comunicação entre janelas para sincronizar sessão
const CHANNEL_NAME = 'waveigl-session-sync'

export interface SessionUser {
  id: string
  username: string
  email: string
  role?: string
}

export interface LinkedAccount {
  platform: 'twitch' | 'youtube' | 'kick'
  platform_user_id: string
  platform_username: string
  is_moderator?: boolean
}

export interface SessionData {
  user: SessionUser | null
  linkedAccounts: LinkedAccount[]
  isModerator: boolean
}

type SessionMessage =
  | { type: 'session_request' }
  | { type: 'session_response'; data: SessionData }

/**
 * Hook para a janela principal (Dashboard) - responde às solicitações de sessão
 */
export function useSessionProvider(sessionData: SessionData) {
  const sessionDataRef = useRef(sessionData)

  // Manter referência atualizada
  useEffect(() => {
    sessionDataRef.current = sessionData
  }, [sessionData])

  useEffect(() => {
    // Verifica se BroadcastChannel é suportado
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<SessionMessage>) => {
      if (event.data?.type === 'session_request') {
        // Responder com dados da sessão
        channel.postMessage({
          type: 'session_response',
          data: sessionDataRef.current
        } as SessionMessage)
      }
    }

    channel.addEventListener('message', handleMessage)

    // Também responder imediatamente ao montar (para popups que já estão esperando)
    channel.postMessage({
      type: 'session_response',
      data: sessionDataRef.current
    } as SessionMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [])
}

/**
 * Hook para o popup - solicita sessão da janela principal
 */
export function useSessionReceiver(
  onSessionReceived: (data: SessionData) => void,
  fallbackFetch: () => Promise<void>
) {
  const hasReceivedSession = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const requestSession = useCallback(() => {
    // Verifica se BroadcastChannel é suportado
    if (typeof BroadcastChannel === 'undefined') {
      fallbackFetch()
      return
    }

    const channel = new BroadcastChannel(CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<SessionMessage>) => {
      if (event.data?.type === 'session_response' && !hasReceivedSession.current) {
        hasReceivedSession.current = true

        // Limpar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        onSessionReceived(event.data.data)
        channel.close()
      }
    }

    channel.addEventListener('message', handleMessage)

    // Solicitar sessão
    channel.postMessage({ type: 'session_request' } as SessionMessage)

    // Timeout: se não receber resposta em 500ms, usar fallback
    timeoutRef.current = setTimeout(() => {
      if (!hasReceivedSession.current) {
        channel.close()
        fallbackFetch()
      }
    }, 500)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onSessionReceived, fallbackFetch])

  useEffect(() => {
    const cleanup = requestSession()
    return cleanup
  }, [requestSession])
}

