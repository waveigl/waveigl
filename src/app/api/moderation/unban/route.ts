import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyDashboardAccess } from '@/lib/auth/access'
import { canModerate } from '@/lib/permissions'
import { applyPlatformUnban } from '@/lib/moderation/actions'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyDashboardAccess(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error || 'Não autenticado' }, { status: 401 })
    }

    if (!canModerate(auth.context!.role)) {
      return NextResponse.json({ error: 'Apenas moderadores podem reverter punições' }, { status: 403 })
    }

    const { targetPlatformUserId, targetPlatform } = await request.json()
    const moderatorId = auth.context!.userId

    if (!targetPlatformUserId || !targetPlatform) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

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

