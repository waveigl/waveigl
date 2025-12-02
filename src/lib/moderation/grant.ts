/**
 * Funções para conceder moderação real nas plataformas
 * Requer que o streamer tenha vinculado sua conta com os scopes adequados
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

// Configuração do canal WaveIGL
const WAVEIGL_CHANNELS = {
  twitch: process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl',
  kick: 'waveigloficial',
  youtube: process.env.YOUTUBE_CHANNEL_ID || ''
}

interface GrantResult {
  success: boolean
  error?: string
  platform: string
}

/**
 * Obtém o token do broadcaster da Twitch (waveigl)
 * Necessário para adicionar moderadores
 */
async function getTwitchBroadcasterToken(): Promise<{ 
  accessToken: string
  broadcasterId: string 
} | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Buscar a conta do broadcaster waveigl
    const { data: broadcasterAccount } = await supabase
      .from('linked_accounts')
      .select('platform_user_id, access_token, authorized_scopes')
      .eq('platform', 'twitch')
      .ilike('platform_username', WAVEIGL_CHANNELS.twitch)
      .maybeSingle()
    
    if (!broadcasterAccount?.access_token) {
      console.log('[Grant Mod] Token do broadcaster waveigl não encontrado')
      return null
    }
    
    // Verificar se o broadcaster tem o scope necessário
    const scopes = broadcasterAccount.authorized_scopes as string[] | null
    if (!scopes?.includes('channel:manage:moderators')) {
      console.log('[Grant Mod] Broadcaster não tem scope channel:manage:moderators')
      return null
    }
    
    return {
      accessToken: broadcasterAccount.access_token,
      broadcasterId: broadcasterAccount.platform_user_id
    }
  } catch (error) {
    console.error('[Grant Mod] Erro ao obter token do broadcaster:', error)
    return null
  }
}

/**
 * Adiciona um usuário como moderador no canal da Twitch do WaveIGL
 * 
 * Endpoint: POST https://api.twitch.tv/helix/moderation/moderators
 * Scope necessário: channel:manage:moderators (do broadcaster)
 * 
 * @param userId - ID do usuário da Twitch a ser promovido
 * @returns Resultado da operação
 */
export async function grantTwitchModerator(userId: string): Promise<GrantResult> {
  try {
    console.log(`[Grant Mod] Tentando adicionar moderador na Twitch: ${userId}`)
    
    // Obter token do broadcaster
    const broadcasterData = await getTwitchBroadcasterToken()
    
    if (!broadcasterData) {
      return {
        success: false,
        error: 'Token do broadcaster não disponível ou sem permissões adequadas',
        platform: 'twitch'
      }
    }
    
    const { accessToken, broadcasterId } = broadcasterData
    const clientId = process.env.TWITCH_CLIENT_ID!
    
    // Chamar API da Twitch para adicionar moderador
    const response = await fetch(
      `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcasterId}&user_id=${userId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': clientId,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.status === 204) {
      console.log(`[Grant Mod] ✅ Usuário ${userId} adicionado como moderador na Twitch`)
      return {
        success: true,
        platform: 'twitch'
      }
    }
    
    // Tratar erros específicos
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData.message || 'Requisição inválida'
      
      // Usuário já é moderador
      if (message.includes('already a moderator')) {
        console.log(`[Grant Mod] Usuário ${userId} já é moderador na Twitch`)
        return {
          success: true, // Consideramos sucesso pois o objetivo foi alcançado
          platform: 'twitch'
        }
      }
      
      console.error(`[Grant Mod] Erro 400: ${message}`)
      return {
        success: false,
        error: message,
        platform: 'twitch'
      }
    }
    
    if (response.status === 401) {
      console.error('[Grant Mod] Token inválido ou expirado')
      return {
        success: false,
        error: 'Token do broadcaster inválido ou expirado',
        platform: 'twitch'
      }
    }
    
    if (response.status === 422) {
      console.error('[Grant Mod] Usuário é VIP - precisa remover VIP primeiro')
      return {
        success: false,
        error: 'Usuário é VIP. Remova o VIP antes de promover a moderador.',
        platform: 'twitch'
      }
    }
    
    if (response.status === 429) {
      console.error('[Grant Mod] Rate limit excedido')
      return {
        success: false,
        error: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
        platform: 'twitch'
      }
    }
    
    const errorText = await response.text()
    console.error(`[Grant Mod] Erro ${response.status}: ${errorText}`)
    return {
      success: false,
      error: `Erro ${response.status}: ${errorText}`,
      platform: 'twitch'
    }
    
  } catch (error) {
    console.error('[Grant Mod] Erro ao adicionar moderador na Twitch:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      platform: 'twitch'
    }
  }
}

/**
 * Remove um usuário como moderador no canal da Twitch do WaveIGL
 * 
 * @param userId - ID do usuário da Twitch a ser removido
 * @returns Resultado da operação
 */
export async function revokeTwitchModerator(userId: string): Promise<GrantResult> {
  try {
    console.log(`[Grant Mod] Tentando remover moderador na Twitch: ${userId}`)
    
    const broadcasterData = await getTwitchBroadcasterToken()
    
    if (!broadcasterData) {
      return {
        success: false,
        error: 'Token do broadcaster não disponível',
        platform: 'twitch'
      }
    }
    
    const { accessToken, broadcasterId } = broadcasterData
    const clientId = process.env.TWITCH_CLIENT_ID!
    
    const response = await fetch(
      `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcasterId}&user_id=${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': clientId
        }
      }
    )
    
    if (response.status === 204) {
      console.log(`[Grant Mod] ✅ Usuário ${userId} removido como moderador na Twitch`)
      return {
        success: true,
        platform: 'twitch'
      }
    }
    
    const errorText = await response.text()
    console.error(`[Grant Mod] Erro ${response.status}: ${errorText}`)
    return {
      success: false,
      error: `Erro ${response.status}: ${errorText}`,
      platform: 'twitch'
    }
    
  } catch (error) {
    console.error('[Grant Mod] Erro ao remover moderador na Twitch:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      platform: 'twitch'
    }
  }
}

/**
 * Adiciona um usuário como moderador no YouTube Live Chat
 * 
 * NOTA: Funciona apenas durante transmissões ao vivo
 * Endpoint: liveChatModerators.insert
 * 
 * @param channelId - ID do canal do YouTube do usuário
 * @param liveChatId - ID do live chat ativo
 * @returns Resultado da operação
 */
export async function grantYouTubeModerator(
  channelId: string,
  liveChatId: string
): Promise<GrantResult> {
  try {
    console.log(`[Grant Mod] Tentando adicionar moderador no YouTube: ${channelId}`)
    
    const supabase = getSupabaseAdmin()
    
    // Buscar token do canal WaveIGL no YouTube
    const { data: broadcasterAccount } = await supabase
      .from('linked_accounts')
      .select('access_token')
      .eq('platform', 'youtube')
      .eq('platform_user_id', WAVEIGL_CHANNELS.youtube)
      .maybeSingle()
    
    if (!broadcasterAccount?.access_token) {
      return {
        success: false,
        error: 'Token do canal YouTube não disponível',
        platform: 'youtube'
      }
    }
    
    // Chamar API do YouTube para adicionar moderador
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/moderators?part=snippet`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${broadcasterAccount.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            liveChatId: liveChatId,
            moderatorDetails: {
              channelId: channelId
            }
          }
        })
      }
    )
    
    if (response.ok) {
      console.log(`[Grant Mod] ✅ Usuário ${channelId} adicionado como moderador no YouTube`)
      return {
        success: true,
        platform: 'youtube'
      }
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error(`[Grant Mod] Erro YouTube ${response.status}:`, errorData)
    return {
      success: false,
      error: errorData.error?.message || `Erro ${response.status}`,
      platform: 'youtube'
    }
    
  } catch (error) {
    console.error('[Grant Mod] Erro ao adicionar moderador no YouTube:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      platform: 'youtube'
    }
  }
}

/**
 * Tenta conceder moderação em todas as plataformas disponíveis
 * 
 * @param userId - ID do usuário no sistema WaveIGL
 * @returns Resultados por plataforma
 */
export async function grantModeratorAllPlatforms(userId: string): Promise<{
  results: GrantResult[]
  anySuccess: boolean
}> {
  const supabase = getSupabaseAdmin()
  
  // Buscar contas vinculadas do usuário
  const { data: linkedAccounts, error } = await supabase
    .from('linked_accounts')
    .select('platform, platform_user_id')
    .eq('user_id', userId)
  
  if (error || !linkedAccounts) {
    return {
      results: [{
        success: false,
        error: 'Erro ao buscar contas vinculadas',
        platform: 'all'
      }],
      anySuccess: false
    }
  }
  
  const results: GrantResult[] = []
  
  // Tentar adicionar moderador em cada plataforma
  for (const account of linkedAccounts) {
    if (account.platform === 'twitch') {
      const result = await grantTwitchModerator(account.platform_user_id)
      results.push(result)
    }
    // Kick não suporta adicionar moderadores via API
    // YouTube requer liveChatId ativo
  }
  
  const anySuccess = results.some(r => r.success)
  
  return { results, anySuccess }
}

