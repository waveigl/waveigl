import { NextRequest, NextResponse } from 'next/server'
import { getCachedYouTubeLive } from '@/lib/youtube/live'

/**
 * GET /api/youtube/status
 * 
 * Retorna o status da live do YouTube (se está ao vivo ou não)
 * Usado pelo frontend para habilitar/desabilitar o botão de envio
 */
export async function GET(_request: NextRequest) {
  try {
    const liveInfo = await getCachedYouTubeLive()
    
    return NextResponse.json({
      isLive: liveInfo.isLive,
      videoId: liveInfo.videoId,
      title: liveInfo.title,
      liveChatId: liveInfo.liveChatId
    })
  } catch (error) {
    console.error('[YouTube Status] Erro:', error)
    return NextResponse.json({ 
      isLive: false,
      error: 'Erro ao verificar status' 
    })
  }
}

