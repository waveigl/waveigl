/**
 * Direct User Discount Service
 * Manages direct user discounts - assigning specific discount prices to individual users
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { DirectUserDiscount, DiscountFilters } from '@/types/discount.types'
import {
  DiscountValidator,
  calculateDiscountedPrice,
  normalizeCouponCode,
} from '@/lib/discounts/validator'
import {
  DiscountValidationError,
  DiscountNotFoundError,
  DiscountPermissionError,
} from '@/types/discount.types'

/**
 * Direct User Discount Service
 * Provides methods for managing direct user discounts
 */
export class DirectUserDiscountService {
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
   * Create a direct user discount
   * @param userId - The user ID to assign discount to
   * @param discountPrice - The custom discount price
   * @param createdBy - The admin ID creating the discount
   * @returns The created discount
   */
  static async createDiscount(
    userId: string,
    discountPrice: number,
    createdBy: string
  ): Promise<DirectUserDiscount> {
    // Validate inputs
    DiscountValidator.validateUUID(userId)
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateUUID(createdBy)

    // Check if user already has an active discount
    const existingDiscount = await this.getDiscountForUser(userId)
    if (existingDiscount) {
      // Soft delete the old discount
      await this.deleteDiscount(existingDiscount.id, createdBy)
    }

    // Create new discount
    const { data, error } = await this.supabase
      .from('direct_user_discounts')
      .insert({
        user_id: userId,
        discount_price: discountPrice,
        created_by: createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[DirectUserDiscountService] Error creating discount:', error)
      throw new Error(`Failed to create discount: ${error.message}`)
    }

    // Log audit
    await this.logAudit('create', data.id, createdBy, {
      userId,
      discountPrice,
    })

    return this.mapToDiscount(data)
  }

  /**
   * Get a specific discount by ID
   * @param id - The discount ID
   * @returns The discount or null if not found
   */
  static async getDiscount(id: string): Promise<DirectUserDiscount | null> {
    DiscountValidator.validateUUID(id)

    const { data, error } = await this.supabase
      .from('direct_user_discounts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[DirectUserDiscountService] Error fetching discount:', error)
      throw new Error(`Failed to fetch discount: ${error.message}`)
    }

    return this.mapToDiscount(data)
  }

  /**
   * Get discount for a specific user
   * @param userId - The user ID
   * @returns The discount or null if not found
   */
  static async getDiscountForUser(userId: string): Promise<DirectUserDiscount | null> {
    DiscountValidator.validateUUID(userId)

    const { data, error } = await this.supabase
      .from('direct_user_discounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[DirectUserDiscountService] Error fetching user discount:', error)
      throw new Error(`Failed to fetch user discount: ${error.message}`)
    }

    return this.mapToDiscount(data)
  }

  /**
   * List all discounts with optional filters
   * @param filters - Optional filters
   * @returns Array of discounts
   */
  static async listDiscounts(filters?: DiscountFilters): Promise<DirectUserDiscount[]> {
    let query = this.supabase
      .from('direct_user_discounts')
      .select('*')
      .is('deleted_at', null)

    // Apply filters
    if (filters?.status === 'inactive') {
      query = query.eq('is_active', false)
    } else {
      query = query.eq('is_active', true)
    }

    // Apply sorting
    if (filters?.sortBy === 'created_date') {
      query = query.order('created_at', { ascending: filters?.sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[DirectUserDiscountService] Error listing discounts:', error)
      throw new Error(`Failed to list discounts: ${error.message}`)
    }

    return data.map((d) => this.mapToDiscount(d))
  }

  /**
   * Update a discount
   * @param id - The discount ID
   * @param updates - The updates to apply
   * @param updatedBy - The admin ID performing the update
   * @returns The updated discount
   */
  static async updateDiscount(
    id: string,
    updates: Partial<DirectUserDiscount>,
    updatedBy: string
  ): Promise<DirectUserDiscount> {
    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(updatedBy)

    // Validate updates
    if (updates.discountPrice !== undefined) {
      DiscountValidator.validatePrice(updates.discountPrice)
    }

    // Get existing discount
    const existing = await this.getDiscount(id)
    if (!existing) {
      throw new DiscountNotFoundError('direct_user', id)
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.discountPrice !== undefined) {
      updateData.discount_price = updates.discountPrice
    }

    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive
    }

    // Update discount
    const { data, error } = await this.supabase
      .from('direct_user_discounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[DirectUserDiscountService] Error updating discount:', error)
      throw new Error(`Failed to update discount: ${error.message}`)
    }

    // Log audit
    await this.logAudit('update', id, updatedBy, {
      changes: updates,
    })

    return this.mapToDiscount(data)
  }

  /**
   * Delete a discount (soft delete)
   * @param id - The discount ID
   * @param deletedBy - The admin ID performing the deletion
   */
  static async deleteDiscount(id: string, deletedBy: string): Promise<void> {
    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(deletedBy)

    // Get existing discount
    const existing = await this.getDiscount(id)
    if (!existing) {
      throw new DiscountNotFoundError('direct_user', id)
    }

    // Soft delete
    const { error } = await this.supabase
      .from('direct_user_discounts')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)

    if (error) {
      console.error('[DirectUserDiscountService] Error deleting discount:', error)
      throw new Error(`Failed to delete discount: ${error.message}`)
    }

    // Log audit
    await this.logAudit('delete', id, deletedBy, {
      userId: existing.userId,
      discountPrice: existing.discountPrice,
    })
  }

  /**
   * Log audit entry
   * @param action - The action performed
   * @param discountId - The discount ID
   * @param adminId - The admin ID
   * @param changes - The changes made
   */
  private static async logAudit(
    action: 'create' | 'update' | 'delete' | 'redeem',
    discountId: string,
    adminId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('discount_audit_logs').insert({
        action,
        discount_type: 'direct_user',
        discount_id: discountId,
        admin_id: adminId,
        changes_made: changes,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[DirectUserDiscountService] Error logging audit:', error)
      // Don't throw - audit logging should not block operations
    }
  }

  /**
   * Map database record to DirectUserDiscount type
   * @param data - The database record
   * @returns The mapped discount
   */
  private static mapToDiscount(data: Record<string, unknown>): DirectUserDiscount {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      discountPrice: data.discount_price as number,
      createdBy: data.created_by as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      isActive: data.is_active as boolean,
      deletedAt: (data.deleted_at as string) || null,
    }
  }
}

/**
 * Helper function to validate direct user discount for subscription
 * @param userId - The user ID
 * @returns The discount if found and valid, null otherwise
 */
export async function getValidDirectUserDiscount(userId: string): Promise<DirectUserDiscount | null> {
  try {
    const discount = await DirectUserDiscountService.getDiscountForUser(userId)
    if (!discount || !discount.isActive) {
      return null
    }
    return discount
  } catch {
    return null
  }
}

/**
 * Helper function to apply direct user discount to subscription
 * @param userId - The user ID
 * @returns Object with discount info or null
 */
export async function applyDirectUserDiscount(userId: string): Promise<{
  discountPrice: number
  discountAmount: number
  finalPrice: number
} | null> {
  const discount = await getValidDirectUserDiscount(userId)
  if (!discount) {
    return null
  }

  const { discountAmount, finalPrice } = calculateDiscountedPrice(discount.discountPrice)

  return {
    discountPrice: discount.discountPrice,
    discountAmount,
    finalPrice,
  }
}
