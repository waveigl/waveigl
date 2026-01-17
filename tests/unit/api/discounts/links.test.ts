/**
 * Unit Tests for Discount Links API Endpoints
 */

import { describe, it, expect, vi } from 'vitest'
import { POST, GET, DELETE } from '@/app/api/discounts/links/route'
import type { DiscountLink } from '@/types/discount.types'

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
    token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    discountPrice: 5.0,
    maxRedemptions: 10,
    currentRedemptions: 0,
    expirationDate: '2025-12-31T23:59:59Z',
    createdBy: 'admin-1',
    createdAt: '2025-01-01T10:00:00Z',
    isActive: true,
    status: 'active',
  }

  describe('POST /api/discounts/links', () => {
    it('should generate a discount link', async () => {
      vi.mocked(DiscountLinkService.generateLink).mockResolvedValue(mockLink)

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          maxRedemptions: 10,
          expirationDate: '2025-12-31T23:59:59Z',
          createdBy: 'admin-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLink)
    })

    it('should return 400 if required fields missing', async () => {
      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          // Missing other fields
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(DiscountLinkService.generateLink).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'POST',
        body: JSON.stringify({
          discountPrice: 5.0,
          maxRedemptions: 10,
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

  describe('GET /api/discounts/links', () => {
    it('should list all discount links', async () => {
      vi.mocked(DiscountLinkService.listLinks).mockResolvedValue([mockLink])

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'GET',
      })

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([mockLink])
    })

    it('should apply filters', async () => {
      vi.mocked(DiscountLinkService.listLinks).mockResolvedValue([mockLink])

      const request = new Request(
        'http://localhost/api/discounts/links?sortBy=created_date&sortOrder=asc',
        { method: 'GET' }
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 500 on service error', async () => {
      vi.mocked(DiscountLinkService.listLinks).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/links', {
        method: 'GET',
      })

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DB error')
    })
  })

  describe('DELETE /api/discounts/links/:id', () => {
    it('should delete a discount link', async () => {
      vi.mocked(DiscountLinkService.deleteLink).mockResolvedValue(undefined)

      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
          deletedBy: 'admin-1',
        }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 if required fields missing', async () => {
      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
          // Missing deletedBy
        }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 500 on service error', async () => {
      vi.mocked(DiscountLinkService.deleteLink).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/discounts/links/link-1', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 'link-1',
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
