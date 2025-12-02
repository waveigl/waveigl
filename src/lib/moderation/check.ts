/**
 * Funções para verificar status de moderador nas plataformas
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

// Canal do WaveIGL em cada plataforma
const WAVEIGL_CHANNELS = {
  twitch: process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl',
  kick: 'waveigloficial',
  youtube: process.env.YOUTUBE_CHANNEL_ID || ''
}

// IDs dos broadcasters
const TWITCH_BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID || ''
const KICK_BROADCASTER_USER_ID = process.env.KICK_BROADCASTER_USER_ID || '54454625'

// Username do broadcaster da Twitch (para buscar no banco)
const TWITCH_BROADCASTER_USERNAME = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'

/**
 * Obtém o token de acesso do broadcaster da Twitch (waveigl)
 * Necessário para verificar moderadores via API
 */
async function getTwitchBroadcasterToken(): Promise<{ accessToken: string; broadcasterId: string } | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Primeiro, tentar buscar pelo username do broadcaster
    const { data: broadcasterAccount } = await supabase
      .from('linked_accounts')
      .select('platform_user_id, access_token')
      .eq('platform', 'twitch')
      .ilike('platform_username', TWITCH_BROADCASTER_USERNAME)
      .maybeSingle()
    
    if (broadcasterAccount?.access_token) {
      console.log('[Twitch] Token do broadcaster encontrado via username:', TWITCH_BROADCASTER_USERNAME)
      return {
        accessToken: broadcasterAccount.access_token,
        broadcasterId: broadcasterAccount.platform_user_id
      }
    }
    
    // Fallback: usar ID configurado via env
    if (TWITCH_BROADCASTER_ID) {
      const { data: byId } = await supabase
        .from('linked_accounts')
        .select('access_token')
        .eq('platform', 'twitch')
        .eq('platform_user_id', TWITCH_BROADCASTER_ID)
        .maybeSingle()
      
      if (byId?.access_token) {
        console.log('[Twitch] Token do broadcaster encontrado via ID:', TWITCH_BROADCASTER_ID)
        return {
          accessToken: byId.access_token,
          broadcasterId: TWITCH_BROADCASTER_ID
        }
      }
    }
    
    console.log('[Twitch] Token do broadcaster não encontrado. O streamer waveigl precisa vincular a conta.')
    return null
  } catch (error) {
    console.error('[Twitch] Erro ao obter token do broadcaster:', error)
    return null
  }
}

/**
 * Verifica se o usuário é moderador no canal da Twitch do WaveIGL
 * Usa o endpoint Get Moderated Channels com scope user:read:moderated_channels
 * Ref: https://dev.twitch.tv/docs/api/reference#get-moderated-channels
 */
export async function checkTwitchModeratorStatus(
  userId: string,
  userAccessToken: string,
  clientId: string
): Promise<boolean> {
  try {
    // Primeiro, obter informações do canal waveigl para pegar o broadcaster_id
    const channelResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${WAVEIGL_CHANNELS.twitch}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Client-Id': clientId
        }
      }
    )
    
    const channelData = await channelResponse.json()
    const broadcasterId = channelData.data?.[0]?.id
    
    if (!broadcasterId) {
      console.log('[Twitch Mod Check] Canal não encontrado:', WAVEIGL_CHANNELS.twitch)
      return false
    }
    
    console.log('[Twitch Mod Check] Broadcaster ID do canal waveigl:', broadcasterId)
    
    // Verificar se o usuário é o próprio broadcaster (broadcaster é automaticamente "mod")
    if (userId === broadcasterId) {
      console.log('[Twitch Mod Check] Usuário é o broadcaster - tem todas as permissões')
      return true
    }
    
    // Usar endpoint Get Moderated Channels (requer scope user:read:moderated_channels)
    // Este endpoint lista todos os canais onde o usuário autenticado é moderador
    // Ref: https://dev.twitch.tv/docs/api/reference#get-moderated-channels
    console.log('[Twitch Mod Check] Verificando canais moderados pelo usuário...')
    
    const modChannelsResponse = await fetch(
      `https://api.twitch.tv/helix/moderation/channels?user_id=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Client-Id': clientId
        }
      }
    )
    
    if (!modChannelsResponse.ok) {
      const errorText = await modChannelsResponse.text()
      console.log('[Twitch Mod Check] Erro ao buscar canais moderados:', modChannelsResponse.status, errorText)
      
      // Se o erro for 401/403, pode ser que o scope não foi autorizado
      if (modChannelsResponse.status === 401 || modChannelsResponse.status === 403) {
        console.log('[Twitch Mod Check] Scope user:read:moderated_channels pode não estar autorizado')
      }
      
      // Fallback: tentar via token do broadcaster
      return await checkViasBroadcasterToken(userId, clientId)
    }
    
    const modChannelsData = await modChannelsResponse.json()
    console.log('[Twitch Mod Check] Canais moderados encontrados:', modChannelsData.data?.length || 0)
    
    // Verificar se o canal waveigl está na lista de canais que o usuário modera
    const isModInChannel = modChannelsData.data?.some(
      (channel: { broadcaster_id: string; broadcaster_login: string }) => {
        console.log('[Twitch Mod Check] Canal encontrado:', channel.broadcaster_login, channel.broadcaster_id)
        return channel.broadcaster_id === broadcasterId
      }
    )
    
    if (isModInChannel) {
      console.log('[Twitch Mod Check] ✅ Usuário é moderador no canal', WAVEIGL_CHANNELS.twitch)
      return true
    }
    
    console.log('[Twitch Mod Check] ❌ Usuário não é moderador no canal', WAVEIGL_CHANNELS.twitch)
    return false
    
  } catch (error) {
    console.error('[Twitch Mod Check] Erro:', error)
    return false
  }
}

/**
 * Fallback: Verificar moderador usando token do broadcaster
 */
async function checkViasBroadcasterToken(userId: string, clientId: string): Promise<boolean> {
  console.log('[Twitch Mod Check] Tentando fallback via token do broadcaster...')
  
  const broadcasterData = await getTwitchBroadcasterToken()
  
  if (!broadcasterData) {
    console.log('[Twitch Mod Check] Token do broadcaster não disponível')
    return false
  }
  
  const modResponse = await fetch(
    `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcasterData.broadcasterId}&user_id=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${broadcasterData.accessToken}`,
        'Client-Id': clientId
      }
    }
  )
  
  if (modResponse.ok) {
    const modData = await modResponse.json()
    const isModerator = modData.data && modData.data.length > 0
    
    console.log('[Twitch Mod Check] Via broadcaster token - é moderador:', isModerator)
    return isModerator
  } else {
    const errorText = await modResponse.text()
    console.log('[Twitch Mod Check] Erro no fallback:', modResponse.status, errorText)
  }
  
  return false
}

/**
 * Verifica se o usuário é moderador no canal da Kick do WaveIGL
 */
export async function checkKickModeratorStatus(
  userId: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é o próprio broadcaster
    if (userId === KICK_BROADCASTER_USER_ID) {
      console.log('[Kick Mod Check] Usuário é o broadcaster')
      return true
    }
    
    // A API da Kick não tem um endpoint direto para verificar moderadores
    // Vamos tentar usar o endpoint de channels para ver se retorna informações de moderador
    const response = await fetch(
      `https://api.kick.com/public/v1/channels?broadcaster_user_id=${KICK_BROADCASTER_USER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.log('[Kick Mod Check] Resposta:', response.status)
      return false
    }
    
    const data = await response.json()
    
    // Verificar se há informação de role na resposta
    // A estrutura pode variar, então verificamos vários campos
    const channelData = data.data?.[0]
    if (channelData?.role === 'moderator' || channelData?.is_moderator) {
      console.log('[Kick Mod Check] Usuário é moderador')
      return true
    }
    
    console.log('[Kick Mod Check] Usuário não é moderador')
    return false
    
  } catch (error) {
    console.error('[Kick Mod Check] Erro:', error)
    return false
  }
}

/**
 * Verifica se o usuário é moderador no canal do YouTube do WaveIGL
 * Nota: YouTube Live Chat não tem um endpoint direto para verificar moderadores
 * A verificação é feita quando o usuário envia uma mensagem e recebe badges
 */
export async function checkYouTubeModeratorStatus(
  accessToken: string
): Promise<boolean> {
  // YouTube não tem um endpoint simples para verificar moderadores
  // A verificação será feita via badges nas mensagens
  console.log('[YouTube Mod Check] Verificação via API não disponível, usando badges')
  return false
}

