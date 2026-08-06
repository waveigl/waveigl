import { NextRequest, NextResponse } from 'next/server'
import { ShortLinkService } from '@/lib/short-links/short-link.service'

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
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

    if (!isValidUrl(originalUrl)) {
      return NextResponse.json(
        { success: false, error: 'URL inválida. Use uma URL completa com http:// ou https://' },
        { status: 400 }
      )
    }

    const link = await ShortLinkService.createLink({
      originalUrl,
      description: description || undefined,
      createdBy: createdBy || 'anonymous',
    })

    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (error: any) {
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
