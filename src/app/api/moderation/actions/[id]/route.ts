import { NextRequest, NextResponse } from 'next/server'
import { verifyDashboardAccess } from '@/lib/auth/access'
import { canManageModerators } from '@/lib/permissions'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * DELETE /api/moderation/actions/[id]
 * Remove uma ação de moderação (ban ou timeout)
 * Apenas admin pode remover
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyDashboardAccess(request)

    if (!auth.success) {
      return NextResponse.json({ error: auth.error || 'Não autenticado' }, { status: 401 })
    }

    if (!canManageModerators(auth.context!.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem remover ações de moderação' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    // 1. Buscar detalhes da ação antes de deletar
    const { data: action, error: fetchError } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !action) {
      console.error('[API] Erro ao buscar ação para deletar:', fetchError)
      return NextResponse.json(
        { error: 'Ação não encontrada ou erro ao acessar banco' },
        { status: 404 }
      )
    }

    // 2. Se for timeout ou ban, tentar reverter na plataforma
    if (action.action_type === 'timeout' || action.action_type === 'ban') {
      const { applyPlatformUnban } = await import('@/lib/moderation/actions')

      // Tentar reverter em todas as plataformas onde foi aplicado
      // O campo 'platforms' ou 'platform' pode variar dependendo do registro
      const platformsToRevert = action.platforms || [action.platform]

      for (const platform of platformsToRevert) {
        if (!platform) continue

        console.log(`[API] Revertendo ${action.action_type} no ${platform} para ${action.target_user_id}`)
        const result = await applyPlatformUnban(
          platform,
          action.target_user_id,
          auth.context!.userId // Usar o moderador atual para reverter
        )

        if (!result.success) {
          console.warn(`[API] Falha ao reverter no ${platform}:`, result.error)
          // Continuamos para deletar do banco mesmo se a plataforma falhar (ex: usuário já deu unban manual)
        }
      }
    }

    // 3. Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('moderation_actions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[API] Erro ao deletar ação:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar ação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Ação removida e revertida na plataforma' })
  } catch (error) {
    console.error('[API] Erro ao deletar ação de moderação:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar ação de moderação' },
      { status: 500 }
    )
  }
}
