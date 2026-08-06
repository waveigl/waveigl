import { NextRequest, NextResponse } from 'next/server'
import { ShortLinkService } from '@/lib/short-links/short-link.service'
import { parseUserAgent } from '@/lib/short-links/user-agent'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const requestUrl = new URL(request.url)

  const link = await ShortLinkService.getLinkByToken(token)

  if (!link) {
    return NextResponse.redirect(new URL('/', requestUrl.origin), 302)
  }

  try {
    const userAgent = request.headers.get('user-agent') || null
    const parsed = parseUserAgent(userAgent || '')
    const referrer = request.headers.get('referer') || null
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null

    await Promise.allSettled([
      ShortLinkService.incrementClicks(link.id),
      ShortLinkService.recordClick(link.id, {
        ip,
        userAgent,
        referrer,
        deviceType: parsed.deviceType,
        os: parsed.os,
        browser: parsed.browser,
        country: request.headers.get('x-vercel-ip-country') || null,
        region: request.headers.get('x-vercel-ip-region') || null,
        city: request.headers.get('x-vercel-ip-city') || null,
        utmSource: requestUrl.searchParams.get('utm_source') || null,
      }),
    ])
  } catch (error) {
    console.error('[ShortLink] Erro ao registrar clique:', error)
  }

  return NextResponse.redirect(link.originalUrl, 302)
}
