/**
 * Ações de moderação para cada plataforma
 * Implementa timeout e ban via APIs oficiais
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { moderationHub } from '@/lib/chat/hub'
import { Platform } from '@/types'

const TWITCH_CHANNEL = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'

/**
 * Obtém o token do broadcaster para ações de moderação
 */
async function getBroadcasterToken(platform: Platform): Promise<{ token: string; broadcasterId: string } | null> {
  const db = getSupabaseAdmin()

  const channelName = platform === 'twitch' ? TWITCH_CHANNEL :
    platform === 'kick' ? 'waveigl' : 'waveigl'

  const { data: account } = await db
    .from('linked_accounts')
    .select('access_token, platform_user_id')
    .eq('platform', platform)
    .ilike('platform_username', channelName)
    .maybeSingle()

  if (!account?.access_token) {
    console.error(`[Moderation] Token do broadcaster não encontrado para ${platform}`)
    return null
  }

  return { token: account.access_token, broadcasterId: account.platform_user_id }
}

/**
 * Obtém o token do moderador para ações de moderação
 * Permite que a ação apareça no nome do moderador ao invés do streamer
 */
async function getModeratorToken(
  moderatorId: string,
  platform: Platform
): Promise<{ token: string; moderatorPlatformId: string } | null> {
  const db = getSupabaseAdmin()

  const { data: account } = await db
    .from('linked_accounts')
    .select('access_token, platform_user_id')
    .eq('user_id', moderatorId)
    .eq('platform', platform)
    .maybeSingle()

  if (!account?.access_token) {
    console.log(`[Moderation] Token do moderador não encontrado para ${platform}, usando broadcaster`)
    return null
  }

  return { token: account.access_token, moderatorPlatformId: account.platform_user_id }
}

/**
 * Aplica timeout em uma plataforma específica
 * @param moderatorId - ID do moderador no sistema (para usar o token dele)
 */
export async function applyPlatformTimeout(
  platform: string,
  platformUserId: string,
  durationSeconds: number,
  reason?: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Moderation] Aplicando timeout no ${platform} para ${platformUserId}: ${durationSeconds}s (mod: ${moderatorId || 'broadcaster'})`)

  switch (platform) {
    case 'twitch':
      return applyTwitchTimeout(platformUserId, durationSeconds, reason, moderatorId)
    case 'youtube':
      return applyYouTubeTimeout(platformUserId, durationSeconds, reason)
    case 'kick':
      return applyKickTimeout(platformUserId, durationSeconds, reason)
    default:
      return { success: false, error: `Plataforma não suportada: ${platform}` }
  }
}

/**
 * Aplica ban em uma plataforma específica
 * @param moderatorId - ID do moderador no sistema (para usar o token dele)
 */
export async function applyPlatformBan(
  platform: string,
  platformUserId: string,
  reason?: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Moderation] Aplicando ban no ${platform} para ${platformUserId} (mod: ${moderatorId || 'broadcaster'})`)

  switch (platform) {
    case 'twitch':
      return applyTwitchBan(platformUserId, reason, moderatorId)
    case 'youtube':
      return applyYouTubeBan(platformUserId, reason)
    case 'kick':
      return applyKickBan(platformUserId, reason)
    default:
      return { success: false, error: `Plataforma não suportada: ${platform}` }
  }
}

/**
 * Remove ban/timeout de uma plataforma específica (unban)
 * @param moderatorId - ID do moderador no sistema (para usar o token dele)
 */
export async function applyPlatformUnban(
  platform: string,
  platformUserId: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Moderation] Removendo ban/timeout no ${platform} para ${platformUserId} (mod: ${moderatorId || 'broadcaster'})`)

  switch (platform) {
    case 'twitch':
      return applyTwitchUnban(platformUserId, moderatorId)
    case 'youtube':
      return applyYouTubeUnban(platformUserId)
    case 'kick':
      return applyKickUnban(platformUserId)
    default:
      return { success: false, error: `Plataforma não suportada: ${platform}` }
  }
}

// ============ TWITCH ============

async function applyTwitchTimeout(userId: string, durationSeconds: number, reason?: string, moderatorId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('twitch')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }

    // Tentar usar o token do moderador para que a ação apareça no nome dele
    let modToken = broadcaster.token
    let modPlatformId = broadcaster.broadcasterId

    if (moderatorId) {
      const moderator = await getModeratorToken(moderatorId, 'twitch')
      if (moderator) {
        modToken = moderator.token
        modPlatformId = moderator.moderatorPlatformId
        console.log(`[Twitch] Usando token do moderador: ${modPlatformId}`)
      }
    }

    const response = await fetch('https://api.twitch.tv/helix/moderation/bans?' + new URLSearchParams({
      broadcaster_id: broadcaster.broadcasterId,
      moderator_id: modPlatformId
    }), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          user_id: userId,
          duration: durationSeconds,
          reason: reason || 'Timeout via WaveIGL'
        }
      })
    })

    if (response.ok) {
      console.log(`[Twitch] ✅ Timeout aplicado para ${userId} por ${modPlatformId}`)

      moderationHub.publish({
        type: 'timeout',
        platform: 'twitch',
        username: userId,
        userId: userId,
        duration: durationSeconds,
        reason: reason,
        timestamp: Date.now()
      })

      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    console.error(`[Twitch] Erro ao aplicar timeout:`, response.status, errorData)
    return { success: false, error: errorData.message || `Erro ${response.status}` }

  } catch (error) {
    console.error('[Twitch] Erro ao aplicar timeout:', error)
    return { success: false, error: String(error) }
  }
}

async function applyTwitchBan(userId: string, reason?: string, moderatorId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('twitch')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }

    let modToken = broadcaster.token
    let modPlatformId = broadcaster.broadcasterId

    if (moderatorId) {
      const moderator = await getModeratorToken(moderatorId, 'twitch')
      if (moderator) {
        modToken = moderator.token
        modPlatformId = moderator.moderatorPlatformId
        console.log(`[Twitch] Usando token do moderador: ${modPlatformId}`)
      }
    }

    const response = await fetch('https://api.twitch.tv/helix/moderation/bans?' + new URLSearchParams({
      broadcaster_id: broadcaster.broadcasterId,
      moderator_id: modPlatformId
    }), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          user_id: userId,
          reason: reason || 'Ban via WaveIGL'
        }
      })
    })

    if (response.ok) {
      console.log(`[Twitch] ✅ Ban aplicado para ${userId} por ${modPlatformId}`)

      moderationHub.publish({
        type: 'ban',
        platform: 'twitch',
        username: userId,
        userId: userId,
        reason,
        timestamp: Date.now()
      })

      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    console.error(`[Twitch] Erro ao aplicar ban:`, response.status, errorData)
    return { success: false, error: errorData.message || `Erro ${response.status}` }

  } catch (error) {
    console.error('[Twitch] Erro ao aplicar ban:', error)
    return { success: false, error: String(error) }
  }
}

async function applyTwitchUnban(userId: string, moderatorId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('twitch')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }

    let modToken = broadcaster.token
    let modPlatformId = broadcaster.broadcasterId

    if (moderatorId) {
      const moderator = await getModeratorToken(moderatorId, 'twitch')
      if (moderator) {
        modToken = moderator.token
        modPlatformId = moderator.moderatorPlatformId
      }
    }

    const response = await fetch('https://api.twitch.tv/helix/moderation/bans?' + new URLSearchParams({
      broadcaster_id: broadcaster.broadcasterId,
      moderator_id: modPlatformId,
      user_id: userId
    }), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!
      }
    })

    if (response.ok || response.status === 204) {
      console.log(`[Twitch] ✅ Unban aplicado para ${userId}`)

      moderationHub.publish({
        type: 'unban',
        platform: 'twitch',
        username: userId,
        userId: userId,
        timestamp: Date.now()
      })

      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    return { success: false, error: errorData.message || `Erro ${response.status}` }

  } catch (error) {
    console.error('[Twitch] Erro ao aplicar unban:', error)
    return { success: false, error: String(error) }
  }
}

// ============ KICK ============

async function applyKickTimeout(userId: string, durationSeconds: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('kick')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    // Implementação básica do Kick via API de v2 (requer token correto)
    const response = await fetch(`https://api.kick.com/public/v1/channels/${broadcaster.broadcasterId}/bans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        banned_user_id: parseInt(userId),
        duration_minutes: Math.ceil(durationSeconds / 60),
        reason: reason || 'Timeout via WaveIGL'
      })
    })

    if (response.ok) {
      moderationHub.publish({
        type: 'timeout',
        platform: 'kick',
        username: userId,
        userId: userId,
        duration: durationSeconds,
        reason,
        timestamp: Date.now()
      })
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    return { success: false, error: errorData.message || `Erro ${response.status}` }
  } catch (error) {
    console.error('[Kick] Erro ao aplicar timeout:', error)
    return { success: false, error: String(error) }
  }
}

async function applyKickBan(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('kick')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    const response = await fetch(`https://api.kick.com/public/v1/channels/${broadcaster.broadcasterId}/bans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        banned_user_id: parseInt(userId),
        permanent: true,
        reason: reason || 'Ban via WaveIGL'
      })
    })

    if (response.ok) {
      moderationHub.publish({
        type: 'ban',
        platform: 'kick',
        username: userId,
        userId: userId,
        reason,
        timestamp: Date.now()
      })
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    return { success: false, error: errorData.message || `Erro ${response.status}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function applyKickUnban(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('kick')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    const response = await fetch(`https://api.kick.com/public/v1/channels/${broadcaster.broadcasterId}/bans/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`
      }
    })

    if (response.ok || response.status === 204) {
      moderationHub.publish({
        type: 'unban',
        platform: 'kick',
        username: userId,
        userId: userId,
        timestamp: Date.now()
      })
      return { success: true }
    }

    return { success: false, error: `Erro ${response.status}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============ YOUTUBE ============

async function applyYouTubeTimeout(userId: string, durationSeconds: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('youtube')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()

    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      return { success: false, error: 'Não há live ativa no YouTube' }
    }

    const response = await fetch('https://www.googleapis.com/youtube/v3/liveChatBans?part=snippet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          liveChatId: liveInfo.liveChatId,
          type: 'temporary',
          banDurationSeconds: durationSeconds,
          bannedUserDetails: { channelId: userId }
        }
      })
    })

    if (response.ok) {
      moderationHub.publish({
        type: 'timeout',
        platform: 'youtube',
        username: userId,
        userId: userId,
        duration: durationSeconds,
        reason,
        timestamp: Date.now()
      })
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    return { success: false, error: errorData.error?.message || `Erro ${response.status}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function applyYouTubeBan(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('youtube')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()

    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      return { success: false, error: 'Não há live ativa no YouTube' }
    }

    const response = await fetch('https://www.googleapis.com/youtube/v3/liveChatBans?part=snippet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          liveChatId: liveInfo.liveChatId,
          type: 'permanent',
          bannedUserDetails: { channelId: userId }
        }
      })
    })

    if (response.ok) {
      moderationHub.publish({
        type: 'ban',
        platform: 'youtube',
        username: userId,
        userId: userId,
        reason,
        timestamp: Date.now()
      })
      return { success: true }
    }

    return { success: false, error: `Erro ${response.status}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function applyYouTubeUnban(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('youtube')
    if (!broadcaster) return { success: false, error: 'Token do broadcaster não disponível' }

    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()

    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      return { success: false, error: 'Não há live ativa no YouTube' }
    }

    // Buscar lista de bans para achar o banId
    const listResponse = await fetch(`https://www.googleapis.com/youtube/v3/liveChatBans?liveChatId=${liveInfo.liveChatId}&part=snippet`, {
      headers: { 'Authorization': `Bearer ${broadcaster.token}` }
    })

    if (listResponse.ok) {
      const data = await listResponse.json()
      const userBan = data.items?.find((item: any) => item.snippet?.bannedUserDetails?.channelId === userId)

      if (userBan) {
        const deleteResponse = await fetch(`https://www.googleapis.com/youtube/v3/liveChatBans?id=${userBan.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${broadcaster.token}` }
        })

        if (deleteResponse.ok) {
          moderationHub.publish({
            type: 'unban',
            platform: 'youtube',
            username: userId,
            userId: userId,
            timestamp: Date.now()
          })
          return { success: true }
        }
      }
    }

    return { success: false, error: 'Punição não encontrada ou erro na API' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Busca o ID de um usuário na plataforma pelo username
 */
export async function getPlatformUserIdByName(platform: string, username: string): Promise<string | null> {
  const db = getSupabaseAdmin()
  const cleanUsername = username.replace('@', '').trim()

  // 1. Tentar buscar no banco primeiro
  const { data: account } = await db
    .from('linked_accounts')
    .select('platform_user_id')
    .eq('platform', platform)
    .ilike('platform_username', cleanUsername)
    .maybeSingle()

  if (account?.platform_user_id) {
    return account.platform_user_id
  }

  // 2. Tentar via API se não houver no banco (especialmente Twitch)
  if (platform === 'twitch') {
    try {
      const broadcaster = await getBroadcasterToken('twitch')
      if (!broadcaster) return null

      const response = await fetch(`https://api.twitch.tv/helix/users?login=${cleanUsername}`, {
        headers: {
          'Authorization': `Bearer ${broadcaster.token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.data?.[0]?.id || null
      }
    } catch (e) {
      console.error('[Moderation] Erro ao buscar usuário na Twitch:', e)
    }
  }

  // Kick e YouTube por enquanto dependem do banco ou já estarem no chat (ID passado)
  return null
}
