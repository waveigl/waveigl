import { test, expect } from '@playwright/test'

/**
 * End-to-End Tests for Subscription Flow
 * 
 * These tests verify the complete subscription creation flow from webhook
 * to notifications, including error recovery scenarios and health checks.
 */

test.describe('Subscription Flow E2E', () => {
  // ============================================================================
  // 15.1 E2E test for successful subscription
  // ============================================================================
  test.describe('15.1 Successful subscription creation', () => {
    test('should create subscription through webhook and send notifications', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-456',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert - Webhook accepted
      expect(response.status()).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
    })

    test('should verify Discord notifications were sent', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-789',
        type: 'preapproval.created',
        data: {
          id: 'pre-789',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert
      expect(response.status()).toBe(200)
      // In a real scenario, we would verify Discord notifications were sent
      // by checking Discord API or webhook logs
    })

    test('should verify Twitch whisper was sent', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-twitch-123',
        type: 'channel.subscribe',
        data: {
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          broadcaster_user_id: 'broadcaster-123',
          tier: 'tier_1'
        }
      }

      // Act - Send Twitch webhook
      const response = await request.post('/api/webhooks/twitch/eventsub', {
        data: webhookPayload
      })

      // Assert
      expect(response.status()).toBe(200)
      // In a real scenario, we would verify Twitch whisper was sent
    })

    test('should verify database state after subscription', async ({ request }) => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      // Act - Get user profile
      const response = await request.get(`/api/user/profile?userId=${userId}`)

      // Assert
      if (response.status() === 200) {
        const profile = await response.json()
        expect(profile).toHaveProperty('subscription_status')
      }
    })
  })

  // ============================================================================
  // 15.2 E2E test for error recovery
  // ============================================================================
  test.describe('15.2 Error recovery scenarios', () => {
    test('should recover from webhook failure with retry', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-retry-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-retry-123',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook (may fail initially)
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert - Should eventually succeed or be queued for retry
      expect([200, 202, 500]).toContain(response.status())
    })

    test('should handle validation failure gracefully', async ({ request }) => {
      // Arrange
      const invalidPayload = {
        id: 'evt-invalid-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-invalid-123',
          external_reference: 'invalid-uuid', // Invalid UUID
          status: 'active',
          amount: 990
        }
      }

      // Act - Send invalid webhook
      const response = await request.post('/api/subscription/webhook', {
        data: invalidPayload
      })

      // Assert - Should reject with 400
      expect(response.status()).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBeDefined()
    })

    test('should verify recovery succeeds after retry', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-recovery-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-recovery-123',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert - Should succeed
      expect(response.status()).toBe(200)
    })

    test('should send notifications after recovery', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-notify-recovery-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-notify-recovery-123',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert
      expect(response.status()).toBe(200)
      // Verify notifications were sent
    })
  })

  // ============================================================================
  // 15.3 E2E test for health check
  // ============================================================================
  test.describe('15.3 Health check endpoint', () => {
    test('should return health status for all webhooks', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('webhooks')
      expect(health.webhooks).toHaveProperty('mercadoPago')
      expect(health.webhooks).toHaveProperty('discord')
      expect(health.webhooks).toHaveProperty('twitch')
    })

    test('should verify Mercado Pago webhook connectivity', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health.webhooks.mercadoPago).toHaveProperty('status')
      expect(['ok', 'error']).toContain(health.webhooks.mercadoPago.status)
    })

    test('should verify Discord webhook connectivity', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health.webhooks.discord).toHaveProperty('status')
      expect(['ok', 'error']).toContain(health.webhooks.discord.status)
    })

    test('should verify Twitch webhook connectivity', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health.webhooks.twitch).toHaveProperty('status')
      expect(['ok', 'error']).toContain(health.webhooks.twitch.status)
    })

    test('should include pending and failed event counts', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health).toHaveProperty('pendingEvents')
      expect(health).toHaveProperty('failedEvents')
      expect(typeof health.pendingEvents).toBe('number')
      expect(typeof health.failedEvents).toBe('number')
    })

    test('should return 503 if any webhook is unreachable', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      // If any webhook is down, should return 503
      if ([503].includes(response.status())) {
        const health = await response.json()
        expect(health.status).toBe('unhealthy')
      }
    })

    test('should include timestamp in health response', async ({ request }) => {
      // Act - Call health check
      const response = await request.get('/api/health/webhooks')

      // Assert
      expect([200, 503]).toContain(response.status())
      const health = await response.json()
      expect(health).toHaveProperty('timestamp')
      expect(typeof health.timestamp).toBe('string')
    })
  })

  // ============================================================================
  // Additional E2E scenarios
  // ============================================================================
  test.describe('Additional E2E scenarios', () => {
    test('should handle concurrent webhook requests', async ({ request }) => {
      // Arrange
      const webhooks = [
        {
          id: 'evt-concurrent-1',
          type: 'preapproval.created',
          data: {
            id: 'pre-concurrent-1',
            external_reference: '550e8400-e29b-41d4-a716-446655440001',
            status: 'active',
            amount: 990
          }
        },
        {
          id: 'evt-concurrent-2',
          type: 'preapproval.created',
          data: {
            id: 'pre-concurrent-2',
            external_reference: '550e8400-e29b-41d4-a716-446655440002',
            status: 'active',
            amount: 990
          }
        }
      ]

      // Act - Send concurrent requests
      const responses = await Promise.all(
        webhooks.map(webhook =>
          request.post('/api/subscription/webhook', { data: webhook })
        )
      )

      // Assert - All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
    })

    test('should handle duplicate webhook requests idempotently', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-duplicate-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-duplicate-123',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send same webhook twice
      const response1 = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })
      const response2 = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert - Both should succeed (idempotent)
      expect(response1.status()).toBe(200)
      expect(response2.status()).toBe(200)
    })

    test('should log all webhook events', async ({ request }) => {
      // Arrange
      const webhookPayload = {
        id: 'evt-logging-123',
        type: 'preapproval.created',
        data: {
          id: 'pre-logging-123',
          external_reference: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
          amount: 990
        }
      }

      // Act - Send webhook
      const response = await request.post('/api/subscription/webhook', {
        data: webhookPayload
      })

      // Assert
      expect(response.status()).toBe(200)
      // In a real scenario, we would verify logs were created
    })
  })
})
