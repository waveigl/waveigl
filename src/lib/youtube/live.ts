/**
 * Detecta automaticamente o link da live atual do canal WaveIGL no YouTube
 * Usa scraping + API para obter liveChatId
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

const YOUTUBE_CHANNEL_HANDLE = '@waveigl'
const YOUTUBE_CHANNEL_ID = 'UCYourChannelId' // Será obtido dinamicamente

export interface LiveStreamInfo {
  isLive: boolean
  videoId: string | null
  title: string | null
  thumbnailUrl: string | null
  viewerCount: number | null
  liveChatId: string | null
}

/**
 * Renova o token de acesso do YouTube usando o refresh_token
 */
async function refreshYouTubeTokenInternal(userId: string, refreshToken: string): Promise<string | null> {
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
      console.error('[YouTube Live] Erro ao renovar token:', response.status, errorData)
      return null
    }
    
    const tokenData = await response.json()
    
    if (tokenData.access_token) {
      // Atualizar no banco de dados
      const db = getSupabaseAdmin()
      await db
        .from('linked_accounts')
        .update({ 
          access_token: tokenData.access_token,
          ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {})
        })
        .eq('user_id', userId)
        .eq('platform', 'youtube')
      
      console.log('[YouTube Live] ✅ Token renovado com sucesso')
      return tokenData.access_token
    }
    
    return null
  } catch (error) {
    console.error('[YouTube Live] Erro ao renovar token:', error)
    return null
  }
}

// Cache simples de token para evitar buscas repetidas no banco
let liveTokenCache: { token: string; userId: string; refreshToken: string; expiresAt: number } | null = null

/**
 * Obtém token de acesso do YouTube de qualquer conta vinculada
 * NÃO verifica se o token está válido (economiza quota) - a API vai retornar 401 se expirou
 */
async function getYouTubeToken(): Promise<string | null> {
  const now = Date.now()
  
  // Usar cache se ainda válido
  if (liveTokenCache && liveTokenCache.expiresAt > now) {
    return liveTokenCache.token
  }
  
  const db = getSupabaseAdmin()
  
  const { data: account } = await db
    .from('linked_accounts')
    .select('user_id, access_token, refresh_token')
    .eq('platform', 'youtube')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle()
  
  if (!account?.access_token) {
    return null
  }
  
  // Cache por 1 hora
  liveTokenCache = {
    token: account.access_token,
    userId: account.user_id,
    refreshToken: account.refresh_token || '',
    expiresAt: now + 60 * 60 * 1000
  }
  
  return account.access_token
}

/**
 * Força renovação do token (chamado quando recebe 401)
 */
async function forceTokenRenewalLive(): Promise<string | null> {
  // Invalidar cache
  liveTokenCache = null
  
  const db = getSupabaseAdmin()
  
  const { data: account } = await db
    .from('linked_accounts')
    .select('user_id, refresh_token')
    .eq('platform', 'youtube')
    .not('refresh_token', 'is', null)
    .limit(1)
    .maybeSingle()
  
  if (!account?.refresh_token) {
    console.log('[YouTube Live] Sem refresh_token disponível')
    return null
  }
  
  console.log('[YouTube Live] Forçando renovação do token...')
  const newToken = await refreshYouTubeTokenInternal(account.user_id, account.refresh_token)
  
  if (newToken) {
    liveTokenCache = {
      token: newToken,
      userId: account.user_id,
      refreshToken: account.refresh_token,
      expiresAt: Date.now() + 60 * 60 * 1000
    }
  }
  
  return newToken
}

/**
 * Busca o liveChatId usando a API do YouTube
 * Verifica bloqueio de quota antes de chamar
 * Se receber erro 401, tenta renovar o token automaticamente
 * IMPORTANTE: Valida que é uma live AO VIVO do WaveIGL
 */
async function fetchLiveChatIdFromAPI(videoId: string, accessToken: string, retryCount: number = 0): Promise<string | null> {
  try {
    // Verificar se API está bloqueada por quota
    if (isApiBlocked()) {
      return null
    }
    
    // Usar a API de videos para obter detalhes da live, incluindo liveChatId
    // Buscar também channelId para validar que é do WaveIGL
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${videoId}`,
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
        const newToken = await forceTokenRenewalLive()
        if (newToken) {
          return fetchLiveChatIdFromAPI(videoId, newToken, 1) // Retry com novo token
        }
        console.log('[YouTube] Não foi possível renovar o token')
        return null
      }
      
      console.error('[YouTube] Erro ao buscar liveChatId via API:', response.status, errorData)
      
      // Bloquear API se for erro de quota
      if (response.status === 403 && errorData?.error?.message?.includes('quota')) {
        blockApiDueToQuota()
      }
      return null
    }
    
    const data = await response.json()
    const videoData = data.items?.[0]
    
    if (!videoData) {
      console.log('[YouTube] Vídeo não encontrado')
      return null
    }
    
    const liveStreamingDetails = videoData.liveStreamingDetails
    const snippet = videoData.snippet
    
    // ✅ VALIDAÇÃO 1: Verificar se é uma live AO VIVO (não vídeo pré-gravado)
    // Uma live ao vivo tem actualStartTime mas NÃO tem actualEndTime
    const actualStartTime = liveStreamingDetails?.actualStartTime
    const actualEndTime = liveStreamingDetails?.actualEndTime
    const liveChatId = liveStreamingDetails?.activeLiveChatId
    
    if (!actualStartTime) {
      console.log('[YouTube] ❌ Não é uma live (sem actualStartTime)')
      return null
    }
    
    if (actualEndTime) {
      console.log('[YouTube] ❌ Live já encerrada (tem actualEndTime):', actualEndTime)
      return null
    }
    
    if (!liveChatId) {
      console.log('[YouTube] ❌ Não há liveChatId ativo (live não está ao vivo)')
      return null
    }
    
    // ✅ VALIDAÇÃO 2: Verificar se é do canal WaveIGL
    const channelId = snippet?.channelId
    const WAVEIGL_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID
    
    if (!channelId) {
      console.log('[YouTube] ❌ Não foi possível obter channelId')
      return null
    }
    
    if (channelId !== WAVEIGL_CHANNEL_ID) {
      console.log(`[YouTube] ❌ Live é de outro canal (${channelId}), não do WaveIGL (${WAVEIGL_CHANNEL_ID})`)
      return null
    }
    
    console.log('[YouTube] ✅ Live validada: ao vivo + do WaveIGL + liveChatId obtido:', liveChatId)
    return liveChatId
    
  } catch (error) {
    console.error('[YouTube] Erro ao buscar liveChatId:', error)
    return null
  }
}

/**
 * Busca a live atual do canal via scraping + API
 * IMPORTANTE: Valida que é uma live AO VIVO do WaveIGL
 */
export async function getCurrentYouTubeLive(): Promise<LiveStreamInfo> {
  // Primeiro, tentar scraping para detectar se está ao vivo
  const scrapeResult = await scrapeLiveDetection()
  
  // Se não detectou live ao vivo no scraping, retornar vazio
  if (!scrapeResult.isLive || !scrapeResult.videoId) {
    console.log('[YouTube] ❌ Nenhuma live ao vivo detectada')
    return scrapeResult
  }
  
  // Se encontrou videoId mas não tem liveChatId, buscar via API
  // A API vai validar que é realmente uma live ao vivo do WaveIGL
  if (!scrapeResult.liveChatId) {
    const token = await getYouTubeToken()
    if (token) {
      const liveChatId = await fetchLiveChatIdFromAPI(scrapeResult.videoId, token)
      if (liveChatId) {
        scrapeResult.liveChatId = liveChatId
      } else {
        // Se a API não conseguiu obter liveChatId, não é uma live válida
        console.log('[YouTube] ❌ Não foi possível validar a live via API')
        scrapeResult.isLive = false
        scrapeResult.videoId = null
      }
    } else {
      console.log('[YouTube] ⚠️ Nenhum token disponível para validar live via API')
      // Sem token, não podemos validar - considerar como não live
      scrapeResult.isLive = false
      scrapeResult.videoId = null
    }
  }
  
  return scrapeResult
}

/**
 * Buscar via scraping da página do canal
 * IMPORTANTE: Apenas detecta lives AO VIVO (não vídeos pré-gravados)
 * IMPORTANTE: Valida que é do canal WaveIGL
 */
async function scrapeLiveDetection(): Promise<LiveStreamInfo> {
  const result: LiveStreamInfo = {
    isLive: false,
    videoId: null,
    title: null,
    thumbnailUrl: null,
    viewerCount: null,
    liveChatId: null
  }

  try {
    // Buscar a página de lives do canal
    const channelLiveUrl = `https://www.youtube.com/${YOUTUBE_CHANNEL_HANDLE}/live`
    
    console.log(`[YouTube] Buscando live em: ${channelLiveUrl}`)
    
    const res = await fetch(channelLiveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      console.log('[YouTube] Erro ao acessar página de lives:', res.status)
      return result
    }

    const html = await res.text()

    // ✅ VALIDAÇÃO 1: Verificar se há indicador de live AO VIVO na página
    // Procurar por indicadores de live ativa (não vídeo pré-gravado)
    const hasLiveIndicator = html.match(/"isLive"\s*:\s*true/) || 
                             html.match(/"isLiveContent"\s*:\s*true/) ||
                             html.match(/\\"isLive\\":true/) ||
                             html.match(/"isUpcoming"\s*:\s*false/) // Não é upcoming
    
    if (!hasLiveIndicator) {
      console.log('[YouTube] ❌ Nenhuma live ao vivo detectada na página')
      return result
    }

    // Extrair videoId do HTML
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    if (!videoIdMatch) {
      console.log('[YouTube] ❌ Não foi possível extrair videoId')
      return result
    }
    
    const videoId = videoIdMatch[1]
    
    // ✅ VALIDAÇÃO 2: Verificar se é do canal WaveIGL
    // Extrair channelId do HTML para validar
    const WAVEIGL_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID
    
    // Tentar extrair channelId de várias formas
    const channelIdMatch = html.match(/"channelId":"([^"]+)"/) ||
                           html.match(/"externalChannelId":"([^"]+)"/) ||
                           html.match(/\\"channelId\\":\\"([^"\\]+)\\"/)
    
    const extractedChannelId = channelIdMatch?.[1]
    
    console.log('[YouTube] Channel ID extraído:', extractedChannelId)
    console.log('[YouTube] Channel ID esperado (WaveIGL):', WAVEIGL_CHANNEL_ID)
    
    // Se temos o YOUTUBE_CHANNEL_ID configurado, validar
    if (WAVEIGL_CHANNEL_ID && extractedChannelId) {
      if (extractedChannelId !== WAVEIGL_CHANNEL_ID) {
        console.log(`[YouTube] ❌ Live é de outro canal (${extractedChannelId}), não do WaveIGL (${WAVEIGL_CHANNEL_ID})`)
        console.log('[YouTube] ❌ Ignorando vídeo:', videoId)
        return result
      }
      console.log('[YouTube] ✅ Channel ID validado: é do WaveIGL')
    } else if (WAVEIGL_CHANNEL_ID && !extractedChannelId) {
      // Não conseguiu extrair channelId do HTML - tentar validar via título/autor
      // Procurar pelo nome do canal no HTML
      const channelNameMatch = html.match(/"ownerChannelName":"([^"]+)"/) ||
                               html.match(/"author":"([^"]+)"/)
      const channelName = channelNameMatch?.[1]?.toLowerCase()
      
      console.log('[YouTube] Nome do canal extraído:', channelName)
      
      // Verificar se o nome contém "waveigl"
      if (channelName && !channelName.includes('waveigl')) {
        console.log(`[YouTube] ❌ Live parece ser de outro canal: ${channelName}`)
        return result
      }
      
      console.log('[YouTube] ⚠️ Não foi possível extrair channelId, mas nome parece ser WaveIGL')
    } else if (!WAVEIGL_CHANNEL_ID) {
      console.warn('[YouTube] ⚠️ YOUTUBE_CHANNEL_ID não configurado - não é possível validar canal')
    }
    
    result.videoId = videoId
    result.isLive = true // Indicador de live encontrado

    // Extrair título
    const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
    if (titleMatch) {
      result.title = titleMatch[1]
      console.log('[YouTube] Título da live:', result.title)
    }
    
    // Tentar extrair liveChatId do HTML (pode estar disponível no scraping)
    const liveChatIdMatch = html.match(/"liveChatId":"([^"]+)"/) ||
                            html.match(/\\"liveChatId\\":\\"([^"\\]+)\\"/)
    if (liveChatIdMatch) {
      result.liveChatId = liveChatIdMatch[1]
      console.log('[YouTube] ✅ liveChatId obtido via scraping:', result.liveChatId)
    }

    console.log('[YouTube] ✅ Live ao vivo detectada via scraping:', result.videoId)
    return result

  } catch (error) {
    console.error('[YouTube] Erro na detecção de live:', error)
    return result
  }
}

/**
 * Cache para evitar exceder quota da API do Google
 * Usa globalThis para persistir entre chamadas de API (Next.js pode criar novos processos)
 */
declare global {
  // eslint-disable-next-line no-var
  var __youtubeLiveCache: {
    info: LiveStreamInfo | null
    timestamp: number
    apiBlockedUntil: number // Timestamp até quando a API está bloqueada por quota
  } | undefined
}

// Inicializar cache global
if (!globalThis.__youtubeLiveCache) {
  globalThis.__youtubeLiveCache = {
    info: null,
    timestamp: 0,
    apiBlockedUntil: 0
  }
}

const CACHE_TTL_SCRAPE = 5 * 60 * 1000 // 5 minutos para scraping
const CACHE_TTL_WITH_CHAT = 10 * 60 * 1000 // 10 minutos se já tem liveChatId
const API_BLOCK_DURATION = 30 * 60 * 1000 // Bloquear API por 30 minutos após erro de quota

export async function getCachedYouTubeLive(): Promise<LiveStreamInfo> {
  const now = Date.now()
  const cache = globalThis.__youtubeLiveCache!
  
  // Usar TTL maior se já temos liveChatId (evita chamadas à API)
  const ttl = cache.info?.liveChatId ? CACHE_TTL_WITH_CHAT : CACHE_TTL_SCRAPE
  
  if (cache.info && (now - cache.timestamp) < ttl) {
    return cache.info
  }

  cache.info = await getCurrentYouTubeLive()
  cache.timestamp = now
  
  return cache.info
}

/**
 * Verifica se a API está bloqueada por quota
 */
export function isApiBlocked(): boolean {
  return Date.now() < (globalThis.__youtubeLiveCache?.apiBlockedUntil || 0)
}

/**
 * Bloqueia a API por um período após erro de quota
 */
export function blockApiDueToQuota(): void {
  if (globalThis.__youtubeLiveCache) {
    globalThis.__youtubeLiveCache.apiBlockedUntil = Date.now() + API_BLOCK_DURATION
    console.log('[YouTube] ⚠️ API bloqueada por 30 minutos devido a erro de quota')
  }
}

/**
 * Força atualização do cache (stub - cache desabilitado)
 */
export function invalidateLiveCache(): void {
  // Cache desabilitado - função mantida para compatibilidade
}
