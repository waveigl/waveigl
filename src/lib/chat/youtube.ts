import { chatHub, youtubeStatusHub } from './hub'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCachedYouTubeLive, isApiBlocked, blockApiDueToQuota } from '@/lib/youtube/live'

let readerStarted = false
let currentLiveChatId: string | null = null
let currentVideoId: string | null = null
let pollingInterval: NodeJS.Timeout | null = null
let nextPageToken: string | null = null
let lastLoggedState: string = '' // Para evitar spam de logs
let processedMessageIds = new Set<string>() // Para evitar duplicatas
let lastApiCallTime = 0 // Para rate limiting
let lastPublishedLiveStatus = false // Para evitar publicar mesmo status

// Intervalo de polling (em ms)
const CHAT_POLLING_INTERVAL = 5000 // 5 segundos quando há live
const LIVE_CHECK_INTERVAL = 5 * 60 * 1000 // 5 MINUTOS para verificar se há live (economiza quota)
const MIN_API_INTERVAL = 10 * 1000 // Mínimo 10 segundos entre chamadas à API

/**
 * Publica o status atual do YouTube para todos os clientes via SSE
 */
function publishYouTubeStatus(isLive: boolean, videoId: string | null, liveChatId: string | null): void {
  // Só publicar se o status mudou
  if (lastPublishedLiveStatus === isLive && currentLiveChatId === liveChatId) {
    return
  }
  
  lastPublishedLiveStatus = isLive
  currentLiveChatId = liveChatId
  currentVideoId = videoId
  
  youtubeStatusHub.publish({
    type: 'youtube_status',
    isLive,
    videoId,
    liveChatId,
    timestamp: Date.now()
  })
}

/**
 * Renova o token de acesso do YouTube usando o refresh_token
 */
export async function refreshYouTubeToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[YouTube] Erro ao renovar token:', response.status, errorData)
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
          // Atualizar refresh_token se vier um novo
          ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {})
        })
        .eq('user_id', userId)
        .eq('platform', 'youtube')
      
      console.log('[YouTube] ✅ Token renovado com sucesso')
      return tokenData.access_token
    }
    
    return null
  } catch (error) {
    console.error('[YouTube] Erro ao renovar token:', error)
    return null
  }
}

// Cache do token para evitar verificações repetidas
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Invalida o cache do token (chamado quando recebe 401)
 */
function invalidateTokenCache(): void {
  cachedToken = null
  console.log('[YouTube] Cache de token invalidado')
}

/**
 * Força renovação do token (chamado quando recebe 401)
 */
async function forceTokenRenewal(): Promise<string | null> {
  invalidateTokenCache()
  
  const supabase = getSupabaseAdmin()
  
  const { data: account } = await supabase
    .from('linked_accounts')
    .select('user_id, refresh_token')
    .eq('platform', 'youtube')
    .not('refresh_token', 'is', null)
    .limit(1)
    .maybeSingle()
  
  if (!account?.refresh_token) {
    console.log('[YouTube] Nenhum refresh_token disponível para renovar')
    return null
  }
  
  console.log('[YouTube] Forçando renovação do token...')
  const newToken = await refreshYouTubeToken(account.user_id, account.refresh_token)
  
  if (newToken) {
    cachedToken = {
      token: newToken,
      expiresAt: Date.now() + 60 * 60 * 1000
    }
    return newToken
  }
  
  return null
}

/**
 * Obtém um token de acesso do YouTube de qualquer conta vinculada
 * Usa cache para evitar verificações repetidas (economiza quota)
 */
async function getYouTubeToken(): Promise<string | null> {
  try {
    // Usar cache se ainda válido (15 minutos de margem)
    const now = Date.now()
    if (cachedToken && cachedToken.expiresAt > now + 15 * 60 * 1000) {
      return cachedToken.token
    }
    
    const supabase = getSupabaseAdmin()
    
    // Buscar qualquer conta do YouTube vinculada
    const { data: accounts } = await supabase
      .from('linked_accounts')
      .select('user_id, access_token, refresh_token, platform_user_id, platform_username')
      .eq('platform', 'youtube')
      .not('access_token', 'is', null)
    
    if (!accounts || accounts.length === 0) {
      return null
    }
    
    const account = accounts[0]
    
    // Se não temos cache ou está expirado, assumir que o token é válido
    // A API vai retornar 401 se não for, e aí renovamos
    if (account.access_token) {
      // Cache por 1 hora (tokens do Google duram 1h)
      cachedToken = {
        token: account.access_token,
        expiresAt: now + 60 * 60 * 1000
      }
      return account.access_token
    }
    
    // Token não existe, tentar renovar
    console.log('[YouTube] Token não encontrado, tentando renovar...')
    
    if (account.refresh_token) {
      const newToken = await refreshYouTubeToken(account.user_id, account.refresh_token)
      if (newToken) {
        cachedToken = {
          token: newToken,
          expiresAt: now + 60 * 60 * 1000
        }
        return newToken
      }
    }
    
    console.log('[YouTube] Não foi possível renovar o token')
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
 * Se o scraping não conseguir o chatId, usa a API do YouTube
 */
async function detectLiveChatId(): Promise<string | null> {
  try {
    const liveInfo = await getCachedYouTubeLive()
    
    if (liveInfo.isLive && liveInfo.liveChatId) {
      logStateChange('live_found', `[YouTube] ✅ Live detectada: ${liveInfo.videoId}, chatId: ${liveInfo.liveChatId}`)
      return liveInfo.liveChatId
    }
    
    // Se detectou live mas não tem chatId, tentar via API
    if (liveInfo.isLive && liveInfo.videoId && !liveInfo.liveChatId) {
      console.log(`[YouTube] Live encontrada (${liveInfo.videoId}) mas sem chatId, buscando via API...`)
      
      const accessToken = await getYouTubeToken()
      if (accessToken) {
        // Buscar liveChatId diretamente do vídeo
        const liveChatId = await fetchLiveChatIdFromVideo(accessToken, liveInfo.videoId)
        if (liveChatId) {
          logStateChange('live_found_api', `[YouTube] ✅ liveChatId obtido via API: ${liveChatId}`)
          return liveChatId
        }
      }
      
      logStateChange('live_no_chat', `[YouTube] Live encontrada mas sem chatId disponível`)
    }
    
    return null
  } catch (error) {
    console.error('[YouTube] Erro ao detectar liveChatId:', error)
    return null
  }
}

/**
 * Busca o liveChatId de um vídeo específico via API
 * Com rate limiting, verificação de bloqueio de quota, e renovação de token
 */
async function fetchLiveChatIdFromVideo(accessToken: string, videoId: string, retryCount: number = 0): Promise<string | null> {
  try {
    // Verificar se API está bloqueada por quota
    if (isApiBlocked()) {
      return null
    }
    
    // Rate limiting - esperar se a última chamada foi muito recente
    const now = Date.now()
    if (now - lastApiCallTime < MIN_API_INTERVAL) {
      console.log('[YouTube] Rate limit - aguardando antes de chamar API')
      return null
    }
    lastApiCallTime = now
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for erro 401 (token expirado), tentar renovar e tentar novamente
      if (response.status === 401 && retryCount === 0) {
        console.log('[YouTube] Token expirado (401), forçando renovação...')
        const newToken = await forceTokenRenewal()
        if (newToken) {
          return fetchLiveChatIdFromVideo(newToken, videoId, 1) // Retry com novo token
        }
        console.log('[YouTube] Não foi possível renovar o token')
        return null
      }
      
      // Se for erro de quota, bloquear API globalmente
      if (response.status === 403 && errorData?.error?.message?.includes('quota')) {
        blockApiDueToQuota()
      } else if (response.status !== 401) { // Não logar 401 novamente
        console.error('[YouTube] Erro ao buscar vídeo:', response.status, errorData)
      }
      return null
    }
    
    const data = await response.json()
    const liveChatId = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId
    
    if (liveChatId) {
      console.log('[YouTube] ✅ liveChatId encontrado:', liveChatId)
      return liveChatId
    }
    
    console.log('[YouTube] Vídeo não tem activeLiveChatId')
    return null
    
  } catch (error) {
    console.error('[YouTube] Erro ao buscar liveChatId do vídeo:', error)
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
 * Detecta live e publica status via SSE para evitar polling do frontend
 */
async function pollYouTubeChat(): Promise<void> {
  // Se não temos liveChatId, tentar detectar
  if (!currentLiveChatId) {
    // Primeiro, tentar via módulo de detecção (usa scraping - não gasta quota)
    const detectedChatId = await detectLiveChatId()
    
    // Se não encontrou via scraping, tentar via OAuth (com cuidado para não gastar quota)
    if (!detectedChatId) {
      const accessToken = await getYouTubeToken()
      if (accessToken) {
        currentLiveChatId = await detectLiveChatIdViaOAuth(accessToken)
      }
    } else {
      currentLiveChatId = detectedChatId
    }
    
    if (!currentLiveChatId) {
      logStateChange('no_live', '[YouTube] Nenhuma live ativa detectada')
      // Publicar status offline para clientes (evita polling do frontend)
      publishYouTubeStatus(false, null, null)
      return
    }
    
    // Reset page token quando encontrar novo chat
    nextPageToken = null
    processedMessageIds.clear()
    
    // Publicar status online para clientes (evita polling do frontend)
    publishYouTubeStatus(true, currentVideoId, currentLiveChatId)
    console.log(`[YouTube] ✅ Live detectada! chatId: ${currentLiveChatId}`)
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
 * NÃO faz verificação inicial - isso será feito quando Twitch/Kick detectar atividade
 * Economiza quota da API do Google
 */
export async function startYouTubeReader(): Promise<void> {
  if (readerStarted) return
  readerStarted = true
  
  console.log('[YouTube] Leitor de chat iniciado (aguardando sinal de Twitch/Kick)')
  
  // Iniciar polling periódico APENAS para verificar mensagens quando há live
  // A detecção de live será feita quando Twitch/Kick receber primeira mensagem
  const startPolling = () => {
    // Se já temos liveChatId, verificar mensagens a cada 5 segundos
    // Se não temos, verificar a cada 5 minutos (economiza quota)
    const interval = currentLiveChatId ? CHAT_POLLING_INTERVAL : LIVE_CHECK_INTERVAL
    
    pollingInterval = setTimeout(async () => {
      // Só fazer polling se já temos liveChatId ou se passou 5 minutos
      if (currentLiveChatId) {
        await pollYouTubeChat()
      }
      // Se não temos liveChatId, não fazemos nada - esperamos Twitch/Kick detectar
      startPolling() // Reagendar
    }, interval)
  }
  
  startPolling()
}

/**
 * Força uma verificação do YouTube (chamado quando Twitch/Kick detecta atividade)
 * Isso permite iniciar a leitura do chat do YouTube de forma inteligente
 */
export async function triggerYouTubeCheck(): Promise<void> {
  console.log('[YouTube] Verificação forçada (trigger externo)')
  await pollYouTubeChat()
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
): Promise<{ success: boolean; error?: string; code?: string }> {
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
      
      // Token expirado - retornar código específico para renovação
      if (response.status === 401) {
        return { success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' }
      }
      
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
