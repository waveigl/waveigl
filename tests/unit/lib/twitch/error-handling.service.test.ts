/**
 * ErrorHandlingService Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandlingService } from '@/lib/twitch/error-handling.service'

// Mock the Discord notification service
vi.mock('@/lib/notifications/discord', () => ({
  notifyDiscord: vi.fn().mockResolvedValue(undefined),
}))

describe('ErrorHandlingService', () => {
  let errorHandler: ErrorHandlingService

  beforeEach(() => {
    errorHandler = new ErrorHandlingService()
    vi.clearAllMocks()
  })

  describe('isRetryableError', () => {
    it('should return true for retryable error codes', () => {
      const retryableCodes = [408, 429, 500, 502, 503, 504]
      retryableCodes.forEach((code) => {
        expect(errorHandler.isRetryableError(code)).toBe(true)
      })
    })

    it('should return false for non-retryable error codes', () => {
      const nonRetryableCodes = [400, 401, 403, 404]
      nonRetryableCodes.forEach((code) => {
        expect(errorHandler.isRetryableError(code)).toBe(false)
      })
    })
  })

  describe('isPermanentError', () => {
    it('should return true for permanent error codes', () => {
      const permanentCodes = [400, 401, 403, 404, 405]
      permanentCodes.forEach((code) => {
        expect(errorHandler.isPermanentError(code)).toBe(true)
      })
    })

    it('should return false for transient error codes', () => {
      const transientCodes = [500, 502, 503, 504]
      transientCodes.forEach((code) => {
        expect(errorHandler.isPermanentError(code)).toBe(false)
      })
    })
  })

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay1 = errorHandler.getRetryDelay(1)
      const delay2 = errorHandler.getRetryDelay(2)
      const delay3 = errorHandler.getRetryDelay(3)
      const delay4 = errorHandler.getRetryDelay(4)

      // Base delays should be: 1000, 2000, 4000, 8000 (plus jitter)
      expect(delay1).toBeGreaterThanOrEqual(1000)
      expect(delay1).toBeLessThan(2000)

      expect(delay2).toBeGreaterThanOrEqual(2000)
      expect(delay2).toBeLessThan(3000)

      expect(delay3).toBeGreaterThanOrEqual(4000)
      expect(delay3).toBeLessThan(5000)

      expect(delay4).toBeGreaterThanOrEqual(8000)
      expect(delay4).toBeLessThan(9000)
    })

    it('should use Retry-After header if provided', () => {
      const delay = errorHandler.getRetryDelay(1, 5)
      expect(delay).toBe(5000) // 5 seconds converted to milliseconds
    })

    it('should prioritize Retry-After over exponential backoff', () => {
      const delay = errorHandler.getRetryDelay(4, 2)
      expect(delay).toBe(2000) // Should use Retry-After, not 8000+
    })
  })

  describe('isBlockedError', () => {
    it('should detect blocked whisper errors', () => {
      const blockedMessages = [
        'User has blocked whispers',
        'Cannot send whisper - blocked',
        'Whisper not allowed',
        'Permission denied to send message',
      ]

      blockedMessages.forEach((msg) => {
        expect(errorHandler.isBlockedError(msg)).toBe(true)
      })
    })

    it('should return false for non-blocked errors', () => {
      expect(errorHandler.isBlockedError('User not found')).toBe(false)
      expect(errorHandler.isBlockedError('Rate limit exceeded')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(errorHandler.isBlockedError('USER HAS BLOCKED WHISPERS')).toBe(true)
      expect(errorHandler.isBlockedError('PERMISSION DENIED')).toBe(true)
    })
  })

  describe('isBannedError', () => {
    it('should detect banned user errors', () => {
      const bannedMessages = [
        'User is banned',
        'User suspended from platform',
        'User not found',
        'User does not exist',
      ]

      bannedMessages.forEach((msg) => {
        expect(errorHandler.isBannedError(msg)).toBe(true)
      })
    })

    it('should return false for non-banned errors', () => {
      expect(errorHandler.isBannedError('Rate limit exceeded')).toBe(false)
      expect(errorHandler.isBannedError('Invalid token')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(errorHandler.isBannedError('USER IS BANNED')).toBe(true)
      expect(errorHandler.isBannedError('USER SUSPENDED')).toBe(true)
    })
  })

  describe('logError', () => {
    it('should log error with context', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await errorHandler.logError('error', 'Test Error', 'Test message', {
        userId: 'user-123',
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should include timestamp in log', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await errorHandler.logError('error', 'Test Error', 'Test message', {})

      const callArgs = consoleSpy.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('timestamp')

      consoleSpy.mockRestore()
    })

    it('should include environment in log', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await errorHandler.logError('error', 'Test Error', 'Test message', {})

      const callArgs = consoleSpy.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('environment')

      consoleSpy.mockRestore()
    })
  })
})
