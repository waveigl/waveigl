/**
 * Kick OAuth 2.1 com PKCE
 * Baseado na documentação oficial: https://docs.kick.com
 */

import crypto from 'crypto'

const KICK_OAUTH_HOST = 'https://id.kick.com'

/**
 * Gera um code_verifier aleatório para PKCE
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Gera o code_challenge a partir do code_verifier usando SHA256
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest()
  return hash.toString('base64url')
}

/**
 * Gera um state aleatório para proteção CSRF
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Constrói a URL de autorização do Kick OAuth
 */
export function buildAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL('/oauth/authorize', KICK_OAUTH_HOST)
  
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('scope', params.scope)
  url.searchParams.set('state', params.state)
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  
  return url.toString()
}

/**
 * Troca o authorization code por tokens
 */
export async function exchangeCodeForTokens(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  codeVerifier: string
}): Promise<{
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const response = await fetch(`${KICK_OAUTH_HOST}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
      code: params.code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Kick OAuth] Token exchange failed:', error)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Atualiza tokens usando refresh_token
 */
export async function refreshTokens(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
}): Promise<{
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const response = await fetch(`${KICK_OAUTH_HOST}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Kick OAuth] Token refresh failed:', error)
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Revoga um token
 */
export async function revokeToken(token: string, tokenType: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
  const url = new URL('/oauth/revoke', KICK_OAUTH_HOST)
  url.searchParams.set('token', token)
  url.searchParams.set('token_hint_type', tokenType)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!response.ok) {
    console.error('[Kick OAuth] Token revoke failed:', response.status)
  }
}

/**
 * Obtém informações do usuário autenticado
 */
export async function getKickUser(accessToken: string): Promise<{
  user_id: number
  name: string
  email: string | null
  profile_picture: string | null
}> {
  // Endpoint da API Kick para obter dados do usuário
  const response = await fetch('https://api.kick.com/public/v1/users', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Kick API] Get user failed:', error)
    throw new Error(`Get user failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('[Kick API] Raw user data:', JSON.stringify(data))
  
  // A API retorna um array, pegar o primeiro elemento
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('No user data returned from Kick API')
    }
    return data[0]
  }
  
  // Se tiver data.data como array
  if (data.data && Array.isArray(data.data)) {
    if (data.data.length === 0) {
      throw new Error('No user data returned from Kick API')
    }
    return data.data[0]
  }
  
  // Se for objeto direto
  return data.data || data
}

/**
 * Busca informações de um canal pelo slug usando a API autenticada
 */
export async function getKickChannel(accessToken: string, channelSlug: string): Promise<{
  broadcaster_user_id: number
  slug: string
  channel_description: string | null
  banner_picture: string | null
  stream_title: string | null
  category: { name: string } | null
} | null> {
  try {
    // Usar a API pública v1 da Kick com autenticação
    const response = await fetch(`https://api.kick.com/public/v1/channels?broadcaster_user_id=`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Kick API] Get channel failed:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[Kick API] Channel data:', JSON.stringify(data))
    
    return data.data?.[0] || null
  } catch (error) {
    console.error('[Kick API] Error fetching channel:', error)
    return null
  }
}

