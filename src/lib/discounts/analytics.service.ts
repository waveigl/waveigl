/**
 * Discount Analytics Service
 * Provides analytics and reporting for discount operations
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type {
  DiscountStats,
  DiscountRedemption,
  AnalyticsFilters,
  DirectUserDiscount,
  DiscountLink,
  CouponCode,
} from '@/types/discount.types'
import { DiscountValidator } from '@/lib/discounts/validator'

interface RedemptionTimeline {
  date: string
  count: number
  revenue: number
}

interface DiscountAnalytics {
  totalDiscounts: number
  totalRedeemed: number
  totalRevenueLost: number
  averageDiscountValue: number
  redemptionRate: number
  byType: {
    directUser: DiscountStats
    links: DiscountStats
    coupons: DiscountStats
  }
}

/**
 * Discount Analytics Service
 * Provides methods for analytics and reporting
 */
export class DiscountAnalyticsService {
  private static supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )

  /**
   * Get overall discount analytics
   * @param filters - Optional filters
   * @returns Overall analytics data
   */
  static async getOverallAnalytics(filters?: AnalyticsFilters): Promise<DiscountAnalytics> {
    try {
      // Get all redemptions
      const redemptions = await this.getRedemptions(filters)

      // Get discount counts by type
      const directUserCount = await this.getDiscountCount('direct_user', filters)
      const linksCount = await this.getDiscountCount('link', filters)
      const couponsCount = await this.getDiscountCount('coupon', filters)

      // Calculate totals
      const totalDiscounts = directUserCount + linksCount + couponsCount
      const totalRedeemed = redemptions.length
      const totalRevenueLost = redemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue =
        totalRedeemed > 0 ? totalRevenueLost / totalRedeemed : 0

      // Get stats by type
      const directUserStats = await this.getDiscountTypeStats('direct_user', filters)
      const linksStats = await this.getDiscountTypeStats('link', filters)
      const couponsStats = await this.getDiscountTypeStats('coupon', filters)

      return {
        totalDiscounts,
        totalRedeemed,
        totalRevenueLost,
        averageDiscountValue,
        redemptionRate: totalDiscounts > 0 ? totalRedeemed / totalDiscounts : 0,
        byType: {
          directUser: directUserStats,
          links: linksStats,
          coupons: couponsStats,
        },
      }
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error getting overall analytics:', error)
      throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get stats for a specific discount
   * @param discountId - The discount ID
   * @param discountType - The discount type
   * @returns Discount-specific stats
   */
  static async getDiscountStats(
    discountId: string,
    discountType: 'direct_user' | 'link' | 'coupon'
  ): Promise<DiscountStats> {
    DiscountValidator.validateUUID(discountId)

    try {
      // Get redemptions for this discount
      const { data: redemptions, error } = await this.supabase
        .from('discount_redemptions')
        .select('*')
        .eq('discount_id', discountId)
        .eq('discount_type', discountType)

      if (error) {
        console.error('[DiscountAnalyticsService] Error fetching redemptions:', error)
        throw new Error(`Failed to fetch redemptions: ${error.message}`)
      }

      const totalRedeemed = redemptions?.length || 0
      const totalRevenueLost = redemptions?.reduce((sum, r) => sum + (r.discount_amount || 0), 0) || 0
      const averageDiscountValue = totalRedeemed > 0 ? totalRevenueLost / totalRedeemed : 0

      // Get recent redemptions (last 10)
      const recentRedemptions = (redemptions || [])
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
        .slice(0, 10)
        .map((r) => this.mapToRedemption(r))

      return {
        totalRedeemed,
        redemptionRate: totalRedeemed,
        revenueImpact: totalRevenueLost,
        averageDiscountValue,
        recentRedemptions,
      }
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error getting discount stats:', error)
      throw new Error(`Failed to get discount stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get redemption timeline for a discount
   * @param discountId - The discount ID
   * @param discountType - The discount type
   * @returns Timeline data
   */
  static async getRedemptionTimeline(
    discountId: string,
    discountType: 'direct_user' | 'link' | 'coupon'
  ): Promise<RedemptionTimeline[]> {
    DiscountValidator.validateUUID(discountId)

    try {
      const { data: redemptions, error } = await this.supabase
        .from('discount_redemptions')
        .select('redeemed_at, discount_amount')
        .eq('discount_id', discountId)
        .eq('discount_type', discountType)
        .order('redeemed_at', { ascending: true })

      if (error) {
        console.error('[DiscountAnalyticsService] Error fetching timeline:', error)
        throw new Error(`Failed to fetch timeline: ${error.message}`)
      }

      // Group by date
      const timeline = new Map<string, { count: number; revenue: number }>()

      ;(redemptions || []).forEach((r) => {
        const date = new Date(r.redeemed_at).toISOString().split('T')[0]
        const existing = timeline.get(date) || { count: 0, revenue: 0 }
        timeline.set(date, {
          count: existing.count + 1,
          revenue: existing.revenue + (r.discount_amount || 0),
        })
      })

      // Convert to array
      return Array.from(timeline.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue,
      }))
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error getting timeline:', error)
      throw new Error(`Failed to get timeline: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Export discount data as CSV
   * @param filters - Optional filters
   * @returns CSV string
   */
  static async exportData(filters?: AnalyticsFilters): Promise<string> {
    try {
      const redemptions = await this.getRedemptions(filters)

      // Build CSV header
      const headers = [
        'Discount ID',
        'Discount Type',
        'User ID',
        'Subscription ID',
        'Discount Amount',
        'Final Price',
        'Redeemed At',
        'IP Address',
      ]

      // Build CSV rows
      const rows = redemptions.map((r) => [
        r.discountId,
        r.discountType,
        r.userId,
        r.subscriptionId,
        r.discountAmount.toFixed(2),
        r.finalPrice.toFixed(2),
        r.redeemedAt,
        r.ipAddress || '',
      ])

      // Combine header and rows
      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      return csv
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error exporting data:', error)
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get redemptions with optional filters
   * @param filters - Optional filters
   * @returns Array of redemptions
   */
  private static async getRedemptions(filters?: AnalyticsFilters): Promise<DiscountRedemption[]> {
    let query = this.supabase.from('discount_redemptions').select('*')

    // Apply discount type filter
    if (filters?.discountType) {
      query = query.eq('discount_type', filters.discountType)
    }

    // Apply date range filter
    if (filters?.dateRange?.start) {
      query = query.gte('redeemed_at', filters.dateRange.start)
    }
    if (filters?.dateRange?.end) {
      query = query.lte('redeemed_at', filters.dateRange.end)
    }

    // Apply sorting
    if (filters?.sortBy === 'created_date') {
      query = query.order('redeemed_at', { ascending: filters?.sortOrder === 'asc' })
    } else {
      query = query.order('redeemed_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[DiscountAnalyticsService] Error fetching redemptions:', error)
      throw new Error(`Failed to fetch redemptions: ${error.message}`)
    }

    return (data || []).map((r) => this.mapToRedemption(r))
  }

  /**
   * Get count of discounts by type
   * @param discountType - The discount type
   * @param filters - Optional filters
   * @returns Count of discounts
   */
  private static async getDiscountCount(
    discountType: 'direct_user' | 'link' | 'coupon',
    filters?: AnalyticsFilters
  ): Promise<number> {
    try {
      let query = this.supabase.from('discount_redemptions').select('*', { count: 'exact', head: true })

      query = query.eq('discount_type', discountType)

      if (filters?.dateRange?.start) {
        query = query.gte('redeemed_at', filters.dateRange.start)
      }
      if (filters?.dateRange?.end) {
        query = query.lte('redeemed_at', filters.dateRange.end)
      }

      const { count, error } = await query

      if (error) {
        console.error('[DiscountAnalyticsService] Error counting discounts:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error counting discounts:', error)
      return 0
    }
  }

  /**
   * Get stats for a discount type
   * @param discountType - The discount type
   * @param filters - Optional filters
   * @returns Stats for the discount type
   */
  private static async getDiscountTypeStats(
    discountType: 'direct_user' | 'link' | 'coupon',
    filters?: AnalyticsFilters
  ): Promise<DiscountStats> {
    try {
      const { data: redemptions, error } = await this.supabase
        .from('discount_redemptions')
        .select('*')
        .eq('discount_type', discountType)

      if (error) {
        console.error('[DiscountAnalyticsService] Error fetching type stats:', error)
        throw new Error(`Failed to fetch stats: ${error.message}`)
      }

      const totalRedeemed = redemptions?.length || 0
      const totalRevenueLost = redemptions?.reduce((sum, r) => sum + (r.discount_amount || 0), 0) || 0
      const averageDiscountValue = totalRedeemed > 0 ? totalRevenueLost / totalRedeemed : 0

      const recentRedemptions = (redemptions || [])
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
        .slice(0, 10)
        .map((r) => this.mapToRedemption(r))

      return {
        totalRedeemed,
        redemptionRate: totalRedeemed,
        revenueImpact: totalRevenueLost,
        averageDiscountValue,
        recentRedemptions,
      }
    } catch (error) {
      console.error('[DiscountAnalyticsService] Error getting type stats:', error)
      throw new Error(`Failed to get type stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database record to DiscountRedemption type
   * @param data - The database record
   * @returns The mapped redemption
   */
  private static mapToRedemption(data: Record<string, unknown>): DiscountRedemption {
    return {
      id: data.id as string,
      discountType: data.discount_type as 'direct_user' | 'link' | 'coupon',
      discountId: data.discount_id as string,
      userId: data.user_id as string,
      subscriptionId: data.subscription_id as string,
      discountAmount: data.discount_amount as number,
      finalPrice: data.final_price as number,
      redeemedAt: data.redeemed_at as string,
      ipAddress: (data.ip_address as string) || undefined,
      userAgent: (data.user_agent as string) || undefined,
    }
  }
}

/**
 * Helper function to format analytics for display
 * @param analytics - The analytics data
 * @returns Formatted analytics
 */
export function formatAnalytics(analytics: DiscountAnalytics): {
  totalDiscounts: string
  totalRedeemed: string
  totalRevenueLost: string
  averageDiscountValue: string
  redemptionRate: string
} {
  return {
    totalDiscounts: analytics.totalDiscounts.toString(),
    totalRedeemed: analytics.totalRedeemed.toString(),
    totalRevenueLost: `R$ ${analytics.totalRevenueLost.toFixed(2)}`,
    averageDiscountValue: `R$ ${analytics.averageDiscountValue.toFixed(2)}`,
    redemptionRate: `${(analytics.redemptionRate * 100).toFixed(2)}%`,
  }
}

/**
 * Helper function to format stats for display
 * @param stats - The stats data
 * @returns Formatted stats
 */
export function formatStats(stats: DiscountStats): {
  totalRedeemed: string
  redemptionRate: string
  revenueImpact: string
  averageDiscountValue: string
} {
  return {
    totalRedeemed: stats.totalRedeemed.toString(),
    redemptionRate: stats.redemptionRate.toString(),
    revenueImpact: `R$ ${stats.revenueImpact.toFixed(2)}`,
    averageDiscountValue: `R$ ${stats.averageDiscountValue.toFixed(2)}`,
  }
}
