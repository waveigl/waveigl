/**
 * POST /api/subscribers/send-messages
 * Send messages to uncontacted subscribers
 */

import { NextRequest, NextResponse } from 'next/server'
import { MessageService } from '@/lib/twitch/message.service'
import { ValidationService } from '@/lib/twitch/validation.service'
import { verifySubscriberManagementAccess } from '@/lib/twitch/authorization.middleware'
import { ErrorHandlingService } from '@/lib/twitch/error-handling.service'

const messageService = new MessageService()
const validator = new ValidationService()
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

    // Get message from body
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate message
    validator.validateMessage(message)

    console.log('[API] POST /api/subscribers/send-messages started:', {
      channelId: context!.channelId,
      adminId: context!.userId,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    })

    // Send messages
    const result = await messageService.sendMessagesToUncontacted(
      context!.channelId,
      message,
      context!.accessToken,
      context!.userId
    )

    const duration = Date.now() - startTime

    console.log('[API] POST /api/subscribers/send-messages completed:', {
      channelId: context!.channelId,
      sent: result.sent,
      failed: result.failed,
      blocked: result.blocked,
      banned: result.banned,
      duration,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        duration,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await errorHandler.logError(
      'error',
      'Failed to send messages to subscribers',
      message,
      {
        operation: 'POST /api/subscribers/send-messages',
      }
    )

    console.error('[API] POST /api/subscribers/send-messages error:', {
      error: message,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    )
  }
}
