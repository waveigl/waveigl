import { NextResponse } from 'next/server'
import { getCachedYouTubeLive } from '@/lib/youtube/live'

export const dynamic = 'force-dynamic'
export const revalidate = 30

/**
 * GET /api/youtube/live
 * Retorna informações da live atual do canal WaveIGL no YouTube
 */
export async function GET() {
  try {
    const liveInfo = await getCachedYouTubeLive()
    
    return NextResponse.json(liveInfo, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('[API] Erro ao buscar live YouTube:', error)
    return NextResponse.json({
      isLive: false,
      videoId: null,
      title: null,
      thumbnailUrl: null,
      viewerCount: null,
      liveChatId: null
    })
  }
}


