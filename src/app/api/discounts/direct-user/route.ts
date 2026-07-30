import { NextRequest, NextResponse } from 'next/server'
import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, discountPrice, createdBy } = body

    if (!userId || discountPrice === undefined || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const discount = await DirectUserDiscountService.createDiscount({
      userId,
      discountPrice,
      createdBy,
    })

    return NextResponse.json({ success: true, data: discount }, { status: 201 })
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

    const filters = {
      sortBy,
      sortOrder,
      status: null,
    }

    const discounts = await DirectUserDiscountService.listDiscounts(filters)

    return NextResponse.json({ success: true, data: discounts }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, discountPrice, isActive, updatedBy } = body

    if (!id || !updatedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const discount = await DirectUserDiscountService.updateDiscount(id, {
      discountPrice,
      isActive,
      updatedBy,
    })

    return NextResponse.json({ success: true, data: discount }, { status: 200 })
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

    await DirectUserDiscountService.deleteDiscount(id, deletedBy)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}