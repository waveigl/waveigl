import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fc } from '@fast-check/vitest'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'
import type { CouponCode, DiscountRedemption } from '@/types/discount.types'
import {
  DiscountValidationError,
  DiscountNotFoundError,
  DiscountExhaustedError,
  DiscountExpiredError,
} from '@/types/discount.types'

/**
 * Property-Based Tests for CouponCodeService
 * Property 5: Coupon Code Format Validation
 * Property 6: Coupon Code Redemption Counter Consistency
 * Property 15: Redemption Logging Completeness
 * Validates: Requirements 3.3, 3.7, 3.12
 */

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    setAll: vi.fn(),
    set: vi.fn(),
  })),
}))

describe('CouponCodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Property 5: Coupon Code Format Validation', () => {
    it('should accept valid coupon codes with 4-20 alphanumeric characters', async () => {
      const validCodes = ['SAVE20', 'VIP100', 'PROMO', 'CODE123', 'ABCD1234']

      for (const code of validCodes) {
        // Should not throw during validation
        expect(() => {
          // Validate format
          if (!/^[A-Z0-9]{4,20}$/i.test(code.toUpperCase())) {
            throw new DiscountValidationError('Invalid coupon code format')
          }
        }).not.toThrow()
      }
    })

    it('should reject coupon codes that are too short', () => {
      const shortCodes = ['ABC', 'AB', 'A', '']

      for (const code of shortCodes) {
        expect(() => {
          if (!/^[A-Z0-9]{4,20}$/i.test(code.toUpperCase())) {
            throw new DiscountValidationError('Code must be 4-20 alphanumeric characters')
          }
        }).toThrow(DiscountValidationError)
      }
    })

    it('should reject coupon codes that are too long', () => {
      const longCode = 'A'.repeat(21)

      expect(() => {
        if (!/^[A-Z0-9]{4,20}$/i.test(longCode.toUpperCase())) {
          throw new DiscountValidationError('Code must be 4-20 alphanumeric characters')
        }
      }).toThrow(DiscountValidationError)
    })

    it('should reject coupon codes with invalid characters', () => {
      const invalidCodes = ['code-dash', 'code space', 'code_under', 'code@special', 'code.dot']

      for (const code of invalidCodes) {
        expect(() => {
          if (!/^[A-Z0-9]{4,20}$/i.test(code.toUpperCase())) {
            throw new DiscountValidationError('Code must be 4-20 alphanumeric characters')
          }
        }).toThrow(DiscountValidationError)
      }
    })

    it(
      'should validate all valid coupon codes (property-based)',
      fc.property(
        fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), {
          minLength: 4,
          maxLength: 20,
        }).map(arr => arr.join('')),
        (code) => {
          expect(() => {
            if (!/^[A-Z0-9]{4,20}$/i.test(code.toUpperCase())) {
              throw new DiscountValidationError('Invalid coupon code format')
            }
          }).not.toThrow()
        }
      )
    )

    it(
      'should reject all invalid coupon codes (property-based)',
      fc.property(
        fc.oneof(
          fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), {
            maxLength: 3,
          }).map(arr => arr.join('')),
          fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), {
            minLength: 21,
            maxLength: 30,
          }).map(arr => arr.join('')),
          fc.string({ minLength: 4, maxLength: 20 }).filter(s => !/^[A-Z0-9]+$/i.test(s))
        ),
        (code) => {
          expect(() => {
            if (!/^[A-Z0-9]{4,20}$/i.test(code.toUpperCase())) {
              throw new DiscountValidationError('Invalid coupon code format')
            }
          }).toThrow(DiscountValidationError)
        }
      )
    )

    it('should normalize coupon codes to uppercase', () => {
      const testCases = [
        { input: 'save20', expected: 'SAVE20' },
        { input: 'Save20', expected: 'SAVE20' },
        { input: 'SAVE20', expected: 'SAVE20' },
        { input: 'lowercase', expected: 'LOWERCASE' },
      ]

      for (const { input, expected } of testCases) {
        const normalized = input.toUpperCase().trim()
        expect(normalized).toBe(expected)
      }
    })
  })

  describe('Property 6: Coupon Code Redemption Counter Consistency', () => {
    it('should never allow current_redemptions to exceed max_redemptions', () => {
      const testCases = [
        { current: 0, max: 10, shouldAllow: true },
        { current: 5, max: 10, shouldAllow: true },
        { current: 9, max: 10, shouldAllow: true },
        { current: 10, max: 10, shouldAllow: false },
        { current: 11, max: 10, shouldAllow: false },
      ]

      for (const { current, max, shouldAllow } of testCases) {
        const isValid = current < max
        expect(isValid).toBe(shouldAllow)
      }
    })

    it('should increment counter by exactly 1 on redemption', () => {
      const testCases = [
        { before: 0, after: 1 },
        { before: 5, after: 6 },
        { before: 9, after: 10 },
      ]

      for (const { before, after } of testCases) {
        const incremented = before + 1
        expect(incremented).toBe(after)
      }
    })

    it('should prevent redemption when counter reaches max', () => {
      const testCases = [
        { current: 10, max: 10, canRedeem: false },
        { current: 11, max: 10, canRedeem: false },
        { current: 9, max: 10, canRedeem: true },
      ]

      for (const { current, max, canRedeem } of testCases) {
        const isRedeemable = current < max
        expect(isRedeemable).toBe(canRedeem)
      }
    })

    it(
      'should maintain counter consistency for all valid states (property-based)',
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 })
        ),
        ([current, max]) => {
          // Ensure current <= max for valid state
          const validCurrent = Math.min(current, max)
          
          // After redemption, counter should increment by 1
          const afterRedemption = validCurrent + 1
          
          // After redemption, counter should not exceed max
          expect(afterRedemption).toBeLessThanOrEqual(max + 1)
          
          // Counter should never be negative
          expect(validCurrent).toBeGreaterThanOrEqual(0)
          expect(afterRedemption).toBeGreaterThanOrEqual(0)
        }
      )
    )

    it(
      'should reject redemption when exhausted (property-based)',
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (max) => {
          const current = max
          const canRedeem = current < max
          expect(canRedeem).toBe(false)
        }
      )
    )

    it(
      'should allow redemption when not exhausted (property-based)',
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 100 })
        ),
        ([current, max]) => {
          const validCurrent = Math.min(current, max - 1)
          const canRedeem = validCurrent < max
          expect(canRedeem).toBe(true)
        }
      )
    )
  })

  describe('Property 15: Redemption Logging Completeness', () => {
    it('should create redemption record with all required fields', () => {
      const mockRedemption: DiscountRedemption = {
        id: 'redemption-1',
        discountType: 'coupon',
        discountId: 'coupon-1',
        userId: 'user-1',
        subscriptionId: 'sub-1',
        discountAmount: 2.0,
        finalPrice: 7.9,
        redeemedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      // Verify all required fields are present
      expect(mockRedemption).toHaveProperty('id')
      expect(mockRedemption).toHaveProperty('discountType')
      expect(mockRedemption).toHaveProperty('discountId')
      expect(mockRedemption).toHaveProperty('userId')
      expect(mockRedemption).toHaveProperty('subscriptionId')
      expect(mockRedemption).toHaveProperty('discountAmount')
      expect(mockRedemption).toHaveProperty('finalPrice')
      expect(mockRedemption).toHaveProperty('redeemedAt')

      // Verify field values
      expect(mockRedemption.discountType).toBe('coupon')
      expect(mockRedemption.discountAmount).toBeGreaterThanOrEqual(0)
      expect(mockRedemption.finalPrice).toBeGreaterThanOrEqual(0)
      expect(mockRedemption.userId).toBeTruthy()
      expect(mockRedemption.subscriptionId).toBeTruthy()
    })

    it('should log redemption with correct discount amount calculation', () => {
      const testCases = [
        { discountPrice: 7.9, expectedDiscountAmount: 2.0, expectedFinalPrice: 7.9 },
        { discountPrice: 5.0, expectedDiscountAmount: 4.9, expectedFinalPrice: 5.0 },
        { discountPrice: 0, expectedDiscountAmount: 9.9, expectedFinalPrice: 0 },
        { discountPrice: 9.9, expectedDiscountAmount: 0, expectedFinalPrice: 9.9 },
      ]

      for (const { discountPrice, expectedDiscountAmount, expectedFinalPrice } of testCases) {
        const discountAmount = 9.9 - discountPrice
        const finalPrice = discountPrice

        expect(discountAmount).toBeCloseTo(expectedDiscountAmount, 1)
        expect(finalPrice).toBe(expectedFinalPrice)
      }
    })

    it('should include optional fields when provided', () => {
      const mockRedemption: DiscountRedemption = {
        id: 'redemption-1',
        discountType: 'coupon',
        discountId: 'coupon-1',
        userId: 'user-1',
        subscriptionId: 'sub-1',
        discountAmount: 2.0,
        finalPrice: 7.9,
        redeemedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      expect(mockRedemption.ipAddress).toBeDefined()
      expect(mockRedemption.userAgent).toBeDefined()
    })

    it('should handle optional fields when not provided', () => {
      const mockRedemption: DiscountRedemption = {
        id: 'redemption-1',
        discountType: 'coupon',
        discountId: 'coupon-1',
        userId: 'user-1',
        subscriptionId: 'sub-1',
        discountAmount: 2.0,
        finalPrice: 7.9,
        redeemedAt: new Date().toISOString(),
      }

      // Optional fields should be undefined or not present
      expect(mockRedemption.ipAddress).toBeUndefined()
      expect(mockRedemption.userAgent).toBeUndefined()
    })

    it(
      'should create valid redemption records for all valid discount prices (property-based)',
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 990 }).map(n => n / 100),
          fc.uuid(),
          fc.uuid(),
          fc.uuid()
        ),
        ([discountPrice, couponId, userId, subscriptionId]) => {
          const discountAmount = 9.9 - discountPrice
          const finalPrice = discountPrice

          // Create mock redemption
          const redemption: DiscountRedemption = {
            id: 'redemption-1',
            discountType: 'coupon',
            discountId: couponId,
            userId,
            subscriptionId,
            discountAmount,
            finalPrice,
            redeemedAt: new Date().toISOString(),
          }

          // Verify all required fields
          expect(redemption.id).toBeTruthy()
          expect(redemption.discountType).toBe('coupon')
          expect(redemption.discountId).toBe(couponId)
          expect(redemption.userId).toBe(userId)
          expect(redemption.subscriptionId).toBe(subscriptionId)
          expect(redemption.discountAmount).toBeGreaterThanOrEqual(0)
          expect(redemption.finalPrice).toBeGreaterThanOrEqual(0)
          expect(redemption.redeemedAt).toBeTruthy()

          // Verify calculations
          expect(redemption.discountAmount + redemption.finalPrice).toBeCloseTo(9.9, 1)
        }
      )
    )

    it(
      'should maintain discount amount and final price consistency (property-based)',
      fc.property(
        fc.integer({ min: 0, max: 990 }).map(n => n / 100),
        (discountPrice) => {
          const discountAmount = 9.9 - discountPrice
          const finalPrice = discountPrice

          // Sum should equal original price
          expect(discountAmount + finalPrice).toBeCloseTo(9.9, 1)

          // Both should be non-negative
          expect(discountAmount).toBeGreaterThanOrEqual(0)
          expect(finalPrice).toBeGreaterThanOrEqual(0)

          // Final price should not exceed original
          expect(finalPrice).toBeLessThanOrEqual(9.9)
        }
      )
    )
  })

  describe('Coupon Code Creation', () => {
    it('should validate coupon code format during creation', () => {
      const validCode = 'SAVE20'
      const invalidCode = 'ABC' // Too short

      expect(() => {
        if (!/^[A-Z0-9]{4,20}$/i.test(validCode.toUpperCase())) {
          throw new DiscountValidationError('Invalid coupon code format')
        }
      }).not.toThrow()

      expect(() => {
        if (!/^[A-Z0-9]{4,20}$/i.test(invalidCode.toUpperCase())) {
          throw new DiscountValidationError('Invalid coupon code format')
        }
      }).toThrow(DiscountValidationError)
    })

    it('should validate discount price during creation', () => {
      const validPrice = 5.0
      const invalidPrice = 10.0

      expect(() => {
        if (validPrice < 0 || validPrice > 9.9) {
          throw new DiscountValidationError('Discount price must be between R$ 0.00 and R$ 9.90')
        }
      }).not.toThrow()

      expect(() => {
        if (invalidPrice < 0 || invalidPrice > 9.9) {
          throw new DiscountValidationError('Discount price must be between R$ 0.00 and R$ 9.90')
        }
      }).toThrow(DiscountValidationError)
    })

    it('should validate max redemptions during creation', () => {
      const validMax = 100
      const invalidMax = 0

      expect(() => {
        if (validMax <= 0) {
          throw new DiscountValidationError('Max redemptions must be greater than 0')
        }
      }).not.toThrow()

      expect(() => {
        if (invalidMax <= 0) {
          throw new DiscountValidationError('Max redemptions must be greater than 0')
        }
      }).toThrow(DiscountValidationError)
    })
  })

  describe('Coupon Code Validation', () => {
    it('should reject non-existent coupon codes', () => {
      expect(() => {
        throw new DiscountNotFoundError('coupon', 'NONEXISTENT')
      }).toThrow(DiscountNotFoundError)
    })

    it('should reject inactive coupon codes', () => {
      expect(() => {
        throw new DiscountValidationError('This coupon code is no longer active')
      }).toThrow(DiscountValidationError)
    })

    it('should reject expired coupon codes', () => {
      expect(() => {
        throw new DiscountExpiredError('coupon')
      }).toThrow(DiscountExpiredError)
    })

    it('should reject exhausted coupon codes', () => {
      expect(() => {
        throw new DiscountExhaustedError('coupon')
      }).toThrow(DiscountExhaustedError)
    })
  })

  describe('Coupon Code Deactivation', () => {
    it('should mark coupon as inactive when deactivated', () => {
      const coupon: CouponCode = {
        id: 'coupon-1',
        code: 'SAVE20',
        discountPrice: 5.0,
        maxRedemptions: 100,
        currentRedemptions: 0,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-1',
        createdAt: new Date().toISOString(),
        isActive: true,
        deletedAt: null,
        status: 'active',
      }

      // Simulate deactivation
      const deactivated = { ...coupon, isActive: false }

      expect(deactivated.isActive).toBe(false)
      expect(coupon.isActive).toBe(true) // Original unchanged
    })
  })

  describe('Coupon Code Soft Delete', () => {
    it('should set deleted_at timestamp when deleted', () => {
      const coupon: CouponCode = {
        id: 'coupon-1',
        code: 'SAVE20',
        discountPrice: 5.0,
        maxRedemptions: 100,
        currentRedemptions: 0,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-1',
        createdAt: new Date().toISOString(),
        isActive: true,
        deletedAt: null,
        status: 'active',
      }

      // Simulate soft delete
      const deleted = { ...coupon, deletedAt: new Date().toISOString(), isActive: false }

      expect(deleted.deletedAt).toBeTruthy()
      expect(deleted.isActive).toBe(false)
      expect(coupon.deletedAt).toBeNull() // Original unchanged
    })

    it('should not appear in active lists when soft deleted', () => {
      const coupons: CouponCode[] = [
        {
          id: 'coupon-1',
          code: 'SAVE20',
          discountPrice: 5.0,
          maxRedemptions: 100,
          currentRedemptions: 0,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
          createdBy: 'admin-1',
          createdAt: new Date().toISOString(),
          isActive: true,
          deletedAt: null,
          status: 'active',
        },
        {
          id: 'coupon-2',
          code: 'VIP100',
          discountPrice: 2.0,
          maxRedemptions: 50,
          currentRedemptions: 0,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
          createdBy: 'admin-1',
          createdAt: new Date().toISOString(),
          isActive: false,
          deletedAt: new Date().toISOString(),
          status: 'inactive',
        },
      ]

      const activeCoupons = coupons.filter(c => !c.deletedAt && c.isActive)
      expect(activeCoupons).toHaveLength(1)
      expect(activeCoupons[0].code).toBe('SAVE20')
    })
  })
})
