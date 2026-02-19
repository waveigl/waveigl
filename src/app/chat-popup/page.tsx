'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { UnifiedChat } from '@/components/UnifiedChat'
import { Platform, UnifiedMessage } from '@/types'
import { getUserRole } from '@/lib/permissions'
import { useSessionReceiver, SessionData } from '@/hooks/use-session-sync'

export default function ChatPopupPage() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [user, setUser] = useState<{
    id: string
    username: string
    email: string
    role?: string
  } | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{
    platform: Platform
    platform_user_id: string
    platform_username: string
    is_moderator?: boolean
  }>>([])
  const [isModerator, setIsModerator] = useState(false)
  const [youtubeStatus, setYoutubeStatus] = useState<{
    isLive: boolean
    videoId: string | null
    liveChatId: string | null
  }>({ isLive: false, videoId: null, liveChatId: null })
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const linkedAccountsRef = useRef(linkedAccounts)

  useEffect(() => {
    linkedAccountsRef.current = linkedAccounts
  }, [linkedAccounts])

  // Callback quando receber sessão via BroadcastChannel
  const handleSessionReceived = useCallback((data: SessionData) => {
    console.log('[ChatPopup] Sessão recebida via BroadcastChannel:', data.user?.username)

    if (data.user) {
      setUser(data.user)
      setLinkedAccounts(data.linkedAccounts as Array<{
        platform: Platform
        platform_user_id: string
        platform_username: string
        is_moderator?: boolean
      }>)
      setIsModerator(data.isModerator)
    }
    setSessionLoaded(true)
  }, [])

  // Fallback: buscar dados via API se BroadcastChannel não funcionar
  const fallbackFetch = useCallback(async () => {
    console.log('[ChatPopup] Usando fallback API para carregar sessão')
    try {
      const res = await fetch('/api/me', {
        credentials: 'include' // Importante: enviar cookies
      })
      if (res.ok) {
        const data = await res.json()

        if (data.user) {
          setUser({
            id: data.user.id,
            username: data.user.display_name || data.user.username || data.user.email,
            email: data.user.email,
            role: data.user.role
          })

          // Mapear linked_accounts para o formato esperado
          const accounts = (data.linked_accounts || []).map((acc: any) => ({
            platform: acc.platform,
            platform_user_id: acc.platform_user_id,
            platform_username: acc.platform_username,
            is_moderator: acc.is_moderator
          }))
          setLinkedAccounts(accounts)

          // Verificar se tem cargo de moderador
          const role = data.user.role || getUserRole(accounts)
          setIsModerator(['moderator', 'admin', 'owner', 'streamer'].includes(role) || data.user.is_moderator)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
    setSessionLoaded(true)
  }, [])

  // Usar hook de sincronização de sessão
  useSessionReceiver(handleSessionReceived, fallbackFetch)

  // SSE para mensagens do chat
  useEffect(() => {
    const es = new EventSource('/api/chat/stream')

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)

        // Evento de status do YouTube
        if (payload.type === 'youtube_status') {
          setYoutubeStatus({
            isLive: payload.isLive,
            videoId: payload.videoId,
            liveChatId: payload.liveChatId
          })
          return
        }

        // Evento de atualização de moderador
        if (payload.type === 'moderator_update') {
          const currentLinkedAccounts = linkedAccountsRef.current
          if (currentLinkedAccounts.length > 0) {
            const matchingAccount = currentLinkedAccounts.find(
              acc => acc.platform === payload.platform &&
                acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
            )

            if (matchingAccount) {
              setIsModerator(true)
              setLinkedAccounts(prev =>
                prev.map(acc =>
                  acc.platform === payload.platform &&
                    acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
                    ? { ...acc, is_moderator: true }
                    : acc
                )
              )
            }
          }
          return
        }

        // Mensagem de chat normal
        if (payload && payload.message && payload.platform) {
          const messageId = String(payload.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
          const newMessage = {
            id: messageId,
            platform: payload.platform,
            username: payload.username || 'user',
            userId: payload.userId || 'unknown',
            message: payload.message,
            timestamp: payload.timestamp || Date.now(),
            badges: payload.badges || []
          }

          setMessages((curr) => {
            if (curr.some(m => m.id === messageId)) {
              return curr
            }
            return [...curr.slice(-200), newMessage]
          })

          // Verificar se esta mensagem é do usuário atual e tem badge de moderador
          const currentLinkedAccounts = linkedAccountsRef.current
          if (currentLinkedAccounts.length > 0) {
            const matchingAccount = currentLinkedAccounts.find(
              acc => acc.platform === payload.platform &&
                acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
            )

            if (matchingAccount && payload.badges?.some((b: string) =>
              ['moderator', 'mod', 'broadcaster', 'vip', 'staff', 'admin', 'owner'].includes(b.toLowerCase())
            )) {
              setIsModerator(true)
              setLinkedAccounts(prev =>
                prev.map(acc =>
                  acc.platform === payload.platform &&
                    acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
                    ? { ...acc, is_moderator: true }
                    : acc
                )
              )
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    return () => {
      es.close()
    }
  }, [])

  const handleSendMessage = () => {
    console.log('Enviando mensagem via popup')
  }

  const handleModerate = async (userId: string, username: string, platform: string, action: string, duration?: number, reason?: string) => {
    console.log('Moderando usuário:', userId, 'username:', username, 'plataforma:', platform, 'ação:', action)

    if (!user?.id) {
      console.error('Usuário não autenticado')
      return
    }

    try {
      let endpoint = ''
      let body: Record<string, unknown> = {}

      if (action === 'timeout') {
        endpoint = '/api/moderation/timeout'
        body = {
          targetPlatformUserId: userId,
          targetUsername: username,
          targetPlatform: platform,
          durationSeconds: duration || 600,
          reason: reason || 'Timeout via chat popup',
          moderatorId: user.id
        }
      } else if (action === 'ban') {
        endpoint = '/api/moderation/ban'
        body = {
          targetPlatformUserId: userId,
          targetUsername: username,
          targetPlatform: platform,
          reason: reason || 'Ban via chat popup',
          moderatorId: user.id
        }
      } else if (action === 'unban') {
        endpoint = '/api/moderation/unban'
        body = {
          targetPlatformUserId: userId,
          targetPlatform: platform,
          moderatorId: user.id
        }
      } else {
        console.error('Ação de moderação desconhecida:', action)
        return
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include' // Importante: enviar cookies de sessão
      })

      const data = await res.json()

      if (res.ok) {
        console.log('Moderação aplicada com sucesso:', data)

        const moderatorName = linkedAccounts.find(acc => acc.platform === platform)?.platform_username || user.username || 'Moderador'
        const formatDuration = (seconds: number): string => {
          if (seconds < 60) return `${seconds}s`
          if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
          if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
          return `${Math.floor(seconds / 86400)}d`
        }
        const durationText = duration ? formatDuration(duration) : ''

        let systemTag = ''
        if (action === 'ban') {
          systemTag = ` [🛡️ Banido por ${moderatorName}]`
        } else if (action === 'unban') {
          systemTag = ` [🛡️ Punição revertida por ${moderatorName}]`
        } else {
          systemTag = ` [🛡️ Timeout ${durationText} por ${moderatorName}]`
        }

        setMessages(curr => {
          const lastMsgIndex = curr.map((msg, idx) => ({ msg, idx }))
            .filter(({ msg }) => msg.userId === userId && msg.platform === platform)
            .pop()?.idx

          return curr.map((msg, idx) => {
            if (msg.userId === userId && msg.platform === platform) {
              if (idx === lastMsgIndex) {
                return {
                  ...msg,
                  message: msg.message + systemTag
                }
              } else if (action !== 'unban') {
                return {
                  ...msg,
                  message: '<Mensagem Deletada>'
                }
              }
            }
            return msg
          })
        })
      } else {
        console.error('Erro ao aplicar moderação:', data.error)
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao moderar:', error)
      alert('Erro ao aplicar moderação')
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Chat ocupa todo o espaço - sem header */}
      <UnifiedChat
        messages={messages}
        onSendMessage={handleSendMessage}
        isModerator={isModerator}
        onModerate={handleModerate}
        isLogged={!!user}
        youtubeStatusFromSSE={youtubeStatus}
        currentUser={user ? {
          id: user.id,
          is_moderator: isModerator,
          role: (user.role as 'user' | 'moderator' | 'admin' | 'owner' | 'streamer') || 'user',
          linkedAccounts
        } : undefined}
        isPopup={true}
        defaultCompact={true}
      />
    </div>
  )
}

