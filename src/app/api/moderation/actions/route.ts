import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/moderation/actions
 * Retorna todas as ações de moderação (bans e timeouts) ativas
 * Apenas streamer e admin podem acessar
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar erro ao setar cookies
            }
          },
        },
      }
    )

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é streamer ou admin
    const { data: linkedAccounts } = await supabase
      .from('linked_accounts')
      .select('platform, platform_username, is_moderator')
      .eq('user_id', user.id)

    const isStreamer = linkedAccounts?.some(
      acc =>
        (acc.platform === 'twitch' && acc.platform_username?.toLowerCase() === 'waveigl') ||
        (acc.platform === 'kick' && acc.platform_username?.toLowerCase() === 'waveigl')
    )

    const isAdmin = linkedAccounts?.some(
      acc =>
        (acc.platform === 'twitch' && acc.platform_username?.toLowerCase() === 'ogabrieltoth') ||
        (acc.platform === 'kick' && acc.platform_username?.toLowerCase() === 'ogabrieltoth')
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
      ...(bans || []).map(ban => ({
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
      ...(timeouts || []).map(timeout => ({
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
