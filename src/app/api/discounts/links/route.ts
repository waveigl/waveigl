import { NextRequest, NextResponse } from 'next/server'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discountPrice, maxRedemptions, expirationDate, description, createdBy } = body

    if (discountPrice === undefined || !maxRedemptions || !expirationDate || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const link = await DiscountLinkService.generateLink({
      discountPrice,
      maxRedemptions,
      expirationDate,
      description,
      createdBy,
    })

    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') as any
    const sortOrder = searchParams.get('sortOrder') as any
    const status = searchParams.get('status') as any

    const filters = {
      sortBy,
      sortOrder,
      status: status || null,
    }

    const links = await DiscountLinkService.listLinks(filters)

    return NextResponse.json({ success: true, data: links }, { status: 200 })
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

    if (!id || !deletedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await DiscountLinkService.deleteLink(id, deletedBy)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}