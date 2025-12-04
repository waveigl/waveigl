/**
 * Inicialização das funções de envio para o sistema de filas
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import tmi from 'tmi.js'

const TWITCH_CHANNEL = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'

/**
 * Interface para o MessageQueue
 */
interface MessageQueue {
  registerSendFunction(platform: string, fn: (message: string) => Promise<boolean>): void
}

/**
 * Envia mensagem na Twitch como streamer
 */
async function sendTwitchMessage(message: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: streamerAccount } = await supabase
      .from('linked_accounts')
      .select('platform_username, access_token')
      .eq('platform', 'twitch')
      .ilike('platform_username', TWITCH_CHANNEL)
      .maybeSingle()
    
    if (!streamerAccount?.access_token) {
      console.log('[Queue-Twitch] Token do streamer não encontrado')
      return false
    }
    
    const client = new tmi.Client({
      identity: {
        username: streamerAccount.platform_username,
        password: `oauth:${streamerAccount.access_token}`
      },
      channels: [TWITCH_CHANNEL],
      connection: { secure: true, reconnect: false }
    })
    
    await client.connect()
    await client.say(TWITCH_CHANNEL, message)
    await client.disconnect()
    
    console.log('[Queue-Twitch] ✅ Mensagem enviada')
    return true
  } catch (error) {
    console.error('[Queue-Twitch] Erro ao enviar:', error)
    return false
  }
}

/**
 * Renova o token da Kick usando refresh_token
 */
async function refreshKickTokenForBroadcaster(
  refreshToken: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KICK_CLIENT_ID!,
        client_secret: process.env.KICK_CLIENT_SECRET!,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Queue-Kick] Erro ao renovar token:', response.status, errorData)
      return null
    }

    const tokenData = await response.json()

    if (tokenData.access_token) {
      // Atualizar no banco de dados
      const supabase = getSupabaseAdmin()
      await supabase
        .from('linked_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || refreshToken
        })
        .eq('user_id', userId)
        .eq('platform', 'kick')

      console.log('[Queue-Kick] ✅ Token renovado com sucesso')
      return tokenData.access_token
    }

    return null
  } catch (error) {
    console.error('[Queue-Kick] Erro ao renovar token:', error)
    return null
  }
}

/**
 * Envia mensagem na Kick como streamer (waveigloficial)
 * Inclui refresh automático de token se expirado
 */
async function sendKickMessage(message: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: broadcasterAccount } = await supabase
      .from('linked_accounts')
      .select('user_id, access_token, refresh_token, platform_user_id')
      .eq('platform', 'kick')
      .ilike('platform_username', 'waveigloficial')
      .maybeSingle()
    
    if (!broadcasterAccount?.access_token) {
      console.log('[Queue-Kick] Token do broadcaster não encontrado')
      return false
    }
    
    // Função para tentar enviar
    const tryToSend = async (token: string): Promise<Response> => {
      return fetch('https://api.kick.com/public/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          broadcaster_user_id: parseInt(broadcasterAccount.platform_user_id),
          content: message,
          type: 'user'
        })
      })
    }
    
    // Primeira tentativa
    let response = await tryToSend(broadcasterAccount.access_token)
    
    // Se receber 401, tentar renovar o token
    if (response.status === 401 && broadcasterAccount.refresh_token) {
      console.log('[Queue-Kick] Token expirado, tentando renovar...')
      
      const newToken = await refreshKickTokenForBroadcaster(
        broadcasterAccount.refresh_token,
        broadcasterAccount.user_id
      )
      
      if (newToken) {
        // Tentar novamente com o novo token
        response = await tryToSend(newToken)
      }
    }
    
    if (response.ok) {
      console.log('[Queue-Kick] ✅ Mensagem enviada')
      return true
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error('[Queue-Kick] Erro:', response.status, errorData)
    return false
    
  } catch (error) {
    console.error('[Queue-Kick] Erro ao enviar:', error)
    return false
  }
}

/**
 * Envia mensagem no YouTube como streamer (waveigl) - se tiver live ativa
 * IMPORTANTE: Deve usar APENAS a conta do streamer (waveigl) para enviar mensagens
 */
async function sendYouTubeMessage(message: string): Promise<boolean> {
  try {
    // Importar dinamicamente para evitar dependência circular
    const { getCachedYouTubeLive } = await import('@/lib/youtube/live')
    const liveInfo = await getCachedYouTubeLive()
    
    if (!liveInfo.isLive || !liveInfo.liveChatId) {
      console.log('[Queue-YouTube] Não há live ativa, pulando...')
      return true // Retorna true para não bloquear a fila
    }
    
    const supabase = getSupabaseAdmin()
    
    // IMPORTANTE: Buscar APENAS a conta do streamer (waveigl)
    // Primeiro tentar pelo channel handle/username
    let youtubeAccount = null
    
    // Buscar conta do waveigl (streamer)
    const { data: streamerAccount } = await supabase
      .from('linked_accounts')
      .select('access_token, platform_username, refresh_token, user_id')
      .eq('platform', 'youtube')
      .not('access_token', 'is', null)
      .or('platform_username.ilike.%waveigl%,platform_username.ilike.@waveigl')
      .limit(1)
      .maybeSingle()
    
    if (streamerAccount?.access_token) {
      youtubeAccount = streamerAccount
      console.log(`[Queue-YouTube] Usando conta do streamer: ${streamerAccount.platform_username}`)
    } else {
      // Fallback: buscar a conta que tem o channel ID do waveigl
      // Channel ID do waveigl: UCgCA2McqOsFiZUU-MgaXyaA
      const { data: channelAccount } = await supabase
        .from('linked_accounts')
        .select('access_token, platform_username, refresh_token, user_id')
        .eq('platform', 'youtube')
        .eq('platform_user_id', 'UCgCA2McqOsFiZUU-MgaXyaA')
        .not('access_token', 'is', null)
        .maybeSingle()
      
      if (channelAccount?.access_token) {
        youtubeAccount = channelAccount
        console.log(`[Queue-YouTube] Usando conta por channel ID: ${channelAccount.platform_username}`)
      }
    }
    
    if (!youtubeAccount?.access_token) {
      console.log('[Queue-YouTube] Token do streamer (waveigl) não encontrado')
      return true // Retorna true para não bloquear a fila
    }
    
    // Verificar se o token é válido, se não, tentar renovar
    let accessToken = youtubeAccount.access_token
    
    const tokenCheck = await fetch(
      'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken
    )
    
    if (!tokenCheck.ok && youtubeAccount.refresh_token) {
      console.log('[Queue-YouTube] Token expirado, renovando...')
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: youtubeAccount.refresh_token,
          grant_type: 'refresh_token'
        })
      })
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json()
        accessToken = tokenData.access_token
        
        // Atualizar no banco
        await supabase
          .from('linked_accounts')
          .update({ access_token: accessToken })
          .eq('user_id', youtubeAccount.user_id)
          .eq('platform', 'youtube')
        
        console.log('[Queue-YouTube] ✅ Token renovado')
      } else {
        console.log('[Queue-YouTube] Falha ao renovar token')
        return true // Retorna true para não bloquear a fila
      }
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            liveChatId: liveInfo.liveChatId,
            type: 'textMessageEvent',
            textMessageDetails: {
              messageText: message
            }
          }
        })
      }
    )
    
    if (response.ok) {
      console.log('[Queue-YouTube] ✅ Mensagem enviada como streamer')
      return true
    }
    
    const errorData = await response.json().catch(() => ({}))
    console.error('[Queue-YouTube] Erro:', response.status, errorData)
    return false
    
  } catch (error) {
    console.error('[Queue-YouTube] Erro ao enviar:', error)
    return false
  }
}

/**
 * Inicializa as funções de envio no sistema de filas
 */
export function initializeQueueSenders(queue: MessageQueue): void {
  console.log('[Queue] Registrando funções de envio...')
  
  queue.registerSendFunction('twitch', sendTwitchMessage)
  queue.registerSendFunction('kick', sendKickMessage)
  queue.registerSendFunction('youtube', sendYouTubeMessage)
  
  console.log('[Queue] ✅ Funções de envio registradas')
}

