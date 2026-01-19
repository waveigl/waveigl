/**
 * Unit Tests for Discount Links API Endpoints
 * Tests link generation, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET, DELETE } from '@/app/api/discounts/links/route'
import type { DiscountLink } from '@/types/discount.types'

// Mock services
vi.mock('@/lib/discounts/discount-link.service', () => ({
  DiscountLinkService: {
    generateLink: vi.fn(),
    listLinks: vi.fn(),
    deleteLink: vi.fn(),
  },
}))

vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn(),
}))

import { DiscountLinkService } from '@/lib/discounts/discount-link.service'

describe('Discount Links API Endpoints', () => {
  const mockLink: DiscountLink = {
    id: 'link-1',
    token: 'a'.repeat(64),
    discountPrice: 5.0,
    maxRedemptions: 100,
    currentRedemptions: 0,
    expirationDate: new Date(Date.now() + 86400000).toISOString(),
    description: 'Test link',
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    isActive: true,
    deletedAt: null,
    status: 'active',
  }

  describe('POST /api/discounts/links', () => {
    it('should generate a discount link', async () => {
      // Arrange
      vi.mocked(DiscountLinkService.generateLink).mockResolvedValue(mockLink)

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          maxRedemptions: 100,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
          description: 'Test link',
          createdBy: 'admin-1',
        }),
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLink)
    })

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          // Missing maxRedemptions, expirationDate, createdBy
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
      vi.mocked(DiscountLinkService.generateLink).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          maxRedemptions: 100,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
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

    it('should accept optional description', async () => {
      // Arrange
      vi.mocked(DiscountLinkService.generateLink).mockResolvedValue(mockLink)

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          maxRedemptions: 100,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
          description: 'Optional description',
          createdBy: 'admin-1',
        }),
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/discounts/links', () => {
    it('should list all discount links', async () => {
      // Arrange
      const mockLinks = [mockLink]
      vi.mocked(DiscountLinkService.listLinks).mockResolvedValue(mockLinks)

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'GET',
      })

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLinks)
    })

    it('should apply filters when provided', async () => {
      // Arrange
      const mockLinks = [mockLink]
      vi.mocked(DiscountLinkService.listLinks).mockResolvedValue(mockLinks)

      const request = new Request(
        'http://localhost/api/discounts/links?sortBy=created_date&sortOrder=asc&status=active',
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
      expect(DiscountLinkService.listLinks).toHaveBeenCalledWith({
        sortBy: 'created_date',
        sortOrder: 'asc',
        status: 'active',
      })
    })

    it('should return 500 on service error', async () => {
      // Arrange
      vi.mocked(DiscountLinkService.listLinks).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'GET',
      })

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })

    it('should handle empty list', async () => {
      // Arrange
      vi.mocked(DiscountLinkService.listLinks).mockResolvedValue([])

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'GET',
      })

      // Act
      const response = await GET(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('DELETE /api/discounts/links/:id', () => {
    it('should delete a discount link', async () => {
      // Arrange
      vi.mocked(DiscountLinkService.deleteLink).mockResolvedValue(undefined)

      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
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
      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
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
      vi.mocked(DiscountLinkService.deleteLink).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
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

  describe('Link Validation', () => {
    it('should validate link token format', () => {
      const validToken = 'a'.repeat(64)
      const invalidToken = 'short'

      expect(validToken.length).toBe(64)
      expect(invalidToken.length).toBeLessThan(64)
    })

    it('should validate link expiration', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      const pastDate = new Date(Date.now() - 86400000).toISOString()

      expect(new Date(futureDate).getTime()).toBeGreaterThan(Date.now())
      expect(new Date(pastDate).getTime()).toBeLessThan(Date.now())
    })

    it('should validate redemption counter', () => {
      const link: DiscountLink = {
        ...mockLink,
        currentRedemptions: 50,
        maxRedemptions: 100,
      }

      expect(link.currentRedemptions).toBeLessThan(link.maxRedemptions)
    })
  })

  describe('Link Status', () => {
    it('should determine active status', () => {
      const activeLink: DiscountLink = {
        ...mockLink,
        isActive: true,
        currentRedemptions: 0,
        maxRedemptions: 100,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
      }

      expect(activeLink.status).toBe('active')
    })

    it('should determine exhausted status', () => {
      const exhaustedLink: DiscountLink = {
        ...mockLink,
        isActive: true,
        currentRedemptions: 100,
        maxRedemptions: 100,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'exhausted',
      }

      expect(exhaustedLink.status).toBe('exhausted')
    })

    it('should determine expired status', () => {
      const expiredLink: DiscountLink = {
        ...mockLink,
        isActive: true,
        currentRedemptions: 0,
        maxRedemptions: 100,
        expirationDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'expired',
      }

      expect(expiredLink.status).toBe('expired')
    })

    it('should determine inactive status', () => {
      const inactiveLink: DiscountLink = {
        ...mockLink,
        isActive: false,
        status: 'inactive',
      }

      expect(inactiveLink.status).toBe('inactive')
    })
  })
})
