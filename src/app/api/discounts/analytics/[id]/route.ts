/**
 * API Route for Specific Discount Analytics
 * GET /api/discounts/analytics/:id - Get discount-specific stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { DiscountAnalyticsService } from '@/lib/discounts/analytics.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import { notifyDiscord } from '@/lib/notifications/discord'

/**
 * GET /api/discounts/analytics/:id
 * Get stats for a specific discount
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const discountType = searchParams.get('type') as 'direct_user' | 'link' | 'coupon'

    if (!id || !discountType) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, type' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(id)

    const stats = await DiscountAnalyticsService.getDiscountStats(id, discountType)

    console.log('[DiscountAnalytics] Retrieved stats for discount:', { id, discountType })

    return NextResponse.json({ success: true, data: stats }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountAnalytics] Error getting discount stats:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Stats Retrieval Failed',
      message,
      context: { endpoint: 'GET /api/discounts/analytics/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
