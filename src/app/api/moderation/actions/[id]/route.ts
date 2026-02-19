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
    const { error } = await supabase
      .from('moderation_actions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API] Erro ao deletar ação:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar ação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Erro ao deletar ação de moderação:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar ação de moderação' },
      { status: 500 }
    )
  }
}
