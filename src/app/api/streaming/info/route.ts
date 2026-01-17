import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { StreamingPlatform, StreamingInfoResponse } from '@/types/streaming.types'

/**
 * POST /api/streaming/info
 * Atualiza informações de streaming em uma ou múltiplas plataformas
 * Apenas usuários autenticados podem atualizar suas próprias informações
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { applyToAll, platforms } = body

    if (!platforms || typeof platforms !== 'object') {
      return NextResponse.json(
        { error: 'Dados de plataformas inválidos' },
        { status: 400 }
      )
    }

    // Buscar contas vinculadas do usuário
    const { data: linkedAccounts, error: linkedError } = await supabase
      .from('linked_accounts')
      .select('platform, platform_user_id, platform_username')
      .eq('user_id', user.id)

    if (linkedError || !linkedAccounts) {
      console.error('[API] Erro ao buscar contas vinculadas:', linkedError)
      return NextResponse.json(
        { error: 'Erro ao buscar contas vinculadas' },
        { status: 500 }
      )
    }

    const updated: StreamingPlatform[] = []
    const failed: { platform: StreamingPlatform; error: string }[] = []

    // Processar cada plataforma
    for (const [platform, info] of Object.entries(platforms)) {
      try {
        const platformKey = platform as StreamingPlatform
        const linkedAccount = linkedAccounts.find(acc => acc.platform === platformKey)

        if (!linkedAccount) {
          failed.push({
            platform: platformKey,
            error: 'Plataforma não vinculada',
          })
          continue
        }

        // Aqui você integraria com as APIs das plataformas
        // Por enquanto, vamos apenas logar e simular sucesso
        console.log(`[Streaming] Atualizando ${platformKey}:`, {
          userId: user.id,
          platformUsername: linkedAccount.platform_username,
          info,
        })

        // TODO: Integrar com APIs reais
        // - Twitch: Usar Twitch API para atualizar título, categoria, tags
        // - YouTube: Usar YouTube API para atualizar título, descrição, categoria, tags
        // - Kick: Usar Kick API (se disponível) ou webhooks

        updated.push(platformKey)
      } catch (error) {
        console.error(`[Streaming] Erro ao atualizar ${platform}:`, error)
        failed.push({
          platform: platform as StreamingPlatform,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    // Salvar histórico de atualizações no banco (opcional)
    if (updated.length > 0) {
      try {
        await supabase.from('streaming_info_history').insert({
          user_id: user.id,
          platforms: updated,
          data: platforms,
          apply_to_all: applyToAll,
          created_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[Streaming] Erro ao salvar histórico:', error)
        // Não falhar a requisição se o histórico não for salvo
      }
    }

    const response: StreamingInfoResponse = {
      success: failed.length === 0,
      message: `Atualizado em ${updated.length} plataforma(s)`,
      updated,
      ...(failed.length > 0 && { failed }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Erro ao atualizar informações de streaming:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar informações de streaming' },
      { status: 500 }
    )
  }
}
