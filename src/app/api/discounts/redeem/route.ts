import { NextRequest, NextResponse } from 'next/server'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: token' },
        { status: 400 }
      )
    }

    const result = await DiscountLinkService.validateToken(token)

    if (!result.isValid || !result.discount) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Link de desconto inválido',
        },
        { status: 200 }
      )
    }

    const discount = result.discount

    await DiscountLinkService.incrementRedemption(discount.id)

    return NextResponse.json(
      {
        success: true,
        data: {
          discountAmount: discount.discountPrice,
          finalPrice: 9.9 - discount.discountPrice,
          discount,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
