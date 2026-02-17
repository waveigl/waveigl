/**
 * MessageService Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageService } from '@/lib/twitch/message.service'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { platform_username: 'testadmin' } }),
    })),
  })),
}))

// Mock Discord notifications
vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn().mockResolvedValue(undefined),
}))

describe('MessageService', () => {
  let messageService: MessageService

  beforeEach(() => {
    messageService = new MessageService()
    vi.clearAllMocks()
  })

  describe('sendMessagesToUncontacted', () => {
    it('should validate channel ID', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('', 'test message', 'token', 'admin-1')
      ).rejects.toThrow('Channel ID must be a non-empty string')
    })

    it('should validate message content', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', '', 'token', 'admin-1')
      ).rejects.toThrow('Message must be a non-empty string')
    })

    it('should validate access token', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', 'test message', '', 'admin-1')
      ).rejects.toThrow('Access token must be a non-empty string')
    })

    it('should validate admin ID', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', 'test message', 'token', '')
      ).rejects.toThrow('Admin ID must be a non-empty string')
    })

    it('should return empty result when no uncontacted subscribers', async () => {
      const result = await messageService.sendMessagesToUncontacted(
        'channel-1',
        'message',
        'token',
        'admin-1'
      )

      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })
  })

  describe('Message validation', () => {
    it('should reject empty message', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', '', 'token', 'admin-1')
      ).rejects.toThrow('Message must be a non-empty string')
    })

    it('should reject message exceeding max length', async () => {
      const longMessage = 'a'.repeat(501)
      await expect(
        messageService.sendMessagesToUncontacted(
          'channel-1',
          longMessage,
          'token',
          'admin-1'
        )
      ).rejects.toThrow('Message exceeds maximum length of 500 characters')
    })

    it('should accept valid message', async () => {
      const validMessage = 'Hello, this is a test message'
      const result = await messageService.sendMessagesToUncontacted(
        'channel-1',
        validMessage,
        'token',
        'admin-1'
      )
      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })

    it('should accept message at minimum length', async () => {
      const result = await messageService.sendMessagesToUncontacted(
        'channel-1',
        'a',
        'token',
        'admin-1'
      )
      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })

    it('should accept message at maximum length', async () => {
      const maxMessage = 'a'.repeat(500)
      const result = await messageService.sendMessagesToUncontacted(
        'channel-1',
        maxMessage,
        'token',
        'admin-1'
      )
      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })
  })

  describe('Input validation', () => {
    it('should validate channel ID format', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('', 'message', 'token', 'admin-1')
      ).rejects.toThrow('Channel ID must be a non-empty string')
    })

    it('should validate access token format', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', 'message', '', 'admin-1')
      ).rejects.toThrow('Access token must be a non-empty string')
    })

    it('should validate admin ID format', async () => {
      await expect(
        messageService.sendMessagesToUncontacted('channel-1', 'message', 'token', '')
      ).rejects.toThrow('Admin ID must be a non-empty string')
    })

    it('should trim whitespace from inputs', async () => {
      const result = await messageService.sendMessagesToUncontacted(
        '  channel-1  ',
        'message',
        'token',
        'admin-1'
      )
      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })
  })

  describe('Sequential processing', () => {
    it('should process messages sequentially with no subscribers', async () => {
      const result = await messageService.sendMessagesToUncontacted(
        'channel-1',
        'message',
        'token',
        'admin-1'
      )

      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
        errors: [],
      })
    })
  })
})
