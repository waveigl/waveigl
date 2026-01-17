/**
 * API Routes for Coupon Codes
 * POST /api/discounts/coupons - Create coupon code
 * GET /api/discounts/coupons - List all coupons
 * GET /api/discounts/coupons/:id - Get specific coupon
 * POST /api/discounts/coupons/validate - Validate coupon code
 * PUT /api/discounts/coupons/:id - Update coupon
 * DELETE /api/discounts/coupons/:id - Delete coupon
 */

import { NextRequest, NextResponse } from 'next/server'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import { notifyDiscord } from '@/lib/notifications/discord'
import type { DiscountFilters } from '@/types/discount.types'

/**
 * POST /api/discounts/coupons
 * Create a new coupon code
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { code, discountPrice, maxRedemptions, expirationDate, createdBy, description } = body

    if (!code || !discountPrice || !maxRedemptions || !expirationDate || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountPrice, maxRedemptions, expirationDate, createdBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateCouponCode(code)
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateMaxRedemptions(maxRedemptions)
    DiscountValidator.validateExpirationDate(expirationDate)
    DiscountValidator.validateUUID(createdBy)
    if (description) DiscountValidator.validateDescription(description)

    const coupon = await CouponCodeService.createCoupon(
      code,
      discountPrice,
      maxRedemptions,
      expirationDate,
      createdBy,
      description
    )

    console.log('[CouponCode] Created:', { code, discountPrice, maxRedemptions, createdBy })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CouponCode] Error creating coupon:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Coupon Code Creation Failed',
      message,
      context: { endpoint: 'POST /api/discounts/coupons' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/discounts/coupons
 * List all coupon codes with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') as 'created_date' | 'expiration_date' | undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    const status = searchParams.get('status') as 'active' | 'exhausted' | 'expired' | 'inactive' | undefined

    const filters: DiscountFilters = {
      sortBy,
      sortOrder,
      status,
    }

    const coupons = await CouponCodeService.listCoupons(filters)

    console.log('[CouponCode] Listed:', { count: coupons.length })

    return NextResponse.json({ success: true, data: coupons }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CouponCode] Error listing coupons:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Coupon Code Listing Failed',
      message,
      context: { endpoint: 'GET /api/discounts/coupons' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/discounts/coupons/:id
 * Update a coupon code
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, discountPrice, maxRedemptions, expirationDate, updatedBy } = body

    if (!id || !updatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, updatedBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(updatedBy)
    if (discountPrice) DiscountValidator.validatePrice(discountPrice)
    if (maxRedemptions) DiscountValidator.validateMaxRedemptions(maxRedemptions)
    if (expirationDate) DiscountValidator.validateExpirationDate(expirationDate)

    const updates: Record<string, unknown> = {}
    if (discountPrice !== undefined) updates.discountPrice = discountPrice
    if (maxRedemptions !== undefined) updates.maxRedemptions = maxRedemptions
    if (expirationDate !== undefined) updates.expirationDate = expirationDate

    const coupon = await CouponCodeService.updateCoupon(id, updates)

    console.log('[CouponCode] Updated:', { id, updates })

    return NextResponse.json({ success: true, data: coupon }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CouponCode] Error updating coupon:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Coupon Code Update Failed',
      message,
      context: { endpoint: 'PUT /api/discounts/coupons/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/discounts/coupons/:id
 * Delete a coupon code (soft delete)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, deletedBy } = body

    if (!id || !deletedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, deletedBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(deletedBy)

    await CouponCodeService.deleteCoupon(id, deletedBy)

    console.log('[CouponCode] Deleted:', { id })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CouponCode] Error deleting coupon:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Coupon Code Deletion Failed',
      message,
      context: { endpoint: 'DELETE /api/discounts/coupons/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
