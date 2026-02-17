/**
 * API Routes for Discount Validation and Application
 * POST /api/discounts/validate - Validate any discount type
 * POST /api/discounts/apply - Apply discount to subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import { notifyDiscord } from '@/lib/notifications/discord'
import type { DiscountValidationResult } from '@/types/discount.types'

/**
 * POST /api/discounts/validate
 * Validate any discount type (direct_user, link, or coupon)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { discountType, discountId, code, token } = body

    if (!discountType) {
      return NextResponse.json(
        { error: 'Missing required field: discountType' },
        { status: 400 }
      )
    }

    let result: DiscountValidationResult

    if (discountType === 'direct_user') {
      if (!discountId) {
        return NextResponse.json(
          { error: 'Missing required field for direct_user: discountId' },
          { status: 400 }
        )
      }
      DiscountValidator.validateUUID(discountId)
      const discount = await DirectUserDiscountService.getDiscount(discountId)
      result = {
        isValid: !!discount && discount.isActive,
        discount,
      }
    } else if (discountType === 'link') {
      if (!token) {
        return NextResponse.json(
          { error: 'Missing required field for link: token' },
          { status: 400 }
        )
      }
      const link = await DiscountLinkService.validateToken(token)
      result = {
        isValid: true,
        discount: link,
      }
    } else if (discountType === 'coupon') {
      if (!code) {
        return NextResponse.json(
          { error: 'Missing required field for coupon: code' },
          { status: 400 }
        )
      }
      DiscountValidator.validateCouponCode(code)
      const coupon = await CouponCodeService.validateCode(code)
      result = {
        isValid: true,
        discount: coupon,
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid discountType. Must be: direct_user, link, or coupon' },
        { status: 400 }
      )
    }

    console.log('[DiscountValidation] Validated:', { discountType, isValid: result.isValid })

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountValidation] Error validating discount:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Validation Failed',
      message,
      context: { endpoint: 'POST /api/discounts/validate' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
