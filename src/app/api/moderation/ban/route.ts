import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canModerate, isProtectedLinkedAccounts } from '@/lib/permissions'
import { applyPlatformBan } from '@/lib/moderation/actions'

export async function POST(request: NextRequest) {
  try {
    const { targetUserId, reason, moderatorId } = await request.json()

    if (!targetUserId || !moderatorId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Validar permissão do moderador
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', moderatorId)
    const modRole = getUserRole(modLinked || [])
    if (!canModerate(modRole)) {
      return NextResponse.json({ error: 'Sem permissão para moderar' }, { status: 403 })
    }

    // Buscar todas as contas vinculadas do usuário alvo
    const { data: linkedAccounts, error: accountsError } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', targetUserId)

    if (accountsError) {
      console.error('Erro ao buscar contas vinculadas:', accountsError)
      return NextResponse.json({ error: 'Falha ao buscar contas do usuário' }, { status: 500 })
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      return NextResponse.json({ error: 'Usuário não possui contas vinculadas' }, { status: 404 })
    }

    // Bloquear punição para usuários protegidos
    if (isProtectedLinkedAccounts(linkedAccounts)) {
      return NextResponse.json({ error: 'Usuário protegido não pode ser punido' }, { status: 403 })
    }

    // Criar ação de moderação
    const { data: moderationAction, error: actionError } = await db
      .from('moderation_actions')
      .insert({
        user_id: targetUserId,
        moderator_id: moderatorId,
        action_type: 'ban',
        reason: reason || 'Ban aplicado via chat unificado',
        platforms: linkedAccounts.map(account => account.platform)
      })
      .select()
      .single()

    if (actionError) {
      console.error('Erro ao criar ação de moderação:', actionError)
      return NextResponse.json({ error: 'Falha ao criar ação de moderação' }, { status: 500 })
    }

    // Aplicar ban em cada plataforma
    const results: Record<string, { success: boolean; error?: string }> = {}
    
    for (const account of linkedAccounts) {
      try {
        const result = await applyPlatformBan(account.platform, account.platform_user_id, reason)
        results[account.platform] = result
      } catch (error) {
        console.error(`Erro ao aplicar ban na plataforma ${account.platform}:`, error)
        results[account.platform] = { success: false, error: String(error) }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ban aplicado',
      action_id: moderationAction.id,
      results
    })

  } catch (error) {
    console.error('Erro no ban:', error)
    return NextResponse.json(
      { error: 'Falha ao aplicar ban' },
      { status: 500 }
    )
  }
}

