'use client'

import { useState, useEffect, useRef } from 'react'
import { UnifiedChat } from '@/components/UnifiedChat'
import { Platform, UnifiedMessage } from '@/types'
import { getUserRole } from '@/lib/permissions'

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
  const linkedAccountsRef = useRef(linkedAccounts)
  
  useEffect(() => {
    linkedAccountsRef.current = linkedAccounts
  }, [linkedAccounts])

  // Carregar dados do usuário
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setLinkedAccounts(data.linkedAccounts || [])
          
          // Verificar se tem cargo de moderador
          const role = getUserRole(data.linkedAccounts || [])
          setIsModerator(['moderator', 'admin', 'owner', 'streamer'].includes(role))
          
          // Atualizar role do usuário
          if (data.user) {
            setUser(prev => prev ? { ...prev, role } : null)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
    
    initializeUser()
  }, [])

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

  const handleModerate = async (userId: string, platform: string, action: string, duration?: number, reason?: string) => {
    console.log('Moderando usuário:', userId, 'plataforma:', platform, 'ação:', action)
    
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
          targetPlatform: platform,
          durationSeconds: duration || 600,
          reason: reason || 'Timeout via chat popup',
          moderatorId: user.id
        }
      } else if (action === 'ban') {
        endpoint = '/api/moderation/ban'
        body = {
          targetPlatformUserId: userId,
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
        body: JSON.stringify(body)
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
      {/* Header minimalista */}
      <div className="bg-muted/50 border-b border-border px-3 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium">WaveIGL Chat</span>
        </div>
        {user && (
          <span className="text-[10px] text-muted-foreground">
            {user.username}
          </span>
        )}
      </div>
      
      {/* Chat ocupa todo o espaço restante */}
      <div className="flex-1 min-h-0">
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
    </div>
  )
}

