/**
 * GET /api/admin/chat-status - Obter status dos módulos de chat
 * Usado pelo frontend para saber se o chat está offline
 */

import { NextRequest, NextResponse } from 'next/server'
import { getChatModulesStatus, isVideoPlayerOffline } from '@/lib/admin/chat-filter'

export async function GET(request: NextRequest) {
  try {
    const [chatStatus, videoOffline] = await Promise.all([
      getChatModulesStatus(),
      isVideoPlayerOffline()
    ])

    return NextResponse.json({
      success: true,
      chat: chatStatus,
      videoPlayer: {
        isOffline: videoOffline
      }
    })
  } catch (error) {
    console.error('[API] Erro ao buscar status do chat:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
