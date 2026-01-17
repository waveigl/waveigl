import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Verificar se é admin
    const { data: linkedAccounts } = await supabase
      .from('linked_accounts')
      .select('platform, platform_username')
      .eq('user_id', user.id)

    const isAdmin = linkedAccounts?.some(
      acc =>
        (acc.platform === 'twitch' && acc.platform_username?.toLowerCase() === 'ogabrieltoth') ||
        (acc.platform === 'kick' && acc.platform_username?.toLowerCase() === 'ogabrieltoth')
    )

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas admin pode remover ações de moderação' },
        { status: 403 }
      )
    }

    // Deletar ação
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
