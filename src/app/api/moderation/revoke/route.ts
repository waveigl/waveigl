import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { revokeTwitchModerator, revokeModeratorAllPlatforms } from '@/lib/moderation/grant'
import { hasRolePermission, UserRole } from '@/lib/auth/scopes'

/**
 * POST /api/moderation/revoke
 * 
 * Remove moderação de um usuário em todas as plataformas
 * Requer que o usuário atual seja admin ou streamer
 * 
 * Body:
 * - userId: ID do usuário no sistema WaveIGL
 * - platform?: 'twitch' | 'all' (default: 'all')
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
    
    // Apenas admin ou streamer podem revogar moderação
    if (!hasRolePermission(currentRole, 'admin')) {
      return NextResponse.json({ 
        error: 'Permissão negada. Apenas admins ou streamers podem revogar moderação.' 
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
      // Revogar de todas as plataformas
      const { results: revokeResults, anySuccess } = await revokeModeratorAllPlatforms(userId)
      results.push(...revokeResults)
      
      return NextResponse.json({
        success: anySuccess,
        results,
        message: anySuccess 
          ? 'Moderação revogada de todas as plataformas' 
          : 'Não foi possível revogar moderação em nenhuma plataforma'
      })
    } else if (platform === 'twitch') {
      // Revogar apenas na Twitch
      const twitchAccount = linkedAccounts.find(a => a.platform === 'twitch')
      
      if (!twitchAccount) {
        return NextResponse.json({ 
          error: 'Usuário não tem conta Twitch vinculada' 
        }, { status: 400 })
      }
      
      const result = await revokeTwitchModerator(twitchAccount.platform_user_id)
      results.push(result)
      
      if (result.success) {
        // Atualizar is_moderator para false em TODAS as contas (propagação)
        await supabase
          .from('linked_accounts')
          .update({ is_moderator: false })
          .eq('user_id', userId)
        
        // Rebaixar role se era apenas moderador
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
        
        if (targetProfile?.role === 'moderator') {
          await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('id', userId)
        }
      }
    } else {
      return NextResponse.json({ 
        error: 'Plataforma não suportada. Use: twitch ou all' 
      }, { status: 400 })
    }
    
    const anySuccess = results.some(r => r.success)
    
    console.log(`[Revoke API] Moderação revogada para usuário ${userId}`)
    
    return NextResponse.json({
      success: anySuccess,
      results,
      message: anySuccess 
        ? 'Moderação revogada com sucesso' 
        : 'Não foi possível revogar moderação'
    })
    
  } catch (error) {
    console.error('[Revoke API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

