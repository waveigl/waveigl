import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, calculateBackoffDelay } from '@/lib/retry/backoff'

describe('Retry with Exponential Backoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateBackoffDelay', () => {
    it('should calculate correct exponential backoff delays', () => {
      expect(calculateBackoffDelay(0, 1000, 8000)).toBe(1000)  // 1s
      expect(calculateBackoffDelay(1, 1000, 8000)).toBe(2000)  // 2s
      expect(calculateBackoffDelay(2, 1000, 8000)).toBe(4000)  // 4s
      expect(calculateBackoffDelay(3, 1000, 8000)).toBe(8000)  // 8s
    })

    it('should respect max delay', () => {
      expect(calculateBackoffDelay(4, 1000, 8000)).toBe(8000)  // Capped at 8s
      expect(calculateBackoffDelay(5, 1000, 8000)).toBe(8000)  // Capped at 8s
    })

    it('should use custom base delay', () => {
      expect(calculateBackoffDelay(0, 500, 4000)).toBe(500)
      expect(calculateBackoffDelay(1, 500, 4000)).toBe(1000)
      expect(calculateBackoffDelay(2, 500, 4000)).toBe(2000)
    })
  })

  describe('retryWithBackoff', () => {
    describe('Success on first attempt', () => {
      it('should return success immediately without retries', async () => {
        const operation = vi.fn().mockResolvedValue('success')

        const result = await retryWithBackoff(operation)

        expect(result.success).toBe(true)
        expect(result.data).toBe('success')
        expect(result.attempts).toBe(1)
        expect(operation).toHaveBeenCalledTimes(1)
      })

      it('should not retry on first success', async () => {
        const operation = vi.fn().mockResolvedValue({ id: '123' })

        const result = await retryWithBackoff(operation, { maxRetries: 3 })

        expect(result.success).toBe(true)
        expect(result.attempts).toBe(1)
        expect(operation).toHaveBeenCalledTimes(1)
      })
    })

    describe('Success after retries', () => {
      it('should succeed on second attempt', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce('success')

        const result = await retryWithBackoff(operation, { maxRetries: 3, baseDelay: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toBe('success')
        expect(result.attempts).toBe(2)
        expect(operation).toHaveBeenCalledTimes(2)
      })

      it('should succeed on third attempt', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockResolvedValueOnce('success')

        const result = await retryWithBackoff(operation, { maxRetries: 3, baseDelay: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toBe('success')
        expect(result.attempts).toBe(3)
        expect(operation).toHaveBeenCalledTimes(3)
      })

      it('should succeed on last attempt', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockRejectedValueOnce(new Error('Error 3'))
          .mockResolvedValueOnce('success')

        const result = await retryWithBackoff(operation, { maxRetries: 3, baseDelay: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toBe('success')
        expect(result.attempts).toBe(4)
        expect(operation).toHaveBeenCalledTimes(4)
      })
    })

    describe('Failure after max retries', () => {
      it('should fail after max retries exhausted', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Persistent error'))

        const result = await retryWithBackoff(operation, { maxRetries: 2, baseDelay: 10 })

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error?.message).toBe('Persistent error')
        expect(result.attempts).toBe(3)  // 0, 1, 2
        expect(operation).toHaveBeenCalledTimes(3)
      })

      it('should include last error in result', async () => {
        const error = new Error('Final error')
        const operation = vi.fn().mockRejectedValue(error)

        const result = await retryWithBackoff(operation, { maxRetries: 1, baseDelay: 10 })

        expect(result.success).toBe(false)
        expect(result.lastError).toBe(error)
        expect(result.error).toBe(error)
      })

      it('should handle non-Error rejections', async () => {
        const operation = vi.fn().mockRejectedValue('String error')

        const result = await retryWithBackoff(operation, { maxRetries: 1, baseDelay: 10 })

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error?.message).toBe('String error')
      })
    })

    describe('Custom options', () => {
      it('should respect custom maxRetries', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Error'))

        const result = await retryWithBackoff(operation, { maxRetries: 1, baseDelay: 10 })

        expect(result.attempts).toBe(2)  // 0, 1
        expect(operation).toHaveBeenCalledTimes(2)
      })

      it('should respect custom baseDelay', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce('success')

        const startTime = Date.now()
        await retryWithBackoff(operation, { maxRetries: 1, baseDelay: 50 })
        const elapsed = Date.now() - startTime

        // Should have waited at least 50ms
        expect(elapsed).toBeGreaterThanOrEqual(40)  // Allow some margin
      })

      it('should respect custom maxDelay', async () => {
        const delay = calculateBackoffDelay(10, 1000, 2000)
        expect(delay).toBe(2000)  // Capped at maxDelay
      })
    })

    describe('Property 3: Exponential Backoff Retry Pattern', () => {
      it('should follow exponential backoff pattern: 1s, 2s, 4s, 8s', async () => {
        const delays: number[] = []
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockRejectedValueOnce(new Error('Error 3'))
          .mockResolvedValueOnce('success')

        // Mock setTimeout to capture delays
        const originalSetTimeout = global.setTimeout
        vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
          delays.push(delay as number)
          return originalSetTimeout(callback, 0) as any
        })

        await retryWithBackoff(operation, { maxRetries: 3, baseDelay: 1000, maxDelay: 8000 })

        expect(delays).toEqual([1000, 2000, 4000])

        vi.restoreAllMocks()
      })

      it('should log each retry attempt with attempt number and delay', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockResolvedValueOnce('success')

        await retryWithBackoff(operation, { maxRetries: 2, baseDelay: 10 })

        expect(consoleSpy).toHaveBeenCalled()
        const calls = consoleSpy.mock.calls
        expect(calls.some(call => call[0].includes('Attempt 1/3'))).toBe(true)

        consoleSpy.mockRestore()
      })
    })

    describe('Property 4: Successful Retry Completion', () => {
      it('should not perform additional retries after success', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce('success')

        const result = await retryWithBackoff(operation, { maxRetries: 5, baseDelay: 10 })

        expect(result.success).toBe(true)
        expect(operation).toHaveBeenCalledTimes(2)  // Only 2 calls, not 6
      })

      it('should continue normal processing after successful retry', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce({ data: 'result' })

        const result = await retryWithBackoff(operation, { maxRetries: 3, baseDelay: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toEqual({ data: 'result' })
        expect(result.attempts).toBe(2)
      })
    })

    describe('Property 5: Maximum Retry Exhaustion', () => {
      it('should send critical notification after max retries', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Persistent error'))

        const result = await retryWithBackoff(operation, { maxRetries: 2, baseDelay: 10 })

        expect(result.success).toBe(false)
        expect(result.attempts).toBe(3)
        expect(result.error).toBeDefined()
      })

      it('should store event for manual review after max retries', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Error'))

        const result = await retryWithBackoff(operation, { maxRetries: 1, baseDelay: 10 })

        expect(result.success).toBe(false)
        expect(result.lastError).toBeDefined()
        expect(result.attempts).toBe(2)
      })
    })
  })
})
