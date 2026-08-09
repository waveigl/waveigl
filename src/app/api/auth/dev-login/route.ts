import { NextResponse } from 'next/server'
import { createSessionCookie } from '@/lib/auth/session'

export async function GET() {
  const userId = 'dev-user-001'
  const cookie = await createSessionCookie(userId)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3456'
  const response = NextResponse.redirect(new URL('/live', baseUrl))
  response.headers.set('Set-Cookie', cookie)

  return response
}
