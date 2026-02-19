import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyDashboardAccess } from '@/lib/auth/access'
import { canManageModerators } from '@/lib/permissions'

/**
 * GET /api/moderation/actions
 * Retorna todas as ações de moderação (bans e timeouts) ativas
 * Apenas streamer e admin podem acessar
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyDashboardAccess(request)

    if (!auth.success) {
      return NextResponse.json({ error: auth.error || 'Não autenticado' }, { status: 401 })
    }

    if (!canManageModerators(auth.context!.role)) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { userId } = auth.context!
    const supabase = getSupabaseAdmin()

    // Buscar ações de moderação ativas
    const now = new Date()

    // Bans
    const { data: bans } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('action_type', 'ban')
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .order('created_at', { ascending: false })

    // Timeouts
    const { data: timeouts } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('action_type', 'timeout')
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .order('created_at', { ascending: false })

    // Combinar e formatar
    const actions = [
      ...(bans || []).map((ban: any) => ({
        id: ban.id,
        userId: ban.target_user_id,
        username: ban.target_username,
        platform: ban.platform,
        action: 'ban' as const,
        reason: ban.reason,
        duration: ban.duration_seconds,
        appliedAt: new Date(ban.created_at).getTime(),
        expiresAt: ban.expires_at ? new Date(ban.expires_at).getTime() : undefined,
      })),
      ...(timeouts || []).map((timeout: any) => ({
        id: timeout.id,
        userId: timeout.target_user_id,
        username: timeout.target_username,
        platform: timeout.platform,
        action: 'timeout' as const,
        reason: timeout.reason,
        duration: timeout.duration_seconds,
        appliedAt: new Date(timeout.created_at).getTime(),
        expiresAt: timeout.expires_at ? new Date(timeout.expires_at).getTime() : undefined,
      })),
    ]

    return NextResponse.json({ actions })
  } catch (error) {
    console.error('[API] Erro ao buscar ações de moderação:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ações de moderação' },
      { status: 500 }
    )
  }
}
