import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/auth/unlink
 * Desvincula uma conta de plataforma do usuário
 * 
 * - Desvinculação imediata (deleta o registro)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { platform } = await request.json()
    
    if (!platform || !['twitch', 'youtube', 'kick'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se a conta está vinculada
    const { data: linkedAccount, error: findError } = await supabase
      .from('linked_accounts')
      .select('id, platform_username')
      .eq('user_id', session.userId)
      .eq('platform', platform)
      .maybeSingle()

    if (findError || !linkedAccount) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    // Verificar quantas contas o usuário tem vinculadas
    const { count } = await supabase
      .from('linked_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.userId)

    // Não permitir desvincular se for a última conta
    if (count && count <= 1) {
      return NextResponse.json({ 
        error: 'Não é possível desvincular sua última conta. Você precisa ter pelo menos uma conta vinculada.' 
      }, { status: 400 })
    }

    // Deletar a conta vinculada
    const { error: deleteError } = await supabase
      .from('linked_accounts')
      .delete()
      .eq('id', linkedAccount.id)

    if (deleteError) {
      console.error('[Unlink] Erro ao desvincular:', deleteError)
      return NextResponse.json({ error: 'Erro ao desvincular conta' }, { status: 500 })
    }

    console.log(`[Unlink] Conta ${platform}/${linkedAccount.platform_username} desvinculada por ${session.userId}`)

    return NextResponse.json({ 
      success: true, 
      message: `Conta ${linkedAccount.platform_username} desvinculada com sucesso.`
    })

  } catch (error) {
    console.error('Erro ao desvincular conta:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
