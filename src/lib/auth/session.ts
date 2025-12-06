const SESSION_COOKIE_NAME = 'wvg_session'

type SessionPayload = {
  userId: string
  exp: number // epoch seconds
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET ausente ou muito curto')
  }
  return new TextEncoder().encode(secret)
}

function base64url(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padLen = (4 - (base64.length % 4)) % 4
  const padded = base64 + '='.repeat(padLen)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getCryptoKey(secret: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    secret.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function sign(data: string): Promise<string> {
  const secret = getSessionSecret()
  const key = await getCryptoKey(secret)
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  )
  return base64url(new Uint8Array(signature))
}

async function encode(payload: SessionPayload): Promise<string> {
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await sign(body)
  return `${body}.${signature}`
}

async function decode(token: string): Promise<SessionPayload | null> {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  
  const secret = getSessionSecret()
  const key = await getCryptoKey(secret)
  
  const verified = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signature).buffer as ArrayBuffer,
    new TextEncoder().encode(body)
  )

  if (!verified) return null
  
  try {
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(body)))
    return json as SessionPayload
  } catch {
    return null
  }
}

export async function createSessionCookie(userId: string, days = 30): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + days * 24 * 60 * 60
  const token = await encode({ userId, exp })

  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${days * 24 * 60 * 60}`,
    isProd ? 'Secure' : undefined,
  ]
    .filter(Boolean)
    .join('; ')

  return cookie
}

export function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    isProd ? 'Secure' : undefined,
  ]
    .filter(Boolean)
    .join('; ')
  return cookie
}

export async function parseSessionCookie(cookieHeader: string | null | undefined): Promise<{ userId: string } | null> {
  if (!cookieHeader) return null
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const token = cookies[SESSION_COOKIE_NAME]
  if (!token) return null
  const payload = await decode(token)
  if (!payload) return null
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) return null
  return { userId: payload.userId }
}
