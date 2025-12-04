import { NextRequest, NextResponse } from 'next/server'
import { getCachedYouTubeLive } from '@/lib/youtube/live'
import { youtubeStatusHub } from '@/lib/chat/hub'

/**
 * GET /api/youtube/status
 * 
 * Retorna o status da live do YouTube (se está ao vivo ou não)
 * Usado pelo frontend para habilitar/desabilitar o botão de envio
 * 
 * Query params:
 * - lazy=true: Indica que é uma verificação manual (lazy check)
 *              O resultado será publicado via SSE para todos os clientes
 */
export async function GET(request: NextRequest) {
  try {
    const isLazyCheck = request.nextUrl.searchParams.get('lazy') === 'true'
    
    if (isLazyCheck) {
      console.log('[YouTube Status] Lazy check iniciado por usuário')
    }
    
    const liveInfo = await getCachedYouTubeLive()
    
    // Se for lazy check, publicar resultado via SSE para todos os clientes
    if (isLazyCheck) {
      youtubeStatusHub.publish({
        type: 'youtube_status',
        isLive: liveInfo.isLive,
        videoId: liveInfo.videoId,
        liveChatId: liveInfo.liveChatId,
        timestamp: Date.now()
      })
      console.log(`[YouTube Status] Lazy check resultado: ${liveInfo.isLive ? 'ONLINE' : 'OFFLINE'}`)
    }
    
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

