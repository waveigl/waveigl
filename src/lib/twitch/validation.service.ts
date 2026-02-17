/**
 * ValidationService
 * Validates all input data for the Twitch Subscriber Management System
 */

import {
  Subscriber,
  ContactStatus,
  SubscriptionTier,
  TwitchSubscriberResponse,
} from '@/types/twitch.types'

const VALID_CONTACT_STATUSES: ContactStatus[] = [
  'sent',
  'not_sent',
  'failed',
  'blocked',
  'banned',
]

const VALID_TIERS: SubscriptionTier[] = ['tier_1', 'tier_2', 'tier_3']

const MAX_MESSAGE_LENGTH = 500
const MIN_MESSAGE_LENGTH = 1

export class ValidationService {
  /**
   * Validate subscriber data from Twitch API
   */
  validateSubscriberData(data: unknown): TwitchSubscriberResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid subscriber data: not an object')
    }

    const sub = data as Record<string, unknown>

    // Validate required fields
    if (!sub.user_id || typeof sub.user_id !== 'string') {
      throw new Error('Invalid subscriber data: missing or invalid user_id')
    }

    if (!sub.user_login || typeof sub.user_login !== 'string') {
      throw new Error('Invalid subscriber data: missing or invalid user_login')
    }

    if (!sub.user_name || typeof sub.user_name !== 'string') {
      throw new Error('Invalid subscriber data: missing or invalid user_name')
    }

    if (!sub.tier || typeof sub.tier !== 'string') {
      throw new Error('Invalid subscriber data: missing or invalid tier')
    }

    if (!sub.created_at || typeof sub.created_at !== 'string') {
      throw new Error('Invalid subscriber data: missing or invalid created_at')
    }

    // Validate tier format
    const validTiers = ['1000', '2000', '3000']
    if (!validTiers.includes(sub.tier)) {
      throw new Error(`Invalid subscriber data: invalid tier ${sub.tier}`)
    }

    // Validate date format
    const date = new Date(sub.created_at as string)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid subscriber data: invalid date format')
    }

    return {
      user_id: sub.user_id as string,
      user_login: sub.user_login as string,
      user_name: sub.user_name as string,
      tier: sub.tier as string,
      is_gift: typeof sub.is_gift === 'boolean' ? sub.is_gift : false,
      created_at: sub.created_at as string,
    }
  }

  /**
   * Validate message content
   */
  validateMessage(message: string): void {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string')
    }

    const trimmed = message.trim()

    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      throw new Error('Message cannot be empty')
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
      )
    }
  }

  /**
   * Validate contact status filter
   */
  validateContactStatusFilter(status: unknown): ContactStatus {
    if (!status || typeof status !== 'string') {
      throw new Error('Contact status must be a string')
    }

    if (!VALID_CONTACT_STATUSES.includes(status as ContactStatus)) {
      throw new Error(
        `Invalid contact status: ${status}. Must be one of: ${VALID_CONTACT_STATUSES.join(', ')}`
      )
    }

    return status as ContactStatus
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(page: number, limit: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a positive integer')
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Limit must be an integer between 1 and 100')
    }
  }

  /**
   * Validate channel ID
   */
  validateChannelId(channelId: unknown): string {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Channel ID must be a non-empty string')
    }

    if (channelId.trim().length === 0) {
      throw new Error('Channel ID cannot be empty')
    }

    return channelId.trim()
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: unknown): string {
    if (!token || typeof token !== 'string') {
      throw new Error('Access token must be a non-empty string')
    }

    if (token.trim().length === 0) {
      throw new Error('Access token cannot be empty')
    }

    return token.trim()
  }

  /**
   * Validate admin ID
   */
  validateAdminId(adminId: unknown): string {
    if (!adminId || typeof adminId !== 'string') {
      throw new Error('Admin ID must be a non-empty string')
    }

    if (adminId.trim().length === 0) {
      throw new Error('Admin ID cannot be empty')
    }

    return adminId.trim()
  }

  /**
   * Sanitize string to prevent SQL injection
   * Note: Supabase uses parameterized queries, but this adds extra safety
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[;'"\\]/g, '') // Remove quotes and semicolons
      .trim()
  }
}
