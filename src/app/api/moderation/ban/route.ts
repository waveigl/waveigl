import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canBan, isProtectedLinkedAccounts } from '@/lib/permissions'
import { applyPlatformBan } from '@/lib/moderation/actions'

export async function POST(request: NextRequest) {
  try {
    const { targetPlatformUserId, targetPlatform, reason, moderatorId } = await request.json()

    if (!targetPlatformUserId || !targetPlatform || !moderatorId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Validar permissão do moderador - APENAS owner e admin podem banir
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', moderatorId)
    const modRole = getUserRole(modLinked || [])
    if (!canBan(modRole)) {
      return NextResponse.json({ error: 'Apenas administradores podem aplicar bans permanentes' }, { status: 403 })
    }

    // Buscar conta vinculada do alvo pelo platform_user_id
    const { data: targetAccount } = await db
      .from('linked_accounts')
      .select('*')
      .eq('platform', targetPlatform)
      .eq('platform_user_id', targetPlatformUserId)
      .maybeSingle()

    // Se o usuário estiver cadastrado no sistema, verificar proteção
    if (targetAccount) {
      const { data: allTargetAccounts } = await db
        .from('linked_accounts')
        .select('*')
        .eq('user_id', targetAccount.user_id)
      
      if (allTargetAccounts && isProtectedLinkedAccounts(allTargetAccounts)) {
        return NextResponse.json({ error: 'Usuário protegido não pode ser punido' }, { status: 403 })
      }
    }

    // Aplicar ban na plataforma (passando moderatorId para usar o token dele)
    const result = await applyPlatformBan(targetPlatform, targetPlatformUserId, reason, moderatorId)

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Falha ao aplicar ban na plataforma' 
      }, { status: 400 })
    }

    // Registrar ação se o usuário estiver no sistema
    if (targetAccount) {
      await db
        .from('moderation_actions')
        .insert({
          user_id: targetAccount.user_id,
          moderator_id: moderatorId,
          action_type: 'ban',
          reason: reason || 'Ban aplicado via chat unificado',
          platforms: [targetPlatform]
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Ban aplicado',
      platform: targetPlatform,
      result
    })

  } catch (error) {
    console.error('Erro no ban:', error)
    return NextResponse.json(
      { error: 'Falha ao aplicar ban' },
      { status: 500 }
    )
  }
}

