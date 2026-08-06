import { NextRequest, NextResponse } from 'next/server'
import { ShortLinkService } from '@/lib/short-links/short-link.service'

export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required param: id' },
        { status: 400 }
      )
    }

    const stats = await ShortLinkService.getLinkStats(id)
    return NextResponse.json({ success: true, data: stats }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
