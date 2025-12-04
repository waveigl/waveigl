import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { checkTwitchModeratorStatus, checkKickModeratorStatus } from '@/lib/moderation/check'
import { grantTwitchModerator } from '@/lib/moderation/grant'
import { OWNER_ACCOUNT_IDS, ADMIN_ACCOUNT_IDS } from '@/lib/permissions'

/**
 * Verifica e atualiza o status de moderador do usuário em todas as plataformas vinculadas
 * Chamado no login e pode ser chamado manualmente para re-verificar
 * 
 * FLUXO COMPLETO:
 * 1. Verifica se o usuário é o OWNER ou ADMIN (pula verificação de moderador)
 * 2. Verifica se o usuário é moderador em cada plataforma (Twitch, Kick)
 * 3. Se for moderador em QUALQUER plataforma:
 *    a) Propaga is_moderator=true para TODAS as contas vinculadas no banco
 *    b) Atualiza role do perfil para 'moderator'
 *    c) TENTA conceder moderação REAL na Twitch (se o broadcaster tiver o scope)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar todas as contas vinculadas do usuário
    const { data: linkedAccounts, error: fetchError } = await supabase
      .from('linked_accounts')
      .select('id, platform, platform_user_id, access_token, is_moderator')
      .eq('user_id', session.userId)

    if (fetchError || !linkedAccounts) {
      return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 })
    }

    // Verificar se é o OWNER (streamer) - não precisa verificar moderador
    const isOwner = linkedAccounts.some(a => 
      OWNER_ACCOUNT_IDS[a.platform] === a.platform_user_id
    )
    
    if (isOwner) {
      console.log(`[Check Moderator] Usuário é o OWNER (streamer) - pular verificação de moderador`)
      return NextResponse.json({ 
        success: true, 
        isModerator: true,
        isOwner: true,
        platforms: linkedAccounts.reduce((acc, a) => ({ ...acc, [a.platform]: true }), {}),
        message: 'Usuário é o streamer - tem todas as permissões'
      })
    }
    
    // Verificar se é ADMIN - também tem todas as permissões
    const isAdmin = linkedAccounts.some(a => 
      ADMIN_ACCOUNT_IDS[a.platform] === a.platform_user_id
    )
    
    if (isAdmin) {
      console.log(`[Check Moderator] Usuário é ADMIN - pular verificação de moderador`)
      return NextResponse.json({ 
        success: true, 
        isModerator: true,
        isAdmin: true,
        platforms: linkedAccounts.reduce((acc, a) => ({ ...acc, [a.platform]: true }), {}),
        message: 'Usuário é admin - tem todas as permissões'
      })
    }

    const results: Record<string, boolean> = {}
    let anyModerator = false

    // Verificar cada plataforma (apenas para usuários não-owner/admin)
    for (const account of linkedAccounts) {
      let isModerator = account.is_moderator || false

      try {
        if (account.platform === 'twitch' && account.access_token) {
          isModerator = await checkTwitchModeratorStatus(
            account.platform_user_id,
            account.access_token,
            process.env.TWITCH_CLIENT_ID!
          )
        } else if (account.platform === 'kick' && account.access_token) {
          isModerator = await checkKickModeratorStatus(
            account.platform_user_id,
            account.access_token
          )
        }
        // YouTube não tem verificação direta via API

        // Atualizar no banco se mudou
        if (isModerator !== account.is_moderator) {
          await supabase
            .from('linked_accounts')
            .update({ is_moderator: isModerator })
            .eq('id', account.id)
          
          console.log(`[Check Moderator] ${account.platform}: ${account.is_moderator} -> ${isModerator}`)
        }

        results[account.platform] = isModerator
        if (isModerator) anyModerator = true

      } catch (error) {
        console.error(`[Check Moderator] Erro ao verificar ${account.platform}:`, error)
        results[account.platform] = account.is_moderator || false
        if (account.is_moderator) anyModerator = true
      }
    }

    // Se o usuário é moderador em QUALQUER plataforma, propagar para TODAS as plataformas
    const grantResults: Record<string, { success: boolean; error?: string }> = {}
    
    if (anyModerator) {
      console.log(`[Check Moderator] Usuário é moderador em pelo menos uma plataforma. Propagando para todas...`)
      
      // FASE 1: Atualizar TODAS as contas vinculadas para is_moderator = true no banco
      const { error: updateError } = await supabase
        .from('linked_accounts')
        .update({ is_moderator: true })
        .eq('user_id', session.userId)
      
      if (updateError) {
        console.error(`[Check Moderator] Erro ao propagar status:`, updateError)
      } else {
        console.log(`[Check Moderator] ✅ Status de moderador propagado para todas as ${linkedAccounts.length} plataformas no banco`)
      }
      
      // Atualizar results para refletir a propagação
      for (const account of linkedAccounts) {
        results[account.platform] = true
      }
      
      // FASE 2: Verificar se o role atual é menor que moderator e atualizar
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.userId)
        .single()
      
      // Só promover se ainda for 'user' (não rebaixar admin/streamer)
      if (profile && (!profile.role || profile.role === 'user')) {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'moderator' })
          .eq('id', session.userId)
        
        if (roleError) {
          console.error(`[Check Moderator] Erro ao atualizar role:`, roleError)
        } else {
          console.log(`[Check Moderator] ✅ Usuário ${session.userId} promovido para role 'moderator'`)
        }
      } else {
        console.log(`[Check Moderator] Role atual: ${profile?.role} - não precisa atualizar`)
      }
      
      // FASE 3: Tentar conceder moderação REAL nas plataformas
      // Twitch - usar API do broadcaster para adicionar moderador
      const twitchAccount = linkedAccounts.find(a => a.platform === 'twitch')
      if (twitchAccount) {
        console.log(`[Check Moderator] Tentando conceder moderação real na Twitch para ${twitchAccount.platform_user_id}...`)
        const twitchResult = await grantTwitchModerator(twitchAccount.platform_user_id)
        grantResults['twitch'] = { success: twitchResult.success, error: twitchResult.error }
        
        if (twitchResult.success) {
          console.log(`[Check Moderator] ✅ Moderação real concedida na Twitch`)
        } else {
          console.log(`[Check Moderator] ⚠️ Não foi possível conceder moderação real na Twitch: ${twitchResult.error}`)
        }
      }
      
      // Kick - NÃO é possível via API (apenas ban/timeout)
      const kickAccount = linkedAccounts.find(a => a.platform === 'kick')
      if (kickAccount) {
        grantResults['kick'] = { 
          success: false, 
          error: 'Kick não suporta adicionar moderadores via API. O streamer precisa adicionar manualmente.' 
        }
        console.log(`[Check Moderator] ⚠️ Kick não suporta adicionar moderadores via API`)
      }
      
      // YouTube - requer live chat ativo (futuro)
      const youtubeAccount = linkedAccounts.find(a => a.platform === 'youtube')
      if (youtubeAccount) {
        grantResults['youtube'] = { 
          success: false, 
          error: 'YouTube requer transmissão ao vivo ativa para adicionar moderadores.' 
        }
        console.log(`[Check Moderator] ⚠️ YouTube requer live chat ativo para adicionar moderadores`)
      }
      
    } else {
      console.log(`[Check Moderator] Usuário não é moderador em nenhuma plataforma`)
    }

    return NextResponse.json({ 
      success: true, 
      isModerator: anyModerator,
      platforms: results,
      grantResults: anyModerator ? grantResults : undefined
    })

  } catch (error) {
    console.error('[Check Moderator] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

