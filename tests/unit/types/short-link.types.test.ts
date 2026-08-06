import { describe, it, expect } from 'vitest'
import type { ShortLink } from '@/types/short-link.types'

describe('ShortLink Types', () => {
  describe('ShortLink', () => {
    it('should have all required properties', () => {
      const link: ShortLink = {
        id: 'link-id',
        token: 'a1b2c3d4',
        originalUrl: 'https://example.com/pagina-longa',
        clicks: 0,
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: true,
      }

      expect(link.id).toBeDefined()
      expect(link.token).toBeDefined()
      expect(link.originalUrl).toBeDefined()
      expect(link.clicks).toBe(0)
      expect(link.createdBy).toBeDefined()
      expect(link.isActive).toBe(true)
    })

    it('should allow optional description and deletedAt', () => {
      const link: ShortLink = {
        id: 'link-id',
        token: 'x9y8z7w6',
        originalUrl: 'https://discord.gg/waveigl',
        description: 'Servidor do Discord',
        clicks: 10,
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: false,
        deletedAt: new Date().toISOString(),
      }

      expect(link.description).toBe('Servidor do Discord')
      expect(link.deletedAt).toBeDefined()
    })

    it('should track click counts as numbers', () => {
      const link: ShortLink = {
        id: 'link-id',
        token: 'a1b2c3d4',
        originalUrl: 'https://example.com',
        clicks: 42,
        createdBy: 'admin-123',
        createdAt: new Date().toISOString(),
        isActive: true,
      }

      expect(typeof link.clicks).toBe('number')
      expect(link.clicks).toBeGreaterThanOrEqual(0)
    })
  })
})
