import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canModerate } from '@/lib/permissions'
import { applyPlatformUnban } from '@/lib/moderation/actions'

export async function POST(request: NextRequest) {
  try {
    const { targetPlatformUserId, targetPlatform, moderatorId } = await request.json()

    if (!targetPlatformUserId || !targetPlatform || !moderatorId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Validar permissão do moderador - moderadores podem reverter punições
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', moderatorId)
    const modRole = getUserRole(modLinked || [])
    if (!canModerate(modRole)) {
      return NextResponse.json({ error: 'Apenas moderadores podem reverter punições' }, { status: 403 })
    }

    // Aplicar unban na plataforma
    const result = await applyPlatformUnban(targetPlatform, targetPlatformUserId, moderatorId)

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Falha ao reverter punição na plataforma' 
      }, { status: 400 })
    }

    // Buscar conta vinculada do alvo pelo platform_user_id
    const { data: targetAccount } = await db
      .from('linked_accounts')
      .select('*')
      .eq('platform', targetPlatform)
      .eq('platform_user_id', targetPlatformUserId)
      .maybeSingle()

    // Registrar ação se o usuário estiver no sistema
    if (targetAccount) {
      await db
        .from('moderation_actions')
        .insert({
          user_id: targetAccount.user_id,
          moderator_id: moderatorId,
          action_type: 'unban',
          reason: 'Punição revertida via chat unificado',
          platforms: [targetPlatform]
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Punição revertida',
      platform: targetPlatform,
      result
    })

  } catch (error) {
    console.error('Erro no unban:', error)
    return NextResponse.json(
      { error: 'Falha ao reverter punição' },
      { status: 500 }
    )
  }
}

