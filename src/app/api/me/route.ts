import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { hasAllRequiredScopes, getMissingScopes, UserRole } from '@/lib/auth/scopes'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    
    const session = await parseSessionCookie(cookieHeader)
    
    if (!session) {
      return NextResponse.json({ user: null, linked_accounts: [] })
    }

    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', session.userId)
      .single()

    if (userError) {
      console.error('[/api/me] User query error:', userError.message)
    }

    // Buscar contas vinculadas com escopos
    const { data: linked, error: linkedError } = await getSupabaseAdmin()
      .from('linked_accounts')
      .select('id, platform, platform_user_id, platform_username, access_token, refresh_token, created_at, is_moderator, authorized_scopes, needs_reauth')
      .eq('user_id', session.userId)

    if (linkedError) {
      console.error('[/api/me] Linked accounts error:', linkedError.message)
    }

    // Verificar se alguma conta precisa de reautenticação
    const accountsNeedingReauth: Array<{ platform: string; missingScopes: string[] }> = []
    
    for (const account of (linked || [])) {
      const platform = account.platform as 'twitch' | 'youtube' | 'kick'
      const authorizedScopes = account.authorized_scopes as string[] | null
      
      if (!hasAllRequiredScopes(platform, authorizedScopes)) {
        const missingScopes = getMissingScopes(platform, authorizedScopes)
        accountsNeedingReauth.push({ platform, missingScopes })
      }
    }

    // Mascara tokens no retorno
    const mask = (t?: string | null) => (t ? `${t.slice(0, 4)}…${t.slice(-2)}` : null)
    const safeLinked = (linked || []).map((a) => {
      const platform = a.platform as 'twitch' | 'youtube' | 'kick'
      const needsReauth = !hasAllRequiredScopes(platform, a.authorized_scopes as string[] | null)
      
      return {
        ...a,
        access_token: mask(a.access_token as any),
        refresh_token: mask(a.refresh_token as any),
        needs_reauth: needsReauth,
        missing_scopes: needsReauth ? getMissingScopes(platform, a.authorized_scopes as string[] | null) : [],
      }
    })

    // Determina o nome de exibição
    let displayName = user?.username
    if (!displayName && linked && linked.length > 0) {
      // Prioriza Twitch > YouTube > Kick ou ordem de vinculação
      const priority = ['twitch', 'youtube', 'kick']
      const sorted = [...linked].sort((a, b) => {
        const pa = priority.indexOf(a.platform)
        const pb = priority.indexOf(b.platform)
        return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
      })
      displayName = sorted[0].platform_username
    }
    if (!displayName) {
      displayName = user?.email
    }

    // Verificar se é moderador em alguma plataforma
    const isModerator = (linked || []).some(a => a.is_moderator === true)
    
    // Determinar role do usuário
    // Se é moderador mas o role no banco ainda é 'user', usar 'moderator'
    // Não rebaixar se já for admin ou streamer
    let role: UserRole = user?.role || 'user'
    if (isModerator && role === 'user') {
      role = 'moderator'
    }

    const userWithDisplay = user ? { 
      ...user, 
      display_name: displayName,
      is_moderator: isModerator,
      role: role
    } : null

    return NextResponse.json({ 
      user: userWithDisplay, 
      linked_accounts: safeLinked,
      accounts_needing_reauth: accountsNeedingReauth
    })
  } catch (e) {
    console.error('GET /api/me error', e)
    return NextResponse.json({ user: null, linked_accounts: [] }, { status: 200 })
  }
}
