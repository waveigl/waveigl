/**
 * Unit Tests for Direct User Discount API Endpoints
 * Tests CRUD operations and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET, PUT, DELETE } from '@/app/api/discounts/direct-user/route'
import type { DirectUserDiscount } from '@/types/discount.types'

// Mock services
vi.mock('@/lib/discounts/direct-user-discount.service', () => ({
  DirectUserDiscountService: {
    createDiscount: vi.fn(),
    listDiscounts: vi.fn(),
    updateDiscount: vi.fn(),
    deleteDiscount: vi.fn(),
  },
}))

vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn(),
}))

import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'

describe('Direct User Discount API Endpoints', () => {
  const mockDiscount: DirectUserDiscount = {
    id: 'discount-1',
    userId: 'user-1',
    discountPrice: 5.0,
    maxRedemptions: 10,
    currentRedemptions: 0,
    expirationDate: '2025-12-31T10:00:00Z',
    createdBy: 'admin-1',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    isActive: true,
    status: 'active',
  }

  describe('POST /api/discounts/direct-user', () => {
    it('should create a direct user discount', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.createDiscount).mockResolvedValue(mockDiscount)

      const request = new Request('http://localhost/api/discounts/direct-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          discountPrice: 5.0,
          createdBy: 'admin-1',
        }),
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockDiscount)
    })

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const request = new Request('http://localhost/api/discounts/direct-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          // Missing discountPrice and createdBy
        }),
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.createDiscount).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/direct-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          discountPrice: 5.0,
          createdBy: 'admin-1',
        }),
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('GET /api/discounts/direct-user', () => {
    it('should list all direct user discounts', async () => {
      // Arrange
      const mockDiscounts = [mockDiscount]
      vi.mocked(DirectUserDiscountService.listDiscounts).mockResolvedValue(mockDiscounts)

      const request = new Request('http://localhost/api/discounts/direct-user', {
        method: 'GET',
      })

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockDiscounts)
    })

    it('should apply filters when provided', async () => {
      // Arrange
      const mockDiscounts = [mockDiscount]
      vi.mocked(DirectUserDiscountService.listDiscounts).mockResolvedValue(mockDiscounts)

      const request = new Request(
        'http://localhost/api/discounts/direct-user?sortBy=created_date&sortOrder=asc',
        {
          method: 'GET',
        }
      )

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(DirectUserDiscountService.listDiscounts).toHaveBeenCalledWith({
        sortBy: 'created_date',
        sortOrder: 'asc',
        status: null,
      })
    })

    it('should return 500 on service error', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.listDiscounts).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/direct-user', {
        method: 'GET',
      })

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('PUT /api/discounts/direct-user/:id', () => {
    it('should update a direct user discount', async () => {
      // Arrange
      const updatedDiscount = { ...mockDiscount, discountPrice: 7.0 }
      vi.mocked(DirectUserDiscountService.updateDiscount).mockResolvedValue(updatedDiscount)

      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'discount-1',
          discountPrice: 7.0,
          updatedBy: 'admin-1',
        }),
      })

      // Act
      const response = await PUT(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.discountPrice).toBe(7.0)
    })

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'discount-1',
          // Missing discountPrice and updatedBy
        }),
      })

      // Act
      const response = await PUT(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.updateDiscount).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'discount-1',
          discountPrice: 7.0,
          updatedBy: 'admin-1',
        }),
      })

      // Act
      const response = await PUT(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('DELETE /api/discounts/direct-user/:id', () => {
    it('should delete a direct user discount', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.deleteDiscount).mockResolvedValue(undefined)

      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'discount-1',
          deletedBy: 'admin-1',
        }),
      })

      // Act
      const response = await DELETE(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'discount-1',
          // Missing deletedBy
        }),
      })

      // Act
      const response = await DELETE(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      // Arrange
      vi.mocked(DirectUserDiscountService.deleteDiscount).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/direct-user/discount-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'discount-1',
          deletedBy: 'admin-1',
        }),
      })

      // Act
      const response = await DELETE(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})
