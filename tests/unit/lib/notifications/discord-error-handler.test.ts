import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyDiscord, notifyDiscordOnError } from '@/lib/notifications/discord'

// Mock fetch
global.fetch = vi.fn()

describe('Discord Error Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DISCORD_ERROR_WEBHOOK_URL = 'https://discord.com/api/webhooks/test'
  })

  describe('notifyDiscord', () => {
    it('should send error notification', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })

      const result = await notifyDiscord({
        level: 'error',
        title: 'Payment Failed',
        message: 'Mercado Pago returned 401',
        context: { userId: 'user-123', amount: 9.90 }
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should include stack trace in notification', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })

      const stackTrace = 'Error: Something failed\n  at function() line 123'
      await notifyDiscord({
        level: 'error',
        title: 'Error',
        message: 'Test error',
        stackTrace
      })

      const call = (global.fetch as any).mock.calls[0]
      const payload = JSON.parse(call[1].body)
      expect(payload.embeds[0].description).toContain('Stack Trace')
    })

    it('should handle missing webhook URL', async () => {
      delete process.env.DISCORD_ERROR_WEBHOOK_URL
      process.env.DISCORD_WEBHOOK_URL = undefined

      const result = await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(false)
    })

    it('should handle fetch errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(false)
    })

    it('should handle non-ok responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      })

      const result = await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(false)
    })
  })

  describe('notifyDiscordOnError', () => {
    it('should succeed on first attempt', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })

      const result = await notifyDiscordOnError({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => ''
        })

      const result = await notifyDiscordOnError({
        level: 'error',
        title: 'Test',
        message: 'Test'
      }, 2)

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error'
      })

      const result = await notifyDiscordOnError({
        level: 'error',
        title: 'Test',
        message: 'Test'
      }, 1)

      expect(result).toBe(false)
      expect(global.fetch).toHaveBeenCalledTimes(2)  // Initial + 1 retry
    })

    it('should use exponential backoff for retries', async () => {
      vi.useFakeTimers()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => ''
        })

      const promise = notifyDiscordOnError({
        level: 'error',
        title: 'Test',
        message: 'Test'
      }, 1)

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toBe(true)

      vi.useRealTimers()
    })

    it('should handle network errors with retry', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => ''
        })

      const result = await notifyDiscordOnError({
        level: 'error',
        title: 'Test',
        message: 'Test'
      }, 1)

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Property 2: Error Notification on Validation Failure', () => {
    it('should send Discord notification on validation error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })

      const result = await notifyDiscord({
        level: 'error',
        title: 'Validation Failed',
        message: 'Invalid UUID format',
        context: { userId: 'invalid-uuid', field: 'userId' }
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalled()

      const call = (global.fetch as any).mock.calls[0]
      const payload = JSON.parse(call[1].body)
      expect(payload.embeds[0].title).toContain('❌')
    })

    it('should include error details in notification', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })

      await notifyDiscord({
        level: 'error',
        title: 'Validation Failed',
        message: 'Missing required field',
        context: { field: 'subscriptionId', reason: 'Field is required' }
      })

      const call = (global.fetch as any).mock.calls[0]
      const payload = JSON.parse(call[1].body)
      expect(payload.embeds[0].description).toContain('Contexto')
    })
  })

  describe('Property 7: Graceful Discord Notification Failure', () => {
    it('should not throw error when Discord fails', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Discord down'))

      const result = await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(false)
      // Should not throw
    })

    it('should continue processing even if notification fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Error'
      })

      const result = await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(result).toBe(false)
      // Should return false but not throw
    })

    it('should log failure but continue', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await notifyDiscord({
        level: 'error',
        title: 'Test',
        message: 'Test'
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
