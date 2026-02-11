# Implementation Plan: Subscription System Fix

## Overview

This implementation plan breaks down the subscription system fix into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The plan follows a bottom-up approach: implementing core utilities first, then integrating them into webhook handlers, and finally adding monitoring and health checks.

## Tasks

- [x] 1. Create UUID validation utility module
  - Create `src/lib/validation/uuid.ts` with standardized UUID v4 validation function
  - Implement `validateUUIDv4()` that returns validation result with error message
  - Add comprehensive JSDoc documentation
  - Export for use across all endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.1 Write property tests for UUID validation
    - **Property 1: UUID Validation Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 2. Implement retry handler with exponential backoff
  - Create `src/lib/retry/backoff.ts` with retry logic
  - Implement `retryWithBackoff()` function with configurable options
  - Support exponential backoff: 1s, 2s, 4s, 8s delays
  - Log each retry attempt with attempt number and delay
  - Return result object with attempt count and error tracking
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.1 Write property tests for exponential backoff
    - **Property 3: Exponential Backoff Retry Pattern**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 2.2 Write property tests for successful retry
    - **Property 4: Successful Retry Completion**
    - **Validates: Requirements 2.3, 2.5**

  - [x] 2.3 Write property tests for max retry exhaustion
    - **Property 5: Maximum Retry Exhaustion**
    - **Validates: Requirements 2.2, 8.1, 8.4**

- [x] 3. Create structured logging module
  - Create `src/lib/logging/subscription-logger.ts`
  - Implement `logWebhookEvent()` with structured context
  - Format logs as: `[SubscriptionSystem] <level> <message> <context>`
  - Include timestamp, user ID, operation type, and status in all logs
  - Export for use in webhook handlers
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 3.1 Write property tests for structured logging
    - **Property 9: Comprehensive Structured Logging**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 4. Implement event storage for failed operations
  - Create `src/lib/storage/event-store.ts`
  - Implement `EventStore` interface with store, retrieve, list, markProcessed, markFailed methods
  - Use Supabase table `webhook_events` to persist failed events
  - Support querying by status (pending, processed, failed)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 4.1 Write property tests for event storage round trip
    - **Property 11: Event Storage Round Trip**
    - **Validates: Requirements 8.2, 8.3**

- [x] 5. Enhance Discord notification handler
  - Update `src/lib/notifications/discord.ts`
  - Add `notifyDiscordOnError()` function for error notifications
  - Support different notification levels (info, warning, error, critical)
  - Route to appropriate Discord channels based on level
  - Implement retry logic for Discord API failures
  - Log notification status (success/failure)
  - _Requirements: 1.3, 1.4, 1.5, 2.2, 3.5, 5.4, 7.3_

  - [x] 5.1 Write property tests for error notification
    - **Property 2: Error Notification on Validation Failure**
    - **Validates: Requirements 1.2, 1.3, 9.2, 9.3, 9.4**

  - [x] 5.2 Write property tests for graceful Discord failure
    - **Property 7: Graceful Discord Notification Failure**
    - **Validates: Requirements 1.4**

- [x] 6. Enhance Twitch whisper handler
  - Update `src/lib/chat/twitch.ts` whisper function
  - Capture and log errors with full context (recipient, message, error)
  - Re-throw errors to allow upstream handling
  - Send Discord warning notification on failure
  - Log success with recipient and timestamp
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.1 Write property tests for whisper error propagation
    - **Property 6: Twitch Whisper Error Propagation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [x] 7. Create subscription event validation module
  - Create `src/lib/validation/subscription-event.ts`
  - Implement validation for required fields (userId, subscriptionId, amount, status)
  - Validate amount is positive number
  - Validate status is one of: active, pending, cancelled, expired
  - Return validation result with error details
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 7.1 Write property tests for event validation
    - **Property 2: Error Notification on Validation Failure**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 8. Update Mercado Pago webhook handler
  - Update `src/app/api/subscription/webhook/route.ts`
  - Add UUID validation at start of handler
  - Add subscription event validation
  - Wrap subscription creation in retry logic
  - Add structured logging at each step
  - Add Discord error notifications on validation/creation failure
  - Handle Discord notification failures gracefully
  - Return appropriate HTTP status codes (400 for validation, 500 for operation errors)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.1 Write property tests for MP webhook validation
    - **Property 1: UUID Validation Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.4**

  - [x] 8.2 Write property tests for MP webhook retry
    - **Property 3: Exponential Backoff Retry Pattern**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 8.3 Write property tests for MP webhook error handling
    - **Property 2: Error Notification on Validation Failure**
    - **Validates: Requirements 1.2, 1.3, 9.2, 9.3, 9.4**

- [x] 9. Update Twitch EventSub webhook handler
  - Update `src/app/api/webhooks/twitch/eventsub/route.ts`
  - Add UUID validation for user IDs
  - Add subscription event validation
  - Wrap subscription creation in retry logic
  - Add structured logging at each step
  - Add Discord error notifications on failure
  - Wrap Twitch whisper in try-catch to capture errors
  - Handle whisper failures gracefully (log and continue)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.1 Write property tests for Twitch webhook validation
    - **Property 1: UUID Validation Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.4**

  - [x] 9.2 Write property tests for Twitch whisper error handling
    - **Property 6: Twitch Whisper Error Propagation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [x] 10. Implement notification configuration check
  - Update `src/lib/notifications/subscription.ts`
  - Add check for NOTIFY_UNREGISTERED_SUBS environment variable at startup
  - Log warning if disabled at startup
  - Check configuration before sending Discord notifications
  - Skip notifications if disabled, but continue processing subscriptions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.1 Write property tests for notification configuration
    - **Property 8: Notification Configuration Respect**
    - **Validates: Requirements 5.3, 5.5**

- [x] 11. Create health check endpoint
  - Create `src/app/api/health/webhooks/route.ts`
  - Implement GET handler that returns health status
  - Verify Mercado Pago webhook connectivity
  - Verify Discord webhook connectivity
  - Verify Twitch webhook connectivity
  - Return HTTP 200 if all healthy, HTTP 503 if any unreachable
  - Include timestamp and last successful webhook timestamp
  - Include pending and failed event counts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.1 Write property tests for health check
    - **Property 10: Health Check Connectivity Verification**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 12. Implement event retry processor
  - Create `src/lib/jobs/retry-failed-events.ts`
  - Implement background job to retry failed events
  - Query stored events with status 'pending'
  - Retry each event using retry logic
  - Mark as processed on success, update error on failure
  - Run periodically (e.g., every 5 minutes)
  - Log retry attempts and results
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 12.1 Write property tests for event retry processor
    - **Property 11: Event Storage Round Trip**
    - **Validates: Requirements 8.2, 8.3**

- [x] 13. Checkpoint - Ensure all tests pass
  - Run `npm run test` to verify all unit tests pass
  - Run `npm run test:coverage` to verify coverage is adequate
  - Run `npm run lint` to verify code style
  - Run `npm run type-check` to verify TypeScript types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create integration tests
  - Create `tests/integration/subscription-webhook.test.ts`
  - Test full subscription flow from webhook to notifications
  - Test error scenarios with recovery
  - Test retry logic with backoff
  - Test notification delivery
  - Test event storage and retrieval
  - _Requirements: All_

  - [x] 14.1 Write integration test for successful subscription
    - Test complete flow from webhook to all notifications
    - Verify all logs are created
    - Verify Discord notifications are sent

  - [x] 14.2 Write integration test for validation failure
    - Test invalid UUID rejection
    - Test missing field rejection
    - Test invalid amount rejection
    - Verify Discord error notification is sent

  - [x] 14.3 Write integration test for retry scenario
    - Test operation failure and retry
    - Test exponential backoff delays
    - Test successful retry completion

  - [x] 14.4 Write integration test for max retry exhaustion
    - Test operation failure after max retries
    - Test critical Discord notification
    - Test event storage for manual review

  - [x] 14.5 Write integration test for notification configuration
    - Test with NOTIFY_UNREGISTERED_SUBS enabled
    - Test with NOTIFY_UNREGISTERED_SUBS disabled
    - Verify subscriptions are processed in both cases

- [x] 15. Create end-to-end tests
  - Create `tests/e2e/subscription-flow.spec.ts`
  - Test complete subscription creation flow
  - Test error recovery scenarios
  - Test health check endpoint
  - Test notification delivery
  - _Requirements: All_

  - [x] 15.1 Write E2E test for successful subscription
    - Create subscription through webhook
    - Verify Discord notifications
    - Verify Twitch whisper
    - Verify database state

  - [x] 15.2 Write E2E test for error recovery
    - Simulate webhook failure
    - Verify retry occurs
    - Verify recovery succeeds
    - Verify notifications sent

  - [x] 15.3 Write E2E test for health check
    - Call health check endpoint
    - Verify all webhooks are checked
    - Verify status is accurate

- [x] 16. Update CHANGELOG.md
  - Document all changes made
  - Include sections: Added, Fixed, Improved, Security
  - Reference requirements and properties
  - Include version bump information
  - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Run `npm run test` to verify all tests pass
  - Run `npm run test:e2e` to verify E2E tests pass
  - Run `npm run lint` to verify code style
  - Run `npm run type-check` to verify TypeScript types
  - Run `npm run build` to verify build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions
- E2E tests verify complete workflows
- All tasks build incrementally on previous work
- No orphaned code - each task integrates into previous steps
