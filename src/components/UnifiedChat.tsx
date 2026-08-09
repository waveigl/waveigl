'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UnifiedChatProps, Platform, ChatMessage, UserRole, UnifiedMessage } from '@/types'
import { Send, Shield, Clock, Ban, Lock, Crown, Sword, Star, Timer, Loader2, Check, AlertCircle, RotateCcw, Gem, Settings, X, ChevronUp, ChevronDown, ExternalLink, Minimize2, Maximize2, MoreHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Limites padrão de mensagens por role
const DEFAULT_MESSAGE_LIMITS: Record<UserRole, number> = {
  user: 100,
  moderator: 250,
  admin: 250,
  owner: 250,
  streamer: 250
}

// Limites mínimos e máximos permitidos
const MIN_MESSAGE_LIMIT = 50
const MAX_MESSAGE_LIMIT = 500

// Tipos de badges conhecidos
const MODERATOR_BADGES = ['moderator', 'mod', 'broadcaster', 'vip', 'staff', 'admin', 'owner']

// Badges de subscriber
const SUBSCRIBER_BADGES = ['subscriber', 'sub', 'founder', 'member', 'tier1', 'tier2', 'tier3']

// Tipo para mensagem local com status de envio
type MessageStatus = 'sending' | 'sent' | 'error'

interface LocalMessage extends ChatMessage {
  status: MessageStatus
  isLocal: true
  tempId: string // ID temporário para rastrear
}

// Gera ID temporário único
function generateTempId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Configuração de badges
const BADGE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  broadcaster: { icon: <Crown className="w-3 h-3" />, color: 'bg-red-500', label: 'Broadcaster' },
  owner: { icon: <Crown className="w-3 h-3" />, color: 'bg-red-500', label: 'Dono' },
  moderator: { icon: <Sword className="w-3 h-3" />, color: 'bg-green-500', label: 'Mod' },
  mod: { icon: <Sword className="w-3 h-3" />, color: 'bg-green-500', label: 'Mod' },
  vip: { icon: <Star className="w-3 h-3" />, color: 'bg-pink-500', label: 'VIP' },
  staff: { icon: <Shield className="w-3 h-3" />, color: 'bg-blue-500', label: 'Staff' },
  admin: { icon: <Shield className="w-3 h-3" />, color: 'bg-purple-500', label: 'Admin' },
  // Badges de subscriber
  subscriber: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-400', label: 'SUB' },
  sub: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-400', label: 'SUB' },
  founder: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-600', label: 'Founder' },
  member: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-400', label: 'Membro' },
  tier1: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-400', label: 'Tier 1' },
  tier2: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-500', label: 'Tier 2' },
  tier3: { icon: <Gem className="w-3 h-3" />, color: 'bg-purple-600', label: 'Tier 3' },
}

interface ExtendedUnifiedChatProps extends UnifiedChatProps {
  isLogged?: boolean
  youtubeStatusFromSSE?: {
    isLive: boolean
    videoId: string | null
    liveChatId: string | null
  }
  currentUser?: {
    id: string
    is_moderator?: boolean
    role?: UserRole
    linkedAccounts?: Array<{
      platform: Platform
      platform_user_id: string
      platform_username: string
      is_moderator?: boolean
    }>
  }
  // Props para modo popup/compacto
  isPopup?: boolean
  onOpenPopup?: () => void
  defaultCompact?: boolean
  // Modo leitura pública: mostra as mensagens mesmo sem login
  publicReadOnly?: boolean
}

export function UnifiedChat({ messages, onSendMessage, isModerator, onModerate, isLogged = false, youtubeStatusFromSSE, currentUser, isPopup = false, onOpenPopup, defaultCompact = false, publicReadOnly = false }: ExtendedUnifiedChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sendPlatform, setSendPlatform] = useState<Platform | 'all'>('all')
  const [showModerationMenu, setShowModerationMenu] = useState<string | null>(null)
  const [customTimeoutInput, setCustomTimeoutInput] = useState('')
  const [customTimeoutUnit, setCustomTimeoutUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'permanent'>('days')
  const [showCustomTimeout, setShowCustomTimeout] = useState(false)
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(() => {
    // Carregar do localStorage ou usar default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_compact_mode')
      if (saved !== null) return saved === 'true'
    }
    return defaultCompact
  })
  const [youtubeIsLive, setYoutubeIsLive] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [messageLimit, setMessageLimit] = useState<number>(() => {
    // Carregar do localStorage se disponível
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_message_limit')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= MIN_MESSAGE_LIMIT && parsed <= MAX_MESSAGE_LIMIT) {
          return parsed
        }
      }
    }
    // Retornar limite padrão baseado no role
    const role = currentUser?.role || 'user'
    return DEFAULT_MESSAGE_LIMITS[role]
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handler de scroll para detectar se o usuário está no final
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      // Margem de 10px para considerar "no final" (mais restrito)
      const atBottom = scrollHeight - scrollTop - clientHeight < 10
      isAtBottom.current = atBottom

      // Mostrar botão de scroll se não estiver no final e houver mensagens
      setShowScrollBottom(!atBottom && allMessages.length > 5)
    }
  }, [])

  // Atualizar limite quando o role mudar
  useEffect(() => {
    const role = currentUser?.role || 'user'
    const defaultLimit = DEFAULT_MESSAGE_LIMITS[role]

    // Se o limite atual é maior que o permitido para o role, ajustar
    if (messageLimit > defaultLimit) {
      setMessageLimit(defaultLimit)
      localStorage.setItem('chat_message_limit', String(defaultLimit))
    }
  }, [currentUser?.role, messageLimit])

  // Status do YouTube vindo do SSE (fonte primária - não faz polling!)
  useEffect(() => {
    if (youtubeStatusFromSSE) {
      setYoutubeIsLive(youtubeStatusFromSSE.isLive)

      // Se YouTube ficou offline e estava selecionado, mudar para Kick
      // Mas se estava em 'all', deixa em 'all'
      if (!youtubeStatusFromSSE.isLive && sendPlatform === 'youtube') {
        setSendPlatform('kick')
      }
    }
  }, [youtubeStatusFromSSE, sendPlatform])

  // Track platform changes
  useEffect(() => {
    if (sendPlatform) {
      trackEvent(AnalyticsEvents.PLAYER_SELECT, {
        platform: sendPlatform,
        is_logged: isLogged
      });
    }
  }, [sendPlatform, isLogged]);

  // Fallback: verificar via API apenas se não recebeu status via SSE após 5 segundos
  const hasReceivedSSEStatus = useRef(false)
  useEffect(() => {
    if (youtubeStatusFromSSE) {
      hasReceivedSSEStatus.current = true
    }
  }, [youtubeStatusFromSSE])

  // Verificação manual apenas quando o usuário clicar (lazy check)
  // Usa flag global para evitar múltiplas verificações simultâneas
  const isCheckingYoutube = useRef(false)

  const checkYouTubeStatus = useCallback(async () => {
    // Evitar verificações simultâneas
    if (isCheckingYoutube.current) {
      console.log('[YouTube] Verificação já em andamento, ignorando...')
      return
    }

    isCheckingYoutube.current = true

    try {
      console.log('[YouTube] Verificação manual (lazy check) iniciada')
      const res = await fetch('/api/youtube/status?lazy=true')
      const data = await res.json()
      const isLive = data.isLive === true
      setYoutubeIsLive(isLive)

      // Se YouTube ficou online e estávamos em modo de plataforma única (não 'all'), selecionar youtube
      if (isLive && sendPlatform !== 'all') {
        setSendPlatform('youtube')
      }
    } catch {
      setYoutubeIsLive(false)
    } finally {
      isCheckingYoutube.current = false
    }
  }, [])

  // Obtém o ID do usuário na plataforma selecionada (para envio)
  const getCurrentPlatformUserId = useCallback(() => {
    if (!currentUser?.linkedAccounts) return null
    const account = currentUser.linkedAccounts.find(a => a.platform === sendPlatform)
    return account?.platform_user_id || null
  }, [currentUser, sendPlatform])

  // Obtém o username do usuário na plataforma selecionada (para envio)
  const getCurrentPlatformUsername = useCallback(() => {
    if (!currentUser?.linkedAccounts) return 'Você'
    const account = currentUser.linkedAccounts.find(a => a.platform === sendPlatform)
    return account?.platform_username || 'Você'
  }, [currentUser, sendPlatform])

  // Obtém todos os IDs do usuário em todas as plataformas vinculadas
  const getAllUserPlatformIds = useCallback(() => {
    if (!currentUser?.linkedAccounts) return new Map<Platform, string>()
    const map = new Map<Platform, string>()
    currentUser.linkedAccounts.forEach(acc => {
      map.set(acc.platform, acc.platform_user_id)
    })
    return map
  }, [currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Efeito para atualizar status de mensagens locais quando recebemos do servidor
  // Usando ref para evitar loop infinito
  const localMessagesRef = useRef(localMessages)
  localMessagesRef.current = localMessages

  useEffect(() => {
    const userPlatformIds = getAllUserPlatformIds()
    if (userPlatformIds.size === 0) return

    // Verificar se alguma mensagem do servidor corresponde a uma mensagem local com status 'sending'
    const currentLocalMessages = localMessagesRef.current
    const sendingMessages = currentLocalMessages.filter(m => m.status === 'sending')

    if (sendingMessages.length === 0) return

    // Verificar cada mensagem 'sending' contra as mensagens do servidor
    const updatedTempIds: string[] = []

    sendingMessages.forEach(localMsg => {
      const userIdForPlatform = userPlatformIds.get(localMsg.platform)
      if (!userIdForPlatform) return

      const matchingServerMsg = messages.find(
        serverMsg =>
          serverMsg.userId === userIdForPlatform &&
          serverMsg.platform === localMsg.platform &&
          serverMsg.message === localMsg.message &&
          Math.abs(Number(localMsg.timestamp) - serverMsg.timestamp) < 30000
      )

      if (matchingServerMsg) {
        updatedTempIds.push(localMsg.tempId)
      }
    })

    // Atualizar status apenas se houver mudanças
    if (updatedTempIds.length > 0) {
      setLocalMessages(prev =>
        prev.map(localMsg =>
          updatedTempIds.includes(localMsg.tempId)
            ? { ...localMsg, status: 'sent' as MessageStatus }
            : localMsg
        )
      )
    }
  }, [messages, getAllUserPlatformIds])

  // Filtra mensagens do servidor que são do próprio usuário (já temos a versão local)
  const filteredServerMessages = messages.filter(msg => {
    const userPlatformIds = getAllUserPlatformIds()

    // Se não temos contas vinculadas, não filtramos
    if (userPlatformIds.size === 0) return true

    // Verifica se é mensagem do próprio usuário nesta plataforma
    const userIdForPlatform = userPlatformIds.get(msg.platform as Platform)
    if (!userIdForPlatform || msg.userId !== userIdForPlatform) return true

    // Verifica se existe uma mensagem local correspondente
    const hasLocalVersion = localMessages.some(
      localMsg =>
        localMsg.platform === msg.platform &&
        localMsg.message === msg.message &&
        // Mensagem recebida dentro de 30 segundos da mensagem local
        Math.abs(Number(localMsg.timestamp) - msg.timestamp) < 30000
    )

    // Se temos versão local, filtrar a do servidor
    return !hasLocalVersion
  })

  // Combina mensagens do servidor com mensagens locais e ordena por timestamp
  const combinedMessages = [...filteredServerMessages, ...localMessages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  )

  // Aplicar limite de mensagens - mantém apenas as mais recentes
  // IMPORTANTE: Isso remove as mensagens mais antigas da memória, não apenas da visualização
  // Agrupa mensagens idênticas de um mesmo usuário em plataformas diferentes (deduplicação visual)
  const displayMessages = (() => {
    const merged: (UnifiedMessage & { platforms?: Platform[] })[] = []

    combinedMessages.slice(-messageLimit).forEach(msg => {
      const msgUserId = (msg as any).userId || (msg as any).user_id
      const msgTimestamp = Number(msg.timestamp)

      // Tenta encontrar uma mensagem idêntica recente (mesmo texto, mesmo username OU mesmo userId de plataforma vinculada)
      const existing = merged.find(m => {
        const sameContent = m.message === msg.message
        const sameAuthor = m.username === msg.username ||
          ((m as any).userId === msgUserId && msgUserId !== 'unknown')
        const sameTime = Math.abs(m.timestamp - msgTimestamp) < 3000 // Aumentado para 3 segundos

        return sameContent && sameAuthor && sameTime
      })

      if (existing) {
        // Se encontrou, apenas adiciona a plataforma à lista se não existir
        if (!existing.platforms) {
          existing.platforms = [existing.platform]
        }
        if (!existing.platforms.includes(msg.platform)) {
          existing.platforms.push(msg.platform)
        }
      } else {
        // Se não encontrou, adicione como nova mensagem
        merged.push({
          ...msg,
          userId: msgUserId,
          timestamp: msgTimestamp,
          platforms: [msg.platform]
        } as any)
      }
    })

    return merged
  })()

  const allMessages = displayMessages

  // Ref para rastrear o último número de mensagens do servidor (para scroll apenas em novas mensagens)
  const lastServerMessageCountRef = useRef(messages.length)

  useEffect(() => {
    // Só rolar para baixo quando chegam novas mensagens se o usuário já estiver no final
    // ou se a última mensagem for local (enviada pelo próprio usuário)
    const lastMessage = messages[messages.length - 1]
    const userPlatformIds = getAllUserPlatformIds()
    const isFromCurrentUser = lastMessage && userPlatformIds.get(lastMessage.platform as Platform) === lastMessage.userId

    if (messages.length > lastServerMessageCountRef.current) {
      if (isAtBottom.current || isFromCurrentUser) {
        scrollToBottom()
      }
    }
    lastServerMessageCountRef.current = messages.length
  }, [messages.length, getAllUserPlatformIds])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLogged || isSending) return

    const messageText = newMessage.trim()
    if (!messageText) return

    const isCommand = messageText.startsWith('/')

    // Criar mensagem local otimista apenas se NÃO for comando
    let tempId: string | null = null
    if (!isCommand) {
      tempId = generateTempId()
      const userIsModerator = currentUser?.is_moderator ||
        currentUser?.linkedAccounts?.some(acc => acc.is_moderator) ||
        isModerator

      const localMsg: LocalMessage = {
        id: tempId,
        tempId,
        platform: sendPlatform as Platform,
        username: getCurrentPlatformUsername(),
        user_id: getCurrentPlatformUserId() || 'unknown',
        message: messageText,
        timestamp: String(Date.now()),
        created_at: new Date().toISOString(),
        badges: userIsModerator ? ['moderator'] : [],
        status: 'sending',
        isLocal: true
      }

      setLocalMessages(prev => [...prev, localMsg])
    }

    setNewMessage('')
    setIsSending(true)

    trackEvent(AnalyticsEvents.CHAT_INTERACTION, {
      platform: sendPlatform,
      message_length: messageText.length,
      is_command: isCommand
    });

    try {
      // Enviar para a API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: sendPlatform, message: messageText }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        // Se foi um comando com sucesso, talvez mostrar feedback
        if (isCommand && data.command && data.message) {
          // Adicionar mensagem de sistema temporária
          const sysId = generateTempId()
          const sysMsg: LocalMessage = {
            id: sysId,
            tempId: sysId,
            platform: sendPlatform === 'all' ? 'twitch' : sendPlatform as Platform,
            username: 'Sistema',
            user_id: 'system',
            message: `[🛡️ ${data.message}]`,
            timestamp: String(Date.now()),
            created_at: new Date().toISOString(),
            badges: ['moderator'],
            status: 'sent',
            isLocal: true
          }
          setLocalMessages(prev => [...prev, sysMsg])

          // Remover mensagem de sistema após 5 segundos
          setTimeout(() => {
            setLocalMessages(prev => prev.filter(m => m.id !== sysId))
          }, 5000)
        }

        // Sucesso - atualizar status para 'sent' se houver tempId
        if (tempId) {
          setLocalMessages(prev =>
            prev.map(msg =>
              msg.tempId === tempId
                ? { ...msg, status: 'sent' as MessageStatus }
                : msg
            )
          )
        }
        // Sucesso - atualizar status para 'sent'
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'sent' as MessageStatus }
              : msg
          )
        )

        // Remover indicador de 'sent' após 3 segundos
        setTimeout(() => {
          setLocalMessages(prev =>
            prev.map(msg =>
              msg.tempId === tempId
                ? { ...msg, status: 'sent' as MessageStatus }
                : msg
            )
          )
        }, 3000)
      } else {
        // Erro - atualizar status para 'error'
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'error' as MessageStatus }
              : msg
          )
        )
      }
    } catch {
      // Erro de rede - atualizar status para 'error'
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'error' as MessageStatus }
            : msg
        )
      )
    } finally {
      setIsSending(false)
    }

    // Callback opcional (mantido para compatibilidade)
    onSendMessage(messageText)
  }

  // Função para enviar mensagem para todas as plataformas
  const handleSendToAllPlatforms = async (messageText: string) => {
    const isCommand = messageText.startsWith('/')
    const platformsToSend: Platform[] = ['twitch', 'kick']
    if (youtubeIsLive) {
      platformsToSend.push('youtube')
    }

    setNewMessage('')
    setIsSending(true)

    // Criar mensagens locais apenas se NÃO for comando
    const tempIds: Record<string, string> = {}
    if (!isCommand) {
      const userIsModerator = currentUser?.is_moderator ||
        currentUser?.linkedAccounts?.some(acc => acc.is_moderator) ||
        isModerator

      platformsToSend.forEach(platform => {
        const tempId = generateTempId()
        tempIds[platform] = tempId

        const localMsg: LocalMessage = {
          id: tempId,
          tempId,
          platform,
          username: getCurrentPlatformUsername(),
          user_id: getCurrentPlatformUserId() || 'unknown',
          message: messageText,
          timestamp: String(Date.now()),
          created_at: new Date().toISOString(),
          badges: userIsModerator ? ['moderator'] : [],
          status: 'sending',
          isLocal: true
        }

        setLocalMessages(prev => [...prev, localMsg])
      })
    }

    // Enviar para cada plataforma em paralelo
    const results = await Promise.allSettled(
      platformsToSend.map(async platform => {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, message: messageText }),
          credentials: 'include'
        })
        return { platform, ok: response.ok }
      })
    )

    // Atualizar status das mensagens baseado nos resultados
    results.forEach((result, index) => {
      const platform = platformsToSend[index]
      const tempId = tempIds[platform]

      if (result.status === 'fulfilled' && result.value.ok) {
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'sent' as MessageStatus }
              : msg
          )
        )
      } else {
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'error' as MessageStatus }
              : msg
          )
        )
      }
    })

    setIsSending(false)
    onSendMessage(messageText)
  }

  // Função para reenviar mensagem com erro
  const handleRetry = async (tempId: string) => {
    const msgToRetry = localMessages.find(m => m.tempId === tempId)
    if (!msgToRetry) return

    // Atualizar status para 'sending'
    setLocalMessages(prev =>
      prev.map(msg =>
        msg.tempId === tempId
          ? { ...msg, status: 'sending' as MessageStatus }
          : msg
      )
    )

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: msgToRetry.platform, message: msgToRetry.message }),
        credentials: 'include'
      })

      if (response.ok) {
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'sent' as MessageStatus }
              : msg
          )
        )
      } else {
        setLocalMessages(prev =>
          prev.map(msg =>
            msg.tempId === tempId
              ? { ...msg, status: 'error' as MessageStatus }
              : msg
          )
        )
      }
    } catch {
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'error' as MessageStatus }
            : msg
        )
      )
    }
  }

  // Remover mensagem local com erro
  const handleDismissError = (tempId: string) => {
    setLocalMessages(prev => prev.filter(msg => msg.tempId !== tempId))
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return 'bg-purple-500'
      case 'youtube':
        return 'bg-red-500'
      case 'kick':
        return 'bg-green-500'
      default:
        return 'bg-muted'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return '📺'
      case 'youtube':
        return '📺'
      case 'kick':
        return '👑'
      default:
        return '💬'
    }
  }

  const formatTime = (timestamp: string | number) => {
    return new Date(Number(timestamp)).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper para obter userId de mensagens unificadas ou locais
  const getMessageUserId = (message: UnifiedMessage | LocalMessage): string => {
    if ('userId' in message) return message.userId
    if ('user_id' in message) return message.user_id
    return 'unknown'
  }

  const handleModeration = (userId: string, username: string, platform: Platform, action: string, duration?: number) => {
    onModerate(userId, username, platform, action as any, duration, 'Moderação via chat unificado')
    setShowModerationMenu(null)
    setShowCustomTimeout(false)
    setCustomTimeoutInput('')
  }

  const handleCustomTimeout = (userId: string, username: string, platform: Platform) => {
    // Se for permanente, chamar ban
    if (customTimeoutUnit === 'permanent') {
      handleModeration(userId, username, platform, 'ban')
      return
    }

    const value = parseInt(customTimeoutInput)
    if (value <= 0) return

    let seconds: number
    switch (customTimeoutUnit) {
      case 'seconds':
        seconds = value
        break
      case 'minutes':
        seconds = value * 60
        break
      case 'hours':
        seconds = value * 60 * 60
        break
      case 'days':
        seconds = value * 24 * 60 * 60
        break
      case 'months':
        seconds = value * 30 * 24 * 60 * 60 // 30 dias por mês
        break
      default:
        seconds = value * 24 * 60 * 60 // default: dias
    }

    handleModeration(userId, username, platform, 'timeout', seconds)
  }

  // Verifica se o usuário tem badge de moderador
  const hasModeratorBadge = (badges: string[] | undefined) => {
    if (!badges) return false
    return badges.some(badge => MODERATOR_BADGES.includes(badge.toLowerCase()))
  }

  // Toggle modo compacto
  const toggleCompactMode = () => {
    setIsCompactMode(prev => {
      const newValue = !prev
      localStorage.setItem('chat_compact_mode', String(newValue))
      return newValue
    })
  }

  // Abrir chat em popup
  const openChatPopup = () => {
    if (onOpenPopup) {
      onOpenPopup()
      return
    }
    // Abrir nova janela com chat
    const width = 400
    const height = 700
    const left = window.screenX + window.outerWidth - width - 50
    const top = window.screenY + 50
    window.open(
      '/chat-popup',
      'waveigl-chat',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
    )
  }

  // Renderiza mensagem com tag de sistema destacada
  const renderMessageWithSystemTag = (messageText: string) => {
    // Padrão para detectar tags de sistema: [🛡️ ...]
    const systemTagRegex = /(\[🛡️[^\]]+\])$/
    const match = messageText.match(systemTagRegex)

    if (match) {
      const mainText = messageText.replace(systemTagRegex, '').trim()
      const systemTag = match[1]

      return (
        <>
          {mainText}
          <span className="ml-2 text-yellow-500 font-medium text-xs">
            {systemTag}
          </span>
        </>
      )
    }

    return messageText
  }

  // Renderiza badges do usuário
  const renderBadges = (badges: string[] | undefined) => {
    if (!badges || badges.length === 0) return null

    return badges.map((badge, index) => {
      const badgeLower = badge.toLowerCase()
      const config = BADGE_CONFIG[badgeLower]

      if (config) {
        return (
          <span
            key={index}
            className={`inline-flex items-center justify-center w-5 h-5 rounded ${config.color} text-white`}
            title={config.label}
          >
            {config.icon}
          </span>
        )
      }

      // Badge genérico
      return (
        <Badge key={index} className="text-[10px] px-1 py-0 bg-muted text-muted-foreground">
          {badge}
        </Badge>
      )
    })
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isPopup ? 'bg-background' : ''}`}>
      {/* Barra de controle do chat (NÃO aparece no modo popup) */}
      {!isPopup && (
        <>
          {/* Modo compacto: apenas botão minimalista para expandir */}
          {isCompactMode ? (
            <div className="border-b border-border p-0.5 flex items-center justify-center shrink-0 bg-muted/20">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCompactMode}
                title="Expandir opções do chat"
                className="h-4 w-full p-0 hover:bg-muted/50"
              >
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            /* Modo expandido: barra completa */
            <div className="border-b border-border p-1.5 flex items-center gap-1 shrink-0 bg-muted/30">
              {/* Botão para recolher */}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCompactMode}
                title="Recolher opções"
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>

              <div className="ml-auto flex items-center gap-1">
                {/* Botão popup */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openChatPopup}
                  title="Abrir chat em popup"
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>

                {/* Botão de configurações */}
                {isLogged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowChatSettings(true)}
                    title="Configurações do chat"
                    className="h-6 w-6 p-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Platform Send Selector (só aparece se logado e NÃO está em modo compacto) */}
          {isLogged && !isCompactMode && (
            <div className="border-b border-border p-2 flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">Enviar como:</span>
              <Button
                size="sm"
                variant={sendPlatform === 'all' ? 'default' : 'outline'}
                onClick={() => setSendPlatform('all')}
                className={`h-6 text-xs ${sendPlatform === 'all' ? 'bg-gradient-to-r from-purple-600 via-red-500 to-green-500 hover:opacity-90 text-white' : ''}`}
                title="Enviar para Twitch, YouTube e Kick simultaneamente"
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={sendPlatform === 'kick' ? 'default' : 'outline'}
                onClick={() => setSendPlatform('kick')}
                className={`h-6 text-xs ${sendPlatform === 'kick' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
              >
                Kick
              </Button>
              <Button
                size="sm"
                variant={sendPlatform === 'twitch' ? 'default' : 'outline'}
                onClick={() => setSendPlatform('twitch')}
                className={`h-6 text-xs ${sendPlatform === 'twitch' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              >
                Twitch
              </Button>
              <Button
                size="sm"
                variant={sendPlatform === 'youtube' ? 'default' : 'outline'}
                onClick={async () => {
                  if (youtubeIsLive) {
                    setSendPlatform('youtube')
                  } else {
                    await checkYouTubeStatus()
                  }
                }}
                disabled={!youtubeIsLive}
                className={`h-6 text-xs ${sendPlatform === 'youtube' ? 'bg-red-600 hover:bg-red-700 text-white' : ''} ${!youtubeIsLive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={youtubeIsLive ? 'Enviar pelo YouTube' : 'YouTube offline - Clique para verificar'}
              >
                YouTube
                {!youtubeIsLive && <span className="ml-1 text-[10px]">(off)</span>}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de configurações do chat */}
      {showChatSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-4 w-80 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Configurações do Chat</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowChatSettings(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Seletor de plataforma (sempre visível no modal) */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Enviar mensagens como:
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={sendPlatform === 'all' ? 'default' : 'outline'}
                    onClick={() => setSendPlatform('all')}
                    className={`h-7 text-xs ${sendPlatform === 'all' ? 'bg-gradient-to-r from-purple-600 via-red-500 to-green-500 hover:opacity-90 text-white' : ''}`}
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={sendPlatform === 'kick' ? 'default' : 'outline'}
                    onClick={() => setSendPlatform('kick')}
                    className={`h-7 text-xs ${sendPlatform === 'kick' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                  >
                    Kick
                  </Button>
                  <Button
                    size="sm"
                    variant={sendPlatform === 'twitch' ? 'default' : 'outline'}
                    onClick={() => setSendPlatform('twitch')}
                    className={`h-7 text-xs ${sendPlatform === 'twitch' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                  >
                    Twitch
                  </Button>
                  <Button
                    size="sm"
                    variant={sendPlatform === 'youtube' ? 'default' : 'outline'}
                    onClick={async () => {
                      if (youtubeIsLive) {
                        setSendPlatform('youtube')
                      } else {
                        await checkYouTubeStatus()
                      }
                    }}
                    disabled={!youtubeIsLive}
                    className={`h-7 text-xs ${sendPlatform === 'youtube' ? 'bg-red-600 hover:bg-red-700 text-white' : ''} ${!youtubeIsLive ? 'opacity-50' : ''}`}
                  >
                    YouTube {!youtubeIsLive && '(off)'}
                  </Button>
                </div>
              </div>

              {/* Limite de mensagens */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Limite de mensagens no histórico
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={MIN_MESSAGE_LIMIT}
                    max={DEFAULT_MESSAGE_LIMITS[currentUser?.role || 'user']}
                    value={messageLimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10)
                      const maxForRole = DEFAULT_MESSAGE_LIMITS[currentUser?.role || 'user']
                      if (!isNaN(value)) {
                        const clampedValue = Math.min(Math.max(value, MIN_MESSAGE_LIMIT), maxForRole)
                        setMessageLimit(clampedValue)
                        localStorage.setItem('chat_message_limit', String(clampedValue))
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">
                    (máx: {DEFAULT_MESSAGE_LIMITS[currentUser?.role || 'user']})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mensagens mais antigas serão removidas permanentemente.
                </p>
              </div>

              {/* Info sobre o role */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                <p>
                  <strong>Seu cargo:</strong> {currentUser?.role || 'user'}
                </p>
                <p className="mt-1">
                  Usuários normais: máx 100 mensagens<br />
                  Moderadores/Admins/Streamer: máx 250 mensagens
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Só mostra para usuários logados (economiza quota) */}
      {!isLogged && !publicReadOnly ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Chat disponível apenas para usuários logados</p>
            <p className="text-xs mt-1 opacity-70">Faça login para ver e participar do chat</p>
          </div>
        </div>
      ) : (
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth"
        >
          {allMessages.map((message) => {
            const isLocalMessage = (message && typeof message === 'object' && 'isLocal' in message) ? (message as any).isLocal : false
            const localStatus = isLocalMessage ? (message as any).status : null
            const tempId = isLocalMessage ? (message as any).tempId : null

            return (
              <div
                key={message.id}
                className={`relative group ${localStatus === 'error' ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start space-x-2">
                  <div className="shrink-0">
                    <div className="flex -space-x-4">
                      {((message as any).platforms || [message.platform]).map((p: Platform, idx: number) => (
                        <div
                          key={`${p}-${idx}`}
                          className={`w-8 h-8 rounded-full ${getPlatformColor(p)} flex items-center justify-center text-white text-xs ring-2 ring-background`}
                          style={{ zIndex: 10 - idx }}
                        >
                          {getPlatformIcon(p)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Badges de moderador/vip */}
                      {renderBadges(message.badges)}

                      {/* Nome do usuário */}
                      <span className={`font-semibold text-sm ${message.badges?.includes('system') ? 'text-yellow-500' :
                        hasModeratorBadge(message.badges) ? 'text-green-400' : 'text-foreground'
                        }`}>
                        {message.username}
                      </span>

                      {/* Badge da plataforma (ou múltiplas se merged) */}
                      <div className="flex items-center gap-1">
                        {(message as any).platforms && (message as any).platforms.length > 1 ? (
                          ((message as any).platforms as Platform[]).map((p: Platform) => (
                            <Badge key={p} variant="outline" className={`text-[10px] px-1 py-0 ${getPlatformColor(p)} border-none text-white`}>
                              {p}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {message.platform}
                          </Badge>
                        )}
                      </div>

                      {/* Horário */}
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>

                      {/* Indicadores de status para mensagens locais */}
                      {isLocalMessage && localStatus === 'sending' && (
                        <span className="flex items-center text-[10px] text-muted-foreground" title="Enviando...">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </span>
                      )}
                      {isLocalMessage && localStatus === 'sent' && (
                        <span className="flex items-center text-[10px] text-green-500" title="Enviado">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      {isLocalMessage && localStatus === 'error' && (
                        <span className="flex items-center gap-1 text-[10px] text-destructive" title="Erro ao enviar">
                          <AlertCircle className="w-3 h-3" />
                          <span>Falhou</span>
                        </span>
                      )}
                    </div>
                    {/* Mensagem - com tratamento especial para mensagens deletadas e tags de sistema */}
                    {message.message === '<Mensagem Deletada>' ? (
                      <p className="text-sm mt-1 break-words text-muted-foreground/50 italic">
                        &lt;Mensagem Deletada&gt;
                      </p>
                    ) : message.badges?.includes('system') ? (
                      <p className="text-sm mt-1 break-words text-yellow-500 font-medium">
                        {message.message}
                      </p>
                    ) : (
                      <p className={`text-sm mt-1 break-words ${localStatus === 'error' ? 'text-destructive/70' : 'text-muted-foreground'}`}>
                        {renderMessageWithSystemTag(message.message)}
                      </p>
                    )}

                    {/* Botões de ação para mensagens com erro */}
                    {isLocalMessage && localStatus === 'error' && tempId && (
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetry(tempId)}
                          className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Tentar novamente
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissError(tempId)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Descartar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Moderation Buttons - aparecem no hover (apenas para mensagens não-locais, não-sistema, não-deletadas) */}
                  {isModerator && !isLocalMessage && !message.badges?.includes('system') && message.message !== '<Mensagem Deletada>' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {/* Botões de timeout rápido */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleModeration(getMessageUserId(message), message.username, message.platform, 'timeout', 86400)}
                        className="h-7 px-2 text-xs text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                        title="Timeout 1 dia"
                      >
                        <Timer className="w-3 h-3 mr-1" />
                        1d
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleModeration(getMessageUserId(message), message.username, message.platform, 'timeout', 1209600)}
                        className="h-7 px-2 text-xs text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                        title="Timeout 14 dias"
                      >
                        <Timer className="w-3 h-3 mr-1" />
                        14d
                      </Button>

                      {/* Botão de Ban Rápido - Apenas para Streamer/Owner */}
                      {(currentUser?.role === 'streamer' || currentUser?.role === 'owner') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Se a mensagem já indica que foi deletada ou se estivéssemos rastreando o estado de ban,
                            // poderíamos alternar. Para este MVP, vamos de toggle por ação.
                            // Nota: O backend handleModeration chama onModerate.
                            handleModeration(
                              getMessageUserId(message),
                              message.username,
                              message.platform,
                              'ban' // No toggle real precisaríamos do status atual do usuário (banned: boolean)
                            )
                          }}
                          className="h-7 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Banimento Direto"
                        >
                          <Shield className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Botão para menu completo (3 circulos) */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowModerationMenu(showModerationMenu === message.id ? null : message.id)
                          setShowCustomTimeout(false)
                        }}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        title="Mais opções"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Moderation Dropdown - Menu expandido */}
                {showModerationMenu === message.id && isModerator && !isLocalMessage && (
                  <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
                    <div className="p-2 space-y-1">
                      <p className="text-xs text-muted-foreground px-2 py-1 border-b border-border mb-2">
                        Moderar: <span className="text-foreground font-medium">{message.username}</span>
                      </p>

                      {/* Timeout customizado */}
                      {!showCustomTimeout ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowCustomTimeout(true)}
                          className="w-full justify-start text-primary hover:bg-primary/10"
                        >
                          <Clock className="w-3 h-3 mr-2" />
                          Timeout customizado
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2 px-2 py-1">
                          <div className="flex items-center gap-2">
                            {customTimeoutUnit !== 'permanent' && (
                              <Input
                                type="number"
                                min="1"
                                value={customTimeoutInput}
                                onChange={(e) => setCustomTimeoutInput(e.target.value)}
                                placeholder="Valor"
                                className="h-7 text-xs w-16"
                                autoFocus
                              />
                            )}
                            <select
                              value={customTimeoutUnit}
                              onChange={(e) => setCustomTimeoutUnit(e.target.value as any)}
                              className="h-7 text-xs bg-muted border border-border rounded px-2"
                              title="Unidade de tempo"
                              aria-label="Unidade de tempo para timeout"
                            >
                              <option value="seconds">Segundos</option>
                              <option value="minutes">Minutos</option>
                              <option value="hours">Horas</option>
                              <option value="days">Dias</option>
                              <option value="months">Meses</option>
                              <option value="permanent">Permanente</option>
                            </select>
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCustomTimeout(getMessageUserId(message), message.username, message.platform)}
                            disabled={customTimeoutUnit !== 'permanent' && (!customTimeoutInput || parseInt(customTimeoutInput) < 1)}
                            className="h-7 text-xs w-full"
                          >
                            {customTimeoutUnit === 'permanent' ? 'Banir Permanentemente' : 'Aplicar Timeout'}
                          </Button>
                        </div>
                      )}

                      <div className="border-t border-border my-2" />

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleModeration(getMessageUserId(message), message.username, message.platform, 'ban')}
                        className="w-full justify-start bg-red-600 hover:bg-red-700 text-white font-bold border-t border-red-500/50 rounded-none h-11 px-4 shadow-sm"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Banir permanentemente
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleModeration(getMessageUserId(message), message.username, message.platform, 'unban')}
                        className="w-full justify-start text-green-500 hover:bg-green-500/10"
                      >
                        <RotateCcw className="w-3 h-3 mr-2" />
                        Reverter punição
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />

          {/* Botão flutuante para scroll ao fundo */}
          {showScrollBottom && (
            <Button
              size="sm"
              variant="secondary"
              onClick={scrollToBottom}
              className="fixed bottom-20 right-8 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm hover:bg-background animate-bounce z-20 flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Novas mensagens</span>
            </Button>
          )}
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-border p-2 shrink-0">
        {isLogged ? (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Indicador de plataforma (modo popup ou compacto) */}
            {(isPopup || isCompactMode) && (
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${sendPlatform === 'all' ? 'bg-gradient-to-r from-purple-600 via-red-500 to-green-500' :
                  sendPlatform === 'kick' ? 'bg-green-500' :
                    sendPlatform === 'twitch' ? 'bg-purple-600' :
                      sendPlatform === 'youtube' ? 'bg-red-600' : 'bg-muted'
                  }`}
                title={`Enviando para: ${sendPlatform === 'all' ? 'Todos' : sendPlatform}`}
              />
            )}
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            {/* Botão de config (visível no modo popup ou compacto) */}
            {(isPopup || isCompactMode) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowChatSettings(true)}
                title="Configurações"
                className="h-9 w-9 p-0 shrink-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground disabled:opacity-50 h-9 w-9 p-0 shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center space-x-2 py-2 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Faça login para enviar mensagens</span>
          </div>
        )}
      </div>
    </div>
  )
}
