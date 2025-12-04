import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { removeMemberFromServer } from '@/lib/discord/server'

/**
 * POST /api/auth/discord/unlink
 * 
 * Desvincula o Discord do usuário e remove do servidor se tiver assinatura
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = getSupabaseAdmin()

    // Buscar conexão Discord
    const { data: discordConn, error: fetchError } = await db
      .from('discord_connections')
      .select('discord_id, discord_username')
      .eq('user_id', session.userId)
      .maybeSingle()

    if (fetchError || !discordConn) {
      return NextResponse.json({ error: 'Discord não vinculado' }, { status: 400 })
    }

    // Remover do servidor Discord (se estiver lá)
    const removeResult = await removeMemberFromServer(discordConn.discord_id)
    
    if (!removeResult.success) {
      console.warn(`[Discord Unlink] Não foi possível remover do servidor: ${removeResult.error}`)
      // Continua mesmo se falhar a remoção do servidor
    }

    // Deletar conexão do banco
    const { error: deleteError } = await db
      .from('discord_connections')
      .delete()
      .eq('user_id', session.userId)

    if (deleteError) {
      console.error('[Discord Unlink] Erro ao deletar conexão:', deleteError)
      return NextResponse.json({ error: 'Erro ao desvincular' }, { status: 500 })
    }

    // Atualizar benefícios para marcar Discord como desvinculado
    await db
      .from('subscriber_benefits')
      .update({ 
        discord_linked: false,
        discord_claimed_at: null
      })
      .eq('user_id', session.userId)

    console.log(`[Discord Unlink] ✅ Discord desvinculado: ${discordConn.discord_username}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Discord desvinculado com sucesso',
      removedFromServer: removeResult.success
    })

  } catch (error) {
    console.error('[Discord Unlink] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

