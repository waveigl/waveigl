/**
 * Ações de moderação para cada plataforma
 * Implementa timeout e ban via APIs oficiais
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

const TWITCH_CHANNEL = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'

/**
 * Obtém o token do broadcaster para ações de moderação
 */
async function getBroadcasterToken(platform: 'twitch' | 'kick' | 'youtube'): Promise<{ token: string; broadcasterId: string } | null> {
  const db = getSupabaseAdmin()
  
  const channelName = platform === 'twitch' ? TWITCH_CHANNEL : 
                      platform === 'kick' ? 'waveigloficial' : 'waveigl'
  
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
  platform: 'twitch' | 'kick' | 'youtube'
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
    
    // POST https://api.twitch.tv/helix/moderation/bans
    // Timeout é um ban com duração
    const response = await fetch('https://api.twitch.tv/helix/moderation/bans?' + new URLSearchParams({
      broadcaster_id: broadcaster.broadcasterId,
      moderator_id: modPlatformId // Usando o ID do moderador
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
    
    // POST https://api.twitch.tv/helix/moderation/bans
    // Ban permanente (sem duration)
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

// ============ KICK ============

async function applyKickTimeout(userId: string, durationSeconds: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('kick')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }
    
    // Kick API: POST /public/v1/channels/{broadcaster_user_id}/bans
    const response = await fetch(`https://api.kick.com/public/v1/channels/${broadcaster.broadcasterId}/bans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        banned_user_id: parseInt(userId),
        duration_minutes: Math.ceil(durationSeconds / 60), // Kick usa minutos
        reason: reason || 'Timeout via WaveIGL'
      })
    })
    
    if (response.ok) {
      console.log(`[Kick] ✅ Timeout aplicado para ${userId}`)
      return { success: true }
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error(`[Kick] Erro ao aplicar timeout:`, response.status, errorData)
    return { success: false, error: errorData.message || `Erro ${response.status}` }
    
  } catch (error) {
    console.error('[Kick] Erro ao aplicar timeout:', error)
    return { success: false, error: String(error) }
  }
}

async function applyKickBan(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('kick')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }
    
    // Kick API: POST /public/v1/channels/{broadcaster_user_id}/bans
    // Ban permanente (sem duration)
    const response = await fetch(`https://api.kick.com/public/v1/channels/${broadcaster.broadcasterId}/bans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${broadcaster.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        banned_user_id: parseInt(userId),
        permanent: true,
        reason: reason || 'Ban via WaveIGL'
      })
    })
    
    if (response.ok) {
      console.log(`[Kick] ✅ Ban aplicado para ${userId}`)
      return { success: true }
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error(`[Kick] Erro ao aplicar ban:`, response.status, errorData)
    return { success: false, error: errorData.message || `Erro ${response.status}` }
    
  } catch (error) {
    console.error('[Kick] Erro ao aplicar ban:', error)
    return { success: false, error: String(error) }
  }
}

// ============ YOUTUBE ============

async function applyYouTubeTimeout(userId: string, durationSeconds: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('youtube')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }
    
    // YouTube Live Chat API: liveChatBans.insert
    // Primeiro precisamos do liveChatId ativo
    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()
    
    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      return { success: false, error: 'Não há live ativa no YouTube' }
    }
    
    // YouTube usa segundos para timeout (banDurationSeconds)
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
          bannedUserDetails: {
            channelId: userId
          }
        }
      })
    })
    
    if (response.ok) {
      console.log(`[YouTube] ✅ Timeout aplicado para ${userId}`)
      return { success: true }
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error(`[YouTube] Erro ao aplicar timeout:`, response.status, errorData)
    return { success: false, error: errorData.error?.message || `Erro ${response.status}` }
    
  } catch (error) {
    console.error('[YouTube] Erro ao aplicar timeout:', error)
    return { success: false, error: String(error) }
  }
}

async function applyYouTubeBan(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const broadcaster = await getBroadcasterToken('youtube')
    if (!broadcaster) {
      return { success: false, error: 'Token do broadcaster não disponível' }
    }
    
    // YouTube Live Chat API: liveChatBans.insert
    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()
    
    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      return { success: false, error: 'Não há live ativa no YouTube' }
    }
    
    // Ban permanente
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
          bannedUserDetails: {
            channelId: userId
          }
        }
      })
    })
    
    if (response.ok) {
      console.log(`[YouTube] ✅ Ban aplicado para ${userId}`)
      return { success: true }
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error(`[YouTube] Erro ao aplicar ban:`, response.status, errorData)
    return { success: false, error: errorData.error?.message || `Erro ${response.status}` }
    
  } catch (error) {
    console.error('[YouTube] Erro ao aplicar ban:', error)
    return { success: false, error: String(error) }
  }
}

