import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canModerate, isProtectedLinkedAccounts } from '@/lib/permissions'
import { applyPlatformTimeout } from '@/lib/moderation/actions'

export async function POST(request: NextRequest) {
  try {
    const { targetPlatformUserId, targetPlatform, durationSeconds, reason, moderatorId } = await request.json()

    if (!targetPlatformUserId || !targetPlatform || !durationSeconds || !moderatorId) {
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

    // Aplicar timeout na plataforma
    const result = await applyPlatformTimeout(targetPlatform, targetPlatformUserId, durationSeconds, reason)

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Falha ao aplicar timeout na plataforma' 
      }, { status: 400 })
    }

    // Registrar ação se o usuário estiver no sistema
    if (targetAccount) {
      const { data: moderationAction } = await db
        .from('moderation_actions')
        .insert({
          user_id: targetAccount.user_id,
          moderator_id: moderatorId,
          action_type: 'timeout',
          duration_seconds: durationSeconds,
          reason: reason || 'Timeout aplicado via chat unificado',
          expires_at: new Date(Date.now() + durationSeconds * 1000).toISOString(),
          platforms: [targetPlatform]
        })
        .select()
        .single()

      if (moderationAction) {
        await db
          .from('active_timeouts')
          .insert({
            moderation_action_id: moderationAction.id,
            user_id: targetAccount.user_id,
            platform: targetPlatform,
            platform_user_id: targetPlatformUserId,
            expires_at: new Date(Date.now() + durationSeconds * 1000).toISOString(),
            last_applied_at: new Date().toISOString(),
            status: 'active'
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Timeout aplicado',
      platform: targetPlatform,
      result
    })

  } catch (error) {
    console.error('Erro no timeout:', error)
    return NextResponse.json(
      { error: 'Falha ao aplicar timeout' },
      { status: 500 }
    )
  }
}

