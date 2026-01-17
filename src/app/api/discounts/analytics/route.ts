/**
 * API Routes for Discount Analytics
 * GET /api/discounts/analytics - Get overall analytics
 * POST /api/discounts/export - Export data as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { DiscountAnalyticsService } from '@/lib/discounts/analytics.service'
import { notifyDiscord } from '@/lib/notifications/discord'
import type { AnalyticsFilters } from '@/types/discount.types'

/**
 * GET /api/discounts/analytics
 * Get overall discount analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const discountType = searchParams.get('discountType') as
      | 'direct_user'
      | 'link'
      | 'coupon'
      | undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: AnalyticsFilters = {
      discountType,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    }

    const analytics = await DiscountAnalyticsService.getOverallAnalytics(filters)

    console.log('[DiscountAnalytics] Retrieved overall analytics')

    return NextResponse.json({ success: true, data: analytics }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountAnalytics] Error getting analytics:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Analytics Retrieval Failed',
      message,
      context: { endpoint: 'GET /api/discounts/analytics' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/discounts/export
 * Export discount data as CSV
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { discountType, startDate, endDate } = body

    const filters: AnalyticsFilters = {
      discountType,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    }

    const csv = await DiscountAnalyticsService.exportData(filters)

    console.log('[DiscountAnalytics] Exported data as CSV')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="discount-data.csv"',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountAnalytics] Error exporting data:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Data Export Failed',
      message,
      context: { endpoint: 'POST /api/discounts/export' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
