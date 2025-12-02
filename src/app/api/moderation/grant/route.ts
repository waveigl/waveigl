import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { grantTwitchModerator, grantModeratorAllPlatforms } from '@/lib/moderation/grant'
import { hasRolePermission, UserRole } from '@/lib/auth/scopes'

/**
 * POST /api/moderation/grant
 * 
 * Concede moderação real nas plataformas para um usuário
 * Requer que o usuário atual seja admin ou streamer
 * 
 * Body:
 * - userId: ID do usuário no sistema WaveIGL
 * - platform?: 'twitch' | 'youtube' | 'all' (default: 'all')
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Verificar se o usuário atual tem permissão (admin ou streamer)
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.userId)
      .single()
    
    const currentRole = (currentUser?.role || 'user') as UserRole
    
    // Apenas admin ou streamer podem conceder moderação
    if (!hasRolePermission(currentRole, 'admin')) {
      return NextResponse.json({ 
        error: 'Permissão negada. Apenas admins ou streamers podem conceder moderação.' 
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { userId, platform = 'all' } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }
    
    // Buscar contas vinculadas do usuário alvo
    const { data: linkedAccounts, error: fetchError } = await supabase
      .from('linked_accounts')
      .select('platform, platform_user_id')
      .eq('user_id', userId)
    
    if (fetchError || !linkedAccounts || linkedAccounts.length === 0) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado ou sem contas vinculadas' 
      }, { status: 404 })
    }
    
    const results: Array<{ platform: string; success: boolean; error?: string }> = []
    
    if (platform === 'all') {
      // Conceder em todas as plataformas disponíveis
      const { results: grantResults } = await grantModeratorAllPlatforms(userId)
      results.push(...grantResults)
    } else if (platform === 'twitch') {
      // Conceder apenas na Twitch
      const twitchAccount = linkedAccounts.find(a => a.platform === 'twitch')
      
      if (!twitchAccount) {
        return NextResponse.json({ 
          error: 'Usuário não tem conta Twitch vinculada' 
        }, { status: 400 })
      }
      
      const result = await grantTwitchModerator(twitchAccount.platform_user_id)
      results.push(result)
    } else {
      return NextResponse.json({ 
        error: 'Plataforma não suportada. Use: twitch, youtube ou all' 
      }, { status: 400 })
    }
    
    // Se alguma plataforma teve sucesso, atualizar o status interno também
    const anySuccess = results.some(r => r.success)
    
    if (anySuccess) {
      // Atualizar is_moderator para todas as contas vinculadas
      await supabase
        .from('linked_accounts')
        .update({ is_moderator: true })
        .eq('user_id', userId)
      
      // Atualizar role do usuário se necessário
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (targetProfile && (!targetProfile.role || targetProfile.role === 'user')) {
        await supabase
          .from('profiles')
          .update({ role: 'moderator' })
          .eq('id', userId)
      }
      
      console.log(`[Grant API] Moderação concedida para usuário ${userId}`)
    }
    
    return NextResponse.json({
      success: anySuccess,
      results,
      message: anySuccess 
        ? 'Moderação concedida com sucesso' 
        : 'Não foi possível conceder moderação em nenhuma plataforma'
    })
    
  } catch (error) {
    console.error('[Grant API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET /api/moderation/grant
 * 
 * Verifica se o broadcaster tem o token necessário para conceder moderação
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Verificar se o broadcaster waveigl tem o scope necessário
    const { data: broadcasterAccount } = await supabase
      .from('linked_accounts')
      .select('platform_username, authorized_scopes')
      .eq('platform', 'twitch')
      .ilike('platform_username', process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl')
      .maybeSingle()
    
    const hasScope = broadcasterAccount?.authorized_scopes?.includes('channel:manage:moderators')
    
    return NextResponse.json({
      canGrantModerator: !!hasScope,
      broadcasterLinked: !!broadcasterAccount,
      message: hasScope 
        ? 'Sistema pode conceder moderação na Twitch'
        : broadcasterAccount 
          ? 'Broadcaster precisa reautorizar com scope channel:manage:moderators'
          : 'Broadcaster waveigl precisa vincular conta na Twitch'
    })
    
  } catch (error) {
    console.error('[Grant API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

