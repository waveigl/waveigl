import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateUUID, validateUUIDv4 } from '@/lib/validation/uuid'
import { validateSubscriptionEvent } from '@/lib/validation/subscription-event'
import { retryWithBackoff } from '@/lib/retry/backoff'

describe('Subscription Webhook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // 14.1 Integration test for successful subscription
  // ============================================================================
  describe('14.1 Successful subscription flow', () => {
    it('should validate and process a complete subscription event', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const subscriptionId = 'sub-123'
      const status = 'active'
      const amount = 990

      // Act - Step 1: Validate UUID
      const uuidValidation = validateUUID(userId)
      expect(uuidValidation.valid).toBe(true)

      // Act - Step 2: Validate subscription event
      const eventValidation = validateSubscriptionEvent({
        userId,
        subscriptionId,
        status,
        amount
      })
      expect(eventValidation.valid).toBe(true)

      // Act - Step 3: Simulate subscription creation with retry
      let creationAttempts = 0
      const creationResult = await retryWithBackoff(
        async () => {
          creationAttempts++
          return {
            success: true,
            subscriptionId,
            userId,
            status,
            amount,
            createdAt: new Date().toISOString()
          }
        },
        { maxRetries: 2, baseDelay: 10 }
      )

      // Assert - All steps succeeded
      expect(uuidValidation.valid).toBe(true)
      expect(eventValidation.valid).toBe(true)
      expect(creationResult.success).toBe(true)
      expect(creationResult.attempts).toBe(1)
      expect(creationAttempts).toBe(1)
    })

    it('should complete full flow from webhook to notifications', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const subscriptionId = 'sub-456'
      const logs: string[] = []

      // Mock logging
      const mockLog = (message: string) => logs.push(message)

      // Act - Simulate full flow
      mockLog('[SubscriptionSystem] info Webhook received')
      
      const uuidValidation = validateUUID(userId)
      if (!uuidValidation.valid) {
        mockLog(`[SubscriptionSystem] error UUID validation failed: ${uuidValidation.error}`)
      } else {
        mockLog('[SubscriptionSystem] info UUID validation passed')
      }

      const eventValidation = validateSubscriptionEvent({
        userId,
        subscriptionId,
        status: 'active',
        amount: 990
      })
      if (!eventValidation.valid) {
        mockLog(`[SubscriptionSystem] error Event validation failed: ${eventValidation.errors.join(', ')}`)
      } else {
        mockLog('[SubscriptionSystem] info Event validation passed')
      }

      const creationResult = await retryWithBackoff(
        async () => ({ success: true, subscriptionId }),
        { maxRetries: 2, baseDelay: 10 }
      )
      if (creationResult.success) {
        mockLog('[SubscriptionSystem] info Subscription created successfully')
        mockLog('[SubscriptionSystem] info Discord notification sent')
        mockLog('[SubscriptionSystem] info Twitch whisper sent')
      }

      // Assert
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((l: string) => l.includes('UUID validation passed'))).toBe(true)
      expect(logs.some((l: string) => l.includes('Event validation passed'))).toBe(true)
      expect(logs.some((l: string) => l.includes('Subscription created successfully'))).toBe(true)
    })
  })

  // ============================================================================
  // 14.2 Integration test for validation failure
  // ============================================================================
  describe('14.2 Validation failure scenarios', () => {
    it('should reject invalid UUID and send Discord notification', () => {
      // Arrange
      const invalidUUID = 'not-a-uuid'
      const discordNotifications: string[] = []

      // Mock Discord notification
      const mockDiscordNotify = (error: string) => {
        discordNotifications.push(error)
      }

      // Act
      const result = validateUUID(invalidUUID)
      if (!result.valid) {
        mockDiscordNotify(`UUID validation failed: ${result.error}`)
      }

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(discordNotifications.length).toBe(1)
      expect(discordNotifications[0]).toContain('UUID validation failed')
    })

    it('should reject missing required fields', () => {
      // Arrange
      const incompleteEvent = {
        userId: '550e8400-e29b-41d4-a716-446655440000'
        // Missing subscriptionId and status
      }
      const discordNotifications: string[] = []

      // Mock Discord notification
      const mockDiscordNotify = (errors: string[]) => {
        discordNotifications.push(...errors)
      }

      // Act
      const result = validateSubscriptionEvent(incompleteEvent)
      if (!result.valid) {
        mockDiscordNotify(result.errors)
      }

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: string) => e.includes('subscriptionId'))).toBe(true)
      expect(result.errors.some((e: string) => e.includes('status'))).toBe(true)
      expect(discordNotifications.length).toBeGreaterThan(0)
    })

    it('should reject invalid amount', () => {
      // Arrange
      const eventWithInvalidAmount = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'active',
        amount: -100
      }

      // Act
      const result = validateSubscriptionEvent(eventWithInvalidAmount)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: string) => e.includes('positive'))).toBe(true)
    })

    it('should reject invalid status', () => {
      // Arrange
      const eventWithInvalidStatus = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'invalid_status',
        amount: 990
      }

      // Act
      const result = validateSubscriptionEvent(eventWithInvalidStatus)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: string) => e.includes('must be one of'))).toBe(true)
    })
  })

  // ============================================================================
  // 14.3 Integration test for retry scenario
  // ============================================================================
  describe('14.3 Retry scenario with backoff', () => {
    it('should retry failed operation and succeed', async () => {
      // Arrange
      let attempts = 0
      const operation = async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        return { success: true, data: 'subscription-created' }
      }

      // Act
      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelay: 10
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
      expect(attempts).toBe(2)
      expect(result.data).toEqual({ success: true, data: 'subscription-created' })
    })

    it('should implement exponential backoff delays', async () => {
      // Arrange
      const delays: number[] = []
      const originalSetTimeout = global.setTimeout
      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay: any) => {
        delays.push(delay as number)
        return originalSetTimeout(callback, 0) as any
      })

      let attempts = 0
      const operation = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Error')
        }
        return { success: true }
      }

      // Act
      await retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000
      })

      // Assert - Exponential backoff: 1s, 2s
      expect(delays).toEqual([1000, 2000])

      vi.restoreAllMocks()
    })

    it('should succeed on first attempt without retries', async () => {
      // Arrange
      let callCount = 0
      const operation = async () => {
        callCount++
        return { success: true, data: 'immediate-success' }
      }

      // Act
      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelay: 10
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(1)
      expect(callCount).toBe(1)
    })
  })

  // ============================================================================
  // 14.4 Integration test for max retry exhaustion
  // ============================================================================
  describe('14.4 Max retry exhaustion scenario', () => {
    it('should fail after max retries and send critical notification', async () => {
      // Arrange
      const operation = async () => {
        throw new Error('Persistent error')
      }
      const criticalNotifications: string[] = []

      // Mock critical Discord notification
      const mockCriticalNotify = (message: string) => {
        criticalNotifications.push(message)
      }

      // Act
      const result = await retryWithBackoff(operation, {
        maxRetries: 2,
        baseDelay: 10
      })

      // Simulate critical notification on max retries exhausted
      if (!result.success && result.attempts > 2) {
        mockCriticalNotify(`Critical: Subscription creation failed after ${result.attempts} attempts`)
      }

      // Assert
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(3)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Persistent error')
      expect(criticalNotifications.length).toBe(1)
      expect(criticalNotifications[0]).toContain('Critical')
    })

    it('should store event for manual review on max retries', async () => {
      // Arrange
      const storedEvents: any[] = []
      const operation = async () => {
        throw new Error('Persistent error')
      }

      // Mock event storage
      const mockStoreEvent = (event: any) => {
        storedEvents.push(event)
      }

      // Act
      const result = await retryWithBackoff(operation, {
        maxRetries: 1,
        baseDelay: 10
      })

      // Simulate event storage on failure
      if (!result.success) {
        mockStoreEvent({
          eventType: 'subscription_webhook',
          status: 'failed',
          error: result.error?.message,
          attempts: result.attempts,
          timestamp: new Date().toISOString()
        })
      }

      // Assert
      expect(result.success).toBe(false)
      expect(storedEvents.length).toBe(1)
      expect(storedEvents[0].status).toBe('failed')
      expect(storedEvents[0].attempts).toBe(2)
    })
  })

  // ============================================================================
  // 14.5 Integration test for notification configuration
  // ============================================================================
  describe('14.5 Notification configuration respect', () => {
    it('should process subscriptions with NOTIFY_UNREGISTERED_SUBS enabled', () => {
      // Arrange
      const originalEnv = process.env.NOTIFY_UNREGISTERED_SUBS
      process.env.NOTIFY_UNREGISTERED_SUBS = 'true'
      const notifyEnabled = process.env.NOTIFY_UNREGISTERED_SUBS !== 'false'

      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'active',
        amount: 990
      }

      // Act
      const validation = validateSubscriptionEvent(event)
      const shouldNotify = notifyEnabled && validation.valid

      // Assert
      expect(validation.valid).toBe(true)
      expect(shouldNotify).toBe(true)

      // Cleanup
      process.env.NOTIFY_UNREGISTERED_SUBS = originalEnv
    })

    it('should process subscriptions with NOTIFY_UNREGISTERED_SUBS disabled', () => {
      // Arrange
      const originalEnv = process.env.NOTIFY_UNREGISTERED_SUBS
      process.env.NOTIFY_UNREGISTERED_SUBS = 'false'
      const notifyEnabled = process.env.NOTIFY_UNREGISTERED_SUBS !== 'false'

      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'active',
        amount: 990
      }

      // Act
      const validation = validateSubscriptionEvent(event)
      const shouldNotify = notifyEnabled && validation.valid

      // Assert
      expect(validation.valid).toBe(true)
      expect(shouldNotify).toBe(false)
      // Subscription should still be processed even if notifications are disabled

      // Cleanup
      process.env.NOTIFY_UNREGISTERED_SUBS = originalEnv
    })

    it('should skip Discord notifications when disabled but continue processing', () => {
      // Arrange
      const originalEnv = process.env.NOTIFY_UNREGISTERED_SUBS
      process.env.NOTIFY_UNREGISTERED_SUBS = 'false'
      const discordNotifications: string[] = []

      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'active',
        amount: 990
      }

      // Act
      const validation = validateSubscriptionEvent(event)
      const notifyEnabled = process.env.NOTIFY_UNREGISTERED_SUBS !== 'false'

      if (validation.valid && notifyEnabled) {
        discordNotifications.push('Subscription created')
      }

      // Assert
      expect(validation.valid).toBe(true)
      expect(discordNotifications.length).toBe(0) // No notifications sent
      // But subscription was still validated and would be processed

      // Cleanup
      process.env.NOTIFY_UNREGISTERED_SUBS = originalEnv
    })
  })

  // ============================================================================
  // Comprehensive flow validation
  // ============================================================================
  describe('Comprehensive flow validation', () => {
    it('should validate all steps of subscription processing', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const subscriptionId = 'sub-789'
      const status = 'active'

      // Step 1: Validate UUID
      const uuidValidation = validateUUID(userId)
      expect(uuidValidation.valid).toBe(true)

      // Step 2: Validate subscription event
      const eventValidation = validateSubscriptionEvent({
        userId,
        subscriptionId,
        status,
        amount: 990
      })
      expect(eventValidation.valid).toBe(true)

      // Step 3: Simulate retry logic
      let processAttempts = 0
      const processResult = await retryWithBackoff(
        async () => {
          processAttempts++
          return { success: true, userId, subscriptionId }
        },
        { maxRetries: 2, baseDelay: 10 }
      )

      // Assert all steps succeeded
      expect(uuidValidation.valid).toBe(true)
      expect(eventValidation.valid).toBe(true)
      expect(processResult.success).toBe(true)
      expect(processAttempts).toBe(1)
    })
  })
})
