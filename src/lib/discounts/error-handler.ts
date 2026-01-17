/**
 * Error Handling for Discount Operations
 * Comprehensive error handling with Discord notifications
 */

import { notifyDiscord } from '@/lib/notifications/discord'

export class DiscountError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DiscountError'
  }
}

/**
 * Handle discount operation error
 * @param error - Error object
 * @param operation - Operation name
 * @param context - Additional context
 */
export async function handleDiscountError(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const statusCode = error instanceof DiscountError ? error.statusCode : 500

  console.error(`[DiscountError] ${operation}:`, {
    message,
    statusCode,
    context,
  })

  // Notify Discord for errors
  if (statusCode >= 500) {
    await notifyDiscord({
      level: 'error',
      title: `Discount Operation Failed: ${operation}`,
      message,
      context: {
        operation,
        statusCode,
        ...context,
      },
    })
  }
}

/**
 * Validation error handler
 * @param field - Field name
 * @param reason - Reason for validation failure
 */
export function createValidationError(field: string, reason: string): DiscountError {
  return new DiscountError(
    'VALIDATION_ERROR',
    `Validation failed for ${field}: ${reason}`,
    400,
    { field, reason }
  )
}

/**
 * Not found error handler
 * @param type - Resource type
 * @param id - Resource ID
 */
export function createNotFoundError(type: string, id: string): DiscountError {
  return new DiscountError(
    'NOT_FOUND',
    `${type} with ID ${id} not found`,
    404,
    { type, id }
  )
}

/**
 * Permission error handler
 * @param userId - User ID
 * @param action - Action attempted
 */
export function createPermissionError(userId: string, action: string): DiscountError {
  return new DiscountError(
    'PERMISSION_DENIED',
    `User ${userId} does not have permission to ${action}`,
    403,
    { userId, action }
  )
}

/**
 * Conflict error handler
 * @param resource - Resource name
 * @param reason - Reason for conflict
 */
export function createConflictError(resource: string, reason: string): DiscountError {
  return new DiscountError(
    'CONFLICT',
    `Conflict with ${resource}: ${reason}`,
    409,
    { resource, reason }
  )
}

/**
 * Database error handler
 * @param operation - Database operation
 * @param error - Original error
 */
export async function handleDatabaseError(
  operation: string,
  error: unknown
): Promise<DiscountError> {
  const message = error instanceof Error ? error.message : 'Unknown database error'

  console.error(`[DiscountDatabaseError] ${operation}:`, message)

  await notifyDiscord({
    level: 'error',
    title: `Database Error in Discount Operation: ${operation}`,
    message,
    context: { operation },
  })

  return new DiscountError(
    'DATABASE_ERROR',
    `Database operation failed: ${operation}`,
    500,
    { operation }
  )
}

/**
 * Mercado Pago error handler
 * @param operation - Operation name
 * @param error - Original error
 */
export async function handleMercadoPagoError(
  operation: string,
  error: unknown
): Promise<DiscountError> {
  const message = error instanceof Error ? error.message : 'Unknown Mercado Pago error'

  console.error(`[DiscountMercadoPagoError] ${operation}:`, message)

  await notifyDiscord({
    level: 'critical',
    title: `Mercado Pago Error in Discount Operation: ${operation}`,
    message,
    context: { operation },
  })

  return new DiscountError(
    'MERCADO_PAGO_ERROR',
    `Mercado Pago operation failed: ${operation}`,
    500,
    { operation }
  )
}

/**
 * Rate limit error handler
 * @param userId - User ID
 * @param endpoint - Endpoint
 */
export function createRateLimitError(userId: string, endpoint: string): DiscountError {
  return new DiscountError(
    'RATE_LIMIT_EXCEEDED',
    `Rate limit exceeded for user ${userId} on ${endpoint}`,
    429,
    { userId, endpoint }
  )
}

/**
 * Exhausted discount error handler
 * @param discountId - Discount ID
 */
export function createExhaustedDiscountError(discountId: string): DiscountError {
  return new DiscountError(
    'DISCOUNT_EXHAUSTED',
    `Discount ${discountId} has reached its usage limit`,
    410,
    { discountId }
  )
}

/**
 * Expired discount error handler
 * @param discountId - Discount ID
 */
export function createExpiredDiscountError(discountId: string): DiscountError {
  return new DiscountError(
    'DISCOUNT_EXPIRED',
    `Discount ${discountId} has expired`,
    410,
    { discountId }
  )
}
