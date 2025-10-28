import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    // Iniciar OAuth flow
    const clientId = process.env.KICK_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/kick`
    const state = Math.random().toString(36).substring(7)
    
    const authUrl = `https://kick.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=user:read+chat:read+chat:write&` +
      `state=${state}`

    return NextResponse.redirect(authUrl)
  }

  try {
    // Trocar code por access token
    const tokenResponse = await fetch('https://kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.KICK_CLIENT_ID!,
        client_secret: process.env.KICK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/kick`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('Falha ao obter access token')
    }

    // Obter dados do usuário
    const userResponse = await fetch('https://kick.com/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()

    // Aqui você implementaria a lógica para:
    // 1. Verificar se usuário já existe no Supabase
    // 2. Criar ou vincular conta
    // 3. Redirecionar para dashboard

    // Por enquanto, redirecionar para dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)

  } catch (error) {
    console.error('Erro na autenticação Kick:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=kick_auth_failed`)
  }
}
