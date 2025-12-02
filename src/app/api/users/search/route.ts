import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { hasRolePermission, UserRole } from '@/lib/auth/scopes'

/**
 * GET /api/users/search?username=xxx
 * 
 * Busca um usuário pelo username (de qualquer plataforma vinculada)
 * Requer permissão de admin ou streamer
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Verificar se o usuário atual tem permissão
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.userId)
      .single()
    
    const currentRole = (currentUser?.role || 'user') as UserRole
    
    if (!hasRolePermission(currentRole, 'admin')) {
      return NextResponse.json({ 
        error: 'Permissão negada. Apenas admins ou streamers podem buscar usuários.' 
      }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username || username.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Username deve ter pelo menos 2 caracteres' 
      }, { status: 400 })
    }
    
    // Buscar nas contas vinculadas pelo username
    const { data: linkedAccount, error: searchError } = await supabase
      .from('linked_accounts')
      .select('user_id, platform, platform_username')
      .ilike('platform_username', username.trim())
      .maybeSingle()
    
    if (searchError) {
      console.error('[User Search] Erro:', searchError)
      return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
    }
    
    if (!linkedAccount) {
      return NextResponse.json({ user: null })
    }
    
    // Buscar dados do perfil do usuário encontrado
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', linkedAccount.user_id)
      .single()
    
    // Buscar todas as contas vinculadas deste usuário
    const { data: allAccounts } = await supabase
      .from('linked_accounts')
      .select('platform, platform_username, is_moderator')
      .eq('user_id', linkedAccount.user_id)
    
    return NextResponse.json({
      user: profile ? {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        linkedAccounts: allAccounts || []
      } : null
    })
    
  } catch (error) {
    console.error('[User Search] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

