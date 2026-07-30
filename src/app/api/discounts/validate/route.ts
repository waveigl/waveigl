import { NextRequest, NextResponse } from 'next/server'
import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discountType } = body

    if (!discountType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: discountType' },
        { status: 400 }
      )
    }

    if (discountType === 'direct_user') {
      const { discountId } = body
      if (!discountId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field for direct_user: discountId' },
          { status: 400 }
        )
      }

      const discount = await DirectUserDiscountService.getDiscount(discountId)
      if (!discount) {
        return NextResponse.json(
          { success: false, error: 'Discount not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            isValid: true,
            discountAmount: discount.discountPrice,
            finalPrice: 9.9 - discount.discountPrice,
            discountType: 'direct_user',
            discount,
          },
        },
        { status: 200 }
      )
    }

    if (discountType === 'link') {
      const { token } = body
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Missing required field for link: token' },
          { status: 400 }
        )
      }

      const result = await DiscountLinkService.validateToken(token)
      if (!result.isValid || !result.discount) {
        return NextResponse.json(
          {
            success: true,
            data: {
              isValid: false,
              error: result.error,
            },
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            isValid: true,
            discountAmount: result.discount.discountPrice,
            finalPrice: 9.9 - result.discount.discountPrice,
            discountType: 'link',
            discount: result.discount,
          },
        },
        { status: 200 }
      )
    }

    if (discountType === 'coupon') {
      const { code } = body
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Missing required field for coupon: code' },
          { status: 400 }
        )
      }

      const result = await CouponCodeService.validateCode(code)
      if (!result.isValid || !result.discount) {
        return NextResponse.json(
          {
            success: true,
            data: {
              isValid: false,
              error: result.error,
            },
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            isValid: true,
            discountAmount: result.discount.discountPrice,
            finalPrice: 9.9 - result.discount.discountPrice,
            discountType: 'coupon',
            discount: result.discount,
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Invalid discountType. Must be direct_user, link, or coupon' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}