'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from '@/components/VideoPlayer'
import { UnifiedChat } from '@/components/UnifiedChat'
import { PlatformSelector } from '@/components/PlatformSelector'
import { Platform, UnifiedMessage } from '@/types'
import { LogOut, LogIn, Settings, Twitch, Youtube, Link as LinkIcon, Unlink, CheckCircle2, AlertTriangle, Crown, Zap, Shield, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ProfileEditor } from '@/components/ProfileEditor'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ModerationPanel } from '@/components/ModerationPanel'
import BenefitsIndicator, { SubBadge } from '@/components/BenefitsIndicator'
import SubscriberBenefitsPopup from '@/components/SubscriberBenefitsPopup'
import BenefitsPanel from '@/components/BenefitsPanel'

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
  
  // Estados para sistema de benefícios
  const [benefits, setBenefits] = useState<any[]>([])
  const [discordConnection, setDiscordConnection] = useState<any>(null)
  const [showBenefitsPopup, setShowBenefitsPopup] = useState(false)
  const [showBenefitsPanel, setShowBenefitsPanel] = useState(false)
  const [pendingBenefit, setPendingBenefit] = useState<any>(null)
  
  // Status do YouTube (recebido via SSE para evitar polling)
  const [youtubeStatus, setYoutubeStatus] = useState<{
    isLive: boolean
    videoId: string | null
    liveChatId: string | null
  }>({ isLive: false, videoId: null, liveChatId: null })

  // Carregar dados do usuário
  const loadUser = async () => {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      setUser(data.user)
      setLinkedAccounts(data.linked_accounts || [])
      setAccountsNeedingReauth(data.accounts_needing_reauth || [])
      // Verificar se é moderador pelo banco de dados ou pelo campo is_moderator
      setIsModerator(!!data.user?.is_moderator || !!data.is_moderator)
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
        setDiscordConnection(data.discordConnection)
        
        // Verificar se há benefício pendente de onboarding
        if (data.hasPendingOnboarding && data.benefits.length > 0) {
          const pending = data.benefits.find((b: any) => 
            b.onboarding_step < 3 && !b.onboarding_dismissed_at
          )
          if (pending) {
            setPendingBenefit(pending)
            setShowBenefitsPopup(true)
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar benefícios:', e)
    }
  }
  
  useEffect(() => {
    // Carregar dados do usuário e verificar moderador
    const initializeUser = async () => {
      await loadUser()
      // Verificar status de moderador via API após carregar usuário
      // Isso garante que o status esteja atualizado mesmo se mudou fora da plataforma
      await checkModeratorViaAPI()
      // Carregar benefícios
      await loadBenefits()
    }
    initializeUser()

    // Conectar SSE para chat em tempo real (apenas uma vez)
    const es = new EventSource('/api/chat/stream')
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        
        // Evento de status do YouTube (live on/off)
        if (payload.eventType === 'youtube_status') {
          console.log('[Dashboard] Status YouTube via SSE:', payload.isLive ? 'ONLINE' : 'OFFLINE')
          setYoutubeStatus({
            isLive: payload.isLive,
            videoId: payload.videoId,
            liveChatId: payload.liveChatId
          })
          return
        }
        
        // Evento de moderação (alguém foi promovido/removido de moderador)
        if (payload.eventType === 'moderation') {
          console.log('[Dashboard] Evento de moderação:', payload)
          const currentLinkedAccounts = linkedAccountsRef.current
          
          // Verificar se o evento é sobre o usuário atual
          const matchingAccount = currentLinkedAccounts.find(
            acc => acc.platform === payload.platform && 
                   acc.platform_username?.toLowerCase() === payload.username?.toLowerCase()
          )
          
          if (matchingAccount) {
            if (payload.type === 'mod_added') {
              console.log('[Dashboard] Você foi promovido a moderador em', payload.platform)
              setIsModerator(true)
              updateModeratorStatus(payload.platform, true)
            } else if (payload.type === 'mod_removed') {
              console.log('[Dashboard] Você foi removido de moderador em', payload.platform)
              // Re-verificar se ainda é moderador em outras plataformas
              checkModeratorViaAPI()
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
          
          // Usar função de atualização para evitar duplicatas
          setMessages((curr) => {
            // Verificar se já existe mensagem com este ID
            if (curr.some(m => m.id === messageId)) {
              return curr // Não adicionar duplicata
            }
            return [...curr.slice(-200), newMessage]
          })
          
          // Verificar se esta mensagem é do usuário atual e tem badge de moderador
          const currentLinkedAccounts = linkedAccountsRef.current
          if (currentLinkedAccounts.length > 0) {
            const matchingAccount = currentLinkedAccounts.find(
              acc => acc.platform === payload.platform && acc.platform_user_id === payload.userId
            )
            
            // Se é mensagem do usuário atual e tem badges de moderador
            if (matchingAccount && checkIfUserIsModerator(payload.badges)) {
              // Verificar se já checamos esta plataforma
              if (!moderatorCheckedPlatformsRef.current.has(payload.platform)) {
                moderatorCheckedPlatformsRef.current.add(payload.platform)
                console.log(`[Dashboard] Usuário é moderador em ${payload.platform}:`, payload.badges)
                
                // Ativar modo moderador localmente
                setIsModerator(true)
                // Salvar no banco de dados para persistir
                updateModeratorStatus(payload.platform, true)
              }
            }
          }
        }
      } catch {}
    }
    return () => {
      es.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  const handleSendMessage = (message: string) => {
    console.log('Enviando mensagem:', message)
  }

  const handleModerate = async (userId: string, platform: string, action: string, duration?: number, reason?: string) => {
    console.log('Moderando usuário:', userId, 'plataforma:', platform, 'ação:', action, 'duração:', duration, 'motivo:', reason)
    
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
          targetPlatform: platform,
          durationSeconds: duration || 600, // 10 minutos padrão
          reason: reason || 'Timeout via chat unificado',
          moderatorId: user.id
        }
      } else if (action === 'ban') {
        endpoint = '/api/moderation/ban'
        body = {
          targetPlatformUserId: userId,
          targetPlatform: platform,
          reason: reason || 'Ban via chat unificado',
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
        
        // Substituir mensagens do usuário punido por "<Mensagem Deletada>"
        setMessages(curr => curr.map(msg => {
          if (msg.userId === userId && msg.platform === platform) {
            return {
              ...msg,
              message: '<Mensagem Deletada>',
              isDeleted: true
            } as UnifiedMessage & { isDeleted?: boolean }
          }
          return msg
        }))
        
        // Adicionar mensagem de sistema no chat mostrando a punição
        const targetUsername = messages.find(m => m.userId === userId)?.username || 'Usuário'
        const moderatorName = linkedAccounts.find(acc => acc.platform === platform)?.platform_username || user.username || 'Moderador'
        
        const durationText = duration ? formatDuration(duration) : ''
        const actionText = action === 'ban' ? '🔨 banido permanentemente' : `⏱️ recebeu timeout de ${durationText}`
        
        const systemMessage: UnifiedMessage = {
          id: `mod-${Date.now()}`,
          platform: platform as 'twitch' | 'youtube' | 'kick',
          username: '🛡️ Sistema',
          userId: 'system',
          message: `${targetUsername} foi ${actionText} por ${moderatorName}`,
          timestamp: Date.now(),
          badges: ['system']
        }
        
        setMessages(curr => [...curr, systemMessage])
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-400 rounded-lg"></div>
              <span className="text-xl font-bold text-foreground">WaveIGL</span>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              Clube Ativo
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-foreground font-medium">{getDisplayName()}</span>
                  {/* Badge de cargo */}
                  {user.role && ROLE_CONFIG[user.role] && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${ROLE_CONFIG[user.role].bgColor} ${ROLE_CONFIG[user.role].color}`}>
                      {ROLE_CONFIG[user.role].icon}
                      <span className="text-xs font-medium">{ROLE_CONFIG[user.role].label}</span>
                    </div>
                  )}
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

      {/* Main Content */}
      <div className={`flex ${accountsNeedingReauth.length > 0 ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-80px)]'} overflow-hidden`}>
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
              className="w-full h-full rounded-lg"
              youtubeStatusFromSSE={youtubeStatus}
            />
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-96 border-l border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Chat Unificado</h3>
                <p className="text-sm text-muted-foreground">
                  Mensagens de Twitch, YouTube e Kick
                </p>
              </div>
              {/* Botão para streamer/admin desativar chat quando offline */}
              {user?.role && (user.role === 'streamer' || user.role === 'admin') && (
                <Button
                  size="sm"
                  variant={isChatEnabled ? 'default' : 'outline'}
                  onClick={() => setIsChatEnabled(!isChatEnabled)}
                  className={isChatEnabled ? 'bg-green-600 hover:bg-green-700' : 'border-red-500 text-red-500'}
                  title={isChatEnabled ? 'Chat ativo - Clique para desativar' : 'Chat desativado - Clique para ativar'}
                >
                  {isChatEnabled ? '🟢 Ativo' : '🔴 Offline'}
                </Button>
              )}
            </div>
          </div>
          
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
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">💤 Chat desativado</p>
                  <p className="text-sm">O streamer desativou o chat enquanto está offline.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Painel Dev: dados do usuário e contas vinculadas */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Dev: Sessão e Contas Vinculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
  {JSON.stringify(user, null, 2)}
  Linked: {JSON.stringify(linkedAccounts, null, 2)}
              </pre>
            </CardContent>
          </Card>
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
          discordConnected={!!discordConnection}
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
    </div>
  )
}
