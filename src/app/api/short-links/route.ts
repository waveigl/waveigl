import { NextRequest, NextResponse } from 'next/server'
import { ShortLinkService, SHORT_LINK_DUPLICATE_URL } from '@/lib/short-links/short-link.service'

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function containsWhitespace(value: string): boolean {
  return /\s/.test(value)
}

function conflictsWithSite(url: URL, requestUrl: string): boolean {
  try {
    const origin = new URL(requestUrl)
    const stripWww = (host: string) => host.toLowerCase().replace(/^www\./, '')
    return stripWww(url.hostname) === stripWww(origin.hostname)
  } catch {
    return false
  }
}

function normalizeAndValidateUrl(
  value: string,
  requestUrl: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: false, error: 'Informe a URL original' }
  }
  if (containsWhitespace(trimmed)) {
    return { ok: false, error: 'A URL não pode conter espaços' }
  }
  if (!isValidUrl(trimmed)) {
    return { ok: false, error: 'URL inválida. Use uma URL completa com http:// ou https://' }
  }
  if (conflictsWithSite(new URL(trimmed), requestUrl)) {
    return { ok: false, error: 'A URL não pode apontar para o próprio site' }
  }
  return { ok: true, value: trimmed }
}

function isDuplicateError(error: any): boolean {
  return error?.code === SHORT_LINK_DUPLICATE_URL
}

export async function GET() {
  try {
    const links = await ShortLinkService.listLinks()
    return NextResponse.json({ success: true, data: links }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originalUrl, description, createdBy } = body

    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: originalUrl' },
        { status: 400 }
      )
    }

    const result = normalizeAndValidateUrl(originalUrl, request.url)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const link = await ShortLinkService.createLink({
      originalUrl: result.value,
      description: description || undefined,
      createdBy: createdBy || 'anonymous',
    })

    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (error: any) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, originalUrl, description, updatedBy } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    let urlValue: string | undefined
    if (originalUrl !== undefined && originalUrl !== null) {
      const result = normalizeAndValidateUrl(String(originalUrl), request.url)
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      urlValue = result.value
    }

    const link = await ShortLinkService.updateLink(id, {
      originalUrl: urlValue,
      description: description === undefined ? undefined : (String(description).trim() || null),
      updatedBy: updatedBy || 'anonymous',
    })

    return NextResponse.json({ success: true, data: link }, { status: 200 })
  } catch (error: any) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, deletedBy } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    await ShortLinkService.deleteLink(id, deletedBy || 'anonymous')

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
