'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/VideoPlayer'
import { UnifiedChat } from '@/components/UnifiedChat'
import { PlatformSelector } from '@/components/PlatformSelector'
import { Platform, UserRole } from '@/types'
import { useChatStream } from '@/hooks/use-chat-stream'
import { getUserRole, OWNER_EMAIL } from '@/lib/permissions'
import { LogIn, LogOut, Tv, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface LiveUser {
  id: string
  email?: string
  display_name?: string
  username?: string
  role?: string
  is_moderator?: boolean
}

export default function LivePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitch')
  const [user, setUser] = useState<LiveUser | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{
    platform: Platform
    platform_user_id: string
    platform_username: string
    is_moderator?: boolean
  }>>([])
  const { messages, youtubeStatus } = useChatStream()

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' })
      const data = await res.json()

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.display_name || data.user.full_name,
          username: data.user.username,
          role: data.user.role,
          is_moderator: data.user.is_moderator,
        })
        setLinkedAccounts((data.linked_accounts || []).map((acc: any) => ({
          platform: acc.platform,
          platform_user_id: acc.platform_user_id,
          platform_username: acc.platform_username,
          is_moderator: acc.is_moderator,
        })))
      }
    } catch (e) {
      console.error('[Live] Erro ao carregar /api/me', e)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const isLogged = !!user
  const computedRole = getUserRole(linkedAccounts)
  const isOwnerUser = computedRole === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL
  const isModerator = !!user?.is_moderator || ['owner', 'streamer', 'admin', 'moderator'].includes(computedRole)

  const getDisplayName = () => {
    if (!user) return 'Usuário'
    if (user.display_name && user.display_name.trim()) return user.display_name
    if (user.username) return user.username
    return user.email || 'Usuário'
  }

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  const handleSendMessage = (message: string) => {
    console.log('[Live] Mensagem enviada:', message)
  }

  const handleModerate = async (userId: string, username: string, platform: string, action: string, duration?: number, reason?: string) => {
    if (!user?.id) return

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
          reason: reason || 'Timeout via chat ao vivo',
          moderatorId: user.id,
        }
      } else if (action === 'ban') {
        endpoint = '/api/moderation/ban'
        body = {
          targetPlatformUserId: userId,
          targetUsername: username,
          targetPlatform: platform,
          reason: reason || 'Ban via chat ao vivo',
          moderatorId: user.id,
        }
      } else if (action === 'unban') {
        endpoint = '/api/moderation/unban'
        body = {
          targetPlatformUserId: userId,
          targetPlatform: platform,
          moderatorId: user.id,
        }
      } else {
        return
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[Live] Erro na moderação:', data.error)
      }
    } catch (error) {
      console.error('[Live] Erro ao moderar:', error)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/favicon.webp"
                alt="WaveIGL"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-foreground">WaveIGL</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-400 flex items-center gap-1">
                <Tv className="w-4 h-4" />
                AO VIVO
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isOwnerUser && (
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}

            {isLogged ? (
              <>
                <span className="text-foreground font-medium">{getDisplayName()}</span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-foreground border-border hover:bg-muted"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/80"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Chat Section */}
        <div className="border-l border-border bg-card flex flex-col h-full shrink-0 w-[384px]">
          <div className="p-4 border-b border-border shrink-0">
            <h3 className="text-lg font-semibold text-foreground">Chat Unificado</h3>
            <p className="text-sm text-muted-foreground">Mensagens sincronizadas</p>
          </div>

          <div className="flex-1 min-h-0">
            <UnifiedChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isModerator={isModerator}
              onModerate={handleModerate}
              isLogged={isLogged}
              publicReadOnly={!isLogged}
              youtubeStatusFromSSE={youtubeStatus}
              currentUser={isLogged ? {
                id: user!.id,
                is_moderator: isModerator,
                role: (computedRole === 'user' ? (user!.role || 'user') : computedRole) as UserRole,
                linkedAccounts,
              } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
