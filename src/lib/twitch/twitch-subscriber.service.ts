/**
 * TwitchSubscriberService
 * Handles all interactions with Twitch API and subscriber data storage
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import {
  Subscriber,
  SubscriberWithContact,
  PaginatedResult,
  SubscriberStats,
  TwitchSubscriberResponse,
  TwitchPaginatedResponse,
  ContactStatus,
  SyncResult,
} from '@/types/twitch.types'
import { ErrorHandlingService } from './error-handling.service'

const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const TWITCH_PAGE_SIZE = 100

export class TwitchSubscriberService {
  private get supabase() {
    return getSupabaseAdmin()
  }

  private errorHandler = new ErrorHandlingService()

  /**
   * Fetch all subscribers from Twitch API with pagination
   * Automatically retrieves all pages until complete
   */
  async fetchSubscribersFromTwitch(
    channelId: string,
    accessToken: string
  ): Promise<Subscriber[]> {
    const subscribers: Subscriber[] = []
    let cursor: string | undefined

    try {
      while (true) {
        const response = await this.fetchSubscriberPage(
          channelId,
          accessToken,
          cursor
        )

        // Convert Twitch response to internal format
        const pageSubscribers = response.data.map((sub) =>
          this.mapTwitchToSubscriber(sub, channelId)
        )

        subscribers.push(...pageSubscribers)

        // Check if there are more pages
        if (!response.pagination?.cursor) {
          break
        }

        cursor = response.pagination.cursor
      }

      console.log('[TwitchSubscriberService] Fetched subscribers:', {
        channelId,
        totalCount: subscribers.length,
        timestamp: new Date().toISOString(),
      })

      return subscribers
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error fetching subscribers'

      await this.errorHandler.logError(
        'error',
        'Failed to fetch subscribers from Twitch',
        message,
        {
          channelId,
          operation: 'fetchSubscribersFromTwitch',
        }
      )

      throw error
    }
  }

  /**
   * Fetch a single page of subscribers from Twitch API
   */
  private async fetchSubscriberPage(
    channelId: string,
    accessToken: string,
    cursor?: string
  ): Promise<TwitchPaginatedResponse<TwitchSubscriberResponse>> {
    const params = new URLSearchParams({
      broadcaster_id: channelId,
      first: TWITCH_PAGE_SIZE.toString(),
    })

    if (cursor) {
      params.append('after', cursor)
    }

    const response = await fetch(
      `${TWITCH_API_BASE}/subscriptions?${params.toString()}`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Twitch API error: ${response.status} - ${error.message || 'Unknown error'}`
      )
    }

    return response.json()
  }

  /**
   * Map Twitch API response to internal Subscriber format
   */
  private mapTwitchToSubscriber(
    twitchSub: TwitchSubscriberResponse,
    channelId: string
  ): Subscriber {
    return {
      id: '', // Will be set by database
      channelId,
      twitchUserId: twitchSub.user_id,
      twitchUsername: twitchSub.user_login,
      subscriptionTier: this.mapTwitchTier(twitchSub.tier),
      subscriptionDate: new Date(twitchSub.created_at),
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Map Twitch tier format to internal format
   */
  private mapTwitchTier(tier: string): 'tier_1' | 'tier_2' | 'tier_3' {
    switch (tier) {
      case '1000':
        return 'tier_1'
      case '2000':
        return 'tier_2'
      case '3000':
        return 'tier_3'
      default:
        return 'tier_1'
    }
  }

  /**
   * Store or update subscribers in database
   * Uses upsert to prevent duplicates
   */
  async storeSubscribers(
    channelId: string,
    subscribers: Subscriber[]
  ): Promise<{ created: number; updated: number }> {
    if (subscribers.length === 0) {
      return { created: 0, updated: 0 }
    }

    try {
      const { data, error } = await this.supabase
        .from('subscribers')
        .upsert(
          subscribers.map((sub) => ({
            channel_id: sub.channelId,
            twitch_user_id: sub.twitchUserId,
            twitch_username: sub.twitchUsername,
            subscription_tier: sub.subscriptionTier,
            subscription_date: sub.subscriptionDate.toISOString(),
            subscription_status: sub.subscriptionStatus,
            updated_at: new Date().toISOString(),
          })),
          {
            onConflict: 'channel_id,twitch_user_id',
          }
        )
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('[TwitchSubscriberService] Stored subscribers:', {
        channelId,
        count: data?.length || 0,
        timestamp: new Date().toISOString(),
      })

      return {
        created: data?.length || 0,
        updated: data?.length || 0,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error storing subscribers'

      await this.errorHandler.logError(
        'error',
        'Failed to store subscribers',
        message,
        {
          channelId,
          operation: 'storeSubscribers',
          subscriberCount: subscribers.length,
        }
      )

      throw error
    }
  }

  /**
   * Get subscribers with optional filtering and pagination
   */
  async getSubscribers(
    channelId: string,
    filters?: {
      contactStatus?: ContactStatus
      page?: number
      limit?: number
    }
  ): Promise<PaginatedResult<SubscriberWithContact>> {
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    try {
      let query = this.supabase
        .from('subscribers')
        .select(
          `
          *,
          subscriber_contacts (*)
        `,
          { count: 'exact' }
        )
        .eq('channel_id', channelId)
        .order('subscription_date', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply contact status filter if provided
      if (filters?.contactStatus) {
        query = query.eq('subscriber_contacts.contact_status', filters.contactStatus)
      }

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const subscribers = (data || []).map((sub) => ({
        ...sub,
        contact: sub.subscriber_contacts?.[0],
      }))

      return {
        data: subscribers,
        total: count || 0,
        page,
        limit,
        hasMore: offset + limit < (count || 0),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error fetching subscribers'

      await this.errorHandler.logError(
        'error',
        'Failed to fetch subscribers',
        message,
        {
          channelId,
          operation: 'getSubscribers',
          page,
          limit,
        }
      )

      throw error
    }
  }

  /**
   * Get subscriber statistics
   */
  async getSubscriberStats(channelId: string): Promise<SubscriberStats> {
    try {
      const { data, error } = await this.supabase
        .from('subscriber_contacts')
        .select('contact_status', { count: 'exact' })
        .eq('subscribers.channel_id', channelId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const stats: SubscriberStats = {
        total: 0,
        sent: 0,
        notSent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
      }

      // Count by status
      data?.forEach((contact) => {
        stats.total++
        switch (contact.contact_status) {
          case 'sent':
            stats.sent++
            break
          case 'not_sent':
            stats.notSent++
            break
          case 'failed':
            stats.failed++
            break
          case 'blocked':
            stats.blocked++
            break
          case 'banned':
            stats.banned++
            break
        }
      })

      return stats
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error fetching stats'

      await this.errorHandler.logError(
        'error',
        'Failed to fetch subscriber stats',
        message,
        {
          channelId,
          operation: 'getSubscriberStats',
        }
      )

      throw error
    }
  }
}
