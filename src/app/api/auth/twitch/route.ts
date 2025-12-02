import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createSessionCookie, parseSessionCookie } from '@/lib/auth/session'
import { checkTwitchModeratorStatus } from '@/lib/moderation/check'
import { REQUIRED_SCOPES, scopesToString } from '@/lib/auth/scopes'

// Escopos atuais da Twitch
const TWITCH_SCOPES = REQUIRED_SCOPES.twitch

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const appUrl = new URL(request.url).origin

  if (!code) {
    // Iniciar OAuth flow
    const clientId = process.env.TWITCH_CLIENT_ID
    const redirectUri = `${appUrl}/api/auth/twitch`
    const state = Math.random().toString(36).substring(7)
    
    const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scopesToString('twitch')}&` +
      `state=${state}`

    return NextResponse.redirect(authUrl)
  }

  try {
    // Verificar sessão existente para vincular conta adicional
    const session = await parseSessionCookie(request.headers.get('cookie'))
    const currentUserId = session?.userId

    // Trocar code por access token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/twitch`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Twitch token error:', tokenData)
      throw new Error('Falha ao obter access token')
    }

    // Obter dados do usuário
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })

    const userData = await userResponse.json()
    const twitchUser = userData.data[0]

    if (!twitchUser) {
      throw new Error('Falha ao obter dados do usuário Twitch')
    }

    const supabase = getSupabaseAdmin()

    // 1. Verificar se esta conta Twitch já está vinculada a algum usuário
    const { data: existingLink } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('platform', 'twitch')
      .eq('platform_user_id', twitchUser.id)
      .maybeSingle()

    let userId: string

    if (existingLink) {
      // Esta conta Twitch já está vinculada
      if (currentUserId && existingLink.user_id !== currentUserId) {
        // Tentando vincular a uma conta diferente - erro
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=account_already_linked`)
      }
      // Login na conta existente (ou já está logado nela)
      userId = existingLink.user_id
    } else if (currentUserId) {
      // Usuário logado vinculando nova conta Twitch
      userId = currentUserId
    } else {
      // Novo usuário - criar conta
      const email = twitchUser?.email || `twitch_${twitchUser.id}@waveigl.local`

      // Tentar achar usuário existente por email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users.find(u => u.email === email)
      
      if (existingUser) {
        userId = existingUser.id
        // Garantir que o perfil existe
        await ensureProfileExists(supabase, userId, email, twitchUser)
      } else {
        // Criar novo usuário no auth
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            avatar_url: twitchUser.profile_image_url,
            full_name: twitchUser.display_name,
            provider: 'twitch',
            twitch_id: twitchUser.id
          }
        })
        if (createError || !user) throw createError
        userId = user.id
        
        // Criar perfil manualmente (trigger pode não funcionar)
        await ensureProfileExists(supabase, userId, email, twitchUser)
      }
    }

    // 2. Verificar se o usuário é moderador no canal WaveIGL
    console.log('[Twitch Auth] Verificando status de moderador...')
    const isModerator = await checkTwitchModeratorStatus(
      twitchUser.id,
      tokenData.access_token,
      process.env.TWITCH_CLIENT_ID!
    )
    console.log('[Twitch Auth] Status de moderador:', isModerator)

    // 3. Upsert linked account com status de moderador
    console.log('[Twitch Auth] Vinculando conta:', {
      userId,
      platform: 'twitch',
      platform_user_id: twitchUser.id,
      platform_username: twitchUser.login,
      is_moderator: isModerator
    })

    const { error: upsertError } = await supabase
      .from('linked_accounts')
      .upsert({
        user_id: userId,
        platform: 'twitch',
        platform_user_id: twitchUser.id,
        platform_username: twitchUser.login,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        is_moderator: isModerator,
        authorized_scopes: TWITCH_SCOPES,
        needs_reauth: false,
      }, { 
        onConflict: 'platform,platform_user_id',
        ignoreDuplicates: false 
      })

    if (upsertError) {
      console.error('[Twitch Auth] Erro ao vincular conta:', upsertError)
      throw upsertError
    }

    console.log('[Twitch Auth] Conta vinculada com sucesso com escopos:', TWITCH_SCOPES)

    // 3. Atualizar perfil com avatar/nome e role se for moderador
    const profileUpdate: Record<string, any> = {
      avatar_url: twitchUser.profile_image_url,
      username: twitchUser.login,
      updated_at: new Date().toISOString()
    }

    // Se é moderador, atualizar o role e propagar para todas as plataformas
    if (isModerator) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (!currentProfile?.role || currentProfile.role === 'user') {
        profileUpdate.role = 'moderator'
        console.log('[Twitch Auth] Promovendo usuário para moderator')
      }
      
      // Propagar status de moderador para TODAS as contas vinculadas do usuário
      await supabase
        .from('linked_accounts')
        .update({ is_moderator: true })
        .eq('user_id', userId)
      
      console.log('[Twitch Auth] Status de moderador propagado para todas as plataformas')
    }

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    // 4. Criar cookie de sessão e redirecionar
    console.log('[Twitch Auth] Criando sessão para userId:', userId)
    const sessionCookie = await createSessionCookie(userId)
    
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
    res.headers.append('Set-Cookie', sessionCookie)
    return res

  } catch (error) {
    console.error('Erro na autenticação Twitch:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=twitch_auth_failed`)
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
