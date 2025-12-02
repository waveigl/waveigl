import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

export async function GET() {
  const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
  res.headers.append('Set-Cookie', clearSessionCookie())
  return res
}


