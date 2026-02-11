import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  logWebhookEvent,
  logWebhookReceived,
  logValidationError,
  logSubscriptionCreated,
  logSubscriptionCreationFailed,
  logRetryAttempt,
  logNotificationSent,
  logNotificationFailed,
  logOperationSuccess,
  logOperationFailure,
  logCriticalError
} from '@/lib/logging/subscription-logger'

describe('Subscription Logger', () => {
  let consoleLogSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('logWebhookEvent', () => {
    it('should log info level messages', () => {
      logWebhookEvent('info', 'Test message', { userId: 'user-123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const call = consoleLogSpy.mock.calls[0]
      expect(call[0]).toContain('[SubscriptionSystem]')
      expect(call[0]).toContain('INFO')
      expect(call[1]).toHaveProperty('userId', 'user-123')
    })

    it('should log warn level messages', () => {
      logWebhookEvent('warn', 'Warning message', { eventType: 'test' })

      expect(consoleWarnSpy).toHaveBeenCalled()
      const call = consoleWarnSpy.mock.calls[0]
      expect(call[0]).toContain('[SubscriptionSystem]')
      expect(call[0]).toContain('WARN')
    })

    it('should log error level messages', () => {
      logWebhookEvent('error', 'Error message', { error: 'Something failed' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('[SubscriptionSystem]')
      expect(call[0]).toContain('ERROR')
    })

    it('should log critical level messages', () => {
      logWebhookEvent('critical', 'Critical message', { error: 'System down' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('[SubscriptionSystem]')
      expect(call[0]).toContain('CRITICAL')
    })

    it('should include timestamp in context', () => {
      logWebhookEvent('info', 'Test', {})

      const call = consoleLogSpy.mock.calls[0]
      expect(call[1]).toHaveProperty('timestamp')
      expect(typeof call[1].timestamp).toBe('string')
    })

    it('should use provided timestamp', () => {
      const timestamp = '2025-02-10T12:00:00Z'
      logWebhookEvent('info', 'Test', { timestamp })

      const call = consoleLogSpy.mock.calls[0]
      expect(call[1].timestamp).toBe(timestamp)
    })

    it('should include all context fields', () => {
      const context = {
        userId: 'user-123',
        subscriptionId: 'sub-456',
        eventType: 'test_event',
        source: 'webhook',
        statusCode: 200,
        customField: 'custom-value'
      }

      logWebhookEvent('info', 'Test', context)

      const call = consoleLogSpy.mock.calls[0]
      expect(call[1]).toMatchObject(context)
    })
  })

  describe('logWebhookReceived', () => {
    it('should log webhook reception', () => {
      logWebhookReceived('mercadopago', 'payment.created', { userId: 'user-123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const call = consoleLogSpy.mock.calls[0]
      expect(call[0]).toContain('Webhook received')
      expect(call[1]).toHaveProperty('source', 'mercadopago')
      expect(call[1]).toHaveProperty('eventType', 'payment.created')
    })
  })

  describe('logValidationError', () => {
    it('should log validation errors', () => {
      logValidationError('userId', 'Invalid UUID format', { source: 'webhook' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('Validation failed')
      expect(call[1]).toHaveProperty('error', 'Invalid UUID format')
    })
  })

  describe('logSubscriptionCreated', () => {
    it('should log subscription creation', () => {
      logSubscriptionCreated('user-123', 'sub-456', { source: 'webhook' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const call = consoleLogSpy.mock.calls[0]
      expect(call[0]).toContain('Subscription created')
      expect(call[1]).toHaveProperty('userId', 'user-123')
      expect(call[1]).toHaveProperty('subscriptionId', 'sub-456')
      expect(call[1]).toHaveProperty('eventType', 'subscription_created')
    })
  })

  describe('logSubscriptionCreationFailed', () => {
    it('should log subscription creation failure', () => {
      logSubscriptionCreationFailed('user-123', 'Database error', { source: 'webhook' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('Subscription creation failed')
      expect(call[1]).toHaveProperty('userId', 'user-123')
      expect(call[1]).toHaveProperty('error', 'Database error')
    })
  })

  describe('logRetryAttempt', () => {
    it('should log retry attempts', () => {
      logRetryAttempt('subscription_creation', 1, 3, 1000, { userId: 'user-123' })

      expect(consoleWarnSpy).toHaveBeenCalled()
      const call = consoleWarnSpy.mock.calls[0]
      expect(call[0]).toContain('Retry attempt 1/3')
      expect(call[1]).toHaveProperty('attempts', 1)
      expect(call[1]).toHaveProperty('delay', 1000)
    })
  })

  describe('logNotificationSent', () => {
    it('should log notification sent', () => {
      logNotificationSent('discord', 'admin-channel', { userId: 'user-123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const call = consoleLogSpy.mock.calls[0]
      expect(call[0]).toContain('Notification sent')
      expect(call[1]).toHaveProperty('eventType', 'notification_sent_discord')
    })
  })

  describe('logNotificationFailed', () => {
    it('should log notification failure', () => {
      logNotificationFailed('twitch', 'user-456', 'User not found', { userId: 'user-123' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('Notification failed')
      expect(call[1]).toHaveProperty('error', 'User not found')
      expect(call[1]).toHaveProperty('eventType', 'notification_failed_twitch')
    })
  })

  describe('logOperationSuccess', () => {
    it('should log operation success', () => {
      logOperationSuccess('webhook_processing', { userId: 'user-123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const call = consoleLogSpy.mock.calls[0]
      expect(call[0]).toContain('Operation succeeded')
    })
  })

  describe('logOperationFailure', () => {
    it('should log operation failure', () => {
      logOperationFailure('webhook_processing', 'Network timeout', { userId: 'user-123' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('Operation failed')
      expect(call[1]).toHaveProperty('error', 'Network timeout')
    })
  })

  describe('logCriticalError', () => {
    it('should log critical errors', () => {
      logCriticalError('System failure', 'Database connection lost', { source: 'webhook' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const call = consoleErrorSpy.mock.calls[0]
      expect(call[0]).toContain('[SubscriptionSystem]')
      expect(call[0]).toContain('CRITICAL')
      expect(call[1]).toHaveProperty('error', 'Database connection lost')
    })
  })

  describe('Property 9: Comprehensive Structured Logging', () => {
    it('should include required context fields at critical points', () => {
      const context = {
        userId: 'user-123',
        subscriptionId: 'sub-456',
        eventType: 'subscription_created',
        timestamp: new Date().toISOString(),
        source: 'webhook'
      }

      logWebhookEvent('info', 'Test', context)

      const call = consoleLogSpy.mock.calls[0]
      expect(call[1]).toHaveProperty('userId')
      expect(call[1]).toHaveProperty('subscriptionId')
      expect(call[1]).toHaveProperty('eventType')
      expect(call[1]).toHaveProperty('timestamp')
      expect(call[1]).toHaveProperty('source')
    })

    it('should maintain consistent log format', () => {
      logWebhookEvent('info', 'Message 1', { userId: 'user-1' })
      logWebhookEvent('error', 'Message 2', { userId: 'user-2' })
      logWebhookEvent('critical', 'Message 3', { userId: 'user-3' })

      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      const logCall = consoleLogSpy.mock.calls[0]
      const errorCall = consoleErrorSpy.mock.calls[0]

      expect(logCall[0]).toContain('[SubscriptionSystem]')
      expect(errorCall[0]).toContain('[SubscriptionSystem]')
    })

    it('should include error details in error logs', () => {
      logWebhookEvent('error', 'Operation failed', {
        error: 'Database connection timeout',
        stackTrace: 'at function() line 123'
      })

      const call = consoleErrorSpy.mock.calls[0]
      expect(call[1]).toHaveProperty('error')
      expect(call[1]).toHaveProperty('stackTrace')
    })
  })
})
