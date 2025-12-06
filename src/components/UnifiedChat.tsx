'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UnifiedChatProps, Platform, ChatMessage, UserRole, UnifiedMessage } from '@/types'
import { Send, Shield, Clock, Ban, Lock, Crown, Sword, Star, Timer, Loader2, Check, AlertCircle, RotateCcw, Gem, Settings, X } from 'lucide-react'
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
}

export function UnifiedChat({ messages, onSendMessage, isModerator, onModerate, isLogged = false, youtubeStatusFromSSE, currentUser }: ExtendedUnifiedChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sendPlatform, setSendPlatform] = useState<Platform>('kick')
  const [showModerationMenu, setShowModerationMenu] = useState<string | null>(null)
  const [customTimeoutInput, setCustomTimeoutInput] = useState('')
  const [customTimeoutUnit, setCustomTimeoutUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'permanent'>('days')
  const [showCustomTimeout, setShowCustomTimeout] = useState(false)
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [youtubeIsLive, setYoutubeIsLive] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)
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
  const inputRef = useRef<HTMLInputElement>(null)
  
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
      if (!youtubeStatusFromSSE.isLive && sendPlatform === 'youtube') {
        setSendPlatform('kick')
      }
    }
  }, [youtubeStatusFromSSE, sendPlatform])
  
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
      
      // Se YouTube ficou online, automaticamente selecionar
      if (isLive) {
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
  const allMessages = combinedMessages.slice(-messageLimit)

  // Ref para rastrear o último número de mensagens do servidor (para scroll apenas em novas mensagens)
  const lastServerMessageCountRef = useRef(messages.length)
  
  useEffect(() => {
    // Só rolar para baixo quando chegam novas mensagens do servidor (não quando status local muda)
    if (messages.length > lastServerMessageCountRef.current) {
      scrollToBottom()
    }
    lastServerMessageCountRef.current = messages.length
  }, [messages.length])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLogged || isSending) return
    
    const messageText = newMessage.trim()
    if (!messageText) return
    
    // Criar mensagem local otimista
    // Se o usuário é moderador (em qualquer plataforma), adicionar badge de moderador
    const userIsModerator = currentUser?.is_moderator || 
      currentUser?.linkedAccounts?.some(acc => acc.is_moderator) || 
      isModerator
    
    const tempId = generateTempId()
    const localMsg: LocalMessage = {
      id: tempId,
      tempId,
      platform: sendPlatform,
      username: getCurrentPlatformUsername(),
      user_id: getCurrentPlatformUserId() || 'unknown',
      message: messageText,
      timestamp: String(Date.now()),
      created_at: new Date().toISOString(),
      badges: userIsModerator ? ['moderator'] : [],
      status: 'sending',
      isLocal: true
    }
    
    // Adicionar mensagem local imediatamente
    setLocalMessages(prev => [...prev, localMsg])
    setNewMessage('')
    setIsSending(true)
    
    try {
      // Enviar para a API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: sendPlatform, message: messageText })
      })
      
      if (response.ok) {
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
        body: JSON.stringify({ platform: msgToRetry.platform, message: msgToRetry.message })
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

  const handleModeration = (userId: string, platform: Platform, action: string, duration?: number) => {
    onModerate(userId, platform, action as any, duration, 'Moderação via chat unificado')
    setShowModerationMenu(null)
    setShowCustomTimeout(false)
    setCustomTimeoutInput('')
  }

  const handleCustomTimeout = (userId: string, platform: Platform) => {
    // Se for permanente, chamar ban
    if (customTimeoutUnit === 'permanent') {
      handleModeration(userId, platform, 'ban')
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
    
    handleModeration(userId, platform, 'timeout', seconds)
  }

  // Verifica se o usuário tem badge de moderador
  const hasModeratorBadge = (badges: string[] | undefined) => {
    if (!badges) return false
    return badges.some(badge => MODERATOR_BADGES.includes(badge.toLowerCase()))
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Platform Send Selector (só aparece se logado) */}
      {isLogged && (
        <div className="border-b border-border p-2 flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Enviar como:</span>
          <Button
            size="sm"
            variant={sendPlatform === 'kick' ? 'default' : 'outline'}
            onClick={() => setSendPlatform('kick')}
            className={sendPlatform === 'kick' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
          >
            Kick
          </Button>
          <Button
            size="sm"
            variant={sendPlatform === 'twitch' ? 'default' : 'outline'}
            onClick={() => setSendPlatform('twitch')}
            className={sendPlatform === 'twitch' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
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
                // Se não está live, verificar novamente (lazy check - apenas quando clicado)
                await checkYouTubeStatus()
              }
            }}
            disabled={!youtubeIsLive}
            className={`${sendPlatform === 'youtube' ? 'bg-red-600 hover:bg-red-700 text-white' : ''} ${!youtubeIsLive ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={youtubeIsLive ? 'Enviar pelo YouTube' : 'YouTube offline - Clique para verificar'}
          >
            YouTube
            {!youtubeIsLive && <span className="ml-1 text-[10px]">(offline)</span>}
          </Button>
          
          {/* Botão de configurações do chat */}
          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChatSettings(true)}
              title="Configurações do chat"
              className="h-7 w-7 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal de configurações do chat */}
      {showChatSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-4 w-80 shadow-xl">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {allMessages.map((message) => {
          // Verifica se é uma mensagem local
          const isLocalMessage = 'isLocal' in message && message.isLocal
          const localStatus = isLocalMessage ? (message as LocalMessage).status : null
          const tempId = isLocalMessage ? (message as LocalMessage).tempId : null
          
          return (
            <div 
              key={message.id} 
              className={`relative group ${localStatus === 'error' ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${getPlatformColor(message.platform)} flex items-center justify-center text-white text-xs`}>
                    {getPlatformIcon(message.platform)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badges de moderador/vip */}
                    {renderBadges(message.badges)}
                    
                    {/* Nome do usuário */}
                    <span className={`font-semibold text-sm ${
                      message.badges?.includes('system') ? 'text-yellow-500' :
                      hasModeratorBadge(message.badges) ? 'text-green-400' : 'text-foreground'
                    }`}>
                      {message.username}
                    </span>
                    
                    {/* Badge da plataforma */}
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {message.platform}
                    </Badge>
                    
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
                  {/* Mensagem - com tratamento especial para mensagens deletadas e de sistema */}
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
                      {message.message}
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
                      onClick={() => handleModeration(getMessageUserId(message), message.platform, 'timeout', 86400)}
                      className="h-7 px-2 text-xs text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                      title="Timeout 1 dia"
                    >
                      <Timer className="w-3 h-3 mr-1" />
                      1d
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleModeration(getMessageUserId(message), message.platform, 'timeout', 1209600)}
                      className="h-7 px-2 text-xs text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                      title="Timeout 14 dias"
                    >
                      <Timer className="w-3 h-3 mr-1" />
                      14d
                    </Button>
                    
                    {/* Botão para menu completo */}
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
                      <Shield className="w-3 h-3" />
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
                          onClick={() => handleCustomTimeout(getMessageUserId(message), message.platform)}
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
                      variant="ghost"
                      onClick={() => handleModeration(getMessageUserId(message), message.platform, 'ban')}
                      className="w-full justify-start text-destructive hover:bg-destructive/10"
                    >
                      <Ban className="w-3 h-3 mr-2" />
                      Banir permanentemente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 shrink-0">
        {isLogged ? (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground disabled:opacity-50"
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
