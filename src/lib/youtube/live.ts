/**
 * Detecta automaticamente o link da live atual do canal WaveIGL no YouTube
 * Usa scraping da página pública (não requer API key)
 */

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
 * Busca a live atual do canal via scraping (não requer API key)
 */
export async function getCurrentYouTubeLive(): Promise<LiveStreamInfo> {
  return await scrapeLiveDetection()
}

/**
 * Buscar via scraping da página do canal
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
    
    const res = await fetch(channelLiveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      return result
    }

    const html = await res.text()

    // Extrair videoId do HTML
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    if (videoIdMatch) {
      result.videoId = videoIdMatch[1]
      
      // Verificar se está ao vivo - múltiplos padrões
      const isLiveMatch = html.match(/"isLive"\s*:\s*true/) || 
                          html.match(/"isLiveContent"\s*:\s*true/) ||
                          html.match(/\\"isLive\\":true/)
      result.isLive = !!isLiveMatch

      // Extrair título
      const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
      if (titleMatch) {
        result.title = titleMatch[1]
      }
      
      // Tentar extrair liveChatId do HTML
      const liveChatIdMatch = html.match(/"liveChatId":"([^"]+)"/) ||
                              html.match(/\\"liveChatId\\":\\"([^"\\]+)\\"/)
      if (liveChatIdMatch) {
        result.liveChatId = liveChatIdMatch[1]
      }
    }

    return result

  } catch (error) {
    console.error('[YouTube] Erro na detecção de live:', error)
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

/**
 * Força atualização do cache
 */
export function invalidateLiveCache(): void {
  cachedLiveInfo = null
  cacheTimestamp = 0
}
