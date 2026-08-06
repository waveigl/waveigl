/**
 * Unit Tests for Short Links API Endpoints
 * Tests link creation, editing, listing, deletion, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET, PATCH, DELETE } from '@/app/api/short-links/route'
import type { ShortLink } from '@/types/short-link.types'

// Mock services
vi.mock('@/lib/short-links/short-link.service', () => ({
  ShortLinkService: {
    createLink: vi.fn(),
    listLinks: vi.fn(),
    updateLink: vi.fn(),
    deleteLink: vi.fn(),
  },
  SHORT_LINK_DUPLICATE_URL: 'SHORT_LINK_DUPLICATE_URL',
  SHORT_LINK_DUPLICATE_TOKEN: 'SHORT_LINK_DUPLICATE_TOKEN',
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

    it('should create a short link with a custom token', async () => {
      const customLink: ShortLink = { ...mockLink, token: 'hltv-waveigl' }
      vi.mocked(ShortLinkService.createLink).mockResolvedValue(customLink)

      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/pagina-longa',
          description: 'Link de teste',
          createdBy: 'admin-1',
          token: 'hltv-waveigl',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(customLink)
      expect(ShortLinkService.createLink).toHaveBeenCalledWith({
        originalUrl: 'https://example.com/pagina-longa',
        description: 'Link de teste',
        createdBy: 'admin-1',
        token: 'hltv-waveigl',
      })
    })

    it('should return 400 if custom token has invalid characters', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://example.com', token: 'ola mundo', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.createLink).not.toHaveBeenCalled()
    })

    it('should return 409 if custom token already exists', async () => {
      const error = new Error('Já existe outro link curto usando esse código') as any
      error.code = 'SHORT_LINK_DUPLICATE_TOKEN'
      vi.mocked(ShortLinkService.createLink).mockRejectedValue(error)

      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://example.com', token: 'hltv-waveigl', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
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

    it('should return 400 if originalUrl contains whitespace', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://example.com /pagina', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.createLink).not.toHaveBeenCalled()
    })

    it('should return 400 if originalUrl points to the site itself', async () => {
      const request = new Request('https://www.waveigl.com/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://waveigl.com/links', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.createLink).not.toHaveBeenCalled()
    })

    it('should return 409 if originalUrl already exists', async () => {
      const error = new Error('Já existe outro link curto apontando para essa URL') as any
      error.code = 'SHORT_LINK_DUPLICATE_URL'
      vi.mocked(ShortLinkService.createLink).mockRejectedValue(error)

      const request = new Request('http://localhost/api/short-links', {
        method: 'POST',
        body: JSON.stringify({ originalUrl: 'https://example.com', createdBy: 'admin-1' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
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

  describe('PATCH /api/short-links', () => {
    it('should update the short link token and description', async () => {
      const updatedLink: ShortLink = { ...mockLink, token: 'hltv-waveigl', description: 'Novo link', updatedBy: 'admin-1' }
      vi.mocked(ShortLinkService.updateLink).mockResolvedValue(updatedLink)

      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv-waveigl', description: 'Novo link', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedLink)
      expect(ShortLinkService.updateLink).toHaveBeenCalledWith('link-1', {
        token: 'hltv-waveigl',
        description: 'Novo link',
        updatedBy: 'admin-1',
      })
    })

    it('should allow editing only the description', async () => {
      vi.mocked(ShortLinkService.updateLink).mockResolvedValue(mockLink)

      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', description: 'Descrição nova', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(ShortLinkService.updateLink).toHaveBeenCalledWith('link-1', {
        token: undefined,
        description: 'Descrição nova',
        updatedBy: 'admin-1',
      })
    })

    it('should return 400 if id is missing', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ token: 'hltv-waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.updateLink).not.toHaveBeenCalled()
    })

    it('should return 400 if token contains whitespace', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.updateLink).not.toHaveBeenCalled()
    })

    it('should return 400 if token has invalid characters', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv/waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.updateLink).not.toHaveBeenCalled()
    })

    it('should return 400 if token is too short', async () => {
      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'ab', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(ShortLinkService.updateLink).not.toHaveBeenCalled()
    })

    it('should return 409 if token already exists on another link', async () => {
      const error = new Error('Já existe outro link curto usando esse código') as any
      error.code = 'SHORT_LINK_DUPLICATE_TOKEN'
      vi.mocked(ShortLinkService.updateLink).mockRejectedValue(error)

      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv-waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
    })

    it('should return 409 with friendly message on raw Postgres unique violation', async () => {
      const error = new Error('duplicate key value violates unique constraint') as any
      error.code = '23505'
      vi.mocked(ShortLinkService.updateLink).mockRejectedValue(error)

      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv-waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Já existe outro link ativo usando esse código')
    })

    it('should return 500 if service throws', async () => {
      vi.mocked(ShortLinkService.updateLink).mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/short-links', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'link-1', token: 'hltv-waveigl', updatedBy: 'admin-1' }),
      })

      const response = await PATCH(request as any)
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
