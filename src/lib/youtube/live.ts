/**
 * Detecta automaticamente o link da live atual do canal WaveIGL no YouTube
 * Usa scraping + API para obter liveChatId
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

const YOUTUBE_CHANNEL_HANDLE = '@waveigl'

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
 * Busca lives do canal WaveIGL especificamente usando search.list
 * Ref: https://developers.google.com/youtube/v3/docs/search/list
 */
async function fetchLiveBroadcastFromAPI(accessToken: string, retryCount: number = 0): Promise<LiveStreamInfo> {
  const result: LiveStreamInfo = {
    isLive: false,
    videoId: null,
    title: null,
    thumbnailUrl: null,
    viewerCount: null,
    liveChatId: null
  }

  try {
    // Verificar se API está bloqueada por quota
    if (isApiBlocked()) {
      console.log('[YouTube] API bloqueada por quota')
      return result
    }

    // Primeiro, buscar o channelId do @waveigl
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${YOUTUBE_CHANNEL_HANDLE.replace('@', '')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json().catch(() => ({}))

      if (channelResponse.status === 401 && retryCount === 0) {
        console.log('[YouTube] Token expirado (401), forçando renovação...')
        const newToken = await forceTokenRenewalLive()
        if (newToken) {
          return fetchLiveBroadcastFromAPI(newToken, 1)
        }
        return result
      }

      console.error('[YouTube] Erro ao buscar channelId:', channelResponse.status, errorData)
      return result
    }

    const channelData = await channelResponse.json()
    const channelId = channelData.items?.[0]?.id

    if (!channelId) {
      console.log('[YouTube] ❌ Não foi possível obter channelId do @waveigl')
      return result
    }

    console.log('[YouTube] Channel ID do WaveIGL:', channelId)

    // Buscar lives ativas do canal WaveIGL usando search.list
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&maxResults=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error('[YouTube] Erro ao buscar lives:', searchResponse.status, errorData)

      if (searchResponse.status === 403 && errorData?.error?.message?.includes('quota')) {
        blockApiDueToQuota()
      }
      return result
    }

    const searchData = await searchResponse.json()
    const liveVideo = searchData.items?.[0]

    if (!liveVideo) {
      console.log('[YouTube] Nenhuma live ativa encontrada no canal WaveIGL')
      return result
    }

    const videoId = liveVideo.id?.videoId
    const snippet = liveVideo.snippet || {}

    console.log('[YouTube] Live encontrada:', {
      videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle
    })

    result.isLive = true
    result.videoId = videoId
    result.title = snippet.title
    result.thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url

    // Buscar liveChatId e viewerCount via videos.list
    if (videoId) {
      const details = await fetchLiveVideoDetails(accessToken, videoId)
      result.liveChatId = details.liveChatId
      result.viewerCount = details.viewerCount
    }

    if (result.liveChatId) {
      console.log('[YouTube] ✅ Live do WaveIGL detectada:', result.videoId, 'liveChatId:', result.liveChatId, 'viewers:', result.viewerCount)
    } else {
      console.log('[YouTube] ⚠️ Live do WaveIGL detectada mas sem liveChatId:', result.videoId)
    }

    return result

  } catch (error) {
    console.error('[YouTube] Erro ao buscar live:', error)
    return result
  }
}

/**
 * Busca detalhes do vídeo (liveChatId e viewerCount) via API videos.list
 */
async function fetchLiveVideoDetails(accessToken: string, videoId: string): Promise<{ liveChatId: string | null; viewerCount: number | null }> {
  try {
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
      console.error('[YouTube] Erro ao buscar video:', response.status)
      return { liveChatId: null, viewerCount: null }
    }

    const data = await response.json()
    const video = data.items?.[0]
    const details = video?.liveStreamingDetails

    const liveChatId = details?.activeLiveChatId || null
    const viewerCount = details?.concurrentViewers ? parseInt(details.concurrentViewers, 10) : null

    if (liveChatId) {
      console.log('[YouTube] ✅ Detalhes obtidos via videos.list. chat:', liveChatId, 'viewers:', viewerCount)
    }

    return { liveChatId, viewerCount }

  } catch (error) {
    console.error('[YouTube] Erro ao buscar detalhes do vídeo:', error)
    return { liveChatId: null, viewerCount: null }
  }
}

/**
 * Busca a live atual do canal WaveIGL via API
 * Usa search.list para buscar lives do canal específico
 * Fallback para scraping se não houver token disponível
 */
export async function getCurrentYouTubeLive(): Promise<LiveStreamInfo> {
  // Primeiro, tentar via API oficial (mais confiável)
  const token = await getYouTubeToken()

  if (token) {
    console.log('[YouTube] Buscando live do canal WaveIGL via API...')
    const apiResult = await fetchLiveBroadcastFromAPI(token)

    if (apiResult.isLive) {
      console.log('[YouTube] ✅ Live do WaveIGL detectada via API')
      return apiResult
    }

    console.log('[YouTube] API não encontrou live ativa no canal WaveIGL')
  } else {
    console.log('[YouTube] ⚠️ Nenhum token disponível, usando scraping...')
  }

  // Fallback: tentar scraping da página pública do canal
  const scrapeResult = await scrapeLiveDetection()

  // Se scraping encontrou videoId mas não tem liveChatId, buscar via API
  if (scrapeResult.videoId && !scrapeResult.liveChatId && token) {
    console.log('[YouTube] Scraping encontrou videoId, buscando detalhes via API...')
    const details = await fetchLiveVideoDetails(token, scrapeResult.videoId)
    if (details.liveChatId) {
      scrapeResult.liveChatId = details.liveChatId
      scrapeResult.viewerCount = details.viewerCount
      scrapeResult.isLive = true
    }
  }

  return scrapeResult
}

/**
 * Buscar via scraping da página do canal (fallback)
 * Usado quando não há token disponível ou API falha
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

    console.log(`[YouTube] Scraping: ${channelLiveUrl}`)

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

    // Extrair videoId do HTML
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    if (!videoIdMatch) {
      console.log('[YouTube] ❌ Não foi possível extrair videoId via scraping')
      return result
    }

    const videoId = videoIdMatch[1]
    console.log('[YouTube] VideoId extraído via scraping:', videoId)

    // Verificar se há indicador de live ao vivo
    const hasLiveIndicator = html.includes('"isLive":true') ||
      html.includes('"isLiveContent":true') ||
      html.includes('"isLiveNow":true') ||
      html.includes('"liveBroadcastDetails"')

    // Verificar se NÃO é um vídeo encerrado
    const hasEndTime = html.includes('"actualEndTime"')

    if (hasEndTime) {
      console.log('[YouTube] ❌ Live já encerrada (scraping)')
      return result
    }

    result.videoId = videoId
    result.isLive = hasLiveIndicator

    // Extrair título
    const titleMatch = html.match(/"title":"([^"]+)"/)
    if (titleMatch) {
      result.title = titleMatch[1]
    }

    // Tentar extrair liveChatId do HTML
    const liveChatIdMatch = html.match(/"liveChatId":"([^"]+)"/) ||
      html.match(/"activeLiveChatId":"([^"]+)"/)
    if (liveChatIdMatch) {
      result.liveChatId = liveChatIdMatch[1]
      result.isLive = true
      console.log('[YouTube] ✅ liveChatId obtido via scraping:', result.liveChatId)
    }

    // Tentar extrair viewerCount do HTML
    // Formato comum no ytInitialData: "viewCountText":{"runs":[{"text":"170"},{"text":" assistindo agora"}]}
    const viewerCountMatch = html.match(/"viewCountText":\{"runs":\[\{"text":"([\d.,]+)"\}/) ||
      html.match(/viewCountText":\{"simpleText":"([\d.,]+)\s/)

    if (viewerCountMatch) {
      const countStr = viewerCountMatch[1].replace(/[.,\s]/g, '')
      result.viewerCount = parseInt(countStr, 10)
      console.log('[YouTube] ✅ viewerCount obtido via scraping:', result.viewerCount)
    }

    if (result.isLive) {
      console.log('[YouTube] ✅ Live detectada via scraping:', result.videoId)
    } else {
      console.log('[YouTube] ℹ️ Metadados encontrados via scraping, mas stream não parece estar ao vivo:', result.videoId)
    }

    return result

  } catch (error) {
    console.error('[YouTube] Erro no scraping:', error)
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
