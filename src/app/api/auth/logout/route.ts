import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

function getAppUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request)
  const res = NextResponse.redirect(`${appUrl}/auth/login`)
  res.headers.append('Set-Cookie', clearSessionCookie())
  return res
}


