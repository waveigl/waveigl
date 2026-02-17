/**
 * MessageService
 * Handles message sending, tracking, and retry logic for Twitch whispers
 */

import { createClient } from '@supabase/supabase-js'
import {
  ContactStatus,
  MessageSendResult,
  Subscriber,
} from '@/types/twitch.types'
import { ErrorHandlingService } from './error-handling.service'
import { ValidationService } from './validation.service'

const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const MAX_RETRIES = 4
const BASE_DELAY = 1000 // 1 second
const MESSAGE_DELAY = 100 // 100ms between messages

export class MessageService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  private errorHandler = new ErrorHandlingService()
  private validator = new ValidationService()

  /**
   * Send messages to all uncontacted subscribers
   */
  async sendMessagesToUncontacted(
    channelId: string,
    message: string,
    accessToken: string,
    adminId: string
  ): Promise<MessageSendResult> {
    try {
      // Validate inputs
      this.validator.validateChannelId(channelId)
      this.validator.validateMessage(message)
      this.validator.validateAccessToken(accessToken)
      this.validator.validateAdminId(adminId)

      // Get uncontacted subscribers
      const uncontactedSubscribers = await this.getUncontactedSubscribers(channelId)

      console.log('[MessageService] Starting bulk send:', {
        channelId,
        subscriberCount: uncontactedSubscribers.length,
        adminId,
        timestamp: new Date().toISOString(),
      })

      const result: MessageSendResult = {
        total: uncontactedSubscribers.length,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      }

      // Send messages sequentially with delay
      for (let i = 0; i < uncontactedSubscribers.length; i++) {
        const subscriber = uncontactedSubscribers[i]

        // Add delay between messages (except first one)
        if (i > 0) {
          await this.delay(MESSAGE_DELAY)
        }

        try {
          const sendResult = await this.sendMessageWithRetry(
            subscriber.id,
            subscriber.twitchUserId,
            subscriber.twitchUsername,
            message,
            accessToken,
            adminId
          )

          // Track result
          if (sendResult.status === 'sent') {
            result.sent++
          } else if (sendResult.status === 'blocked') {
            result.blocked++
          } else if (sendResult.status === 'banned') {
            result.banned++
          } else {
            result.failed++
            result.errors.push({
              subscriberId: subscriber.id,
              error: sendResult.error || 'Unknown error',
              status: sendResult.status,
            })
          }
        } catch (error) {
          result.failed++
          result.errors.push({
            subscriberId: subscriber.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed',
          })
        }
      }

      console.log('[MessageService] Bulk send completed:', {
        channelId,
        sent: result.sent,
        failed: result.failed,
        blocked: result.blocked,
        banned: result.banned,
        timestamp: new Date().toISOString(),
      })

      // Log action to audit trail
      await this.logAdminAction(channelId, adminId, 'send_messages', {
        message_length: message.length,
        total_sent: result.sent,
        total_failed: result.failed,
        total_blocked: result.blocked,
        total_banned: result.banned,
      })

      return result
    } catch (error) {
      const message_error =
        error instanceof Error ? error.message : 'Unknown error'

      await this.errorHandler.logError(
        'error',
        'Failed to send messages to uncontacted subscribers',
        message_error,
        {
          channelId,
          operation: 'sendMessagesToUncontacted',
        }
      )

      throw error
    }
  }

  /**
   * Send message to single subscriber with retry logic
   */
  private async sendMessageWithRetry(
    subscriberId: string,
    twitchUserId: string,
    twitchUsername: string,
    message: string,
    accessToken: string,
    adminId: string,
    attempt: number = 1
  ): Promise<{
    status: ContactStatus
    error?: string
  }> {
    try {
      // Send message via Twitch API
      const response = await fetch(`${TWITCH_API_BASE}/whispers`, {
        method: 'POST',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_user_id: twitchUserId,
          message: message,
        }),
      })

      if (response.ok) {
        // Success - track in database
        await this.trackMessageSend(subscriberId, 'sent', null, adminId)

        console.log('[MessageService] Message sent:', {
          subscriberId,
          twitchUsername,
          timestamp: new Date().toISOString(),
        })

        return { status: 'sent' }
      }

      // Handle errors
      const errorData = await response.json()
      const errorMessage = errorData.message || 'Unknown error'

      // Check for specific error types
      if (this.errorHandler.isBlockedError(errorMessage)) {
        await this.trackMessageSend(subscriberId, 'blocked', errorMessage, adminId)
        return { status: 'blocked', error: errorMessage }
      }

      if (this.errorHandler.isBannedError(errorMessage)) {
        await this.trackMessageSend(subscriberId, 'banned', errorMessage, adminId)
        return { status: 'banned', error: errorMessage }
      }

      // Check if error is retryable
      if (
        this.errorHandler.isRetryableError(response.status) &&
        attempt < MAX_RETRIES
      ) {
        const delay = this.errorHandler.getRetryDelay(
          attempt,
          response.headers.get('Retry-After')
            ? parseInt(response.headers.get('Retry-After')!)
            : undefined
        )

        console.log('[MessageService] Retrying message send:', {
          subscriberId,
          attempt,
          delay,
          timestamp: new Date().toISOString(),
        })

        await this.delay(delay)

        return this.sendMessageWithRetry(
          subscriberId,
          twitchUserId,
          twitchUsername,
          message,
          accessToken,
          adminId,
          attempt + 1
        )
      }

      // Permanent error or max retries reached
      await this.trackMessageSend(subscriberId, 'failed', errorMessage, adminId)

      return { status: 'failed', error: errorMessage }
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error'

      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        const delay = this.errorHandler.getRetryDelay(attempt)

        console.log('[MessageService] Retrying after error:', {
          subscriberId,
          attempt,
          error: error_message,
          delay,
          timestamp: new Date().toISOString(),
        })

        await this.delay(delay)

        return this.sendMessageWithRetry(
          subscriberId,
          twitchUserId,
          twitchUsername,
          message,
          accessToken,
          adminId,
          attempt + 1
        )
      }

      // Max retries reached
      await this.trackMessageSend(subscriberId, 'failed', error_message, adminId)

      return { status: 'failed', error: error_message }
    }
  }

  /**
   * Track message send in database
   */
  private async trackMessageSend(
    subscriberId: string,
    status: ContactStatus,
    errorMessage: string | null,
    adminId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('subscriber_contacts')
        .upsert(
          {
            subscriber_id: subscriberId,
            message_sent_at: status === 'sent' ? new Date().toISOString() : null,
            contact_status: status,
            error_message: errorMessage,
            sent_by_admin_id: adminId,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'subscriber_id',
          }
        )

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error tracking message'

      await this.errorHandler.logError(
        'error',
        'Failed to track message send',
        message,
        {
          subscriberId,
          status,
          operation: 'trackMessageSend',
        }
      )

      throw error
    }
  }

  /**
   * Get uncontacted subscribers
   */
  private async getUncontactedSubscribers(channelId: string): Promise<Subscriber[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscribers')
        .select(
          `
          *,
          subscriber_contacts (contact_status)
        `
        )
        .eq('channel_id', channelId)
        .eq('subscription_status', 'active')
        .or(
          `subscriber_contacts.contact_status.eq.not_sent,subscriber_contacts.contact_status.eq.failed`
        )

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data || []).map((sub) => ({
        id: sub.id,
        channelId: sub.channel_id,
        twitchUserId: sub.twitch_user_id,
        twitchUsername: sub.twitch_username,
        subscriptionTier: sub.subscription_tier,
        subscriptionDate: new Date(sub.subscription_date),
        subscriptionStatus: sub.subscription_status,
        createdAt: new Date(sub.created_at),
        updatedAt: new Date(sub.updated_at),
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error fetching uncontacted subscribers'

      await this.errorHandler.logError(
        'error',
        'Failed to fetch uncontacted subscribers',
        message,
        {
          channelId,
          operation: 'getUncontactedSubscribers',
        }
      )

      throw error
    }
  }

  /**
   * Log admin action to audit trail
   */
  private async logAdminAction(
    channelId: string,
    adminId: string,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get admin username from linked accounts
      const { data: linkedAccount } = await this.supabase
        .from('linked_accounts')
        .select('platform_username')
        .eq('user_id', adminId)
        .eq('platform', 'twitch')
        .single()

      const adminUsername = linkedAccount?.platform_username || adminId

      await this.supabase.from('admin_action_logs').insert({
        channel_id: channelId,
        admin_id: adminId,
        admin_username: adminUsername,
        action,
        action_details: details,
      })
    } catch (error) {
      console.error('[MessageService] Failed to log admin action:', error)
      // Don't throw - logging failure shouldn't block the operation
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
