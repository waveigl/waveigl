import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/moderation/actions
 * Retorna todas as ações de moderação (bans e timeouts) ativas
 * Apenas streamer e admin podem acessar
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))

    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se é streamer ou admin
    const { data: linkedAccounts } = await supabase
      .from('linked_accounts')
      .select('platform, platform_user_id, is_moderator')
      .eq('user_id', session.userId)

    const isStreamer = linkedAccounts?.some(
      (acc: any) =>
        (acc.platform === 'twitch' && acc.platform_user_id === '173162545') || // waveigl
        (acc.platform === 'kick' && acc.platform_user_id === '54454625')      // waveigl
    )

    const isAdmin = linkedAccounts?.some(
      (acc: any) =>
        (acc.platform === 'twitch' && acc.platform_user_id === '129980106') || // ogabrieltoth
        (acc.platform === 'kick' && acc.platform_user_id === '4053403')       // OGabrielToth
    )

    if (!isStreamer && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

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
