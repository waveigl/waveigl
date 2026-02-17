/**
 * ErrorHandlingService
 * Handles error logging, Discord notifications, and retry logic
 */

import { notifyDiscord } from '@/lib/notifications/discord'

export class ErrorHandlingService {
  /**
   * Log error with context and optionally notify Discord
   */
  async logError(
    level: 'error' | 'critical',
    title: string,
    message: string,
    context: Record<string, unknown>
  ): Promise<void> {
    const timestamp = new Date().toISOString()
    const logContext = {
      ...context,
      timestamp,
      environment: process.env.NODE_ENV,
    }

    // Structured log
    console.error(`[TwitchSubscriberManagement] ${level.toUpperCase()}: ${title}`, {
      message,
      ...logContext,
    })

    // Notify Discord for errors and critical issues
    if (level === 'error' || level === 'critical') {
      try {
        await notifyDiscord({
          level,
          title: `[Twitch Subscribers] ${title}`,
          message,
          context: logContext,
        })
      } catch (discordError) {
        console.error('[ErrorHandlingService] Failed to notify Discord:', discordError)
      }
    }
  }

  /**
   * Determine if an error is retryable based on error code
   */
  isRetryableError(errorCode: number): boolean {
    // Transient errors that should be retried
    const retryableCodes = [408, 429, 500, 502, 503, 504]
    return retryableCodes.includes(errorCode)
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attempt: number, retryAfter?: number): number {
    // If Retry-After header is provided, use it
    if (retryAfter) {
      return retryAfter * 1000 // Convert to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s
    const baseDelay = 1000 // 1 second
    const delay = baseDelay * Math.pow(2, attempt - 1)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000
    return delay + jitter
  }

  /**
   * Determine if error is permanent (should not retry)
   */
  isPermanentError(errorCode: number): boolean {
    // Permanent errors that should not be retried
    const permanentCodes = [400, 401, 403, 404, 405, 406, 409, 410, 411, 413, 414, 415]
    return permanentCodes.includes(errorCode)
  }

  /**
   * Check if error is a "user blocked whispers" error
   */
  isBlockedError(errorMessage: string): boolean {
    const blockedPatterns = [
      'blocked',
      'whisper',
      'cannot send',
      'not allowed',
      'permission denied',
    ]
    return blockedPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern)
    )
  }

  /**
   * Check if error is a "user banned" error
   */
  isBannedError(errorMessage: string): boolean {
    const bannedPatterns = ['banned', 'suspended', 'not found', 'does not exist']
    return bannedPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern)
    )
  }
}
