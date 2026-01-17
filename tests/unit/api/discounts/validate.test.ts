/**
 * Property-Based Tests for Discount Validation
 * Tests Properties 8, 9, 14
 */

import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/discounts/validate/route'
import type { DirectUserDiscount, DiscountLink, CouponCode } from '@/types/discount.types'

vi.mock('@/lib/discounts/direct-user-discount.service', () => ({
  DirectUserDiscountService: {
    getDiscount: vi.fn(),
  },
}))

vi.mock('@/lib/discounts/discount-link.service', () => ({
  DiscountLinkService: {
    validateToken: vi.fn(),
  },
}))

vi.mock('@/lib/discounts/coupon-code.service', () => ({
  CouponCodeService: {
    validateCode: vi.fn(),
  },
}))

vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn(),
}))

import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'
import { CouponCodeService } from '@/lib/discounts/coupon-code.service'

describe('Discount Validation API', () => {
  describe('Property 8: PreApproval Custom Price Application', () => {
    it('should validate direct user discount with correct price', async () => {
      const mockDiscount: DirectUserDiscount = {
        id: 'discount-1',
        userId: 'user-1',
        discountPrice: 5.0,
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        isActive: true,
      }

      vi.mocked(DirectUserDiscountService.getDiscount).mockResolvedValue(mockDiscount)

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'direct_user',
          discountId: 'discount-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isValid).toBe(true)
      expect(data.data.discount.discountPrice).toBe(5.0)
    })

    it('should validate link discount with correct price', async () => {
      const mockLink: DiscountLink = {
        id: 'link-1',
        token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        discountPrice: 7.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: '2025-12-31T23:59:59Z',
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        isActive: true,
        status: 'active',
      }

      vi.mocked(DiscountLinkService.validateToken).mockResolvedValue({
        isValid: true,
        discount: mockLink,
      })

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'link',
          token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isValid).toBe(true)
      expect(data.data.discount.discountPrice).toBe(7.0)
    })

    it('should validate coupon with correct price', async () => {
      const mockCoupon: CouponCode = {
        id: 'coupon-1',
        code: 'SAVE50',
        discountPrice: 3.0,
        maxRedemptions: 100,
        currentRedemptions: 0,
        expirationDate: '2025-12-31T23:59:59Z',
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        isActive: true,
        status: 'active',
      }

      vi.mocked(CouponCodeService.validateCode).mockResolvedValue({
        isValid: true,
        discount: mockCoupon,
      })

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'coupon',
          code: 'SAVE50',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isValid).toBe(true)
      expect(data.data.discount.discountPrice).toBe(3.0)
    })
  })

  describe('Property 9: Discount Metadata Persistence', () => {
    it('should return discount metadata for direct user discount', async () => {
      const mockDiscount: DirectUserDiscount = {
        id: 'discount-1',
        userId: 'user-1',
        discountPrice: 5.0,
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        isActive: true,
      }

      vi.mocked(DirectUserDiscountService.getDiscount).mockResolvedValue(mockDiscount)

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'direct_user',
          discountId: 'discount-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discount).toBeDefined()
      expect(data.data.discount.id).toBe('discount-1')
      expect(data.data.discount.userId).toBe('user-1')
    })

    it('should return discount metadata for link', async () => {
      const mockLink: DiscountLink = {
        id: 'link-1',
        token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        discountPrice: 7.0,
        maxRedemptions: 10,
        currentRedemptions: 0,
        expirationDate: '2025-12-31T23:59:59Z',
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        isActive: true,
        status: 'active',
      }

      vi.mocked(DiscountLinkService.validateToken).mockResolvedValue({
        isValid: true,
        discount: mockLink,
      })

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'link',
          token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discount).toBeDefined()
      expect(data.data.discount.id).toBe('link-1')
      expect(data.data.discount.token).toBe('abc123def456ghi789jkl012mno345pqr678stu901vwx234yz')
    })

    it('should return discount metadata for coupon', async () => {
      const mockCoupon: CouponCode = {
        id: 'coupon-1',
        code: 'SAVE50',
        discountPrice: 3.0,
        maxRedemptions: 100,
        currentRedemptions: 0,
        expirationDate: '2025-12-31T23:59:59Z',
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        isActive: true,
        status: 'active',
      }

      vi.mocked(CouponCodeService.validateCode).mockResolvedValue({
        isValid: true,
        discount: mockCoupon,
      })

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'coupon',
          code: 'SAVE50',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discount).toBeDefined()
      expect(data.data.discount.id).toBe('coupon-1')
      expect(data.data.discount.code).toBe('SAVE50')
    })
  })

  describe('Property 14: Single Discount Per Subscription', () => {
    it('should validate only one discount type at a time', async () => {
      const mockDiscount: DirectUserDiscount = {
        id: 'discount-1',
        userId: 'user-1',
        discountPrice: 5.0,
        createdBy: 'admin-1',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        isActive: true,
      }

      vi.mocked(DirectUserDiscountService.getDiscount).mockResolvedValue(mockDiscount)

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'direct_user',
          discountId: 'discount-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.isValid).toBe(true)
      // Only one discount should be returned
      expect(data.data.discount).toBeDefined()
      expect(Array.isArray(data.data.discount)).toBe(false)
    })

    it('should reject invalid discount type', async () => {
      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'invalid_type',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid discountType')
    })

    it('should require discountType', async () => {
      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field: discountType')
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for missing discountId with direct_user', async () => {
      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'direct_user',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field for direct_user: discountId')
    })

    it('should return 400 for missing token with link', async () => {
      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'link',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field for link: token')
    })

    it('should return 400 for missing code with coupon', async () => {
      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'coupon',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field for coupon: code')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(DirectUserDiscountService.getDiscount).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          discountType: 'direct_user',
          discountId: 'discount-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })
})
