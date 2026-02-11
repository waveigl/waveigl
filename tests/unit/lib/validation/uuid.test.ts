import { describe, it, expect } from 'vitest'
import { validateUUIDv4, validateUUID } from '@/lib/validation/uuid'

describe('UUID Validation', () => {
  describe('validateUUIDv4', () => {
    describe('Valid UUIDs', () => {
      it('should accept valid UUID v4', () => {
        const result = validateUUIDv4('550e8400-e29b-41d4-a716-446655440000')
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should accept valid UUID v4 with uppercase', () => {
        const result = validateUUIDv4('550E8400-E29B-41D4-A716-446655440000')
        expect(result.valid).toBe(true)
      })

      it('should accept multiple valid UUID v4 formats', () => {
        const validUUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '00000000-0000-4000-8000-000000000000'
        ]

        validUUIDs.forEach(uuid => {
          const result = validateUUIDv4(uuid)
          expect(result.valid).toBe(true)
        })
      })
    })

    describe('Invalid UUIDs', () => {
      it('should reject non-string values', () => {
        const result = validateUUIDv4(123)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('expected string')
      })

      it('should reject null', () => {
        const result = validateUUIDv4(null)
        expect(result.valid).toBe(false)
      })

      it('should reject undefined', () => {
        const result = validateUUIDv4(undefined)
        expect(result.valid).toBe(false)
      })

      it('should reject empty string', () => {
        const result = validateUUIDv4('')
        expect(result.valid).toBe(false)
      })

      it('should reject UUID with wrong version', () => {
        // Version 1 UUID (not version 4)
        const result = validateUUIDv4('6ba7b811-9dad-11d1-80b4-00c04fd430c8')
        expect(result.valid).toBe(false)
      })

      it('should reject malformed UUIDs', () => {
        const invalidUUIDs = [
          '550e8400-e29b-41d4-a716',  // Too short
          '550e8400-e29b-41d4-a716-446655440000-extra',  // Too long
          '550e8400e29b41d4a716446655440000',  // No hyphens
          '550e8400-e29b-41d4-a716-44665544000g',  // Invalid character
          'not-a-uuid-at-all-1234-5678-90ab-cdef'  // Invalid format
        ]

        invalidUUIDs.forEach(uuid => {
          const result = validateUUIDv4(uuid)
          expect(result.valid).toBe(false)
        })
      })
    })
  })

  describe('validateUUID', () => {
    describe('Valid UUIDs', () => {
      it('should accept valid UUID v4', () => {
        const result = validateUUID('550e8400-e29b-41d4-a716-446655440000')
        expect(result.valid).toBe(true)
      })

      it('should accept valid UUID v1', () => {
        const result = validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
        expect(result.valid).toBe(true)
      })

      it('should accept multiple UUID versions', () => {
        const validUUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',  // v4
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',  // v1
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8',  // v1
          '00000000-0000-0000-0000-000000000000'    // Nil UUID
        ]

        validUUIDs.forEach(uuid => {
          const result = validateUUID(uuid)
          expect(result.valid).toBe(true)
        })
      })
    })

    describe('Invalid UUIDs', () => {
      it('should reject non-string values', () => {
        const result = validateUUID(123)
        expect(result.valid).toBe(false)
      })

      it('should reject malformed UUIDs', () => {
        const invalidUUIDs = [
          '550e8400-e29b-41d4-a716',
          '550e8400e29b41d4a716446655440000',
          'not-a-uuid'
        ]

        invalidUUIDs.forEach(uuid => {
          const result = validateUUID(uuid)
          expect(result.valid).toBe(false)
        })
      })
    })
  })

  describe('Property 1: UUID Validation Consistency', () => {
    it('should consistently validate the same UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result1 = validateUUIDv4(uuid)
      const result2 = validateUUIDv4(uuid)
      expect(result1.valid).toBe(result2.valid)
    })

    it('should reject all invalid UUIDs consistently', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      ]

      invalidUUIDs.forEach(uuid => {
        const result = validateUUIDv4(uuid)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should accept only valid UUID v4 format', () => {
      // Generate multiple valid v4 UUIDs and verify they all pass
      const validV4UUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-41d4-80b4-00c04fd430c8'
      ]

      validV4UUIDs.forEach(uuid => {
        const result = validateUUIDv4(uuid)
        expect(result.valid).toBe(true)
      })
    })
  })
})
