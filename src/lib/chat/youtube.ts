import { chatHub } from './hub'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCachedYouTubeLive } from '@/lib/youtube/live'

let readerStarted = false
let currentLiveChatId: string | null = null
let pollingInterval: NodeJS.Timeout | null = null
let nextPageToken: string | null = null
let lastLoggedState: string = '' // Para evitar spam de logs
let processedMessageIds = new Set<string>() // Para evitar duplicatas

// Intervalo de polling (em ms)
const CHAT_POLLING_INTERVAL = 5000 // 5 segundos quando há live
const LIVE_CHECK_INTERVAL = 60000 // 60 segundos para verificar se há live

/**
 * Obtém um token de acesso do YouTube de qualquer conta vinculada
 * Prioriza contas que possam ter acesso ao chat
 */
async function getYouTubeToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Buscar qualquer conta do YouTube vinculada
    const { data: accounts } = await supabase
      .from('linked_accounts')
      .select('access_token, platform_user_id, platform_username')
      .eq('platform', 'youtube')
      .not('access_token', 'is', null)
    
    if (accounts && accounts.length > 0) {
      // Retornar o primeiro token disponível
      return accounts[0].access_token
    }
    
    return null
  } catch (error) {
    console.error('[YouTube] Erro ao obter token:', error)
    return null
  }
}

/**
 * Log apenas quando o estado mudar (evita spam)
 */
function logStateChange(state: string, message: string) {
  if (lastLoggedState !== state) {
    console.log(message)
    lastLoggedState = state
  }
}

/**
 * Busca o liveChatId usando o módulo de detecção de live
 */
async function detectLiveChatId(): Promise<string | null> {
  try {
    const liveInfo = await getCachedYouTubeLive()
    
    if (liveInfo.isLive && liveInfo.liveChatId) {
      logStateChange('live_found', `[YouTube] ✅ Live detectada: ${liveInfo.videoId}, chatId: ${liveInfo.liveChatId}`)
      return liveInfo.liveChatId
    }
    
    if (liveInfo.isLive && !liveInfo.liveChatId) {
      logStateChange('live_no_chat', `[YouTube] Live encontrada mas sem chatId disponível`)
    }
    
    return null
  } catch (error) {
    // Silencioso
    return null
  }
}

/**
 * Verifica se há uma live ativa no momento
 */
export async function isYouTubeLiveActive(): Promise<boolean> {
  try {
    const liveInfo = await getCachedYouTubeLive()
    return liveInfo.isLive
  } catch {
    return false
  }
}

/**
 * Busca o liveChatId via API OAuth (fallback)
 */
async function detectLiveChatIdViaOAuth(accessToken: string): Promise<string | null> {
  try {
    const channelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || 'waveigl'
    const channelId = process.env.YOUTUBE_CHANNEL_ID
    
    let targetChannelId = channelId
    
    // Se não tem ID, buscar pelo handle
    if (!targetChannelId) {
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channelHandle}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      )
      
      if (channelResponse.ok) {
        const channelData = await channelResponse.json()
        targetChannelId = channelData.items?.[0]?.id
      }
    }
    
    if (!targetChannelId) {
      return null
    }
    
    // Buscar transmissões ao vivo do canal
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${targetChannelId}&eventType=live&type=video&maxResults=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!searchResponse.ok) {
      return null
    }
    
    const searchData = await searchResponse.json()
    const liveVideoId = searchData.items?.[0]?.id?.videoId
    
    if (!liveVideoId) {
      return null
    }
    
    // Obter detalhes do vídeo para pegar o liveChatId
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${liveVideoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!videoResponse.ok) {
      return null
    }
    
    const videoData = await videoResponse.json()
    const liveChatId = videoData.items?.[0]?.liveStreamingDetails?.activeLiveChatId
    
    if (liveChatId) {
      logStateChange('live_oauth', `[YouTube] ✅ Live detectada via OAuth: ${liveVideoId}`)
    }
    
    return liveChatId || null
    
  } catch (error) {
    return null
  }
}

/**
 * Busca mensagens do chat ao vivo
 */
async function fetchLiveChatMessages(accessToken: string, liveChatId: string): Promise<void> {
  try {
    let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet,authorDetails&liveChatId=${liveChatId}&maxResults=200`
    
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      
      // Se o chat não existe mais (live terminou), resetar
      if (response.status === 404 || response.status === 403) {
        logStateChange('chat_ended', '[YouTube] Live chat encerrado ou inacessível')
        currentLiveChatId = null
        nextPageToken = null
        processedMessageIds.clear()
      } else {
        console.error('[YouTube] Erro ao buscar mensagens:', response.status, errorText)
      }
      return
    }
    
    const data = await response.json()
    
    // Atualizar token para próxima página
    nextPageToken = data.nextPageToken || null
    
    // Processar mensagens
    const messages = data.items || []
    let newMessagesCount = 0
    
    for (const msg of messages) {
      // Evitar duplicatas
      if (processedMessageIds.has(msg.id)) continue
      processedMessageIds.add(msg.id)
      
      // Limpar cache de IDs antigos (manter últimos 1000)
      if (processedMessageIds.size > 1000) {
        const idsArray = Array.from(processedMessageIds)
        processedMessageIds = new Set(idsArray.slice(-500))
      }
      
      // Apenas processar mensagens de texto
      if (msg.snippet?.type !== 'textMessageEvent') continue
      
      const authorDetails = msg.authorDetails || {}
      
      // Mapear badges do YouTube
      const badges: string[] = []
      if (authorDetails.isChatOwner) badges.push('broadcaster')
      if (authorDetails.isChatModerator) badges.push('moderator')
      if (authorDetails.isChatSponsor) badges.push('subscriber')
      if (authorDetails.isVerified) badges.push('verified')
      
      chatHub.publish({
        id: msg.id || `yt-${Date.now()}-${Math.random()}`,
        platform: 'youtube',
        username: authorDetails.displayName || 'Anônimo',
        userId: authorDetails.channelId || 'unknown',
        message: msg.snippet?.textMessageDetails?.messageText || '',
        timestamp: new Date(msg.snippet?.publishedAt || Date.now()).getTime(),
        badges
      })
      
      newMessagesCount++
    }
    
    if (newMessagesCount > 0) {
      console.log(`[YouTube] ${newMessagesCount} novas mensagens recebidas`)
    }
    
  } catch (error) {
    console.error('[YouTube] Erro no polling:', error)
  }
}

/**
 * Função de polling do chat
 */
async function pollYouTubeChat(): Promise<void> {
  // Se não temos liveChatId, tentar detectar
  if (!currentLiveChatId) {
    // Primeiro, tentar via módulo de detecção (usa API key ou scraping)
    currentLiveChatId = await detectLiveChatId()
    
    // Se não encontrou, tentar via OAuth
    if (!currentLiveChatId) {
      const accessToken = await getYouTubeToken()
      if (accessToken) {
        currentLiveChatId = await detectLiveChatIdViaOAuth(accessToken)
      }
    }
    
    if (!currentLiveChatId) {
      logStateChange('no_live', '[YouTube] Nenhuma live ativa detectada')
      return
    }
    
    // Reset page token quando encontrar novo chat
    nextPageToken = null
    processedMessageIds.clear()
  }
  
  // Precisamos de um token para ler mensagens
  const accessToken = await getYouTubeToken()
  
  if (!accessToken) {
    logStateChange('no_token', '[YouTube] Nenhuma conta YouTube vinculada para ler mensagens')
    return
  }
  
  logStateChange('polling', '[YouTube] Polling ativo...')
  await fetchLiveChatMessages(accessToken, currentLiveChatId)
}

/**
 * Inicia o leitor de chat do YouTube
 */
export async function startYouTubeReader(): Promise<void> {
  if (readerStarted) return
  readerStarted = true
  
  console.log('[YouTube] Iniciando leitor de chat...')
  
  // Fazer primeira verificação
  await pollYouTubeChat()
  
  // Iniciar polling periódico
  // Usa intervalo menor quando há live, maior quando não há
  const startPolling = () => {
    const interval = currentLiveChatId ? CHAT_POLLING_INTERVAL : LIVE_CHECK_INTERVAL
    pollingInterval = setTimeout(async () => {
      await pollYouTubeChat()
      startPolling() // Reagendar
    }, interval)
  }
  
  startPolling()
  
  console.log('[YouTube] Leitor de chat iniciado')
}

/**
 * Para o leitor de chat do YouTube
 */
export function stopYouTubeReader(): void {
  if (pollingInterval) {
    clearTimeout(pollingInterval)
    pollingInterval = null
  }
  readerStarted = false
  currentLiveChatId = null
  nextPageToken = null
  processedMessageIds.clear()
  lastLoggedState = ''
  console.log('[YouTube] Leitor de chat parado')
}

/**
 * Retorna o liveChatId atual (para enviar mensagens)
 */
export function getCurrentLiveChatId(): string | null {
  return currentLiveChatId
}

/**
 * Define o liveChatId manualmente (útil para testes)
 */
export function setCurrentLiveChatId(liveChatId: string): void {
  currentLiveChatId = liveChatId
  nextPageToken = null
  processedMessageIds.clear()
}

/**
 * Busca o liveChatId da transmissão ao vivo atual do canal (exportado para uso externo)
 */
export async function getActiveLiveChatId(accessToken: string): Promise<string | null> {
  // Primeiro tentar via módulo de detecção
  const liveChatId = await detectLiveChatId()
  if (liveChatId) return liveChatId
  
  // Fallback via OAuth
  return await detectLiveChatIdViaOAuth(accessToken)
}

/**
 * Envia uma mensagem no chat ao vivo do YouTube
 */
export async function sendYouTubeMessage(
  accessToken: string, 
  liveChatId: string, 
  message: string,
  username?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[YouTube] Enviando mensagem para liveChatId:', liveChatId)
    
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            type: 'textMessageEvent',
            liveChatId,
            textMessageDetails: {
              messageText: message
            }
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `Erro ${response.status}`
      console.error('[YouTube] Erro ao enviar mensagem:', response.status, errorData)
      
      // Erros comuns
      if (response.status === 403) {
        if (errorMessage.includes('liveChatDisabled')) {
          return { success: false, error: 'Chat ao vivo desabilitado nesta transmissão' }
        }
        if (errorMessage.includes('forbidden')) {
          return { success: false, error: 'Sem permissão para enviar mensagens neste chat' }
        }
      }
      if (response.status === 404) {
        return { success: false, error: 'Chat ao vivo não encontrado. A transmissão pode ter terminado.' }
      }
      
      return { success: false, error: errorMessage }
    }
    
    const data = await response.json()
    console.log('[YouTube] ✅ Mensagem enviada:', data.id)
    
    return { success: true }
    
  } catch (error) {
    console.error('[YouTube] Erro ao enviar mensagem:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

/**
 * Busca o liveChatId ativo e retorna (para uso no frontend)
 */
export async function fetchActiveLiveChatId(): Promise<string | null> {
  // Se já temos um, retornar
  if (currentLiveChatId) {
    return currentLiveChatId
  }
  
  // Tentar detectar
  currentLiveChatId = await detectLiveChatId()
  
  if (!currentLiveChatId) {
    const accessToken = await getYouTubeToken()
    if (accessToken) {
      currentLiveChatId = await detectLiveChatIdViaOAuth(accessToken)
    }
  }
  
  return currentLiveChatId
}
