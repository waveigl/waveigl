/**
 * Twitch Subscriber Management System Types
 * Defines all TypeScript interfaces and types for subscriber management
 */

/**
 * Contact status for subscriber communication tracking
 */
export type ContactStatus = 'sent' | 'not_sent' | 'failed' | 'blocked' | 'banned'

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'tier_1' | 'tier_2' | 'tier_3'

/**
 * Subscription status
 */
export type SubscriptionStatusType = 'active' | 'inactive'

/**
 * Subscriber data model
 */
export interface Subscriber {
  id: string // UUID
  channelId: string
  twitchUserId: string
  twitchUsername: string
  subscriptionTier: SubscriptionTier
  subscriptionDate: Date
  subscriptionStatus: SubscriptionStatusType
  createdAt: Date
  updatedAt: Date
}

/**
 * Subscriber contact tracking
 */
export interface SubscriberContact {
  id: string // UUID
  subscriberId: string
  messageSentAt: Date | null
  contactStatus: ContactStatus
  errorMessage: string | null
  sentByAdminId: string | null // Track which admin sent the message
  createdAt: Date
  updatedAt: Date
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Subscriber statistics
 */
export interface SubscriberStats {
  total: number
  sent: number
  notSent: number
  failed: number
  blocked: number
  banned: number
}

/**
 * Message send result summary
 */
export interface MessageSendResult {
  total: number
  sent: number
  failed: number
  blocked: number
  banned: number
  errors: Array<{
    subscriberId: string
    error: string
    status: ContactStatus
  }>
}

/**
 * Sync result summary
 */
export interface SyncResult {
  totalFetched: number
  totalUpdated: number
  totalNew: number
  duration: number
  timestamp: Date
}

/**
 * Twitch API subscriber response
 */
export interface TwitchSubscriberResponse {
  user_id: string
  user_login: string
  user_name: string
  tier: string
  is_gift: boolean
  created_at: string
}

/**
 * Twitch API paginated response
 */
export interface TwitchPaginatedResponse<T> {
  data: T[]
  pagination: {
    cursor?: string
  }
  total?: number
}

/**
 * API error response
 */
export interface ErrorResponse {
  success: false
  error: string
  code: string
  details?: Record<string, unknown>
}

/**
 * API success response wrapper
 */
export interface SuccessResponse<T> {
  success: true
  data: T
}

/**
 * Subscriber with contact info (joined view)
 */
export interface SubscriberWithContact extends Subscriber {
  contact?: SubscriberContact
}

/**
 * Admin action log entry
 */
export interface AdminActionLog {
  id: string
  channelId: string
  adminId: string
  adminUsername: string
  action: 'sync' | 'send_messages' | 'manual_contact_update'
  actionDetails: Record<string, unknown>
  createdAt: Date
}
