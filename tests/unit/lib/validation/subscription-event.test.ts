import { describe, it, expect } from 'vitest'
import {
  validateSubscriptionEvent,
  validateRequiredFields,
  validateAmount,
  validateStatus,
  getValidStatuses
} from '@/lib/validation/subscription-event'

describe('Subscription Event Validation', () => {
  describe('validateSubscriptionEvent', () => {
    it('should validate a complete valid event', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active',
        currency: 'BRL'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing userId', () => {
      const event = {
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('userId is required')
    })

    it('should reject invalid userId format', () => {
      const event = {
        userId: 'not-a-uuid',
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('valid UUID'))).toBe(true)
    })

    it('should reject non-string userId', () => {
      const event = {
        userId: 123,
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be a string'))).toBe(true)
    })

    it('should reject missing subscriptionId', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 990,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('subscriptionId is required')
    })

    it('should reject negative amount', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        amount: -100,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('positive'))).toBe(true)
    })

    it('should reject non-number amount', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        amount: '990',
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be a number'))).toBe(true)
    })

    it('should reject invalid status', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'invalid_status'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be one of'))).toBe(true)
    })

    it('should accept all valid statuses', () => {
      const validStatuses = ['active', 'pending', 'cancelled', 'expired', 'authorized', 'paused']

      validStatuses.forEach(status => {
        const event = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          subscriptionId: 'sub-123',
          amount: 990,
          status
        }

        const result = validateSubscriptionEvent(event)
        expect(result.valid).toBe(true)
      })
    })

    it('should validate currency format', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active',
        currency: 'INVALID'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('3 characters'))).toBe(true)
    })

    it('should return multiple errors', () => {
      const event = {
        userId: 'invalid',
        subscriptionId: '',
        amount: -100,
        status: 'invalid'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('validateRequiredFields', () => {
    it('should validate required fields', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123',
        status: 'active'
      }

      const result = validateRequiredFields(event)

      expect(result.valid).toBe(true)
    })

    it('should reject missing userId', () => {
      const event = {
        subscriptionId: 'sub-123',
        status: 'active'
      }

      const result = validateRequiredFields(event)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('userId is required')
    })

    it('should reject missing subscriptionId', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active'
      }

      const result = validateRequiredFields(event)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('subscriptionId is required')
    })

    it('should reject missing status', () => {
      const event = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionId: 'sub-123'
      }

      const result = validateRequiredFields(event)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('status is required')
    })
  })

  describe('validateAmount', () => {
    it('should validate positive amount', () => {
      const result = validateAmount(990)

      expect(result.valid).toBe(true)
    })

    it('should reject negative amount', () => {
      const result = validateAmount(-100)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('positive'))).toBe(true)
    })

    it('should reject non-number amount', () => {
      const result = validateAmount('990')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be a number'))).toBe(true)
    })

    it('should reject Infinity', () => {
      const result = validateAmount(Infinity)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('finite'))).toBe(true)
    })

    it('should reject NaN', () => {
      const result = validateAmount(NaN)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('finite'))).toBe(true)
    })

    it('should accept zero', () => {
      const result = validateAmount(0)

      expect(result.valid).toBe(true)
    })
  })

  describe('validateStatus', () => {
    it('should validate valid status', () => {
      const result = validateStatus('active')

      expect(result.valid).toBe(true)
    })

    it('should reject invalid status', () => {
      const result = validateStatus('invalid')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be one of'))).toBe(true)
    })

    it('should reject non-string status', () => {
      const result = validateStatus(123)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must be a string'))).toBe(true)
    })

    it('should reject missing status', () => {
      const result = validateStatus(undefined)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('status is required')
    })
  })

  describe('getValidStatuses', () => {
    it('should return list of valid statuses', () => {
      const statuses = getValidStatuses()

      expect(statuses).toContain('active')
      expect(statuses).toContain('pending')
      expect(statuses).toContain('cancelled')
      expect(statuses).toContain('expired')
      expect(statuses).toContain('authorized')
      expect(statuses).toContain('paused')
    })

    it('should return a copy of the list', () => {
      const statuses1 = getValidStatuses()
      const statuses2 = getValidStatuses()

      expect(statuses1).toEqual(statuses2)
      expect(statuses1).not.toBe(statuses2)
    })
  })

  describe('Property 2: Error Notification on Validation Failure', () => {
    it('should identify all validation errors', () => {
      const event = {
        userId: 'invalid-uuid',
        subscriptionId: '',
        amount: -100,
        status: 'invalid_status'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should provide clear error messages', () => {
      const event = {
        userId: 'invalid',
        subscriptionId: 'sub-123',
        amount: 990,
        status: 'active'
      }

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('valid UUID')
    })

    it('should validate all required fields', () => {
      const event = {}

      const result = validateSubscriptionEvent(event)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
