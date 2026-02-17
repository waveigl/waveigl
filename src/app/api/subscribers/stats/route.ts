/**
 * GET /api/subscribers/stats
 * Get subscriber statistics by contact status
 */

import { NextRequest, NextResponse } from 'next/server'
import { TwitchSubscriberService } from '@/lib/twitch/twitch-subscriber.service'
import { verifySubscriberManagementAccess } from '@/lib/twitch/authorization.middleware'

const subscriberService = new TwitchSubscriberService()

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const auth = await verifySubscriberManagementAccess(request)
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.error?.includes('Forbidden') ? 403 : 401 }
      )
    }

    const { context } = auth

    // Get stats
    const stats = await subscriberService.getSubscriberStats(context!.channelId)

    console.log('[API] GET /api/subscribers/stats:', {
      channelId: context!.channelId,
      total: stats.total,
      sent: stats.sent,
      notSent: stats.notSent,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[API] GET /api/subscribers/stats error:', {
      error: message,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
