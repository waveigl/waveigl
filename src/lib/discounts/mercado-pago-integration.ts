/**
 * Mercado Pago Integration for Discounts
 * Handles PreApproval creation with custom pricing
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DiscountValidator } from '@/lib/discounts/validator'
import type { DirectUserDiscount, DiscountLink, CouponCode } from '@/types/discount.types'

interface PreApprovalData {
  externalReference: string
  reason: string
  autoRecurring: {
    frequency: number
    frequencyType: 'months' | 'years'
    transactionAmount: number
    currencyId: string
    startDate: string
  }
  payer: {
    email: string
  }
  backUrl: string
}

interface DiscountMetadata {
  discountType: 'direct_user' | 'link' | 'coupon'
  discountId: string
  discountPrice: number
  discountAmount: number
  originalPrice: number
}

/**
 * Mercado Pago Integration Service
 */
export class MercadoPagoDiscountIntegration {
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
   * Create PreApproval with custom discount price
   * @param userId - User ID
   * @param userEmail - User email
   * @param discount - Discount object (direct_user, link, or coupon)
   * @param discountType - Type of discount
   * @returns PreApproval data with discount metadata
   */
  static async createPreApprovalWithDiscount(
    userId: string,
    userEmail: string,
    discount: DirectUserDiscount | DiscountLink | CouponCode,
    discountType: 'direct_user' | 'link' | 'coupon'
  ): Promise<{
    preApprovalData: PreApprovalData
    discountMetadata: DiscountMetadata
  }> {
    // Validate inputs
    DiscountValidator.validateUUID(userId)
    DiscountValidator.validatePrice(discount.discountPrice)

    const ORIGINAL_PRICE = 9.9
    const discountAmount = ORIGINAL_PRICE - discount.discountPrice

    // Create PreApproval data with custom price
    const preApprovalData: PreApprovalData = {
      externalReference: userId,
      reason: `WaveIGL Club Subscription - ${discountType} discount`,
      autoRecurring: {
        frequency: 1,
        frequencyType: 'months',
        transactionAmount: discount.discountPrice,
        currencyId: 'BRL',
        startDate: new Date().toISOString(),
      },
      payer: {
        email: userEmail,
      },
      backUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/club/success`,
    }

    // Create discount metadata
    const discountMetadata: DiscountMetadata = {
      discountType,
      discountId: discount.id,
      discountPrice: discount.discountPrice,
      discountAmount,
      originalPrice: ORIGINAL_PRICE,
    }

    return {
      preApprovalData,
      discountMetadata,
    }
  }

  /**
   * Store subscription-discount relationship
   * @param subscriptionId - Mercado Pago subscription ID
   * @param userId - User ID
   * @param discountMetadata - Discount metadata
   */
  static async storeSubscriptionDiscount(
    subscriptionId: string,
    userId: string,
    discountMetadata: DiscountMetadata
  ): Promise<void> {
    try {
      DiscountValidator.validateSubscriptionId(subscriptionId)
      DiscountValidator.validateUUID(userId)

      // Store in database
      const { error } = await this.supabase.from('subscription_discounts').insert({
        subscription_id: subscriptionId,
        user_id: userId,
        discount_type: discountMetadata.discountType,
        discount_id: discountMetadata.discountId,
        discount_price: discountMetadata.discountPrice,
        discount_amount: discountMetadata.discountAmount,
        original_price: discountMetadata.originalPrice,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error('[MercadoPagoIntegration] Error storing subscription discount:', error)
        throw new Error(`Failed to store subscription discount: ${error.message}`)
      }

      console.log('[MercadoPagoIntegration] Stored subscription discount:', {
        subscriptionId,
        userId,
        discountType: discountMetadata.discountType,
      })
    } catch (error) {
      console.error('[MercadoPagoIntegration] Error storing subscription discount:', error)
      throw error
    }
  }

  /**
   * Get subscription discount
   * @param subscriptionId - Mercado Pago subscription ID
   * @returns Discount metadata or null
   */
  static async getSubscriptionDiscount(subscriptionId: string): Promise<DiscountMetadata | null> {
    try {
      DiscountValidator.validateSubscriptionId(subscriptionId)

      const { data, error } = await this.supabase
        .from('subscription_discounts')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('[MercadoPagoIntegration] Error fetching subscription discount:', error)
        throw new Error(`Failed to fetch subscription discount: ${error.message}`)
      }

      return {
        discountType: data.discount_type as 'direct_user' | 'link' | 'coupon',
        discountId: data.discount_id,
        discountPrice: data.discount_price,
        discountAmount: data.discount_amount,
        originalPrice: data.original_price,
      }
    } catch (error) {
      console.error('[MercadoPagoIntegration] Error fetching subscription discount:', error)
      return null
    }
  }

  /**
   * Check if discount is still valid for renewal
   * @param discountMetadata - Discount metadata
   * @returns true if discount is still valid
   */
  static async isDiscountValidForRenewal(discountMetadata: DiscountMetadata): Promise<boolean> {
    try {
      if (discountMetadata.discountType === 'direct_user') {
        // Direct user discounts are always valid
        return true
      } else if (discountMetadata.discountType === 'link') {
        // Check if link is still active and not expired
        const { data, error } = await this.supabase
          .from('discount_links')
          .select('is_active, expiration_date, current_redemptions, max_redemptions')
          .eq('id', discountMetadata.discountId)
          .single()

        if (error || !data) return false

        const isExpired = new Date() > new Date(data.expiration_date)
        const isExhausted = data.current_redemptions >= data.max_redemptions

        return data.is_active && !isExpired && !isExhausted
      } else if (discountMetadata.discountType === 'coupon') {
        // Check if coupon is still active and not expired
        const { data, error } = await this.supabase
          .from('coupon_codes')
          .select('is_active, expiration_date, current_redemptions, max_redemptions')
          .eq('id', discountMetadata.discountId)
          .single()

        if (error || !data) return false

        const isExpired = new Date() > new Date(data.expiration_date)
        const isExhausted = data.current_redemptions >= data.max_redemptions

        return data.is_active && !isExpired && !isExhausted
      }

      return false
    } catch (error) {
      console.error('[MercadoPagoIntegration] Error checking discount validity:', error)
      return false
    }
  }

  /**
   * Get renewal price with discount
   * @param discountMetadata - Discount metadata
   * @returns Renewal price or original price if discount invalid
   */
  static async getRenewalPrice(discountMetadata: DiscountMetadata): Promise<number> {
    const isValid = await this.isDiscountValidForRenewal(discountMetadata)
    return isValid ? discountMetadata.discountPrice : discountMetadata.originalPrice
  }
}

/**
 * Helper function to create PreApproval with discount
 * @param userId - User ID
 * @param userEmail - User email
 * @param discount - Discount object
 * @param discountType - Type of discount
 * @returns PreApproval data and discount metadata
 */
export async function createPreApprovalWithDiscount(
  userId: string,
  userEmail: string,
  discount: DirectUserDiscount | DiscountLink | CouponCode,
  discountType: 'direct_user' | 'link' | 'coupon'
): Promise<{
  preApprovalData: PreApprovalData
  discountMetadata: DiscountMetadata
}> {
  return MercadoPagoDiscountIntegration.createPreApprovalWithDiscount(
    userId,
    userEmail,
    discount,
    discountType
  )
}

/**
 * Helper function to store subscription discount
 * @param subscriptionId - Subscription ID
 * @param userId - User ID
 * @param discountMetadata - Discount metadata
 */
export async function storeSubscriptionDiscount(
  subscriptionId: string,
  userId: string,
  discountMetadata: DiscountMetadata
): Promise<void> {
  return MercadoPagoDiscountIntegration.storeSubscriptionDiscount(
    subscriptionId,
    userId,
    discountMetadata
  )
}
