/**
 * Coupon Code Service
 * Manages coupon codes - reusable codes with usage limits
 */

import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { CouponCode, DiscountFilters, DiscountRedemption } from '@/types/discount.types'
import { DiscountValidator, calculateDiscountedPrice, normalizeCouponCode } from '@/lib/discounts/validator'
import {
  DiscountValidationError,
  DiscountNotFoundError,
  DiscountExhaustedError,
  DiscountExpiredError,
} from '@/types/discount.types'

/**
 * Coupon Code Service
 * Provides methods for managing coupon codes
 */
export class CouponCodeService {

  /**
   * Create a coupon code
   * @param code - The coupon code
   * @param discountPrice - The discount price
   * @param maxRedemptions - Maximum number of redemptions
   * @param expirationDate - When the coupon expires
   * @param createdBy - The admin ID creating the coupon
   * @param description - Optional description
   * @returns The created coupon code
   */
  static async createCoupon(
    code: string,
    discountPrice: number,
    maxRedemptions: number,
    expirationDate: string,
    createdBy: string,
    description?: string
  ): Promise<CouponCode> {
    // Validate inputs
    DiscountValidator.validateCouponCode(code)
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateMaxRedemptions(maxRedemptions)
    DiscountValidator.validateExpirationDate(expirationDate)
    DiscountValidator.validateUUID(createdBy)
    if (description) {
      DiscountValidator.validateDescription(description)
    }

    // Normalize code
    const normalizedCode = normalizeCouponCode(code)

    // Check if code already exists
    const existing = await this.getCouponByCode(normalizedCode)
    if (existing && !existing.deletedAt) {
      throw new DiscountValidationError('This coupon code already exists')
    }

    // Create coupon
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('coupon_codes')
      .insert({
        code: normalizedCode,
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
      console.error('[CouponCodeService] Error creating coupon:', error)
      throw new Error(`Failed to create coupon: ${error.message}`)
    }

    // Log audit
    await this.logAudit('create', data.id, createdBy, {
      code: normalizedCode,
      discountPrice,
      maxRedemptions,
      expirationDate,
    })

    return this.mapToCoupon(data)
  }

  /**
   * Get a specific coupon by ID
   * @param id - The coupon ID
   * @returns The coupon or null if not found
   */
  static async getCoupon(id: string): Promise<CouponCode | null> {
    DiscountValidator.validateUUID(id)

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[CouponCodeService] Error fetching coupon:', error)
      throw new Error(`Failed to fetch coupon: ${error.message}`)
    }

    return this.mapToCoupon(data)
  }

  /**
   * Get coupon by code
   * @param code - The coupon code
   * @returns The coupon or null if not found
   */
  static async getCouponByCode(code: string): Promise<CouponCode | null> {
    const normalizedCode = normalizeCouponCode(code)

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[CouponCodeService] Error fetching coupon by code:', error)
      throw new Error(`Failed to fetch coupon: ${error.message}`)
    }

    return this.mapToCoupon(data)
  }

  /**
   * Validate a coupon code
   * @param code - The coupon code to validate
   * @returns The coupon if valid
   */
  static async validateCode(code: string): Promise<CouponCode> {
    DiscountValidator.validateCouponCode(code)

    const coupon = await this.getCouponByCode(code)
    if (!coupon) {
      throw new DiscountNotFoundError('coupon', code)
    }

    if (!coupon.isActive || coupon.deletedAt) {
      throw new DiscountValidationError('This coupon code is no longer active')
    }

    // Check if expired
    if (DiscountValidator.isExpired(coupon.expirationDate)) {
      throw new DiscountExpiredError('coupon')
    }

    // Check if exhausted
    if (coupon.currentRedemptions >= coupon.maxRedemptions) {
      throw new DiscountExhaustedError('coupon')
    }

    return coupon
  }

  /**
   * List all coupons with optional filters
   * @param filters - Optional filters
   * @returns Array of coupons
   */
  static async listCoupons(filters?: DiscountFilters): Promise<CouponCode[]> {
    const supabase = await createServerClient()
    let query = supabase
      .from('coupon_codes')
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
      console.error('[CouponCodeService] Error listing coupons:', error)
      throw new Error(`Failed to list coupons: ${error.message}`)
    }

    return data.map((d) => this.mapToCoupon(d))
  }

  /**
   * Redeem a coupon code
   * @param code - The coupon code
   * @param userId - The user redeeming the coupon
   * @param subscriptionId - The subscription ID
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @returns The redemption record
   */
  static async redeemCoupon(
    code: string,
    userId: string,
    subscriptionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscountRedemption> {
    // Validate code
    const coupon = await this.validateCode(code)

    // Validate inputs
    DiscountValidator.validateUUID(userId)
    DiscountValidator.validateSubscriptionId(subscriptionId)

    // Calculate discount
    const { discountAmount, finalPrice } = calculateDiscountedPrice(coupon.discountPrice)

    // Increment redemption counter
    const supabase = await createServerClient()
    const { error: updateError } = await supabase
      .from('coupon_codes')
      .update({
        current_redemptions: coupon.currentRedemptions + 1,
      })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('[CouponCodeService] Error incrementing redemptions:', updateError)
      throw new Error(`Failed to redeem coupon: ${updateError.message}`)
    }

    // Log redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from('discount_redemptions')
      .insert({
        discount_type: 'coupon',
        discount_id: coupon.id,
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
      console.error('[CouponCodeService] Error logging redemption:', redemptionError)
      throw new Error(`Failed to log redemption: ${redemptionError.message}`)
    }

    // Log audit
    await this.logAudit('redeem', coupon.id, userId, {
      code,
      subscriptionId,
      discountAmount,
      finalPrice,
    })

    return this.mapToRedemption(redemption)
  }

  /**
   * Update a coupon code
   * @param id - The coupon ID
   * @param updates - The updates to apply
   * @returns The updated coupon
   */
  static async updateCoupon(id: string, updates: Partial<CouponCode>): Promise<CouponCode> {
    DiscountValidator.validateUUID(id)

    // Get existing coupon to verify existence and for logging
    const existing = await this.getCoupon(id)
    if (!existing) {
      throw new DiscountNotFoundError('coupon', id)
    }

    // Map Partial<CouponCode> to database fields
    const dbUpdates: Record<string, unknown> = {}
    if (updates.discountPrice !== undefined) {
      DiscountValidator.validatePrice(updates.discountPrice)
      dbUpdates.discount_price = updates.discountPrice
    }
    if (updates.maxRedemptions !== undefined) {
      DiscountValidator.validateMaxRedemptions(updates.maxRedemptions)
      dbUpdates.max_redemptions = updates.maxRedemptions
    }
    if (updates.expirationDate !== undefined) {
      DiscountValidator.validateExpirationDate(updates.expirationDate)
      dbUpdates.expiration_date = updates.expirationDate
    }
    if (updates.description !== undefined) {
      if (updates.description) DiscountValidator.validateDescription(updates.description)
      dbUpdates.description = updates.description || null
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive
    }

    if (Object.keys(dbUpdates).length === 0) {
      return existing
    }

    // Update coupon
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('coupon_codes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[CouponCodeService] Error updating coupon:', error)
      throw new Error(`Failed to update coupon: ${error.message}`)
    }

    // Log audit
    await this.logAudit('update', id, 'system', {
      before: existing,
      after: dbUpdates,
    })

    return this.mapToCoupon(data)
  }

  /**
   * Deactivate a coupon code
   * @param id - The coupon ID
   * @param deactivatedBy - The admin ID performing the deactivation
   */
  static async deactivateCoupon(id: string, deactivatedBy: string): Promise<void> {
    await this.updateCoupon(id, { isActive: false })
  }

  /**
   * Delete a coupon code (soft delete)
   * @param id - The coupon ID
   * @param deletedBy - The admin ID performing the deletion
   */
  static async deleteCoupon(id: string, deletedBy: string): Promise<void> {
    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(deletedBy)

    // Get existing coupon
    const existing = await this.getCoupon(id)
    if (!existing) {
      throw new DiscountNotFoundError('coupon', id)
    }

    // Soft delete
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('coupon_codes')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)

    if (error) {
      console.error('[CouponCodeService] Error deleting coupon:', error)
      throw new Error(`Failed to delete coupon: ${error.message}`)
    }

    // Log audit
    await this.logAudit('delete', id, deletedBy, {
      code: existing.code,
      discountPrice: existing.discountPrice,
    })
  }

  /**
   * Log audit entry
   * @param action - The action performed
   * @param couponId - The coupon ID
   * @param adminId - The admin ID
   * @param changes - The changes made
   */
  private static async logAudit(
    action: 'create' | 'update' | 'delete' | 'redeem',
    couponId: string,
    adminId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      await supabase.from('discount_audit_logs').insert({
        action,
        discount_type: 'coupon',
        discount_id: couponId,
        admin_id: adminId,
        changes_made: changes,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[CouponCodeService] Error logging audit:', error)
      // Don't throw - audit logging should not block operations
    }
  }

  /**
   * Map database record to CouponCode type
   * @param data - The database record
   * @returns The mapped coupon
   */
  private static mapToCoupon(data: Record<string, unknown>): CouponCode {
    const coupon: CouponCode = {
      id: data.id as string,
      code: data.code as string,
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
    return coupon
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
   * Determine coupon status
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
 * Helper function to validate and apply coupon code
 * @param code - The coupon code
 * @param userId - The user ID
 * @param subscriptionId - The subscription ID
 * @returns Object with discount info or null
 */
export async function applyCouponCode(
  code: string,
  userId: string,
  subscriptionId: string
): Promise<{
  discountPrice: number
  discountAmount: number
  finalPrice: number
} | null> {
  try {
    const redemption = await CouponCodeService.redeemCoupon(code, userId, subscriptionId)

    return {
      discountPrice: redemption.finalPrice,
      discountAmount: redemption.discountAmount,
      finalPrice: redemption.finalPrice,
    }
  } catch {
    return null
  }
}
