/**
 * ValidationService Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { ValidationService } from '@/lib/twitch/validation.service'

describe('ValidationService', () => {
  const validator = new ValidationService()

  describe('validateSubscriberData', () => {
    it('should validate correct subscriber data', () => {
      const validData = {
        user_id: '123456',
        user_login: 'testuser',
        user_name: 'TestUser',
        tier: '1000',
        is_gift: false,
        created_at: '2024-01-13T10:00:00Z',
      }

      const result = validator.validateSubscriberData(validData)
      expect(result.user_id).toBe('123456')
      expect(result.user_login).toBe('testuser')
    })

    it('should throw error for missing user_id', () => {
      const invalidData = {
        user_login: 'testuser',
        user_name: 'TestUser',
        tier: '1000',
        created_at: '2024-01-13T10:00:00Z',
      }

      expect(() => validator.validateSubscriberData(invalidData)).toThrow(
        'missing or invalid user_id'
      )
    })

    it('should throw error for invalid tier', () => {
      const invalidData = {
        user_id: '123456',
        user_login: 'testuser',
        user_name: 'TestUser',
        tier: '5000',
        created_at: '2024-01-13T10:00:00Z',
      }

      expect(() => validator.validateSubscriberData(invalidData)).toThrow(
        'invalid tier'
      )
    })

    it('should throw error for invalid date format', () => {
      const invalidData = {
        user_id: '123456',
        user_login: 'testuser',
        user_name: 'TestUser',
        tier: '1000',
        created_at: 'invalid-date',
      }

      expect(() => validator.validateSubscriberData(invalidData)).toThrow()
    })
  })

  describe('validateMessage', () => {
    it('should validate correct message', () => {
      const message = 'Hello, this is a test message'
      expect(() => validator.validateMessage(message)).not.toThrow()
    })

    it('should throw error for empty message', () => {
      expect(() => validator.validateMessage('')).toThrow()
    })

    it('should throw error for message exceeding max length', () => {
      const longMessage = 'a'.repeat(501)
      expect(() => validator.validateMessage(longMessage)).toThrow(
        'exceeds maximum length'
      )
    })

    it('should throw error for non-string message', () => {
      expect(() => validator.validateMessage(null as unknown as string)).toThrow(
        'must be a non-empty string'
      )
    })

    it('should accept message at max length', () => {
      const maxMessage = 'a'.repeat(500)
      expect(() => validator.validateMessage(maxMessage)).not.toThrow()
    })
  })

  describe('validateContactStatusFilter', () => {
    it('should validate correct contact status', () => {
      const result = validator.validateContactStatusFilter('sent')
      expect(result).toBe('sent')
    })

    it('should validate all valid statuses', () => {
      const validStatuses = ['sent', 'not_sent', 'failed', 'blocked', 'banned']
      validStatuses.forEach((status) => {
        expect(() => validator.validateContactStatusFilter(status)).not.toThrow()
      })
    })

    it('should throw error for invalid status', () => {
      expect(() => validator.validateContactStatusFilter('invalid')).toThrow(
        'Invalid contact status'
      )
    })

    it('should throw error for non-string status', () => {
      expect(() => validator.validateContactStatusFilter(123 as unknown as string)).toThrow(
        'must be a string'
      )
    })
  })

  describe('validatePaginationParams', () => {
    it('should validate correct pagination params', () => {
      expect(() => validator.validatePaginationParams(1, 50)).not.toThrow()
    })

    it('should throw error for page < 1', () => {
      expect(() => validator.validatePaginationParams(0, 50)).toThrow(
        'positive integer'
      )
    })

    it('should throw error for limit > 100', () => {
      expect(() => validator.validatePaginationParams(1, 101)).toThrow(
        'between 1 and 100'
      )
    })

    it('should throw error for non-integer page', () => {
      expect(() => validator.validatePaginationParams(1.5, 50)).toThrow(
        'positive integer'
      )
    })

    it('should throw error for non-integer limit', () => {
      expect(() => validator.validatePaginationParams(1, 50.5)).toThrow(
        'integer between 1 and 100'
      )
    })
  })

  describe('validateChannelId', () => {
    it('should validate correct channel ID', () => {
      const result = validator.validateChannelId('123456')
      expect(result).toBe('123456')
    })

    it('should throw error for empty channel ID', () => {
      expect(() => validator.validateChannelId('')).toThrow()
    })

    it('should throw error for non-string channel ID', () => {
      expect(() => validator.validateChannelId(123 as unknown as string)).toThrow(
        'must be a non-empty string'
      )
    })

    it('should trim whitespace', () => {
      const result = validator.validateChannelId('  123456  ')
      expect(result).toBe('123456')
    })
  })

  describe('validateAccessToken', () => {
    it('should validate correct access token', () => {
      const result = validator.validateAccessToken('token123')
      expect(result).toBe('token123')
    })

    it('should throw error for empty token', () => {
      expect(() => validator.validateAccessToken('')).toThrow()
    })

    it('should throw error for non-string token', () => {
      expect(() => validator.validateAccessToken(123 as unknown as string)).toThrow(
        'must be a non-empty string'
      )
    })
  })

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      const input = "test'; DROP TABLE users; --"
      const result = validator.sanitizeString(input)
      expect(result).not.toContain("'")
      expect(result).not.toContain(';')
    })

    it('should trim whitespace', () => {
      const result = validator.sanitizeString('  test  ')
      expect(result).toBe('test')
    })

    it('should handle empty string', () => {
      const result = validator.sanitizeString('')
      expect(result).toBe('')
    })
  })
})
