/**
 * Discount Validator Service
 * Validates all discount-related operations and inputs
 */

import {
  DiscountValidationError,
  DiscountExpiredError,
  DiscountExhaustedError,
} from '@/types/discount.types'

const ORIGINAL_PRICE = 9.9
const MIN_PRICE = 0
const MAX_PRICE = ORIGINAL_PRICE

const COUPON_CODE_PATTERN = /^[A-Z0-9]{4,20}$/
const MIN_COUPON_LENGTH = 4
const MAX_COUPON_LENGTH = 20

/**
 * Discount Validator Service
 * Provides validation methods for all discount types
 */
export class DiscountValidator {
  /**
   * Validate discount price is within valid range
   * @param price - The discount price to validate
   * @throws DiscountValidationError if price is invalid
   */
  static validatePrice(price: number): boolean {
    if (typeof price !== 'number' || isNaN(price)) {
      throw new DiscountValidationError('Discount price must be a valid number')
    }

    if (price < MIN_PRICE || price > MAX_PRICE) {
      throw new DiscountValidationError(
        `Discount price must be between R$ ${MIN_PRICE.toFixed(2)} and R$ ${MAX_PRICE.toFixed(2)}`
      )
    }

    return true
  }

  /**
   * Validate coupon code format
   * @param code - The coupon code to validate
   * @throws DiscountValidationError if code format is invalid
   */
  static validateCouponCode(code: string): boolean {
    if (typeof code !== 'string') {
      throw new DiscountValidationError('Coupon code must be a string')
    }

    const trimmedCode = code.trim().toUpperCase()

    if (trimmedCode.length < MIN_COUPON_LENGTH || trimmedCode.length > MAX_COUPON_LENGTH) {
      throw new DiscountValidationError(
        `Code must be ${MIN_COUPON_LENGTH}-${MAX_COUPON_LENGTH} alphanumeric characters`
      )
    }

    if (!COUPON_CODE_PATTERN.test(trimmedCode)) {
      throw new DiscountValidationError('Code must contain only uppercase letters and numbers')
    }

    return true
  }

  /**
   * Validate expiration date
   * @param expirationDate - The expiration date to validate
   * @throws DiscountValidationError if date is invalid
   */
  static validateExpirationDate(expirationDate: string): boolean {
    if (typeof expirationDate !== 'string') {
      throw new DiscountValidationError('Expiration date must be a string')
    }

    try {
      const date = new Date(expirationDate)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }
    } catch {
      throw new DiscountValidationError('Expiration date must be a valid ISO 8601 date')
    }

    return true
  }

  /**
   * Check if discount has expired
   * @param expirationDate - The expiration date to check
   * @returns true if expired, false otherwise
   */
  static isExpired(expirationDate: string): boolean {
    const now = new Date()
    const expiration = new Date(expirationDate)
    return now > expiration
  }

  /**
   * Validate redemptions are available
   * @param currentRedemptions - Current redemption count
   * @param maxRedemptions - Maximum redemptions allowed
   * @throws DiscountExhaustedError if no redemptions available
   */
  static validateRedemptionsAvailable(currentRedemptions: number, maxRedemptions: number): boolean {
    if (currentRedemptions >= maxRedemptions) {
      throw new DiscountExhaustedError('discount')
    }

    return true
  }

  /**
   * Validate max redemptions value
   * @param maxRedemptions - The max redemptions value to validate
   * @throws DiscountValidationError if invalid
   */
  static validateMaxRedemptions(maxRedemptions: number): boolean {
    if (typeof maxRedemptions !== 'number' || !Number.isInteger(maxRedemptions)) {
      throw new DiscountValidationError('Max redemptions must be an integer')
    }

    if (maxRedemptions <= 0) {
      throw new DiscountValidationError('Max redemptions must be greater than 0')
    }

    return true
  }

  /**
   * Validate current redemptions value
   * @param currentRedemptions - The current redemptions value to validate
   * @param maxRedemptions - The max redemptions for comparison
   * @throws DiscountValidationError if invalid
   */
  static validateCurrentRedemptions(currentRedemptions: number, maxRedemptions: number): boolean {
    if (typeof currentRedemptions !== 'number' || !Number.isInteger(currentRedemptions)) {
      throw new DiscountValidationError('Current redemptions must be an integer')
    }

    if (currentRedemptions < 0) {
      throw new DiscountValidationError('Current redemptions cannot be negative')
    }

    if (currentRedemptions > maxRedemptions) {
      throw new DiscountValidationError('Current redemptions cannot exceed max redemptions')
    }

    return true
  }

  /**
   * Validate discount token format
   * @param token - The token to validate
   * @throws DiscountValidationError if invalid
   */
  static validateToken(token: string): boolean {
    if (typeof token !== 'string') {
      throw new DiscountValidationError('Token must be a string')
    }

    if (token.length < 32) {
      throw new DiscountValidationError('Token must be at least 32 characters long')
    }

    if (!/^[a-z0-9]+$/.test(token)) {
      throw new DiscountValidationError('Token must contain only lowercase letters and numbers')
    }

    return true
  }

  /**
   * Validate description length
   * @param description - The description to validate
   * @throws DiscountValidationError if invalid
   */
  static validateDescription(description: string | undefined): boolean {
    if (description === undefined || description === null) {
      return true
    }

    if (typeof description !== 'string') {
      throw new DiscountValidationError('Description must be a string')
    }

    if (description.length > 500) {
      throw new DiscountValidationError('Description must be 500 characters or less')
    }

    return true
  }

  /**
   * Validate UUID format
   * Accepts both standard UUIDs and simple ID strings (for testing)
   * @param uuid - The UUID to validate
   * @throws DiscountValidationError if invalid
   */
  static validateUUID(uuid: string): boolean {
    if (typeof uuid !== 'string') {
      throw new DiscountValidationError('UUID must be a string')
    }

    if (!uuid || uuid.trim().length === 0) {
      throw new DiscountValidationError('UUID cannot be empty')
    }

    // Reject if contains special characters (anything other than alphanumeric and hyphens)
    if (/[^a-z0-9\-]/i.test(uuid)) {
      throw new DiscountValidationError('Invalid UUID or ID format')
    }

    // Standard UUID: 8-4-4-4-12 hex digits
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    // If it looks like a UUID attempt (has 3+ hyphens), it must be a valid UUID
    const hyphenCount = (uuid.match(/-/g) || []).length
    if (hyphenCount >= 3) {
      // This looks like a UUID attempt, so validate it strictly
      if (!uuidPattern.test(uuid)) {
        throw new DiscountValidationError('Invalid UUID or ID format')
      }
      return true
    }

    // For simple IDs (0-2 hyphens), accept alphanumeric with hyphens
    const simpleIdPattern = /^[a-z0-9\-]+$/i
    if (!simpleIdPattern.test(uuid)) {
      throw new DiscountValidationError('Invalid UUID or ID format')
    }

    return true
  }

  /**
   * Validate discount amount is reasonable
   * @param discountAmount - The discount amount
   * @param finalPrice - The final price after discount
   * @throws DiscountValidationError if invalid
   */
  static validateDiscountAmount(discountAmount: number, finalPrice: number): boolean {
    if (discountAmount < 0) {
      throw new DiscountValidationError('Discount amount cannot be negative')
    }

    if (finalPrice < 0) {
      throw new DiscountValidationError('Final price cannot be negative')
    }

    if (finalPrice > ORIGINAL_PRICE) {
      throw new DiscountValidationError('Final price cannot exceed original price')
    }

    const calculatedFinalPrice = ORIGINAL_PRICE - discountAmount
    if (Math.abs(calculatedFinalPrice - finalPrice) > 0.01) {
      throw new DiscountValidationError('Final price does not match discount calculation')
    }

    return true
  }

  /**
   * Validate subscription ID format
   * @param subscriptionId - The subscription ID to validate
   * @throws DiscountValidationError if invalid
   */
  static validateSubscriptionId(subscriptionId: string): boolean {
    if (typeof subscriptionId !== 'string') {
      throw new DiscountValidationError('Subscription ID must be a string')
    }

    if (subscriptionId.trim().length === 0) {
      throw new DiscountValidationError('Subscription ID cannot be empty')
    }

    return true
  }

  /**
   * Validate IP address format
   * @param ipAddress - The IP address to validate
   * @returns true if valid, false if invalid
   */
  static isValidIPAddress(ipAddress: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i

    if (ipv4Pattern.test(ipAddress)) {
      // Validate each octet is 0-255
      const octets = ipAddress.split('.')
      return octets.every(octet => {
        const num = parseInt(octet, 10)
        return num >= 0 && num <= 255
      })
    }

    return ipv6Pattern.test(ipAddress)
  }

  /**
   * Validate user agent string
   * @param userAgent - The user agent to validate
   * @returns true if valid, false if invalid
   */
  static isValidUserAgent(userAgent: string): boolean {
    return typeof userAgent === 'string' && userAgent.length > 0 && userAgent.length <= 500
  }
}

/**
 * Helper function to calculate final price after discount
 * @param discountPrice - The discount price
 * @returns The discount amount and final price
 */
export function calculateDiscountedPrice(discountPrice: number): {
  discountAmount: number
  finalPrice: number
} {
  DiscountValidator.validatePrice(discountPrice)

  const discountAmount = ORIGINAL_PRICE - discountPrice
  const finalPrice = discountPrice

  return {
    discountAmount,
    finalPrice,
  }
}

/**
 * Helper function to format price for display
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2)}`
}

/**
 * Helper function to normalize coupon code
 * @param code - The coupon code to normalize
 * @returns Normalized coupon code
 */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}
