import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createSessionCookie, parseSessionCookie } from '@/lib/auth/session'
import { 
  generateCodeVerifier, 
  generateCodeChallenge, 
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getKickUser
} from '@/lib/kick/oauth'
import { cookies } from 'next/headers'
import { checkKickModeratorStatus } from '@/lib/moderation/check'
import { REQUIRED_SCOPES } from '@/lib/auth/scopes'

// Escopos da Kick API
const KICK_SCOPES = REQUIRED_SCOPES.kick.join(' ')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  // Se houver erro do OAuth
  if (error) {
    console.error('[Kick Auth] OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/dashboard?error=kick_auth_denied`)
  }

  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[Kick Auth] Credenciais não configuradas')
    return NextResponse.redirect(`${appUrl}/auth/link-kick?error=not_configured`)
  }

  const redirectUri = `${appUrl}/api/auth/kick`

  // Se não tem code, iniciar OAuth flow
  if (!code) {
    // Gerar PKCE
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const stateValue = generateState()

    // Armazenar code_verifier e state em cookies seguros
    const cookieStore = await cookies()
    
    cookieStore.set('kick_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/'
    })
    
    cookieStore.set('kick_oauth_state', stateValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    })

    // Construir URL de autorização
    const authUrl = buildAuthorizationUrl({
      clientId,
      redirectUri,
      scope: KICK_SCOPES,
      state: stateValue,
      codeChallenge
    })

    console.log('[Kick Auth] Redirecionando para:', authUrl)
    return NextResponse.redirect(authUrl)
  }

  // Callback do OAuth - trocar code por tokens
  try {
    const cookieStore = await cookies()
    const storedVerifier = cookieStore.get('kick_code_verifier')?.value
    const storedState = cookieStore.get('kick_oauth_state')?.value

    // Validar state
    if (!storedState || storedState !== state) {
      console.error('[Kick Auth] State mismatch')
      return NextResponse.redirect(`${appUrl}/dashboard?error=kick_state_mismatch`)
    }

    if (!storedVerifier) {
      console.error('[Kick Auth] Code verifier não encontrado')
      return NextResponse.redirect(`${appUrl}/dashboard?error=kick_verifier_missing`)
    }

    // Verificar sessão existente para vincular conta adicional
    const session = await parseSessionCookie(request.headers.get('cookie'))
    const currentUserId = session?.userId

    // Trocar code por tokens
    console.log('[Kick Auth] Trocando code por tokens...')
    const tokenData = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
      codeVerifier: storedVerifier
    })

    console.log('[Kick Auth] Tokens obtidos com sucesso')

    // Obter dados do usuário
    console.log('[Kick Auth] Buscando dados do usuário...')
    const kickUser = await getKickUser(tokenData.access_token)
    console.log('[Kick Auth] Usuário:', kickUser)

    const supabase = getSupabaseAdmin()

    // Verificar se esta conta Kick já está vinculada a algum usuário
    const { data: existingLink } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('platform', 'kick')
      .eq('platform_user_id', String(kickUser.user_id))
      .maybeSingle()

    let userId: string

    if (existingLink) {
      // Esta conta Kick já está vinculada
      if (currentUserId && existingLink.user_id !== currentUserId) {
        const response = NextResponse.redirect(`${appUrl}/dashboard?error=account_already_linked`)
        response.cookies.delete('kick_code_verifier')
        response.cookies.delete('kick_oauth_state')
        return response
      }
      userId = existingLink.user_id
    } else if (currentUserId) {
      // Usuário logado vinculando nova conta Kick
      userId = currentUserId
    } else {
      // Novo usuário - criar conta
      const email = kickUser.email || `kick_${kickUser.user_id}@waveigl.local`

      // Tentar achar usuário existente por email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users.find(u => u.email === email)
      
      if (existingUser) {
        userId = existingUser.id
        await ensureProfileExists(supabase, userId, email, kickUser)
      } else {
        // Criar novo usuário no auth
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            avatar_url: kickUser.profile_picture,
            full_name: kickUser.name,
            provider: 'kick',
            kick_id: kickUser.user_id
          }
        })
        if (createError || !user) throw createError
        userId = user.id
        
        await ensureProfileExists(supabase, userId, email, kickUser)
      }
    }

    // Verificar se o usuário é moderador no canal WaveIGL
    console.log('[Kick Auth] Verificando status de moderador...')
    const isModerator = await checkKickModeratorStatus(
      String(kickUser.user_id),
      tokenData.access_token
    )
    console.log('[Kick Auth] Status de moderador:', isModerator)

    // Upsert linked account com status de moderador
    console.log('[Kick Auth] Vinculando conta:', {
      userId,
      platform: 'kick',
      platform_user_id: kickUser.user_id,
      platform_username: kickUser.name,
      is_moderator: isModerator
    })

    const { error: upsertError } = await supabase
      .from('linked_accounts')
      .upsert({
        user_id: userId,
        platform: 'kick',
        platform_user_id: String(kickUser.user_id),
        platform_username: kickUser.name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        is_moderator: isModerator,
        authorized_scopes: REQUIRED_SCOPES.kick,
        needs_reauth: false,
      }, { 
        onConflict: 'platform,platform_user_id',
        ignoreDuplicates: false 
      })

    if (upsertError) {
      console.error('[Kick Auth] Erro ao vincular conta:', upsertError)
      throw upsertError
    }

    console.log('[Kick Auth] Conta vinculada com sucesso com escopos:', REQUIRED_SCOPES.kick)

    // Atualizar perfil
    await supabase
      .from('profiles')
      .update({
        avatar_url: kickUser.profile_picture,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .is('avatar_url', null)

    // Limpar cookies de PKCE
    const response = NextResponse.redirect(`${appUrl}/dashboard?success=kick_linked`)
    response.cookies.delete('kick_code_verifier')
    response.cookies.delete('kick_oauth_state')
    
    // Criar sessão se não estiver logado
    if (!currentUserId) {
      const sessionCookie = await createSessionCookie(userId)
      response.headers.append('Set-Cookie', sessionCookie)
    }

    return response

  } catch (error) {
    console.error('[Kick Auth] Erro:', error)
    
    // Limpar cookies em caso de erro
    const response = NextResponse.redirect(`${appUrl}/dashboard?error=kick_auth_failed`)
    response.cookies.delete('kick_code_verifier')
    response.cookies.delete('kick_oauth_state')
    return response
  }
}

// Função auxiliar para garantir que o perfil existe
async function ensureProfileExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  email: string,
  kickUser: { name: string; profile_picture: string | null }
) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        username: kickUser.name,
        avatar_url: kickUser.profile_picture,
        full_name: kickUser.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Kick Auth] Erro ao criar perfil:', profileError)
      throw profileError
    }
    console.log('[Kick Auth] Perfil criado com sucesso para:', userId)
  }
}
