/**
 * Checkout Integration for Discounts
 * Handles discount application during subscription checkout
 */

import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import type { DiscountValidationResult } from '@/types/discount.types'

/**
 * Apply discount code at checkout
 * @param code - Coupon code
 * @param userId - User ID
 * @returns Discount info or null
 */
export async function applyCouponCodeAtCheckout(
  code: string,
  userId: string
): Promise<DiscountValidationResult | null> {
  try {
    DiscountValidator.validateCouponCode(code)
    DiscountValidator.validateUUID(userId)

    const coupon = await CouponCodeService.validateCode(code)
    return {
      isValid: true,
      discount: coupon,
    }
  } catch (error) {
    console.error('[CheckoutIntegration] Error applying coupon code:', error)
    return null
  }
}

/**
 * Apply discount link at checkout
 * @param token - Discount link token
 * @param userId - User ID
 * @returns Discount info or null
 */
export async function applyDiscountLinkAtCheckout(
  token: string,
  userId: string
): Promise<DiscountValidationResult | null> {
  try {
    DiscountValidator.validateToken(token)
    DiscountValidator.validateUUID(userId)

    const link = await DiscountLinkService.validateToken(token)
    return {
      isValid: true,
      discount: link,
    }
  } catch (error) {
    console.error('[CheckoutIntegration] Error applying discount link:', error)
    return null
  }
}

/**
 * Get direct user discount at checkout
 * @param userId - User ID
 * @returns Discount info or null
 */
export async function getDirectUserDiscountAtCheckout(
  userId: string
): Promise<DiscountValidationResult | null> {
  try {
    DiscountValidator.validateUUID(userId)

    const discount = await DirectUserDiscountService.getDiscountForUser(userId)
    if (!discount || !discount.isActive) {
      return null
    }

    return {
      isValid: true,
      discount,
    }
  } catch (error) {
    console.error('[CheckoutIntegration] Error getting direct user discount:', error)
    return null
  }
}

/**
 * Calculate checkout price with discount
 * @param discountPrice - Discount price
 * @returns Discount amount and final price
 */
export function calculateCheckoutPrice(discountPrice: number): {
  originalPrice: number
  discountAmount: number
  finalPrice: number
} {
  const ORIGINAL_PRICE = 9.9

  DiscountValidator.validatePrice(discountPrice)

  const discountAmount = ORIGINAL_PRICE - discountPrice
  const finalPrice = discountPrice

  return {
    originalPrice: ORIGINAL_PRICE,
    discountAmount,
    finalPrice,
  }
}

/**
 * Display discount info at checkout
 * @param discount - Discount object
 * @returns Formatted discount info
 */
export function formatCheckoutDiscount(discount: any): {
  label: string
  discountAmount: string
  finalPrice: string
} {
  const ORIGINAL_PRICE = 9.9
  const discountAmount = ORIGINAL_PRICE - discount.discountPrice

  return {
    label: `Discount Applied: R$ ${discountAmount.toFixed(2)} off`,
    discountAmount: `R$ ${discountAmount.toFixed(2)}`,
    finalPrice: `R$ ${discount.discountPrice.toFixed(2)}`,
  }
}
