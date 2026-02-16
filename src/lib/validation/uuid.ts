/**
 * UUID v4 Validation Module
 * Provides standardized UUID v4 validation across all webhook endpoints
 */

export interface UUIDValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates that a value is a valid UUID v4 format
 * 
 * @param value - The value to validate (can be any type)
 * @returns Validation result with error message if invalid
 * 
 * @example
 * const result = validateUUIDv4('550e8400-e29b-41d4-a716-446655440000')
 * if (result.valid) {
 *   // Process subscription
 * } else {
 *   console.error(result.error)
 * }
 */
export function validateUUIDv4(value: unknown): UUIDValidationResult {
  // Check if value is a string
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `Invalid UUID: expected string, got ${typeof value}`
    }
  }

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // Where x is any hex digit and y is one of 8, 9, A, or B
  // More permissive regex to accept valid v4 UUIDs
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidv4Regex.test(value)) {
    return {
      valid: false,
      error: `Invalid UUID v4 format: ${value}`
    }
  }

  return { valid: true }
}

/**
 * Validates that a value is a valid UUID (v4 or v1)
 * More permissive than validateUUIDv4 - accepts any UUID format
 * 
 * @param value - The value to validate (can be any type)
 * @returns Validation result with error message if invalid
 */
export function validateUUID(value: unknown): UUIDValidationResult {
  // Check if value is a string
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `Invalid UUID: expected string, got ${typeof value}`
    }
  }

  // Generic UUID format (v1, v3, v4, v5)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(value)) {
    return {
      valid: false,
      error: `Invalid UUID format: ${value}`
    }
  }

  return { valid: true }
}
