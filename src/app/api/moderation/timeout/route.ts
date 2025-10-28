import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ModerationActionType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { targetUserId, durationSeconds, reason, moderatorId } = await request.json()

    if (!targetUserId || !durationSeconds || !moderatorId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }

    // Buscar todas as contas vinculadas do usuário alvo
    const { data: linkedAccounts, error: accountsError } = await getSupabaseAdmin()
      .from('linked_accounts')
      .select('*')
      .eq('user_id', targetUserId)

    if (accountsError) {
      console.error('Erro ao buscar contas vinculadas:', accountsError)
      return NextResponse.json({ error: 'Falha ao buscar contas do usuário' }, { status: 500 })
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      return NextResponse.json({ error: 'Usuário não possui contas vinculadas' }, { status: 404 })
    }

    // Criar ação de moderação
    const { data: moderationAction, error: actionError } = await getSupabaseAdmin()
      .from('moderation_actions')
      .insert({
        user_id: targetUserId,
        moderator_id: moderatorId,
        action_type: 'timeout',
        duration_seconds: durationSeconds,
        reason: reason || 'Timeout aplicado via chat unificado',
        expires_at: new Date(Date.now() + durationSeconds * 1000).toISOString(),
        platforms: linkedAccounts.map(account => account.platform)
      })
      .select()
      .single()

    if (actionError) {
      console.error('Erro ao criar ação de moderação:', actionError)
      return NextResponse.json({ error: 'Falha ao criar ação de moderação' }, { status: 500 })
    }

    // Aplicar timeout em cada plataforma e criar registros de timeout ativo
    for (const account of linkedAccounts) {
      try {
        // Aplicar timeout na plataforma (implementar chamadas para APIs específicas)
        await applyPlatformTimeout(account.platform, account.platform_user_id, durationSeconds)
        
        // Criar registro de timeout ativo
        await getSupabaseAdmin()
          .from('active_timeouts')
          .insert({
            moderation_action_id: moderationAction.id,
            user_id: targetUserId,
            platform: account.platform,
            platform_user_id: account.platform_user_id,
            expires_at: new Date(Date.now() + durationSeconds * 1000).toISOString(),
            last_applied_at: new Date().toISOString(),
            status: 'active'
          })
      } catch (error) {
        console.error(`Erro ao aplicar timeout na plataforma ${account.platform}:`, error)
        // Continuar com outras plataformas mesmo se uma falhar
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Timeout aplicado com sucesso',
      action_id: moderationAction.id 
    })

  } catch (error) {
    console.error('Erro no timeout:', error)
    return NextResponse.json(
      { error: 'Falha ao aplicar timeout' }, 
      { status: 500 }
    )
  }
}

async function applyPlatformTimeout(platform: string, platformUserId: string, durationSeconds: number) {
  // Implementar chamadas para APIs específicas de cada plataforma
  switch (platform) {
    case 'twitch':
      // Implementar timeout via Twitch API
      console.log(`Aplicando timeout no Twitch para ${platformUserId}: ${durationSeconds}s`)
      break
    case 'youtube':
      // Implementar timeout via YouTube API
      console.log(`Aplicando timeout no YouTube para ${platformUserId}: ${durationSeconds}s`)
      break
    case 'kick':
      // Implementar timeout via Kick API
      console.log(`Aplicando timeout no Kick para ${platformUserId}: ${durationSeconds}s`)
      break
    default:
      throw new Error(`Plataforma não suportada: ${platform}`)
  }
}
