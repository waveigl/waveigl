/**
 * Retry Handler with Exponential Backoff
 * Implements retry logic with exponential backoff delays for failed operations
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number
  /** Maximum delay in milliseconds (default: 8000) */
  maxDelay?: number
}

export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean
  /** The result data if successful */
  data?: T
  /** The error if failed */
  error?: Error
  /** Number of attempts made */
  attempts: number
  /** The last error encountered */
  lastError?: Error
}

/**
 * Retries an operation with exponential backoff
 * 
 * Implements exponential backoff with delays: 1s, 2s, 4s, 8s
 * Logs each retry attempt with attempt number and delay
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns Result object with success status, data, and attempt count
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetchUserData(userId),
 *   { maxRetries: 3, baseDelay: 1000 }
 * )
 * 
 * if (result.success) {
 *   console.log('Success after', result.attempts, 'attempts')
 *   console.log('Data:', result.data)
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts')
 *   console.error('Error:', result.error)
 * }
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const maxRetries = options.maxRetries ?? 3
  const baseDelay = options.baseDelay ?? 1000
  const maxDelay = options.maxDelay ?? 8000

  let lastError: Error | undefined
  let attempts = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1

    try {
      const data = await operation()
      
      // Success on first attempt
      if (attempt === 0) {
        return {
          success: true,
          data,
          attempts: 1
        }
      }

      // Success after retries
      console.log(`[Retry] Operation succeeded on attempt ${attempts}/${maxRetries + 1}`)
      return {
        success: true,
        data,
        attempts
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // If this was the last attempt, return failure
      if (attempt === maxRetries) {
        console.error(`[Retry] Operation failed after ${attempts} attempts`, {
          error: lastError.message,
          attempts
        })
        return {
          success: false,
          error: lastError,
          attempts,
          lastError
        }
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

      console.warn(`[Retry] Attempt ${attempts}/${maxRetries + 1} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        delay
      })

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but just in case
  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts,
    lastError
  }
}

/**
 * Calculates the delay for a given retry attempt
 * 
 * @param attempt - The attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns The delay in milliseconds
 * 
 * @example
 * const delay = calculateBackoffDelay(2, 1000, 8000)
 * // Returns 4000 (1000 * 2^2)
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 8000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
}
