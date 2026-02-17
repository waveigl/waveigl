/**
 * POST /api/subscribers/sync
 * Sync subscribers from Twitch API and store in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { TwitchSubscriberService } from '@/lib/twitch/twitch-subscriber.service'
import { verifySubscriberManagementAccess } from '@/lib/twitch/authorization.middleware'
import { ErrorHandlingService } from '@/lib/twitch/error-handling.service'

const subscriberService = new TwitchSubscriberService()
const errorHandler = new ErrorHandlingService()

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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

    console.log('[API] POST /api/subscribers/sync started:', {
      channelId: context!.channelId,
      adminId: context!.userId,
      timestamp: new Date().toISOString(),
    })

    // Fetch subscribers from Twitch
    const subscribers = await subscriberService.fetchSubscribersFromTwitch(
      context!.channelId,
      context!.accessToken
    )

    // Store in database
    const storeResult = await subscriberService.storeSubscribers(
      context!.channelId,
      subscribers
    )

    const duration = Date.now() - startTime

    console.log('[API] POST /api/subscribers/sync completed:', {
      channelId: context!.channelId,
      totalFetched: subscribers.length,
      totalStored: storeResult.created,
      duration,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        totalFetched: subscribers.length,
        totalUpdated: storeResult.updated,
        totalNew: storeResult.created,
        duration,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await errorHandler.logError(
      'error',
      'Failed to sync subscribers from Twitch',
      message,
      {
        operation: 'POST /api/subscribers/sync',
      }
    )

    console.error('[API] POST /api/subscribers/sync error:', {
      error: message,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: 'Failed to sync subscribers' },
      { status: 500 }
    )
  }
}
