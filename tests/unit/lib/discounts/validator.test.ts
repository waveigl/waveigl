import { describe, it, expect } from 'vitest'
import { fc } from '@fast-check/vitest'
import {
  DiscountValidator,
  calculateDiscountedPrice,
  formatPrice,
  normalizeCouponCode,
} from '@/lib/discounts/validator'
import {
  DiscountValidationError,
  DiscountExhaustedError,
  DiscountExpiredError,
} from '@/types/discount.types'

/**
 * Property-Based Tests for DiscountValidator
 * Property 2: Discount Price Validation
 * Property 5: Coupon Code Format Validation
 * Property 7: Discount Expiration Validation
 * Validates: Requirements 1.3, 3.3, 6.1, 6.2
 */

describe('DiscountValidator', () => {
  describe('Property 2: Discount Price Validation', () => {
    it('should accept valid prices between 0 and 9.90', () => {
      expect(() => DiscountValidator.validatePrice(0)).not.toThrow()
      expect(() => DiscountValidator.validatePrice(5.0)).not.toThrow()
      expect(() => DiscountValidator.validatePrice(9.9)).not.toThrow()
      expect(() => DiscountValidator.validatePrice(9.90)).not.toThrow()
    })

    it('should reject prices below 0', () => {
      expect(() => DiscountValidator.validatePrice(-0.01)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validatePrice(-1)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validatePrice(-100)).toThrow(DiscountValidationError)
    })

    it('should reject prices above 9.90', () => {
      expect(() => DiscountValidator.validatePrice(9.91)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validatePrice(10)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validatePrice(100)).toThrow(DiscountValidationError)
    })

    it('should reject non-numeric prices', () => {
      expect(() => DiscountValidator.validatePrice(NaN)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validatePrice(Infinity)).toThrow(DiscountValidationError)
    })

    it(
      'should validate all prices in valid range',
      fc.property(fc.integer({ min: 0, max: 990 }).map(n => n / 100), (price) => {
        expect(() => DiscountValidator.validatePrice(price)).not.toThrow()
      })
    )

    it(
      'should reject all prices outside valid range',
      fc.property(
        fc.oneof(
          fc.integer({ min: -100000, max: -1 }).map(n => n / 100),
          fc.integer({ min: 991, max: 100000 }).map(n => n / 100)
        ),
        (price) => {
          expect(() => DiscountValidator.validatePrice(price)).toThrow(DiscountValidationError)
        }
      )
    )
  })

  describe('Property 5: Coupon Code Format Validation', () => {
    it('should accept valid coupon codes', () => {
      expect(() => DiscountValidator.validateCouponCode('SAVE20')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('VIP100')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('PROMO')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('CODE123')).not.toThrow()
    })

    it('should reject codes that are too short', () => {
      expect(() => DiscountValidator.validateCouponCode('ABC')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCouponCode('AB')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCouponCode('A')).toThrow(DiscountValidationError)
    })

    it('should reject codes that are too long', () => {
      const longCode = 'A'.repeat(21)
      expect(() => DiscountValidator.validateCouponCode(longCode)).toThrow(DiscountValidationError)
    })

    it('should reject codes with invalid characters', () => {
      expect(() => DiscountValidator.validateCouponCode('code-with-dash')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCouponCode('code with space')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCouponCode('code_with_underscore')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCouponCode('code@special')).toThrow(DiscountValidationError)
    })

    it('should normalize codes to uppercase', () => {
      expect(() => DiscountValidator.validateCouponCode('save20')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('Save20')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('lowercase')).not.toThrow()
      expect(() => DiscountValidator.validateCouponCode('MixedCase')).not.toThrow()
    })

    it(
      'should validate all valid coupon codes',
      fc.property(
        fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), {
          minLength: 4,
          maxLength: 20,
        }).map(arr => arr.join('')),
        (code) => {
          expect(() => DiscountValidator.validateCouponCode(code)).not.toThrow()
        }
      )
    )
  })

  describe('Property 7: Discount Expiration Validation', () => {
    it('should accept future expiration dates', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      expect(() => DiscountValidator.validateExpirationDate(futureDate)).not.toThrow()
      expect(DiscountValidator.isExpired(futureDate)).toBe(false)
    })

    it('should reject past expiration dates', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString()
      expect(() => DiscountValidator.validateExpirationDate(pastDate)).not.toThrow()
      expect(DiscountValidator.isExpired(pastDate)).toBe(true)
    })

    it('should reject invalid date formats', () => {
      expect(() => DiscountValidator.validateExpirationDate('invalid')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateExpirationDate('2025-13-45')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateExpirationDate('')).toThrow(DiscountValidationError)
    })

    it('should accept valid ISO 8601 dates', () => {
      expect(() => DiscountValidator.validateExpirationDate('2025-12-31T23:59:59Z')).not.toThrow()
      expect(() => DiscountValidator.validateExpirationDate('2025-12-31')).not.toThrow()
    })

    it(
      'should validate all valid ISO 8601 dates',
      fc.property(fc.date(), (date) => {
        expect(() => DiscountValidator.validateExpirationDate(date.toISOString())).not.toThrow()
      })
    )
  })

  describe('Redemption Validation', () => {
    it('should validate redemptions are available', () => {
      expect(() => DiscountValidator.validateRedemptionsAvailable(0, 10)).not.toThrow()
      expect(() => DiscountValidator.validateRedemptionsAvailable(5, 10)).not.toThrow()
      expect(() => DiscountValidator.validateRedemptionsAvailable(9, 10)).not.toThrow()
    })

    it('should reject when redemptions are exhausted', () => {
      expect(() => DiscountValidator.validateRedemptionsAvailable(10, 10)).toThrow(DiscountExhaustedError)
      expect(() => DiscountValidator.validateRedemptionsAvailable(11, 10)).toThrow(DiscountExhaustedError)
    })

    it('should validate max redemptions', () => {
      expect(() => DiscountValidator.validateMaxRedemptions(1)).not.toThrow()
      expect(() => DiscountValidator.validateMaxRedemptions(100)).not.toThrow()
      expect(() => DiscountValidator.validateMaxRedemptions(1000)).not.toThrow()
    })

    it('should reject invalid max redemptions', () => {
      expect(() => DiscountValidator.validateMaxRedemptions(0)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateMaxRedemptions(-1)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateMaxRedemptions(1.5)).toThrow(DiscountValidationError)
    })

    it('should validate current redemptions', () => {
      expect(() => DiscountValidator.validateCurrentRedemptions(0, 10)).not.toThrow()
      expect(() => DiscountValidator.validateCurrentRedemptions(5, 10)).not.toThrow()
      expect(() => DiscountValidator.validateCurrentRedemptions(10, 10)).not.toThrow()
    })

    it('should reject invalid current redemptions', () => {
      expect(() => DiscountValidator.validateCurrentRedemptions(-1, 10)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCurrentRedemptions(11, 10)).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateCurrentRedemptions(1.5, 10)).toThrow(DiscountValidationError)
    })
  })

  describe('Token Validation', () => {
    it('should accept valid tokens', () => {
      const validToken = 'a'.repeat(64)
      expect(() => DiscountValidator.validateToken(validToken)).not.toThrow()
    })

    it('should reject short tokens', () => {
      expect(() => DiscountValidator.validateToken('short')).toThrow(DiscountValidationError)
    })

    it('should reject tokens with invalid characters', () => {
      const invalidToken = 'A'.repeat(64) // Uppercase not allowed
      expect(() => DiscountValidator.validateToken(invalidToken)).toThrow(DiscountValidationError)
    })
  })

  describe('Description Validation', () => {
    it('should accept valid descriptions', () => {
      expect(() => DiscountValidator.validateDescription('Valid description')).not.toThrow()
      expect(() => DiscountValidator.validateDescription('')).not.toThrow()
      expect(() => DiscountValidator.validateDescription(undefined)).not.toThrow()
    })

    it('should reject descriptions that are too long', () => {
      const longDescription = 'A'.repeat(501)
      expect(() => DiscountValidator.validateDescription(longDescription)).toThrow(DiscountValidationError)
    })
  })

  describe('UUID Validation', () => {
    it('should accept valid UUIDs', () => {
      expect(() => DiscountValidator.validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow()
      expect(() => DiscountValidator.validateUUID('user-1')).not.toThrow()
      expect(() => DiscountValidator.validateUUID('admin-123')).not.toThrow()
    })

    it('should reject invalid UUIDs', () => {
      expect(() => DiscountValidator.validateUUID('550e8400-e29b-41d4-a716')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateUUID('invalid@special')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateUUID('')).toThrow(DiscountValidationError)
    })
  })

  describe('Discount Amount Validation', () => {
    it('should validate correct discount amounts', () => {
      expect(() => DiscountValidator.validateDiscountAmount(0, 9.9)).not.toThrow()
      expect(() => DiscountValidator.validateDiscountAmount(2.0, 7.9)).not.toThrow()
      expect(() => DiscountValidator.validateDiscountAmount(9.9, 0)).not.toThrow()
    })

    it('should reject negative discount amounts', () => {
      expect(() => DiscountValidator.validateDiscountAmount(-1, 10.9)).toThrow(DiscountValidationError)
    })

    it('should reject negative final prices', () => {
      expect(() => DiscountValidator.validateDiscountAmount(1, -1)).toThrow(DiscountValidationError)
    })

    it('should reject final prices exceeding original', () => {
      expect(() => DiscountValidator.validateDiscountAmount(0, 10)).toThrow(DiscountValidationError)
    })

    it('should reject mismatched calculations', () => {
      expect(() => DiscountValidator.validateDiscountAmount(2.0, 8.0)).toThrow(DiscountValidationError)
    })
  })

  describe('Subscription ID Validation', () => {
    it('should accept valid subscription IDs', () => {
      expect(() => DiscountValidator.validateSubscriptionId('sub-123')).not.toThrow()
      expect(() => DiscountValidator.validateSubscriptionId('550e8400-e29b-41d4-a716-446655440000')).not.toThrow()
    })

    it('should reject empty subscription IDs', () => {
      expect(() => DiscountValidator.validateSubscriptionId('')).toThrow(DiscountValidationError)
      expect(() => DiscountValidator.validateSubscriptionId('   ')).toThrow(DiscountValidationError)
    })
  })

  describe('IP Address Validation', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(DiscountValidator.isValidIPAddress('192.168.1.1')).toBe(true)
      expect(DiscountValidator.isValidIPAddress('127.0.0.1')).toBe(true)
    })

    it('should accept valid IPv6 addresses', () => {
      expect(DiscountValidator.isValidIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
    })

    it('should reject invalid IP addresses', () => {
      expect(DiscountValidator.isValidIPAddress('invalid')).toBe(false)
      expect(DiscountValidator.isValidIPAddress('256.256.256.256')).toBe(false)
    })
  })

  describe('User Agent Validation', () => {
    it('should accept valid user agents', () => {
      expect(DiscountValidator.isValidUserAgent('Mozilla/5.0')).toBe(true)
    })

    it('should reject empty user agents', () => {
      expect(DiscountValidator.isValidUserAgent('')).toBe(false)
    })

    it('should reject user agents that are too long', () => {
      const longUserAgent = 'A'.repeat(501)
      expect(DiscountValidator.isValidUserAgent(longUserAgent)).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    describe('calculateDiscountedPrice', () => {
      it('should calculate correct discount amount and final price', () => {
        const result = calculateDiscountedPrice(7.9)
        expect(result.discountAmount).toBeCloseTo(2.0, 2)
        expect(result.finalPrice).toBe(7.9)
      })

      it('should handle zero discount', () => {
        const result = calculateDiscountedPrice(9.9)
        expect(result.discountAmount).toBeCloseTo(0, 2)
        expect(result.finalPrice).toBe(9.9)
      })

      it('should handle full discount', () => {
        const result = calculateDiscountedPrice(0)
        expect(result.discountAmount).toBeCloseTo(9.9, 2)
        expect(result.finalPrice).toBe(0)
      })
    })

    describe('formatPrice', () => {
      it('should format prices correctly', () => {
        expect(formatPrice(9.9)).toBe('R$ 9.90')
        expect(formatPrice(5.0)).toBe('R$ 5.00')
        expect(formatPrice(0)).toBe('R$ 0.00')
      })
    })

    describe('normalizeCouponCode', () => {
      it('should normalize coupon codes', () => {
        expect(normalizeCouponCode('save20')).toBe('SAVE20')
        expect(normalizeCouponCode('  SAVE20  ')).toBe('SAVE20')
        expect(normalizeCouponCode('Save20')).toBe('SAVE20')
      })
    })
  })
})
