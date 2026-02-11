/**
 * Subscription Event Validation Module
 * Validates subscription events before processing
 */

export interface SubscriptionEventValidationResult {
  valid: boolean
  errors: string[]
}

export interface SubscriptionEventData {
  userId?: unknown
  subscriptionId?: unknown
  amount?: unknown
  status?: unknown
  currency?: unknown
  [key: string]: unknown
}

/**
 * Valid subscription statuses
 */
const VALID_STATUSES = ['active', 'pending', 'cancelled', 'expired', 'authorized', 'paused']

/**
 * Validates a subscription event
 * 
 * @param event - The subscription event to validate
 * @returns Validation result with list of errors if invalid
 * 
 * @example
 * const result = validateSubscriptionEvent({
 *   userId: 'user-123',
 *   subscriptionId: 'sub-456',
 *   amount: 990,
 *   status: 'active'
 * })
 * 
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 * }
 */
export function validateSubscriptionEvent(event: SubscriptionEventData): SubscriptionEventValidationResult {
  const errors: string[] = []

  // Validate userId
  if (!event.userId) {
    errors.push('userId is required')
  } else if (typeof event.userId !== 'string') {
    errors.push(`userId must be a string, got ${typeof event.userId}`)
  } else if (!isValidUUID(event.userId)) {
    errors.push(`userId must be a valid UUID, got ${event.userId}`)
  }

  // Validate subscriptionId
  if (!event.subscriptionId) {
    errors.push('subscriptionId is required')
  } else if (typeof event.subscriptionId !== 'string') {
    errors.push(`subscriptionId must be a string, got ${typeof event.subscriptionId}`)
  }

  // Validate amount
  if (event.amount !== undefined) {
    if (typeof event.amount !== 'number') {
      errors.push(`amount must be a number, got ${typeof event.amount}`)
    } else if (event.amount < 0) {
      errors.push(`amount must be positive, got ${event.amount}`)
    } else if (!Number.isFinite(event.amount)) {
      errors.push(`amount must be a finite number, got ${event.amount}`)
    }
  }

  // Validate status
  if (!event.status) {
    errors.push('status is required')
  } else if (typeof event.status !== 'string') {
    errors.push(`status must be a string, got ${typeof event.status}`)
  } else if (!VALID_STATUSES.includes(event.status)) {
    errors.push(`status must be one of ${VALID_STATUSES.join(', ')}, got ${event.status}`)
  }

  // Validate currency if provided
  if (event.currency !== undefined) {
    if (typeof event.currency !== 'string') {
      errors.push(`currency must be a string, got ${typeof event.currency}`)
    } else if (event.currency.length !== 3) {
      errors.push(`currency must be 3 characters, got ${event.currency}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates that a value is a valid UUID
 */
function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validates required fields are present
 */
export function validateRequiredFields(event: SubscriptionEventData): SubscriptionEventValidationResult {
  const errors: string[] = []

  if (!event.userId) {
    errors.push('userId is required')
  }

  if (!event.subscriptionId) {
    errors.push('subscriptionId is required')
  }

  if (event.status === undefined) {
    errors.push('status is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates subscription amount
 */
export function validateAmount(amount: unknown): SubscriptionEventValidationResult {
  const errors: string[] = []

  if (amount === undefined || amount === null) {
    errors.push('amount is required')
  } else if (typeof amount !== 'number') {
    errors.push(`amount must be a number, got ${typeof amount}`)
  } else if (amount < 0) {
    errors.push(`amount must be positive, got ${amount}`)
  } else if (!Number.isFinite(amount)) {
    errors.push(`amount must be a finite number, got ${amount}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates subscription status
 */
export function validateStatus(status: unknown): SubscriptionEventValidationResult {
  const errors: string[] = []

  if (!status) {
    errors.push('status is required')
  } else if (typeof status !== 'string') {
    errors.push(`status must be a string, got ${typeof status}`)
  } else if (!VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of ${VALID_STATUSES.join(', ')}, got ${status}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Gets list of valid statuses
 */
export function getValidStatuses(): string[] {
  return [...VALID_STATUSES]
}
