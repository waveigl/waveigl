import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Atualiza o status de moderador do usuário em uma plataforma
 * Chamado quando detectamos que o usuário tem badge de moderador
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { platform, isModerator } = await request.json()
    
    if (!platform || !['twitch', 'youtube', 'kick'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Atualizar o campo is_moderator na conta vinculada
    const { error } = await supabase
      .from('linked_accounts')
      .update({ is_moderator: !!isModerator })
      .eq('user_id', session.userId)
      .eq('platform', platform)

    if (error) {
      console.error('[Moderator] Erro ao atualizar status:', error)
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, isModerator: !!isModerator })

  } catch (error) {
    console.error('[Moderator] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

