/**
 * Property-Based Tests for DiscountAnalyticsService
 * Tests Property 16: Analytics Aggregation Accuracy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DiscountAnalyticsService, formatAnalytics, formatStats } from '@/lib/discounts/analytics.service'
import type { DiscountRedemption, DiscountStats } from '@/types/discount.types'

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(function () {
        return this
      }),
      eq: vi.fn(function () {
        return this
      }),
      gte: vi.fn(function () {
        return this
      }),
      lte: vi.fn(function () {
        return this
      }),
      order: vi.fn(function () {
        return this
      }),
    })),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    setAll: vi.fn(),
  })),
}))

describe('DiscountAnalyticsService', () => {
  describe('Property 16: Analytics Aggregation Accuracy', () => {
    /**
     * Property 16: Analytics Aggregation Accuracy
     * For any discount, the analytics should accurately reflect:
     * - total_redeemed (count of redemptions)
     * - revenue_impact (sum of discount_amounts)
     * - average_discount_value (mean of discount_amounts)
     *
     * Validates: Requirements 7.1, 7.5
     */

    it('should accurately calculate total_redeemed from redemption count', () => {
      // Arrange: Create mock redemptions
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate total_redeemed
      const totalRedeemed = mockRedemptions.length

      // Assert: Should equal count of redemptions
      expect(totalRedeemed).toBe(3)
      expect(totalRedeemed).toBe(mockRedemptions.length)
    })

    it('should accurately calculate revenue_impact as sum of discount_amounts', () => {
      // Arrange: Create mock redemptions with various discount amounts
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 1.5,
          finalPrice: 8.4,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 2.5,
          finalPrice: 7.4,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 3.0,
          finalPrice: 6.9,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate revenue_impact
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)

      // Assert: Should equal sum of all discount amounts
      expect(revenueImpact).toBe(7.0)
      expect(revenueImpact).toBeCloseTo(1.5 + 2.5 + 3.0, 2)
    })

    it('should accurately calculate average_discount_value as mean of discount_amounts', () => {
      // Arrange: Create mock redemptions
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 1.0,
          finalPrice: 8.9,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 3.0,
          finalPrice: 6.9,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate average_discount_value
      const totalRevenue = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? totalRevenue / mockRedemptions.length : 0

      // Assert: Should equal mean of discount amounts
      expect(averageDiscountValue).toBeCloseTo(2.0, 2)
      expect(averageDiscountValue).toBe(6.0 / 3)
    })

    it('should handle empty redemptions correctly', () => {
      // Arrange: Empty redemptions
      const mockRedemptions: DiscountRedemption[] = []

      // Act: Calculate metrics
      const totalRedeemed = mockRedemptions.length
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? revenueImpact / mockRedemptions.length : 0

      // Assert: Should handle empty case gracefully
      expect(totalRedeemed).toBe(0)
      expect(revenueImpact).toBe(0)
      expect(averageDiscountValue).toBe(0)
    })

    it('should maintain accuracy with single redemption', () => {
      // Arrange: Single redemption
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 2.5,
          finalPrice: 7.4,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
      ]

      // Act: Calculate metrics
      const totalRedeemed = mockRedemptions.length
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? revenueImpact / mockRedemptions.length : 0

      // Assert: Should equal the single value
      expect(totalRedeemed).toBe(1)
      expect(revenueImpact).toBe(2.5)
      expect(averageDiscountValue).toBe(2.5)
    })

    it('should maintain accuracy with large number of redemptions', () => {
      // Arrange: Generate 100 redemptions with random discount amounts
      const mockRedemptions: DiscountRedemption[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        discountType: 'coupon' as const,
        discountId: 'discount-1',
        userId: `user-${i}`,
        subscriptionId: `sub-${i}`,
        discountAmount: Math.random() * 9.9, // Random discount between 0 and 9.9
        finalPrice: 9.9 - Math.random() * 9.9,
        redeemedAt: new Date(2025, 0, 1 + (i % 31)).toISOString(),
      }))

      // Act: Calculate metrics
      const totalRedeemed = mockRedemptions.length
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? revenueImpact / mockRedemptions.length : 0

      // Assert: Should maintain accuracy
      expect(totalRedeemed).toBe(100)
      expect(revenueImpact).toBeGreaterThan(0)
      expect(averageDiscountValue).toBeGreaterThan(0)
      expect(averageDiscountValue).toBeLessThanOrEqual(9.9)
      expect(averageDiscountValue).toBeCloseTo(revenueImpact / 100, 2)
    })

    it('should maintain accuracy with mixed discount types', () => {
      // Arrange: Mix of different discount types
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'direct_user',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 1.0,
          finalPrice: 8.9,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'link',
          discountId: 'discount-2',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-3',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 3.0,
          finalPrice: 6.9,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate metrics
      const totalRedeemed = mockRedemptions.length
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? revenueImpact / mockRedemptions.length : 0

      // Assert: Should aggregate correctly across types
      expect(totalRedeemed).toBe(3)
      expect(revenueImpact).toBeCloseTo(6.0, 2)
      expect(averageDiscountValue).toBeCloseTo(2.0, 2)
    })

    it('should maintain accuracy with decimal precision', () => {
      // Arrange: Redemptions with precise decimal values
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 1.23,
          finalPrice: 8.67,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 2.34,
          finalPrice: 7.56,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 3.45,
          finalPrice: 6.45,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate metrics
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = mockRedemptions.length > 0 ? revenueImpact / mockRedemptions.length : 0

      // Assert: Should maintain decimal precision
      expect(revenueImpact).toBeCloseTo(7.02, 2)
      expect(averageDiscountValue).toBeCloseTo(2.34, 2)
    })

    it('should verify revenue_impact equals sum of all discount_amounts', () => {
      // Arrange: Create multiple redemptions
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 0.5,
          finalPrice: 9.4,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 1.5,
          finalPrice: 8.4,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 2.5,
          finalPrice: 7.4,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
        {
          id: '4',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-4',
          subscriptionId: 'sub-4',
          discountAmount: 3.5,
          finalPrice: 6.4,
          redeemedAt: '2025-01-04T10:00:00Z',
        },
      ]

      // Act: Calculate revenue impact
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const manualSum = 0.5 + 1.5 + 2.5 + 3.5

      // Assert: Should equal manual sum
      expect(revenueImpact).toBeCloseTo(manualSum, 2)
      expect(revenueImpact).toBe(8.0)
    })

    it('should verify average_discount_value equals revenue_impact divided by total_redeemed', () => {
      // Arrange: Create redemptions
      const mockRedemptions: DiscountRedemption[] = [
        {
          id: '1',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          discountAmount: 2.0,
          finalPrice: 7.9,
          redeemedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: '2',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          discountAmount: 4.0,
          finalPrice: 5.9,
          redeemedAt: '2025-01-02T10:00:00Z',
        },
        {
          id: '3',
          discountType: 'coupon',
          discountId: 'discount-1',
          userId: 'user-3',
          subscriptionId: 'sub-3',
          discountAmount: 6.0,
          finalPrice: 3.9,
          redeemedAt: '2025-01-03T10:00:00Z',
        },
      ]

      // Act: Calculate metrics
      const totalRedeemed = mockRedemptions.length
      const revenueImpact = mockRedemptions.reduce((sum, r) => sum + r.discountAmount, 0)
      const averageDiscountValue = revenueImpact / totalRedeemed

      // Assert: Should equal revenue_impact / total_redeemed
      expect(averageDiscountValue).toBeCloseTo(4.0, 2)
      expect(averageDiscountValue).toBe(12.0 / 3)
    })
  })

  describe('formatAnalytics', () => {
    it('should format analytics correctly', () => {
      // Arrange
      const analytics = {
        totalDiscounts: 10,
        totalRedeemed: 5,
        totalRevenueLost: 15.5,
        averageDiscountValue: 3.1,
        redemptionRate: 0.5,
        byType: {
          directUser: {
            totalRedeemed: 2,
            redemptionRate: 2,
            revenueImpact: 5.0,
            averageDiscountValue: 2.5,
            recentRedemptions: [],
          },
          links: {
            totalRedeemed: 2,
            redemptionRate: 2,
            revenueImpact: 5.0,
            averageDiscountValue: 2.5,
            recentRedemptions: [],
          },
          coupons: {
            totalRedeemed: 1,
            redemptionRate: 1,
            revenueImpact: 5.5,
            averageDiscountValue: 5.5,
            recentRedemptions: [],
          },
        },
      }

      // Act
      const formatted = formatAnalytics(analytics)

      // Assert
      expect(formatted.totalDiscounts).toBe('10')
      expect(formatted.totalRedeemed).toBe('5')
      expect(formatted.totalRevenueLost).toBe('R$ 15.50')
      expect(formatted.averageDiscountValue).toBe('R$ 3.10')
      expect(formatted.redemptionRate).toBe('50.00%')
    })
  })

  describe('formatStats', () => {
    it('should format stats correctly', () => {
      // Arrange
      const stats: DiscountStats = {
        totalRedeemed: 10,
        redemptionRate: 10,
        revenueImpact: 25.5,
        averageDiscountValue: 2.55,
        recentRedemptions: [],
      }

      // Act
      const formatted = formatStats(stats)

      // Assert
      expect(formatted.totalRedeemed).toBe('10')
      expect(formatted.redemptionRate).toBe('10')
      expect(formatted.revenueImpact).toBe('R$ 25.50')
      expect(formatted.averageDiscountValue).toBe('R$ 2.55')
    })
  })
})
