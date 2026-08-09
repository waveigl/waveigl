'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from '@/components/VideoPlayer'
import { UnifiedChat } from '@/components/UnifiedChat'
import { PlatformSelector } from '@/components/PlatformSelector'
import { LiveInfoPanel } from '@/components/LiveInfoPanel'
import { ModerationStats } from '@/components/ModerationStats'
import { Platform, UnifiedMessage } from '@/types'
import { LogOut, LogIn, Settings, Twitch, Youtube, Link as LinkIcon, Unlink, CheckCircle2, AlertTriangle, Crown, Zap, Shield, User, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minimize2, PanelRightOpen, PanelBottomOpen, LayoutPanelTop, Tag, BarChart3, Tv } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ProfileEditor } from '@/components/ProfileEditor'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ModerationPanel } from '@/components/ModerationPanel'
import BenefitsIndicator, { SubBadge } from '@/components/BenefitsIndicator'
import { AdminPanel } from '@/components/AdminPanel'
import { BenefitsPanel } from '@/components/BenefitsPanel'
import { SubscriberBenefitsPopup } from '@/components/SubscriberBenefitsPopup'
import { DashboardStats } from '@/components/DashboardStats'
import { getUserRole, isOwner, isAdmin } from '@/lib/permissions'
import { useSessionProvider } from '@/hooks/use-session-sync'
import ShortLinksTab from '@/components/ShortLinksTab'
import ShortLinksDashboard from '@/components/ShortLinksDashboard'

// Configuração visual dos cargos
const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  streamer: { label: 'Streamer', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: <Crown className="w-4 h-4" /> },
  admin: { label: 'Admin', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: <Zap className="w-4 h-4" /> },
  moderator: { label: 'Mod', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: <Shield className="w-4 h-4" /> },
  user: { label: 'Usuário', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: <User className="w-4 h-4" /> }
}

// Componente para item de conta vinculada com desvinculação
function LinkedAccountItem({
  platform,
  account,
  onLink,
  onUnlink
}: {
  platform: 'twitch' | 'youtube' | 'kick'
  account: any | null
  onLink: () => void
  onUnlink: (platform: string) => void
}) {
  const [unlinkStep, setUnlinkStep] = useState<'idle' | 'confirm' | 'typing'>('idle')
  const [unlinkText, setUnlinkText] = useState('')
  const [isUnlinking, setIsUnlinking] = useState(false)

  const platformConfig = {
    twitch: {
      icon: <Twitch className="w-5 h-5 text-purple-500" />,
      name: 'Twitch'
    },
    youtube: {
      icon: <Youtube className="w-5 h-5 text-red-500" />,
      name: 'YouTube'
    },
    kick: {
      icon: <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-[10px] font-bold text-black">K</div>,
      name: 'Kick'
    }
  }

  const config = platformConfig[platform]

  const handleUnlinkClick = () => {
    if (unlinkStep === 'idle') {
      setUnlinkStep('confirm')
    } else if (unlinkStep === 'confirm') {
      setUnlinkStep('typing')
    }
  }

  const handleConfirmUnlink = async () => {
    if (unlinkText.toLowerCase() !== 'desvincular') return

    setIsUnlinking(true)
    try {
      await onUnlink(platform)
    } finally {
      setIsUnlinking(false)
      setUnlinkStep('idle')
      setUnlinkText('')
    }
  }

  const handleCancel = () => {
    setUnlinkStep('idle')
    setUnlinkText('')
  }

  if (!account) {
    // Conta não vinculada
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm text-muted-foreground">{config.name}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onLink}>
          <LinkIcon className="w-3 h-3 mr-2" />
          Vincular
        </Button>
      </div>
    )
  }

  // Verificar se precisa reautenticação
  const needsReauth = account.needs_reauth === true

  // Conta vinculada
  return (
    <div className={`border rounded-lg overflow-hidden ${needsReauth ? 'border-yellow-500/50 bg-yellow-500/5' : 'bg-muted/50'}`}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-medium">{account.platform_username}</span>
          {needsReauth ? (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>

        {needsReauth ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onLink}
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
          >
            <AlertTriangle className="w-3 h-3 mr-2" />
            Reautorizar
          </Button>
        ) : unlinkStep === 'idle' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnlinkClick}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          >
            <Unlink className="w-3 h-3 mr-2" />
            Desvincular
          </Button>
        )}

        {!needsReauth && unlinkStep === 'confirm' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUnlinkClick}
            >
              Confirmar
            </Button>
          </div>
        )}
      </div>

      {/* Aviso de reautenticação necessária */}
      {needsReauth && (
        <div className="px-3 pb-3 pt-1 border-t border-yellow-500/30">
          <p className="text-xs text-yellow-500">
            ⚠️ Novas permissões são necessárias. Clique em "Reautorizar" para continuar usando esta conta.
          </p>
        </div>
      )}

      {!needsReauth && unlinkStep === 'typing' && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            Digite <span className="font-mono text-red-400">desvincular</span> para confirmar:
          </p>
          <div className="flex gap-2">
            <Input
              value={unlinkText}
              onChange={(e) => setUnlinkText(e.target.value)}
              placeholder="desvincular"
              className="h-8 text-sm bg-background"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmUnlink}
              disabled={unlinkText.toLowerCase() !== 'desvincular' || isUnlinking}
              className="h-8"
            >
              {isUnlinking ? 'Desvinculando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitch')
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [isModerator, setIsModerator] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [accountsNeedingReauth, setAccountsNeedingReauth] = useState<Array<{ platform: string; missingScopes: string[] }>>([])
  const [isChatEnabled, setIsChatEnabled] = useState(true) // Controle de chat para o streamer

  // Estado para aba ativa do dashboard
  const [activeTab, setActiveTab] = useState<'live' | 'short-links' | 'dashboard'>('live')

  // Estados para sistema de benefícios
  const [benefits, setBenefits] = useState<any[]>([])
  const [showBenefitsPopup, setShowBenefitsPopup] = useState(false)
  const [showBenefitsPanel, setShowBenefitsPanel] = useState(false)
  const [pendingBenefit, setPendingBenefit] = useState<any>(null)

  // Estado para painel admin
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  // Estado para ações de moderação
  const [moderationActions, setModerationActions] = useState<any[]>([])

  // Status do YouTube (recebido via SSE para evitar polling)
  const [youtubeStatus, setYoutubeStatus] = useState<{
    isLive: boolean
    videoId: string | null
    liveChatId: string | null
  }>({ isLive: false, videoId: null, liveChatId: null })



  // Estados para Layout Customizável
  const [chatWidth, setChatWidth] = useState(384) // Padrão: w-96 (384px)
  const [bottomHeight, setBottomHeight] = useState(400) // Padrão
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isBottomVisible, setIsBottomVisible] = useState(true)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Refs para controle de redimensionamento
  const isResizingChat = useRef(false)
  const isResizingBottom = useRef(false)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  // Handlers para redimensionamento otimizados
  const startResizingChat = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingChat.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'col-resize'
    document.body.classList.add('resizing')
  }, [])

  const startResizingBottom = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingBottom.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'row-resize'
    document.body.classList.add('resizing')
  }, [])

  const stopResizing = useCallback(() => {
    if (isResizingChat.current || isResizingBottom.current) {
      // Salvar valores finais no estado quando terminar o ajuste
      if (dashboardRef.current) {
        const style = window.getComputedStyle(dashboardRef.current)
        if (isResizingChat.current) {
          setChatWidth(parseInt(style.getPropertyValue('--chat-width'), 10))
        } else if (isResizingBottom.current) {
          setBottomHeight(parseInt(style.getPropertyValue('--bottom-height'), 10))
        }
      }
    }

    isResizingChat.current = false
    isResizingBottom.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'default'
    document.body.classList.remove('resizing')

    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafId.current) return

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      if (!dashboardRef.current) return

      if (isResizingChat.current) {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= 300 && newWidth <= 800) {
          dashboardRef.current.style.setProperty('--chat-width', `${newWidth}px`)
        }
      } else if (isResizingBottom.current) {
        const newHeight = window.innerHeight - e.clientY
        if (newHeight >= 150 && newHeight <= 600) {
          dashboardRef.current.style.setProperty('--bottom-height', `${newHeight}px`)
        }
      }
    })
  }, [])

  // Atualizar variáveis CSS iniciais
  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.style.setProperty('--chat-width', `${chatWidth}px`)
      dashboardRef.current.style.setProperty('--bottom-height', `${bottomHeight}px`)
    }
  }, [])

  // Sincronizar sessão com popups via BroadcastChannel
  const sessionData = useMemo(() => ({
    user: user ? {
      id: user.id,
      username: user.display_name || user.username || user.email,
      email: user.email,
      role: user.role
    } : null,
    linkedAccounts: linkedAccounts.map((acc: any) => ({
      platform: acc.platform,
      platform_user_id: acc.platform_user_id,
      platform_username: acc.platform_username,
      is_moderator: acc.is_moderator
    })),
    isModerator
  }), [user, linkedAccounts, isModerator])

  // Só o owner waveigl vê as seções de Links Curtos e Dashboard
  const isOwnerUser = getUserRole(linkedAccounts) === 'owner' || user?.email?.toLowerCase() === 'csgoblackbelt@gmail.com'

  // Hook que responde às solicitações de sessão do popup
  useSessionProvider(sessionData)

  // Carregar dados do usuário
  const loadUser = async () => {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      const linkedAccounts = data.linked_accounts || []

      // Determinar role correto baseado nas contas vinculadas (mais confiável)
      const computedRole = getUserRole(linkedAccounts)

      // Se o role computado for diferente do banco, usar o computado (prioridade)
      const finalRole = computedRole !== 'user' ? computedRole : (data.user?.role || 'user')

      setUser({
        ...data.user,
        role: finalRole
      })
      setLinkedAccounts(linkedAccounts)
      setAccountsNeedingReauth(data.accounts_needing_reauth || [])

      // Verificar se é moderador pelo banco de dados ou pelo campo is_moderator
      setIsModerator(!!data.user?.is_moderator || !!data.is_moderator || finalRole === 'moderator' || finalRole === 'admin' || finalRole === 'owner')
    } catch (e) {
      console.error('Falha ao carregar /api/me', e)
    }
  }

  // Verificar status de moderador via API (chamado no login/carregamento)
  const checkModeratorViaAPI = async () => {
    try {
      console.log('[Dashboard] Verificando status de moderador via API...')
      const res = await fetch('/api/me/check-moderator', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        console.log('[Dashboard] Resultado da verificação:', data)
        setIsModerator(data.isModerator)

        // Recarregar dados do usuário para atualizar linkedAccounts e role
        // Isso garante que a UI reflita as mudanças feitas pelo check-moderator
        await loadUser()
        console.log('[Dashboard] Dados do usuário recarregados após verificação de moderador')
      }
    } catch (e) {
      console.error('Erro ao verificar moderador via API:', e)
    }
  }

  // Badges que indicam moderador
  const MODERATOR_BADGES = ['moderator', 'mod', 'broadcaster', 'owner', 'staff', 'admin']

  // Refs para evitar re-criação do EventSource
  const linkedAccountsRef = useRef(linkedAccounts)
  const isModeratorRef = useRef(isModerator)
  // Rastrear quais plataformas já verificamos para moderador
  const moderatorCheckedPlatformsRef = useRef<Set<string>>(new Set())

  // Atualizar refs quando estados mudam
  useEffect(() => {
    linkedAccountsRef.current = linkedAccounts
  }, [linkedAccounts])

  useEffect(() => {
    isModeratorRef.current = isModerator
  }, [isModerator])

  // Verifica se o usuário atual é moderador baseado nas badges
  const checkIfUserIsModerator = (badges: string[]) => {
    if (!badges || badges.length === 0) return false
    return badges.some(badge => MODERATOR_BADGES.includes(badge.toLowerCase()))
  }

  // Atualiza o status de moderador no banco de dados
  const updateModeratorStatus = async (platform: string, isMod: boolean) => {
    try {
      await fetch('/api/me/moderator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, isModerator: isMod })
      })
      console.log(`[Moderator] Status atualizado para ${platform}: ${isMod}`)
    } catch (e) {
      console.error('Erro ao atualizar status de moderador:', e)
    }
  }

  // Carregar benefícios do usuário
  const loadBenefits = async () => {
    try {
      const res = await fetch('/api/benefits')
      if (res.ok) {
        const data = await res.json()
        setBenefits(data.benefits || [])
      }
    } catch (e) {
      console.error('Erro ao carregar benefícios:', e)
    }
  }

  // Carregar ações de moderação
  const loadModerationActions = async () => {
    try {
      const res = await fetch('/api/moderation/actions')
      if (res.ok) {
        const data = await res.json()
        setModerationActions(data.actions || [])
      }
    } catch (e) {
      console.error('Erro ao carregar ações de moderação:', e)
    }
  }

  // Envolver funções em useCallback para evitar recriação
  const handleInitializeUser = useCallback(async () => {
    await loadUser()

    await Promise.all([
      checkModeratorViaAPI(),
      loadBenefits(),
      loadModerationActions()
    ])
  }, [])

  // Efeito para gerenciar a conexão SSE
  useEffect(() => {
    let es: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      if (es) es.close()

      console.log('[Dashboard] Conectando ao SSE...')
      es = new EventSource('/api/chat/stream')

      es.onopen = () => {
        console.log('[Dashboard] ✅ Conexão SSE estabelecida')
      }

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)

          // Evento de status do YouTube (live on/off)
          if (payload.eventType === 'youtube_status') {
            setYoutubeStatus({
              isLive: payload.isLive,
              videoId: payload.videoId,
              liveChatId: payload.liveChatId
            })
            return
          }

          // Evento de moderação
          if (payload.eventType === 'moderation') {
            console.log('[Dashboard] Evento de moderação:', payload)

            // Se for ban, timeout ou unban, atualizar a lista de ações
            if (['ban', 'timeout', 'unban'].includes(payload.type)) {
              console.log(`[Dashboard] Atualizando ações devido a: ${payload.type}`)
              loadModerationActions()
            }

            const currentLinkedAccounts = linkedAccountsRef.current
            const matchingAccount = currentLinkedAccounts.find(
              acc => acc.platform === payload.platform &&
                acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
            )

            if (matchingAccount) {
              if (payload.type === 'mod_added') {
                setIsModerator(true)
                updateModeratorStatus(payload.platform, true)
              } else if (payload.type === 'mod_removed') {
                checkModeratorViaAPI()
              }
            }
            return
          }

          // Mensagem de chat
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
              if (curr.some(m => m.id === messageId)) return curr
              return [...curr.slice(-200), newMessage]
            })

            const currentLinkedAccounts = linkedAccountsRef.current
            if (currentLinkedAccounts.length > 0) {
              const matchingAccount = currentLinkedAccounts.find(
                acc => acc.platform === payload.platform && acc.platform_user_id === payload.userId
              )
              if (matchingAccount && checkIfUserIsModerator(payload.badges)) {
                if (!moderatorCheckedPlatformsRef.current.has(payload.platform)) {
                  moderatorCheckedPlatformsRef.current.add(payload.platform)
                  setIsModerator(true)
                  updateModeratorStatus(payload.platform, true)
                }
              }
            }
          }
        } catch (e) {
          console.error('[Dashboard] Erro ao processar mensagem SSE:', e)
        }
      }

      es.onerror = (err) => {
        console.error('[Dashboard] ❌ Erro no SSE:', err)
        if (es) es.close()
        // Tentar reconectar em 5 segundos
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    // Lidar com visibilidade da página (reconectar se ficou muito tempo fora)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Dashboard] Aba visível, verificando conexão...')
        // Se a conexão estava fechada ou deu erro, connect() vai reiniciar
        if (!es || es.readyState === EventSource.CLOSED) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (es) es.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Inicialização (apenas na montagem)
  useEffect(() => {
    handleInitializeUser()
  }, [handleInitializeUser])

  const handleSendMessage = (message: string) => {
    console.log('Enviando mensagem:', message)
  }

  const handleModerate = async (userId: string, username: string, platform: string, action: string, duration?: number, reason?: string) => {
    console.log('Moderando usuário:', userId, 'username:', username, 'plataforma:', platform, 'ação:', action, 'duração:', duration, 'motivo:', reason)

    if (!user?.id) {
      console.error('Usuário não autenticado')
      return
    }

    try {
      // Determinar qual endpoint chamar baseado na ação
      let endpoint = ''
      let body: Record<string, unknown> = {}

      if (action === 'timeout') {
        endpoint = '/api/moderation/timeout'
        body = {
          targetPlatformUserId: userId,
          targetUsername: username,
          targetPlatform: platform,
          durationSeconds: duration || 600, // 10 minutos padrão
          reason: reason || 'Timeout via chat unificado',
          moderatorId: user.id
        }
      } else if (action === 'ban') {
        endpoint = '/api/moderation/ban'
        body = {
          targetPlatformUserId: userId,
          targetUsername: username,
          targetPlatform: platform,
          reason: reason || 'Ban via chat unificado',
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
        const durationText = duration ? formatDuration(duration) : ''

        // Texto da ação de moderação
        let systemTag = ''
        if (action === 'ban') {
          systemTag = ` [🛡️ Banido por ${moderatorName}]`
        } else if (action === 'unban') {
          systemTag = ` [🛡️ Punição revertida por ${moderatorName}]`
        } else {
          systemTag = ` [🛡️ Timeout ${durationText} por ${moderatorName}]`
        }

        // Atualizar a última mensagem do usuário para incluir a tag de sistema
        // e marcar as mensagens anteriores como deletadas
        setMessages(curr => {
          // Encontrar a última mensagem do usuário nessa plataforma
          const lastMsgIndex = curr.map((msg, idx) => ({ msg, idx }))
            .filter(({ msg }) => msg.userId === userId && msg.platform === platform)
            .pop()?.idx

          return curr.map((msg, idx) => {
            if (msg.userId === userId && msg.platform === platform) {
              if (idx === lastMsgIndex) {
                // Última mensagem: adicionar a tag de sistema
                return {
                  ...msg,
                  message: msg.message + systemTag,
                  systemTag: systemTag
                } as UnifiedMessage & { systemTag?: string }
              } else {
                // Mensagens anteriores: marcar como deletada (apenas para ban/timeout, não para unban)
                if (action !== 'unban') {
                  return {
                    ...msg,
                    message: '<Mensagem Deletada>',
                    isDeleted: true
                  } as UnifiedMessage & { isDeleted?: boolean }
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

  // Formatar duração em texto legível
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  const handleLinkAccount = (platform: string) => {
    // Todas as plataformas agora usam OAuth
    window.location.href = `/api/auth/${platform}`
  }

  const handleUnlinkAccount = async (platform: string) => {
    try {
      const res = await fetch(`/api/auth/unlink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      const data = await res.json()

      if (res.ok) {
        // Recarregar dados do usuário para atualizar a UI
        await loadUser()
      } else {
        alert(data.error || 'Erro ao desvincular conta')
      }
    } catch (error) {
      alert('Erro ao desvincular conta')
    }
  }

  const getLinkedAccount = (platform: string) => {
    return linkedAccounts.find(acc => acc.platform === platform) || null
  }

  // Determinar nome a exibir no header
  // Prioridade: full_name > display_name (username da plataforma) > email
  const getDisplayName = () => {
    if (!user) return 'Usuário'

    // Se tem nome real cadastrado, usa ele
    if (user.full_name && user.full_name.trim()) {
      return user.full_name
    }

    // Senão, usa o display_name (que vem do username da plataforma)
    if (user.display_name) {
      return user.display_name
    }

    // Fallback para email
    return user.email || 'Usuário'
  }

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden" suppressHydrationWarning>
      {/* Overlay para suavizar redimensionamento (evita problemas com IFrames) */}
      {(isResizingChat.current || isResizingBottom.current) && (
        <div className="fixed inset-0 z-[100] cursor-col-resize select-none" />
      )}

      {/* Botão flutuante para restaurar header se oculto */}
      {!isHeaderVisible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsHeaderVisible(true)}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-card rounded-t-none border-x border-b border-border h-6 px-4 hover:bg-muted"
          title="Mostrar Menu"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}

      {/* Header */}
      <header className={`bg-card border-b border-border transition-all duration-300 overflow-hidden ${isHeaderVisible ? 'h-[73px]' : 'h-0 opacity-0'}`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/favicon.webp"
                alt="WaveIGL"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-foreground">WaveIGL</span>
            </div>
            {/* Botão Ocultar Header */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHeaderVisible(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Ocultar Menu"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-foreground font-medium">{getDisplayName()}</span>
                  {/* Badge de cargo */}
                  {(() => {
                    // Determinar role final (priorizar role computado das contas vinculadas)
                    const computedRole = getUserRole(linkedAccounts)
                    const displayRole = computedRole !== 'user' ? computedRole : (user.role || 'user')

                    // Mapear 'owner' para 'streamer' na UI
                    const uiRole = displayRole === 'owner' ? 'streamer' : displayRole

                    return uiRole && ROLE_CONFIG[uiRole] && (
                      <div
                        onClick={() => {
                          // Apenas admin e streamer podem abrir o painel
                          if (uiRole === 'admin' || uiRole === 'streamer') {
                            setShowAdminPanel(true)
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${ROLE_CONFIG[uiRole].bgColor} ${ROLE_CONFIG[uiRole].color} ${(uiRole === 'admin' || uiRole === 'streamer') ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                          }`}
                      >
                        {ROLE_CONFIG[uiRole].icon}
                        <span className="text-xs font-medium">{ROLE_CONFIG[uiRole].label}</span>
                      </div>
                    )
                  })()}
                </div>

                <ProfileEditor user={user} onUpdate={loadUser} />

                {/* Painel de moderação - apenas para admin/streamer */}
                {(user.role === 'admin' || user.role === 'streamer') && (
                  <ModerationPanel isAdmin={true} />
                )}

                {/* Indicador de benefícios para subs */}
                {benefits.length > 0 && (
                  <>
                    <BenefitsIndicator
                      hasPendingBenefits={benefits.some(b => b.onboarding_step < 3 && !b.onboarding_dismissed_at)}
                      onClick={() => setShowBenefitsPanel(true)}
                    />
                    {!benefits.some(b => b.onboarding_step < 3) && <SubBadge />}
                  </>
                )}
              </>
            )}

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Configurações</DialogTitle>
                  <CardDescription>Gerencie suas contas vinculadas e preferências.</CardDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <h4 className="text-sm font-medium leading-none mb-2">Contas Vinculadas</h4>
                  <div className="flex flex-col gap-3">
                    <LinkedAccountItem
                      platform="twitch"
                      account={getLinkedAccount('twitch')}
                      onLink={() => handleLinkAccount('twitch')}
                      onUnlink={handleUnlinkAccount}
                    />
                    <LinkedAccountItem
                      platform="youtube"
                      account={getLinkedAccount('youtube')}
                      onLink={() => handleLinkAccount('youtube')}
                      onUnlink={handleUnlinkAccount}
                    />
                    <LinkedAccountItem
                      platform="kick"
                      account={getLinkedAccount('kick')}
                      onLink={() => handleLinkAccount('kick')}
                      onUnlink={handleUnlinkAccount}
                    />

                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Botão Admin Específico no Header */}
            {(user?.role === 'admin' || user?.role === 'streamer') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminPanel(true)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                title="Abrir Painel Admin"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}

            {user ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-foreground border-border hover:bg-muted"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = '/auth/login'}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/80"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Alerta de reautenticação necessária */}
      {accountsNeedingReauth.length > 0 && (
        <Alert variant="destructive" className="mx-6 mt-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-400">Ação necessária</AlertTitle>
          <AlertDescription className="text-yellow-200/80">
            {accountsNeedingReauth.length === 1
              ? `Sua conta ${accountsNeedingReauth[0].platform.toUpperCase()} precisa de novas permissões.`
              : `${accountsNeedingReauth.length} contas precisam de novas permissões.`
            }
            {' '}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="underline hover:text-yellow-100"
            >
              Abrir configurações
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card/50">
        <nav className="flex items-center px-4 space-x-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            Live
          </button>
          {isOwnerUser && (
            <button
              onClick={() => setActiveTab('short-links')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === 'short-links'
                  ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Tag className="w-4 h-4" />
              Links Curtos
            </button>
          )}
          {isOwnerUser && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {activeTab === 'short-links' ? (
          <div className="flex-1 overflow-auto p-6">
            <ShortLinksTab />
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="flex-1 overflow-auto p-6">
            <ShortLinksDashboard />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Video Player Section */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-6 border-b border-border shrink-0">
                <PlatformSelector
                  selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                availablePlatforms={['twitch', 'youtube', 'kick']}
              />
            </div>

            <div className="flex-1 p-6 min-h-0">
              <VideoPlayer
                platform={selectedPlatform}
                channelId="waveigl"
                className="w-full h-full rounded-lg shadow-2xl"
                youtubeStatusFromSSE={youtubeStatus}
              />
            </div>
          </div>

          {/* Resizer Handle Horizontal */}
          {isChatVisible && (
            <div
              onMouseDown={startResizingChat}
              className="w-1.5 cursor-col-resize bg-border/40 hover:bg-primary/50 transition-colors z-10"
              title="Arraste para redimensionar o chat"
            />
          )}

          {/* Chat Section */}
          <div
            ref={dashboardRef}
            style={{
              width: isChatVisible ? 'var(--chat-width, 384px)' : '48px',
              '--chat-width': `${chatWidth}px`,
              '--bottom-height': `${bottomHeight}px`
            } as any}
            className="border-l border-border bg-card flex flex-col h-full shrink-0 transition-[width] duration-300 relative group overflow-hidden"
          >
            {/* Botão Shelve Chat */}
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
              title={isChatVisible ? "Recolher Chat" : "Abrir Chat"}
            >
              {isChatVisible ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className={`p-4 border-b border-border shrink-0 flex items-center justify-between ${!isChatVisible ? 'h-full py-8' : ''}`}>
              {isChatVisible ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Chat Unificado</h3>
                    <p className="text-sm text-muted-foreground">
                      Mensagens sincronizadas
                    </p>
                  </div>
                  {/* Botão para streamer/admin desativar chat quando offline */}
                  {user?.role && (user.role === 'streamer' || user.role === 'admin') && (
                    <Button
                      size="sm"
                      variant={isChatEnabled ? 'default' : 'outline'}
                      onClick={() => setIsChatEnabled(!isChatEnabled)}
                      className={isChatEnabled ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'border-red-500/50 text-red-500'}
                      title={isChatEnabled ? 'Chat ativo' : 'Chat desativado'}
                    >
                      {isChatEnabled ? '🟢' : '🔴'}
                    </Button>
                  )}
                </>
              ) : (
                <div
                  className="flex flex-col items-center gap-6 cursor-pointer"
                  onClick={() => setIsChatVisible(true)}
                >
                  <PanelRightOpen className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest [writing-mode:vertical-lr]">CHAT</span>
                </div>
              )}
            </div>

            {isChatVisible && (
              <>
                {/* Contadores de Moderação */}
                {(user?.role === 'streamer' || user?.role === 'admin') && moderationActions.length > 0 && (
                  <div className="px-4 py-2 border-b border-border bg-muted/20">
                    <ModerationStats actions={moderationActions} compact={true} />
                  </div>
                )}

                <div className="flex-1 min-h-0">
                  {isChatEnabled ? (
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
                        role: user.role || 'user',
                        linkedAccounts: linkedAccounts.map(acc => ({
                          platform: acc.platform as Platform,
                          platform_user_id: acc.platform_user_id,
                          platform_username: acc.platform_username,
                          is_moderator: acc.is_moderator
                        }))
                      } : undefined}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
                      <div>
                        <p className="text-lg mb-2">💤 Chat desativado</p>
                        <p className="text-sm">Inativo pelo streamer.</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        {/* Resizer Handle Vertical */}
        {(user?.role === 'streamer' || user?.role === 'admin') && isBottomVisible && (
          <div
            onMouseDown={startResizingBottom}
            className="h-1.5 cursor-row-resize bg-border/40 hover:bg-primary/50 transition-colors z-10"
            title="Arraste para redimensionar o painel inferior"
          />
        )}

        {/* Painel de Estatísticas e Informações de Live */}
        {(user?.role === 'streamer' || user?.role === 'admin') && (
          <div
            style={{ height: isBottomVisible ? 'var(--bottom-height, 400px)' : '40px' }}
            className={`border-t border-border bg-card relative transition-[height] duration-300 group ${!isBottomVisible ? 'overflow-hidden' : ''}`}
          >
            {/* Botão Shelve Bottom Panel */}
            <button
              onClick={() => setIsBottomVisible(!isBottomVisible)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
              title={isBottomVisible ? "Recolher Painel" : "Expandir Painel"}
            >
              {isBottomVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!isBottomVisible ? (
              <div
                className="h-full flex items-center justify-center gap-3 cursor-pointer"
                onClick={() => setIsBottomVisible(true)}
              >
                <LayoutPanelTop className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Painel de Infos & Stats</span>
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Gerenciamento da Live
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsBottomVisible(false)}>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Ocultar
                  </Button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DashboardStats />
                  <LiveInfoPanel
                    isStreamer={isOwner(user?.role)}
                    isAdmin={isAdmin(user?.role)}
                    onRefresh={loadModerationActions}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}



          {/* Popup de onboarding de benefícios para novos subs */}
          {pendingBenefit && (
            <SubscriberBenefitsPopup
              benefit={pendingBenefit}
              isOpen={showBenefitsPopup}
              onClose={() => {
                setShowBenefitsPopup(false)
                loadBenefits() // Recarregar para atualizar status
              }}
              onDismiss={() => {
                setShowBenefitsPopup(false)
              }}
            />
          )}

          {/* Painel completo de benefícios */}
          <BenefitsPanel
            isOpen={showBenefitsPanel}
            onClose={() => setShowBenefitsPanel(false)}
            onOpenOnboarding={(benefit) => {
              setPendingBenefit(benefit)
              setShowBenefitsPanel(false)
              setShowBenefitsPopup(true)
            }}
          />


          {/* Painel Admin - Apenas para Gabriel Toth */}
        </div>
    </div>
  )
}
