/**
 * Subscription System Structured Logging
 * Provides consistent, structured logging across the subscription webhook system
 */

export type LogLevel = 'info' | 'warn' | 'warning' | 'error' | 'critical'

export interface LogContext {
  /** User ID (UUID) */
  userId?: string
  /** Subscription ID */
  subscriptionId?: string
  /** Event type (e.g., 'subscription_created', 'payment_received') */
  eventType?: string
  /** Timestamp in ISO 8601 format */
  timestamp?: string
  /** Source of the log (e.g., 'webhook', 'retry', 'notification') */
  source?: string
  /** HTTP status code if applicable */
  statusCode?: number
  /** Error message if applicable */
  error?: string
  /** Stack trace if applicable */
  stackTrace?: string
  /** Number of retry attempts */
  attempts?: number
  /** Delay in milliseconds */
  delay?: number
  /** Additional context */
  [key: string]: unknown
}

/**
 * Logs a webhook event with structured context
 * 
 * Format: [SubscriptionSystem] <level> <message> <context>
 * 
 * @param level - Log level (info, warn, error, critical)
 * @param message - Log message
 * @param context - Structured context object
 * 
 * @example
 * logWebhookEvent('info', 'Subscription created', {
 *   userId: 'user-123',
 *   subscriptionId: 'sub-456',
 *   timestamp: new Date().toISOString(),
 *   source: 'webhook'
 * })
 */
export function logWebhookEvent(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): void {
  // Ensure timestamp is set
  const timestamp = context.timestamp || new Date().toISOString()

  // Build context object with timestamp
  const logContext = {
    timestamp,
    ...context
  }

  // Format log message
  const logMessage = `[SubscriptionSystem] ${level.toUpperCase()} ${message}`

  // Log based on level
  switch (level) {
    case 'info':
      console.log(logMessage, logContext)
      break
    case 'warn':
    case 'warning':
      console.warn(logMessage, logContext)
      break
    case 'error':
      console.error(logMessage, logContext)
      break
    case 'critical':
      console.error(logMessage, logContext)
      break
    default:
      console.log(logMessage, logContext)
  }
}

/**
 * Logs webhook reception
 */
export function logWebhookReceived(
  source: string,
  eventType: string,
  context?: Omit<LogContext, 'source' | 'eventType'>
): void {
  logWebhookEvent('info', `Webhook received: ${source}/${eventType}`, {
    source,
    eventType,
    ...context
  })
}

/**
 * Logs validation error
 */
export function logValidationError(
  field: string,
  reason: string,
  context?: Omit<LogContext, 'error'>
): void {
  logWebhookEvent('error', `Validation failed: ${field}`, {
    error: reason,
    ...context
  })
}

/**
 * Logs subscription creation
 */
export function logSubscriptionCreated(
  userId: string,
  subscriptionId: string,
  context?: Omit<LogContext, 'userId' | 'subscriptionId' | 'eventType'>
): void {
  logWebhookEvent('info', 'Subscription created', {
    userId,
    subscriptionId,
    eventType: 'subscription_created',
    ...context
  })
}

/**
 * Logs subscription creation failure
 */
export function logSubscriptionCreationFailed(
  userId: string,
  error: string,
  context?: Omit<LogContext, 'userId' | 'error' | 'eventType'>
): void {
  logWebhookEvent('error', 'Subscription creation failed', {
    userId,
    error,
    eventType: 'subscription_creation_failed',
    ...context
  })
}

/**
 * Logs retry attempt
 */
export function logRetryAttempt(
  operation: string,
  attempt: number,
  maxAttempts: number,
  delay: number,
  context?: Omit<LogContext, 'attempts' | 'delay'>
): void {
  logWebhookEvent('warn', `Retry attempt ${attempt}/${maxAttempts} for ${operation}`, {
    attempts: attempt,
    delay,
    ...context
  })
}

/**
 * Logs notification sent
 */
export function logNotificationSent(
  type: string,
  recipient: string,
  context?: Omit<LogContext, 'eventType'>
): void {
  logWebhookEvent('info', `Notification sent: ${type} to ${recipient}`, {
    eventType: `notification_sent_${type}`,
    ...context
  })
}

/**
 * Logs notification failure
 */
export function logNotificationFailed(
  type: string,
  recipient: string,
  error: string,
  context?: Omit<LogContext, 'error' | 'eventType'>
): void {
  logWebhookEvent('error', `Notification failed: ${type} to ${recipient}`, {
    error,
    eventType: `notification_failed_${type}`,
    ...context
  })
}

/**
 * Logs operation success
 */
export function logOperationSuccess(
  operation: string,
  context?: LogContext
): void {
  logWebhookEvent('info', `Operation succeeded: ${operation}`, context)
}

/**
 * Logs operation failure
 */
export function logOperationFailure(
  operation: string,
  error: string,
  context?: Omit<LogContext, 'error'>
): void {
  logWebhookEvent('error', `Operation failed: ${operation}`, {
    error,
    ...context
  })
}

/**
 * Logs critical error
 */
export function logCriticalError(
  message: string,
  error: string,
  context?: Omit<LogContext, 'error'>
): void {
  logWebhookEvent('critical', message, {
    error,
    ...context
  })
}
