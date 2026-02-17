# Implementation Plan: Twitch Subscriber Management System

## Overview

This implementation plan breaks down the Twitch Subscriber Management System into discrete coding tasks. Each task builds on previous tasks, with property-based tests validating correctness properties and unit tests validating specific examples and edge cases. The implementation follows the architecture defined in the design document, with services handling business logic, API routes handling HTTP requests, and the database layer persisting data.

## Tasks

- [x] 1. Set up project structure, database schema, and core types
  - Create directory structure: `src/lib/twitch/`, `src/app/api/subscribers/`, `src/types/twitch.types.ts`
  - Define TypeScript types: Subscriber, SubscriberContact, ContactStatus, API response types
  - Create Supabase migrations for subscribers and subscriber_contacts tables
  - Create database indexes on (channel_id, twitch_user_id)
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [-] 2. Implement TwitchSubscriberService for fetching and storing subscribers
  - [ ] 2.1 Create TwitchSubscriberService class with fetchSubscribersFromTwitch method
    - Implement pagination logic to fetch all pages from Twitch API
    - Handle Twitch API errors (401, 403, 500+) with proper error handling
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ]* 2.2 Write property test for pagination completeness
    - **Property 1: Pagination Completeness**
    - **Validates: Requirements 1.2**
  
  - [ ] 2.3 Implement storeSubscribers method to persist data
    - Store subscriber data with all required fields
    - Implement upsert logic to update existing subscribers
    - Prevent duplicate entries using twitch_user_id as unique identifier
    - _Requirements: 1.3, 2.1, 2.3, 2.4_
  
  - [ ]* 2.4 Write property test for subscriber idempotence
    - **Property 2: Subscriber Idempotence**
    - **Validates: Requirements 1.6, 2.4**
  
  - [ ] 2.5 Implement getSubscribers method with filtering and pagination
    - Support filtering by contact_status
    - Implement pagination (50 per page for admin panel)
    - Use database indexes for performance
    - _Requirements: 3.3, 5.1, 9.3_
  
  - [ ]* 2.6 Write property test for contact status filtering
    - **Property 3: Contact Status Filtering**
    - **Validates: Requirements 3.3**
  
  - [ ] 2.7 Implement getSubscriberStats method
    - Count subscribers by contact_status
    - Return stats object with all status counts
    - _Requirements: 5.8_
  
  - [ ]* 2.8 Write unit tests for TwitchSubscriberService
    - Test fetching single and multiple pages
    - Test storing new and updating existing subscribers
    - Test filtering and pagination
    - Test error handling for Twitch API errors
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Implement ValidationService for input validation
  - [ ] 3.1 Create ValidationService class with validation methods
    - validateSubscriberData: Verify all required fields present and valid
    - validateMessage: Verify message not empty and <= 500 characters
    - validateContactStatusFilter: Verify filter is valid status
    - validatePaginationParams: Verify page and limit are valid
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ]* 3.2 Write property tests for input validation
    - **Property 14: Input Validation Completeness**
    - **Property 15: Message Length Validation**
    - **Property 17: Contact Status Filter Validation**
    - **Validates: Requirements 8.1, 8.2, 8.4**
  
  - [ ]* 3.3 Write unit tests for ValidationService
    - Test validation of valid and invalid subscriber data
    - Test validation of message content (empty, too long)
    - Test validation of filter parameters
    - Test SQL injection prevention
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 4. Implement ErrorHandlingService for logging and Discord notifications
  - [ ] 4.1 Create ErrorHandlingService class
    - logError method: Log with context (error_code, error_message, operation, timestamp, user_id)
    - isRetryableError method: Determine if error should be retried
    - getRetryDelay method: Calculate exponential backoff delay
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 4.2 Write property tests for error handling
    - **Property 19: Structured Logging Completeness**
    - **Property 20: Discord Notification on Critical Error**
    - **Validates: Requirements 6.4, 6.5**
  
  - [ ]* 4.3 Write unit tests for ErrorHandlingService
    - Test logging with all required context fields
    - Test Discord notification for critical errors
    - Test retry determination for different error codes
    - Test exponential backoff calculation
    - _Requirements: 6.4, 6.5_

- [x] 5. Implement MessageService for sending and tracking messages
  - [ ] 5.1 Create MessageService class with sendMessageWithRetry method
    - Send message via Twitch Whisper API
    - Implement exponential backoff retry logic (1s, 2s, 4s, 8s, max 4 attempts)
    - Handle specific errors: blocked (no retry), banned (no retry), transient (retry)
    - Track message send in database
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 5.2 Write property tests for message sending
    - **Property 5: Message Send Atomicity**
    - **Property 6: Blocked User Detection**
    - **Property 7: Banned User Detection**
    - **Property 8: Exponential Backoff Correctness**
    - **Property 9: Permanent Error Non-Retry**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 6.2, 6.3**
  
  - [ ] 5.3 Implement sendMessagesToUncontacted method
    - Identify subscribers with contact_status "not_sent" or "failed"
    - Send messages sequentially with 100ms delay between each
    - Track each send result
    - Return summary (sent, failed, blocked, banned counts)
    - _Requirements: 4.1, 4.7, 4.8_
  
  - [ ]* 5.4 Write property test for sequential message processing
    - **Property 11: Sequential Message Processing**
    - **Validates: Requirements 4.8**
  
  - [ ] 5.5 Implement trackMessageSend method
    - Update subscriber_contacts record with message_sent_at and contact_status
    - Handle duplicate contact prevention on subscription renewal
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 5.6 Write property tests for contact tracking
    - **Property 4: Duplicate Contact Prevention**
    - **Property 21: Successful Retry Status Update**
    - **Validates: Requirements 3.2, 6.6**
  
  - [ ]* 5.7 Write unit tests for MessageService
    - Test sending message to single subscriber
    - Test retry logic with exponential backoff
    - Test handling of blocked and banned users
    - Test sequential processing with delays
    - Test bulk message sending
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 6. Implement authorization and OAuth scope validation
  - [ ] 6.1 Create authorization middleware
    - Verify user is authenticated
    - Verify user is EITHER the channel owner OR a channel admin
    - Verify Twitch OAuth token has required scopes (channel:read:subscriptions, channel:manage:whispers)
    - Redirect to login if unauthenticated
    - Return 403 if unauthorized
    - Prompt re-authentication if scopes missing
    - Grant identical permissions to both channel owner and channel admins
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.1_
  
  - [ ]* 6.2 Write property tests for authorization
    - **Property 12: Authorization Enforcement**
    - **Property 13: OAuth Scope Validation**
    - **Property 26: Admin Authorization Enforcement**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 11.1**
  
  - [ ]* 6.3 Write unit tests for authorization
    - Test access with valid credentials (channel owner)
    - Test access with valid credentials (channel admin)
    - Test access without authentication
    - Test access with insufficient permissions
    - Test OAuth scope validation
    - Test identical permissions for channel owner and admins
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.1_

- [ ] 7. Implement API routes for subscriber management
  - [ ] 7.1 Create GET /api/subscribers route
    - Accept query parameters: page, limit, contactStatus
    - Validate parameters using ValidationService
    - Call TwitchSubscriberService.getSubscribers
    - Return paginated results with total count
    - Handle errors and return appropriate status codes
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 7.2 Create POST /api/subscribers/sync route
    - Verify authorization
    - Call TwitchSubscriberService.fetchSubscribersFromTwitch
    - Call TwitchSubscriberService.storeSubscribers
    - Return sync result (total_fetched, total_updated, total_new, duration)
    - Handle errors and notify Discord
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [ ] 7.3 Create POST /api/subscribers/send-messages route
    - Verify authorization
    - Validate message content using ValidationService
    - Call MessageService.sendMessagesToUncontacted
    - Return summary (sent, failed, blocked, banned counts)
    - Handle errors and notify Discord
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  
  - [ ] 7.4 Create GET /api/subscribers/stats route
    - Verify authorization
    - Call TwitchSubscriberService.getSubscriberStats
    - Return stats object with all status counts
    - _Requirements: 5.8_
  
  - [ ]* 7.5 Write unit tests for API routes
    - Test GET /api/subscribers with various filters and pagination
    - Test POST /api/subscribers/sync with valid and invalid data
    - Test POST /api/subscribers/send-messages with valid and invalid data
    - Test GET /api/subscribers/stats
    - Test error handling and status codes
    - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3, 4.7, 5.1, 5.2, 5.3, 5.8_

- [x] 8. Implement admin panel UI components
  - [x] 8.1 Create SubscriberList component
    - Display paginated list of subscribers (50 per page)
    - Show columns: username, subscription_tier, subscription_date, contact_status, actions
    - Implement pagination controls
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.2 Create SubscriberFilter component
    - Filter by contact_status (sent, not_sent, failed, blocked, banned)
    - Update list when filter changes
    - _Requirements: 5.3_
  
  - [x] 8.3 Create SyncButton component
    - Display "Sync with Twitch" button
    - Show loading indicator during sync
    - Display success/error notification after sync
    - Display last sync timestamp
    - _Requirements: 5.4, 5.7_
  
  - [x] 8.4 Create SendMessagesButton component
    - Display "Send Messages" button
    - Show loading indicator during send
    - Display progress during send
    - Display summary (sent, failed, blocked, banned counts) after send
    - _Requirements: 5.5, 5.6, 4.7_
  
  - [x] 8.5 Create SubscriberStats component
    - Display counts by contact_status (sent, not_sent, failed, blocked, banned)
    - Update when data changes
    - _Requirements: 5.8_
  
  - [x] 8.6 Create SubscriberManagementPanel component
    - Combine all components into admin panel
    - Handle data fetching and state management
    - Display outdated data notification if last sync > 1 hour
    - _Requirements: 1.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x]* 8.7 Write unit tests for UI components
    - Test SubscriberList rendering and pagination
    - Test SubscriberFilter functionality
    - Test SyncButton loading and notifications
    - Test SendMessagesButton progress and summary
    - Test SubscriberStats display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 9. Implement rate limiting and performance optimization
  - [ ] 9.1 Add rate limiting to message sending
    - Implement 100ms delay between messages
    - Implement Twitch API rate limit handling (429 with Retry-After)
    - _Requirements: 4.8, 6.1_
  
  - [ ]* 9.2 Write property test for rate limiting
    - **Property 10: Rate Limit Respect**
    - **Validates: Requirements 6.1**
  
  - [ ] 9.3 Verify database query performance
    - Ensure queries use indexes and complete within 500ms
    - Test with 1600+ subscriber records
    - _Requirements: 9.3_
  
  - [ ]* 9.4 Write property test for query performance
    - **Property 18: Query Performance**
    - **Validates: Requirements 9.3**

- [ ] 10. Implement data consistency and referential integrity
  - [ ] 10.1 Verify referential integrity between tables
    - Ensure subscriber_contacts.subscriber_id references subscribers.id
    - Implement cascade delete or prevent deletion if contacts exist
    - _Requirements: 2.5_
  
  - [ ]* 10.2 Write property test for referential integrity
    - **Property 24: Referential Integrity**
    - **Validates: Requirements 2.5**
  
  - [ ] 10.3 Implement duplicate prevention on sync
    - Verify upsert logic prevents duplicates
    - Test with subscriber renewals and upgrades
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 10.4 Write property test for duplicate prevention
    - **Property 23: Duplicate Prevention on Sync**
    - **Validates: Requirements 2.3, 2.4**

- [ ] 11. Implement comprehensive logging and monitoring
  - [ ] 11.1 Add structured logging to all operations
    - Log subscriber fetch with context: channel_id, subscriber_count, timestamp
    - Log message send with context: subscriber_id, twitch_username, timestamp, status
    - Log errors with context: error_code, error_message, operation, timestamp, user_id
    - Log sync summary: total_fetched, total_updated, total_new, duration, timestamp
    - Log message summary: total_sent, total_failed, total_blocked, total_banned, duration, timestamp
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 11.2 Write property tests for logging
    - **Property 19: Structured Logging Completeness**
    - **Validates: Requirements 10.3**
  
  - [ ]* 11.3 Write unit tests for logging
    - Test logging of all operations with required context
    - Test Discord notifications for critical errors
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Run `npm run test` to execute all unit tests
  - Run `npm run test:e2e` to execute E2E tests
  - Run `npm run lint` to check code style
  - Run `npm run type-check` to verify TypeScript types
  - Ensure all tests pass before proceeding
  - Ask the user if questions arise

- [ ] 13. Integration and wiring
  - [ ] 13.1 Wire all services together in API routes
    - Inject services into routes
    - Ensure error handling flows through ErrorHandlingService
    - Ensure all operations are logged
    - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3, 4.7_
  
  - [ ] 13.2 Wire UI components to API routes
    - Connect SubscriberList to GET /api/subscribers
    - Connect SyncButton to POST /api/subscribers/sync
    - Connect SendMessagesButton to POST /api/subscribers/send-messages
    - Connect SubscriberStats to GET /api/subscribers/stats
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [ ]* 13.3 Write integration tests
    - Test end-to-end flow: sync → send messages → verify results
    - Test error scenarios and recovery
    - Test authorization and access control
    - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3, 4.7, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Run `npm run test` to execute all unit tests
  - Run `npm run test:e2e` to execute E2E tests
  - Run `npm run lint` to check code style
  - Run `npm run type-check` to verify TypeScript types
  - Ensure all tests pass before completion
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All code follows PROJECT_STANDARDS.md, NAMING_CONVENTIONS.md, and ERROR_HANDLING.md
- Update CHANGELOG.md with all changes before committing
- Follow semantic versioning for version updates
