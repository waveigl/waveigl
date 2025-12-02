import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentLiveChatId, getActiveLiveChatId } from '@/lib/chat/youtube'

/**
 * GET /api/youtube/live-chat-id
 * 
 * Retorna o liveChatId da transmissão ao vivo atual do canal WaveIGL
 * Usado pelo frontend para enviar mensagens no YouTube
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Primeiro, tentar usar o liveChatId já descoberto pelo reader
    let liveChatId = getCurrentLiveChatId()
    
    if (liveChatId) {
      return NextResponse.json({ 
        liveChatId,
        source: 'cache',
        isLive: true 
      })
    }
    
    // Se não tem, tentar buscar usando o token do usuário
    const supabase = getSupabaseAdmin()
    
    const { data: youtubeAccount } = await supabase
      .from('linked_accounts')
      .select('access_token')
      .eq('user_id', session.userId)
      .eq('platform', 'youtube')
      .maybeSingle()
    
    if (!youtubeAccount?.access_token) {
      return NextResponse.json({ 
        error: 'Conta YouTube não vinculada',
        liveChatId: null,
        isLive: false
      }, { status: 400 })
    }
    
    // Buscar liveChatId usando o token do usuário
    liveChatId = await getActiveLiveChatId(youtubeAccount.access_token)
    
    if (!liveChatId) {
      return NextResponse.json({ 
        liveChatId: null,
        isLive: false,
        message: 'Nenhuma transmissão ao vivo encontrada no canal WaveIGL'
      })
    }
    
    return NextResponse.json({ 
      liveChatId,
      source: 'api',
      isLive: true 
    })
    
  } catch (error) {
    console.error('[YouTube LiveChatId] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

