/**
 * Discount Link Service
 * Manages discount links - unique URLs with limited redemptions
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { DiscountLink, DiscountFilters, DiscountRedemption } from '@/types/discount.types'
import { DiscountValidator, calculateDiscountedPrice } from '@/lib/discounts/validator'
import {
  DiscountValidationError,
  DiscountNotFoundError,
  DiscountExhaustedError,
  DiscountExpiredError,
} from '@/types/discount.types'
import { randomBytes } from 'crypto'

/**
 * Discount Link Service
 * Provides methods for managing discount links
 */
export class DiscountLinkService {
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
   * Generate a unique discount link
   * @param discountPrice - The discount price
   * @param maxRedemptions - Maximum number of redemptions
   * @param expirationDate - When the link expires
   * @param createdBy - The admin ID creating the link
   * @param description - Optional description
   * @returns The created discount link
   */
  static async generateLink(
    discountPrice: number,
    maxRedemptions: number,
    expirationDate: string,
    createdBy: string,
    description?: string
  ): Promise<DiscountLink> {
    // Validate inputs
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateMaxRedemptions(maxRedemptions)
    DiscountValidator.validateExpirationDate(expirationDate)
    DiscountValidator.validateUUID(createdBy)
    if (description) {
      DiscountValidator.validateDescription(description)
    }

    // Generate unique token
    const token = this.generateToken()

    // Create link
    const { data, error } = await this.supabase
      .from('discount_links')
      .insert({
        token,
        discount_price: discountPrice,
        max_redemptions: maxRedemptions,
        current_redemptions: 0,
        expiration_date: expirationDate,
        description: description || null,
        created_by: createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[DiscountLinkService] Error generating link:', error)
      throw new Error(`Failed to generate link: ${error.message}`)
    }

    // Log audit
    await this.logAudit('create', data.id, createdBy, {
      discountPrice,
      maxRedemptions,
      expirationDate,
    })

    return this.mapToLink(data)
  }

  /**
   * Get a specific link by ID
   * @param id - The link ID
   * @returns The link or null if not found
   */
  static async getLink(id: string): Promise<DiscountLink | null> {
    DiscountValidator.validateUUID(id)

    const { data, error } = await this.supabase
      .from('discount_links')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[DiscountLinkService] Error fetching link:', error)
      throw new Error(`Failed to fetch link: ${error.message}`)
    }

    return this.mapToLink(data)
  }

  /**
   * Validate a discount link token
   * @param token - The token to validate
   * @returns Validation result with link details
   */
  static async validateToken(token: string): Promise<DiscountLink> {
    DiscountValidator.validateToken(token)

    const { data, error } = await this.supabase
      .from('discount_links')
      .select('*')
      .eq('token', token)
      .is('deleted_at', null)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new DiscountNotFoundError('discount_link', token)
      }
      console.error('[DiscountLinkService] Error validating token:', error)
      throw new Error(`Failed to validate token: ${error.message}`)
    }

    const link = this.mapToLink(data)

    // Check if expired
    if (DiscountValidator.isExpired(link.expirationDate)) {
      throw new DiscountExpiredError('link')
    }

    // Check if exhausted
    if (link.currentRedemptions >= link.maxRedemptions) {
      throw new DiscountExhaustedError('link')
    }

    return link
  }

  /**
   * List all links with optional filters
   * @param filters - Optional filters
   * @returns Array of links
   */
  static async listLinks(filters?: DiscountFilters): Promise<DiscountLink[]> {
    let query = this.supabase
      .from('discount_links')
      .select('*')
      .is('deleted_at', null)

    // Apply filters
    if (filters?.status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (filters?.status === 'exhausted') {
      // This would need a computed column or post-processing
    } else if (filters?.status === 'expired') {
      // This would need a computed column or post-processing
    } else {
      query = query.eq('is_active', true)
    }

    // Apply sorting
    if (filters?.sortBy === 'created_date') {
      query = query.order('created_at', { ascending: filters?.sortOrder === 'asc' })
    } else if (filters?.sortBy === 'expiration_date') {
      query = query.order('expiration_date', { ascending: filters?.sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[DiscountLinkService] Error listing links:', error)
      throw new Error(`Failed to list links: ${error.message}`)
    }

    return data.map((d) => this.mapToLink(d))
  }

  /**
   * Redeem a discount link
   * @param token - The link token
   * @param userId - The user redeeming the link
   * @param subscriptionId - The subscription ID
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @returns The redemption record
   */
  static async redeemLink(
    token: string,
    userId: string,
    subscriptionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscountRedemption> {
    // Validate token
    const link = await this.validateToken(token)

    // Validate inputs
    DiscountValidator.validateUUID(userId)
    DiscountValidator.validateSubscriptionId(subscriptionId)

    // Calculate discount
    const { discountAmount, finalPrice } = calculateDiscountedPrice(link.discountPrice)

    // Increment redemption counter
    const { error: updateError } = await this.supabase
      .from('discount_links')
      .update({
        current_redemptions: link.currentRedemptions + 1,
      })
      .eq('id', link.id)

    if (updateError) {
      console.error('[DiscountLinkService] Error incrementing redemptions:', updateError)
      throw new Error(`Failed to redeem link: ${updateError.message}`)
    }

    // Log redemption
    const { data: redemption, error: redemptionError } = await this.supabase
      .from('discount_redemptions')
      .insert({
        discount_type: 'link',
        discount_id: link.id,
        user_id: userId,
        subscription_id: subscriptionId,
        discount_amount: discountAmount,
        final_price: finalPrice,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
      .select()
      .single()

    if (redemptionError) {
      console.error('[DiscountLinkService] Error logging redemption:', redemptionError)
      throw new Error(`Failed to log redemption: ${redemptionError.message}`)
    }

    // Log audit
    await this.logAudit('redeem', link.id, userId, {
      subscriptionId,
      discountAmount,
      finalPrice,
    })

    return this.mapToRedemption(redemption)
  }

  /**
   * Delete a link (soft delete)
   * @param id - The link ID
   * @param deletedBy - The admin ID performing the deletion
   */
  static async deleteLink(id: string, deletedBy: string): Promise<void> {
    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(deletedBy)

    // Get existing link
    const existing = await this.getLink(id)
    if (!existing) {
      throw new DiscountNotFoundError('discount_link', id)
    }

    // Soft delete
    const { error } = await this.supabase
      .from('discount_links')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)

    if (error) {
      console.error('[DiscountLinkService] Error deleting link:', error)
      throw new Error(`Failed to delete link: ${error.message}`)
    }

    // Log audit
    await this.logAudit('delete', id, deletedBy, {
      token: existing.token,
      discountPrice: existing.discountPrice,
    })
  }

  /**
   * Generate a unique token
   * @returns A unique token string
   */
  private static generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Log audit entry
   * @param action - The action performed
   * @param linkId - The link ID
   * @param adminId - The admin ID
   * @param changes - The changes made
   */
  private static async logAudit(
    action: 'create' | 'update' | 'delete' | 'redeem',
    linkId: string,
    adminId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('discount_audit_logs').insert({
        action,
        discount_type: 'link',
        discount_id: linkId,
        admin_id: adminId,
        changes_made: changes,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[DiscountLinkService] Error logging audit:', error)
      // Don't throw - audit logging should not block operations
    }
  }

  /**
   * Map database record to DiscountLink type
   * @param data - The database record
   * @returns The mapped link
   */
  private static mapToLink(data: Record<string, unknown>): DiscountLink {
    const link: DiscountLink = {
      id: data.id as string,
      token: data.token as string,
      discountPrice: data.discount_price as number,
      maxRedemptions: data.max_redemptions as number,
      currentRedemptions: data.current_redemptions as number,
      expirationDate: data.expiration_date as string,
      description: (data.description as string) || undefined,
      createdBy: data.created_by as string,
      createdAt: data.created_at as string,
      isActive: data.is_active as boolean,
      deletedAt: (data.deleted_at as string) || null,
      status: this.getStatus(data),
    }
    return link
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

  /**
   * Determine link status
   * @param data - The database record
   * @returns The status
   */
  private static getStatus(data: Record<string, unknown>): 'active' | 'exhausted' | 'expired' | 'inactive' {
    if (!data.is_active) {
      return 'inactive'
    }

    if ((data.current_redemptions as number) >= (data.max_redemptions as number)) {
      return 'exhausted'
    }

    if (DiscountValidator.isExpired(data.expiration_date as string)) {
      return 'expired'
    }

    return 'active'
  }
}

/**
 * Helper function to get share URL for a discount link
 * @param token - The link token
 * @returns The share URL
 */
export function getDiscountLinkShareUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waveigl.com'
  return `${baseUrl}/checkout/club?discount_token=${token}`
}

/**
 * Helper function to validate and apply discount link
 * @param token - The link token
 * @param userId - The user ID
 * @param subscriptionId - The subscription ID
 * @returns Object with discount info or null
 */
export async function applyDiscountLink(
  token: string,
  userId: string,
  subscriptionId: string
): Promise<{
  discountPrice: number
  discountAmount: number
  finalPrice: number
} | null> {
  try {
    const redemption = await DiscountLinkService.redeemLink(token, userId, subscriptionId)

    return {
      discountPrice: redemption.finalPrice,
      discountAmount: redemption.discountAmount,
      finalPrice: redemption.finalPrice,
    }
  } catch {
    return null
  }
}
