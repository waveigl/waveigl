import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createSessionCookie, parseSessionCookie } from '@/lib/auth/session'
import { REQUIRED_SCOPES } from '@/lib/auth/scopes'

// Escopos do YouTube/Google
const YOUTUBE_SCOPES = REQUIRED_SCOPES.youtube

function getAppUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const appUrl = getAppUrl(request)

  if (!code) {
    // Iniciar OAuth flow
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${appUrl}/api/auth/youtube`
    const state = Math.random().toString(36).substring(7)

    // Escopos base + escopos do YouTube
    const scope = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      ...YOUTUBE_SCOPES
    ].join('+')

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `include_granted_scopes=true&` +
      `prompt=consent&` +
      `state=${state}`

    return NextResponse.redirect(authUrl)
  }

  try {
    // Verificar sessão existente para vincular conta adicional
    const session = await parseSessionCookie(request.headers.get('cookie'))
    const currentUserId = session?.userId

    // Trocar code por access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/youtube`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('YouTube token error:', tokenData)
      throw new Error('Falha ao obter access token')
    }

    // Obter dados do usuário
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    
    if (!userData?.id) {
      throw new Error('Falha ao obter dados do usuário YouTube')
    }

    const platformUserId = userData.id
    const platformUsername = userData.name || userData.email?.split('@')[0] || 'user'

    const supabase = getSupabaseAdmin()

    // 1. Verificar se esta conta YouTube já está vinculada a algum usuário
    const { data: existingLink } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('platform', 'youtube')
      .eq('platform_user_id', platformUserId)
      .maybeSingle()

    let userId: string

    if (existingLink) {
      // Esta conta YouTube já está vinculada
      if (currentUserId && existingLink.user_id !== currentUserId) {
        // Tentando vincular a uma conta diferente - erro
        return NextResponse.redirect(`${appUrl}/dashboard?error=account_already_linked`)
      }
      // Login na conta existente (ou já está logado nela)
      userId = existingLink.user_id
    } else if (currentUserId) {
      // Usuário logado vinculando nova conta YouTube
      userId = currentUserId
    } else {
      // Novo usuário - criar conta
      const email = userData?.email || `youtube_${platformUserId}@waveigl.local`

      // Tentar achar usuário existente por email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users.find(u => u.email === email)
      
      if (existingUser) {
        userId = existingUser.id
        // Garantir que o perfil existe
        await ensureProfileExists(supabase, userId, email, {
          display_name: userData.name,
          profile_image_url: userData.picture,
          login: platformUsername
        })
      } else {
        // Criar novo usuário no auth
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            avatar_url: userData.picture,
            full_name: userData.name,
            provider: 'youtube'
          }
        })
        if (createError || !user) throw createError
        userId = user.id
        
        // Criar perfil manualmente
        await ensureProfileExists(supabase, userId, email, {
          display_name: userData.name,
          profile_image_url: userData.picture,
          login: platformUsername
        })
      }
    }

    // 2. Upsert linked account
    console.log('[YouTube Auth] Vinculando conta:', {
      userId,
      platform: 'youtube',
      platform_user_id: platformUserId,
      platform_username: platformUsername
    })

    // Escopos completos incluindo os base do Google
    const allScopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      ...YOUTUBE_SCOPES
    ]

    const { error: upsertError } = await supabase
      .from('linked_accounts')
      .upsert({
        user_id: userId,
        platform: 'youtube',
        platform_user_id: String(platformUserId),
        platform_username: String(platformUsername),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        authorized_scopes: allScopes,
        needs_reauth: false,
      }, { 
        onConflict: 'platform,platform_user_id',
        ignoreDuplicates: false 
      })

    if (upsertError) {
      console.error('[YouTube Auth] Erro ao vincular conta:', upsertError)
      throw upsertError
    }

    console.log('[YouTube Auth] Conta vinculada com sucesso com escopos:', allScopes)

    // 3. Atualizar perfil com avatar/nome
    await supabase
      .from('profiles')
      .update({
        avatar_url: userData.picture,
        username: platformUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // 4. Criar cookie de sessão e redirecionar
    console.log('[YouTube Auth] Criando sessão para userId:', userId)
    const sessionCookie = await createSessionCookie(userId)
    
    const res = NextResponse.redirect(`${appUrl}/dashboard`)
    res.headers.append('Set-Cookie', sessionCookie)
    return res

  } catch (error) {
    console.error('Erro na autenticação YouTube:', error)
    return NextResponse.redirect(`${appUrl}/auth/login?error=youtube_auth_failed`)
  }
}

// Função auxiliar para garantir que o perfil existe
async function ensureProfileExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  email: string,
  platformUser: { display_name?: string; profile_image_url?: string; login?: string }
) {
  // Verificar se perfil já existe
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existingProfile) {
    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        username: platformUser.login,
        avatar_url: platformUser.profile_image_url,
        full_name: platformUser.display_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Auth] Erro ao criar perfil:', profileError)
      throw profileError
    }
    console.log('[Auth] Perfil criado com sucesso para:', userId)
  }
}
