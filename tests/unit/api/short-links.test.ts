/**
 * Unit Tests for Short Links API Endpoints
 * Tests link creation, listing, deletion, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET, DELETE } from '@/app/api/short-links/route'
import type { ShortLink } from '@/types/short-link.types'

// Mock services
vi.mock('@/lib/short-links/short-link.service', () => ({
  ShortLinkService: {
    createLink: vi.fn(),
    listLinks: vi.fn(),
    deleteLink: vi.fn(),
  },
}))

vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn(),
}))

import { ShortLinkService } from '@/lib/short-links/short-link.service'

describe('Short Links API Endpoints', () => {
  const mockLink: ShortLink = {
    id: 'link-1',
    token: 'a1b2c3d4',
    originalUrl: 'https://example.com/pagina-longa',
    description: 'Link de teste',
    clicks: 0,
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    isActive: true,
    deletedAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/short-links', () => {
    it('should create a short link', async () => {
      vi.mocked(ShortLinkService.createLink).mockResolvedValue(mockLink)

      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/pagina-longa',
          description: 'Link de teste',
          createdBy: 'admin-1',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLink)
      expect(ShortLinkService.createLink).toHaveBeenCalledWith({
        originalUrl: 'https://example.com/pagina-longa',
        description: 'Link de teste',
        createdBy: 'admin-1',
      })
    })

    it('should return 400 if originalUrl is missing', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.createLink).not.toHaveBeenCalled()
    })

    it('should return 400 if originalUrl is not a valid http(s) URL', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'not-a-url', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.createLink).not.toHaveBeenCalled()
    })

    it('should return 400 if originalUrl has invalid protocol', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'ftp://example.com/file', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 500 if service throws', async () => {
      vi.mocked(ShortLinkService.createLink).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://example.com', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/short-links', () => {
    it('should list short links', async () => {
      vi.mocked(ShortLinkService.listLinks).mockResolvedValue([mockLink])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([mockLink])
    })

    it('should return 500 if service throws', async () => {
      vi.mocked(ShortLinkService.listLinks).mockRejectedValue(new Error('DB error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/short-links', () => {
    it('should delete a short link', async () => {
      vi.mocked(ShortLinkService.deleteLink).mockResolvedValue(undefined)

      const request = new Request('http://localhost/api/short-links', {
        method: 'DELETE',
        body: JSON.stringify({ id: 'link-1', deletedBy: 'admin-1' }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(ShortLinkService.deleteLink).toHaveBeenCalledWith('link-1', 'admin-1')
    })

    it('should return 400 if id is missing', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'DELETE',
        body: JSON.stringify({ deletedBy: 'admin-1' }),
      })

      const response = await DELETE(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.deleteLink).not.toHaveBeenCalled()
    })
  })
})
