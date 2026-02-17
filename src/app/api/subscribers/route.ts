/**
 * GET /api/subscribers
 * Fetch paginated list of subscribers with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { TwitchSubscriberService } from '@/lib/twitch/twitch-subscriber.service'
import { ValidationService } from '@/lib/twitch/validation.service'
import { verifySubscriberManagementAccess } from '@/lib/twitch/authorization.middleware'

const subscriberService = new TwitchSubscriberService()
const validator = new ValidationService()

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

    // Get query parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const contactStatus = request.nextUrl.searchParams.get('contactStatus')

    // Validate parameters
    validator.validatePaginationParams(page, limit)

    if (contactStatus) {
      validator.validateContactStatusFilter(contactStatus)
    }

    // Fetch subscribers
    const result = await subscriberService.getSubscribers(context!.channelId, {
      contactStatus: contactStatus as any,
      page,
      limit,
    })

    console.log('[API] GET /api/subscribers:', {
      channelId: context!.channelId,
      page,
      limit,
      total: result.total,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[API] GET /api/subscribers error:', {
      error: message,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}
