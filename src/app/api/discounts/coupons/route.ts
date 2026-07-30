import { NextRequest, NextResponse } from 'next/server'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, discountPrice, maxRedemptions, expirationDate, createdBy } = body

    if (!code || discountPrice === undefined || !maxRedemptions || !expirationDate || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const coupon = await CouponCodeService.createCoupon({
      code,
      discountPrice,
      maxRedemptions,
      expirationDate,
      createdBy,
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
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

    const coupons = await CouponCodeService.listCoupons(filters)

    return NextResponse.json({ success: true, data: coupons }, { status: 200 })
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
    const { id, discountPrice, maxRedemptions, expirationDate, isActive, updatedBy } = body

    if (!id || !updatedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const coupon = await CouponCodeService.updateCoupon(id, {
      discountPrice,
      maxRedemptions,
      expirationDate,
      isActive,
      updatedBy,
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 200 })
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

    await CouponCodeService.deleteCoupon(id, deletedBy)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}