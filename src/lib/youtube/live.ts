/**
 * Detecta automaticamente o link da live atual do canal WaveIGL no YouTube
 */

const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCwaveigL' // Substituir pelo ID real
const YOUTUBE_CHANNEL_HANDLE = '@waveigl'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export interface LiveStreamInfo {
  isLive: boolean
  videoId: string | null
  title: string | null
  thumbnailUrl: string | null
  viewerCount: number | null
  liveChatId: string | null
}

/**
 * Busca a live atual do canal usando a API do YouTube
 */
export async function getCurrentYouTubeLive(): Promise<LiveStreamInfo> {
  const result: LiveStreamInfo = {
    isLive: false,
    videoId: null,
    title: null,
    thumbnailUrl: null,
    viewerCount: null,
    liveChatId: null
  }

  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] YOUTUBE_API_KEY não configurada, usando fallback')
    return await fallbackLiveDetection()
  }

  try {
    // Método 1: Buscar via Search API (mais confiável)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`
    
    const searchRes = await fetch(searchUrl, { next: { revalidate: 60 } })
    const searchData = await searchRes.json()

    if (searchData.items && searchData.items.length > 0) {
      const liveVideo = searchData.items[0]
      result.isLive = true
      result.videoId = liveVideo.id.videoId
      result.title = liveVideo.snippet.title
      result.thumbnailUrl = liveVideo.snippet.thumbnails?.high?.url || liveVideo.snippet.thumbnails?.default?.url

      // Buscar detalhes da live (viewerCount e liveChatId)
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
        `part=liveStreamingDetails,statistics&id=${result.videoId}&key=${YOUTUBE_API_KEY}`
      
      const detailsRes = await fetch(videoDetailsUrl, { next: { revalidate: 30 } })
      const detailsData = await detailsRes.json()

      if (detailsData.items && detailsData.items.length > 0) {
        const details = detailsData.items[0]
        result.viewerCount = parseInt(details.liveStreamingDetails?.concurrentViewers || '0')
        result.liveChatId = details.liveStreamingDetails?.activeLiveChatId || null
      }
    }

    return result

  } catch (error) {
    console.error('[YouTube] Erro ao buscar live:', error)
    return await fallbackLiveDetection()
  }
}

/**
 * Fallback: Buscar via scraping da página do canal (sem API key)
 */
async function fallbackLiveDetection(): Promise<LiveStreamInfo> {
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
    
    const res = await fetch(channelLiveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      next: { revalidate: 60 }
    })

    const html = await res.text()

    // Extrair videoId do HTML
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    if (videoIdMatch) {
      result.videoId = videoIdMatch[1]
      
      // Verificar se está ao vivo
      const isLiveMatch = html.match(/"isLive"\s*:\s*true/)
      result.isLive = !!isLiveMatch

      // Extrair título
      const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
      if (titleMatch) {
        result.title = titleMatch[1]
      }
    }

    return result

  } catch (error) {
    console.error('[YouTube] Erro no fallback de detecção de live:', error)
    return result
  }
}

/**
 * Cache simples para evitar muitas requisições
 */
let cachedLiveInfo: LiveStreamInfo | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000 // 30 segundos

export async function getCachedYouTubeLive(): Promise<LiveStreamInfo> {
  const now = Date.now()
  
  if (cachedLiveInfo && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedLiveInfo
  }

  cachedLiveInfo = await getCurrentYouTubeLive()
  cacheTimestamp = now
  
  return cachedLiveInfo
}


