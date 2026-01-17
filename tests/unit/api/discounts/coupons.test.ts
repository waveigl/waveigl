/**
 * Unit Tests for Coupon Codes API Endpoints
 */

import { describe, it, expect, vi } from 'vitest'
import { POST, GET, PUT, DELETE } from '@/app/api/discounts/coupons/route'
import type { CouponCode } from '@/types/discount.types'

vi.mock('@/lib/discounts/coupon-code.service', () => ({
  CouponCodeService: {
    createCoupon: vi.fn(),
    listCoupons: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
  },
}))

vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn(),
}))

import { CouponCodeService } from '@/lib/discounts/coupon-code.service'

describe('Coupon Codes API Endpoints', () => {
  const mockCoupon: CouponCode = {
    id: 'coupon-1',
    code: 'SAVE50',
    discountPrice: 5.0,
    maxRedemptions: 100,
    currentRedemptions: 0,
    expirationDate: '2025-12-31T23:59:59Z',
    createdBy: 'admin-1',
    createdAt: '2025-01-01T10:00:00Z',
    isActive: true,
    status: 'active',
  }

  describe('POST /api/discounts/coupons', () => {
    it('should create a coupon code', async () => {
      vi.mocked(CouponCodeService.createCoupon).mockResolvedValue(mockCoupon)

      const request = new Request('http://localhost/api/discounts/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE50',
          discountPrice: 5.0,
          maxRedemptions: 100,
          expirationDate: '2025-12-31T23:59:59Z',
          createdBy: 'admin-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCoupon)
    })

    it('should return 400 if required fields missing', async () => {
      const request = new Request('http://localhost/api/discounts/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE50',
          // Missing other fields
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(CouponCodeService.createCoupon).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE50',
          discountPrice: 5.0,
          maxRedemptions: 100,
          expirationDate: '2025-12-31T23:59:59Z',
          createdBy: 'admin-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })

  describe('GET /api/discounts/coupons', () => {
    it('should list all coupons', async () => {
      vi.mocked(CouponCodeService.listCoupons).mockResolvedValue([mockCoupon])

      const request = new Request('http://localhost/api/discounts/coupons', {
        method: 'GET',
      })

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([mockCoupon])
    })

    it('should apply filters', async () => {
      vi.mocked(CouponCodeService.listCoupons).mockResolvedValue([mockCoupon])

      const request = new Request(
        'http://localhost/api/discounts/coupons?sortBy=created_date&sortOrder=asc',
        { method: 'GET' }
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 500 on service error', async () => {
      vi.mocked(CouponCodeService.listCoupons).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/coupons', {
        method: 'GET',
      })

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })

  describe('PUT /api/discounts/coupons/:id', () => {
    it('should update a coupon code', async () => {
      const updated = { ...mockCoupon, discountPrice: 7.0 }
      vi.mocked(CouponCodeService.updateCoupon).mockResolvedValue(updated)

      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'coupon-1',
          discountPrice: 7.0,
          updatedBy: 'admin-1',
        }),
      })

      const response = await PUT(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.discountPrice).toBe(7.0)
    })

    it('should return 400 if required fields missing', async () => {
      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'coupon-1',
          // Missing updatedBy
        }),
      })

      const response = await PUT(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(CouponCodeService.updateCoupon).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'coupon-1',
          discountPrice: 7.0,
          updatedBy: 'admin-1',
        }),
      })

      const response = await PUT(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })

  describe('DELETE /api/discounts/coupons/:id', () => {
    it('should delete a coupon code', async () => {
      vi.mocked(CouponCodeService.deleteCoupon).mockResolvedValue(undefined)

      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'coupon-1',
          deletedBy: 'admin-1',
        }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 if required fields missing', async () => {
      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'coupon-1',
          // Missing deletedBy
        }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(CouponCodeService.deleteCoupon).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/coupons/coupon-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'coupon-1',
          deletedBy: 'admin-1',
        }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })
})
