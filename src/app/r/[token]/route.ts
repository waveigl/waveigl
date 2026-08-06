import { NextRequest, NextResponse } from 'next/server'
import { ShortLinkService } from '@/lib/short-links/short-link.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const link = await ShortLinkService.getLinkByToken(token)

  if (!link) {
    return NextResponse.redirect(new URL('/', _request.nextUrl.origin), 302)
  }

  try {
    await ShortLinkService.incrementClicks(link.id)
  } catch (error) {
    console.error('[ShortLink] Erro ao incrementar clicks:', error)
  }

  return NextResponse.redirect(link.originalUrl, 302)
}
