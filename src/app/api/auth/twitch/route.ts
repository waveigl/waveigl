import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    // Iniciar OAuth flow
    const clientId = process.env.TWITCH_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch`
    const state = Math.random().toString(36).substring(7)
    
    const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=user:read:email+chat:read+chat:edit+moderator:manage:banned_users&` +
      `state=${state}`

    return NextResponse.redirect(authUrl)
  }

  try {
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
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
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

    // Aqui você implementaria a lógica para:
    // 1. Verificar se usuário já existe no Supabase
    // 2. Criar ou vincular conta
    // 3. Redirecionar para dashboard

    // Por enquanto, redirecionar para dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)

  } catch (error) {
    console.error('Erro na autenticação Twitch:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=twitch_auth_failed`)
  }
}
