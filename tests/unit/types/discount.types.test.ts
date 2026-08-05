import { describe, it, expect } from 'vitest'
import type {
  DirectUserDiscount,
  DiscountLink,
  CouponCode,
  DiscountValidationResult,
  DiscountRedemption,
  DiscountStats,
  DiscountFilters,
  AnalyticsFilters,
} from '@/types/discount.types'

describe('Discount Types', () => {
  describe('DirectUserDiscount', () => {
    it('should have all required properties', () => {
      const discount: DirectUserDiscount = {
        id: 'test-id',
        userId: 'user-123',
        discountPrice: 5.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        status: 'active',
      }

      expect(discount.id).toBeDefined()
      expect(discount.userId).toBeDefined()
      expect(discount.discountPrice).toBeDefined()
      expect(discount.createdBy).toBeDefined()
      expect(discount.isActive).toBe(true)
    })

    it('should allow optional deletedAt property', () => {
      const discount: DirectUserDiscount = {
        id: 'test-id',
        userId: 'user-123',
        discountPrice: 5.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false,
        deletedAt: new Date().toISOString(),
        status: 'inactive',
      }

      expect(discount.deletedAt).toBeDefined()
    })

    it('should allow optional user property', () => {
      const discount: DirectUserDiscount = {
        id: 'test-id',
        userId: 'user-123',
        discountPrice: 5.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        status: 'active',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          fullName: 'Test User',
        },
      }

      expect(discount.user).toBeDefined()
      expect(discount.user?.email).toBe('user@example.com')
    })
  })

  describe('DiscountLink', () => {
    it('should have all required properties', () => {
      const link: DiscountLink = {
        id: 'link-id',
        token: 'unique-token-123',
        discountPrice: 3.0,
        maxRedemptions: 10,
        currentRedemptions: 2,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: true,
        status: 'active',
      }

      expect(link.token).toBeDefined()
      expect(link.maxRedemptions).toBe(10)
      expect(link.currentRedemptions).toBe(2)
      expect(link.status).toBe('active')
    })

    it('should support all status values', () => {
      const statuses: Array<'active' | 'exhausted' | 'expired' | 'inactive'> = [
        'active',
        'exhausted',
        'expired',
        'inactive',
      ]

      statuses.forEach((status) => {
        const link: DiscountLink = {
          id: 'link-id',
          token: 'token',
          discountPrice: 3.0,
          maxRedemptions: 10,
          currentRedemptions: 0,
          expirationDate: new Date().toISOString(),
          createdBy: 'admin-123',
          createdAt: new Date().toISOString(),
          isActive: true,
          status,
        }

        expect(link.status).toBe(status)
      })
    })

    it('should allow optional description', () => {
      const link: DiscountLink = {
        id: 'link-id',
        token: 'token',
        discountPrice: 3.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: new Date().toISOString(),
        description: 'Special offer for VIPs',
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: true,
        status: 'active',
      }

      expect(link.description).toBe('Special offer for VIPs')
    })
  })

  describe('CouponCode', () => {
    it('should have all required properties', () => {
      const coupon: CouponCode = {
        id: 'coupon-id',
        code: 'SAVE20',
        discountPrice: 2.0,
        maxRedemptions: 100,
        currentRedemptions: 45,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: true,
        status: 'active',
      }

      expect(coupon.code).toBeDefined()
      expect(coupon.code).toMatch(/^[A-Z0-9]+$/)
      expect(coupon.maxRedemptions).toBe(100)
      expect(coupon.currentRedemptions).toBe(45)
    })

    it('should support all status values', () => {
      const statuses: Array<'active' | 'exhausted' | 'expired' | 'inactive'> = [
        'active',
        'exhausted',
        'expired',
        'inactive',
      ]

      statuses.forEach((status) => {
        const coupon: CouponCode = {
          id: 'coupon-id',
          code: 'TEST',
          discountPrice: 2.0,
          maxRedemptions: 100,
          currentRedemptions: 0,
          expirationDate: new Date().toISOString(),
          createdBy: 'admin-123',
          createdAt: new Date().toISOString(),
          isActive: true,
          status,
        }

        expect(coupon.status).toBe(status)
      })
    })
  })

  describe('DiscountValidationResult', () => {
    it('should represent valid discount', () => {
      const result: DiscountValidationResult = {
        isValid: true,
        discountAmount: 2.0,
        finalPrice: 7.9,
        discountType: 'coupon',
      }

      expect(result.isValid).toBe(true)
      expect(result.discountAmount).toBe(2.0)
      expect(result.finalPrice).toBe(7.9)
    })

    it('should represent invalid discount with error', () => {
      const result: DiscountValidationResult = {
        isValid: false,
        error: 'Coupon has expired',
      }

      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('DiscountRedemption', () => {
    it('should track all redemption details', () => {
      const redemption: DiscountRedemption = {
        id: 'redemption-id',
        discountType: 'coupon',
        discountId: 'coupon-id',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        discountAmount: 2.0,
        finalPrice: 7.9,
        redeemedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      }

      expect(redemption.discountType).toBe('coupon')
      expect(redemption.discountAmount).toBe(2.0)
      expect(redemption.finalPrice).toBe(7.9)
      expect(redemption.ipAddress).toBeDefined()
    })
  })

  describe('DiscountStats', () => {
    it('should aggregate discount statistics', () => {
      const stats: DiscountStats = {
        totalRedeemed: 50,
        redemptionRate: 0.5,
        revenueImpact: 100.0,
        averageDiscountValue: 2.0,
        recentRedemptions: [],
      }

      expect(stats.totalRedeemed).toBe(50)
      expect(stats.redemptionRate).toBe(0.5)
      expect(stats.revenueImpact).toBe(100.0)
      expect(stats.averageDiscountValue).toBe(2.0)
    })
  })

  describe('DiscountFilters', () => {
    it('should support all filter options', () => {
      const filters: DiscountFilters = {
        searchTerm: 'SAVE',
        sortBy: 'created_date',
        sortOrder: 'desc',
        status: 'active',
        dateRange: {
          start: '2025-01-01',
          end: '2025-01-31',
        },
      }

      expect(filters.searchTerm).toBe('SAVE')
      expect(filters.sortBy).toBe('created_date')
      expect(filters.sortOrder).toBe('desc')
      expect(filters.status).toBe('active')
      expect(filters.dateRange).toBeDefined()
    })

    it('should support all sortBy options', () => {
      const sortOptions: Array<'created_date' | 'expiration_date' | 'remaining_redemptions' | 'total_redeemed'> = [
        'created_date',
        'expiration_date',
        'remaining_redemptions',
        'total_redeemed',
      ]

      sortOptions.forEach((sortBy) => {
        const filters: DiscountFilters = { sortBy }
        expect(filters.sortBy).toBe(sortBy)
      })
    })
  })

  describe('AnalyticsFilters', () => {
    it('should extend DiscountFilters with discountType', () => {
      const filters: AnalyticsFilters = {
        searchTerm: 'test',
        discountType: 'coupon',
        sortBy: 'total_redeemed',
      }

      expect(filters.searchTerm).toBe('test')
      expect(filters.discountType).toBe('coupon')
      expect(filters.sortBy).toBe('total_redeemed')
    })

    it('should support all discountType options', () => {
      const types: Array<'direct_user' | 'link' | 'coupon'> = ['direct_user', 'link', 'coupon']

      types.forEach((type) => {
        const filters: AnalyticsFilters = { discountType: type }
        expect(filters.discountType).toBe(type)
      })
    })
  })

  describe('Type Validation', () => {
    it('should validate discount price range', () => {
      // Valid prices
      const validPrices = [0, 1.5, 5.0, 9.9, 9.90]
      validPrices.forEach((price) => {
        expect(price).toBeGreaterThanOrEqual(0)
        expect(price).toBeLessThanOrEqual(9.9)
      })
    })

    it('should validate coupon code format', () => {
      const validCodes = ['SAVE20', 'VIP100', 'PROMO', 'CODE123']
      const invalidCodes = ['abc', 'toolongcodewithtoomanycharacters', 'code-with-dash', 'code with space']

      validCodes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4,20}$/)
      })

      invalidCodes.forEach((code) => {
        expect(code).not.toMatch(/^[A-Z0-9]{4,20}$/)
      })
    })

    it('should validate discount types', () => {
      const validTypes: Array<'direct_user' | 'link' | 'coupon'> = ['direct_user', 'link', 'coupon']

      validTypes.forEach((type) => {
        expect(['direct_user', 'link', 'coupon']).toContain(type)
      })
    })
  })
})
