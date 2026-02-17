# Design Document: Twitch Subscriber Management System

## Overview

The Twitch Subscriber Management System is a backend service integrated into the WaveIGL platform that manages subscriber data synchronization from Twitch, tracks contact status for bulk messaging, and provides an admin panel for streamers and channel admins to manage their subscribers. The system handles pagination, error recovery, maintains data consistency across multiple operations, and supports multiple admins with full access and audit trail logging.

### Key Design Decisions

1. **On-Demand Sync**: Subscribers are fetched on-demand when the admin accesses the panel or clicks sync, not via background jobs. This reduces unnecessary API calls and costs.
2. **Sequential Message Processing**: Messages are sent sequentially with delays to respect Twitch API rate limits and avoid overwhelming the service.
3. **Idempotent Operations**: Subscriber renewals and contact tracking are designed to be idempotent to prevent duplicates.
4. **Structured Error Handling**: All errors are logged with context and critical errors notify Discord for immediate visibility.
5. **Multi-Admin Support**: Both channel owners and channel admins have full access to the subscriber management panel with identical permissions.
6. **Audit Trail**: All actions (sync, send messages) are logged with the admin's identity for accountability and tracking.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Panel (Frontend)                    │
│  - Subscriber list with pagination                           │
│  - Filter by contact status                                  │
│  - Sync button, Send Messages button                         │
│  - Last sync timestamp, Status counts                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Routes (Next.js Backend)                    │
│  - GET /api/subscribers (list with filters)                  │
│  - POST /api/subscribers/sync (fetch from Twitch)            │
│  - POST /api/subscribers/send-messages (bulk send)           │
│  - GET /api/subscribers/stats (counts by status)             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           Service Layer (Business Logic)                     │
│  - TwitchSubscriberService (fetch, store, update)            │
│  - MessageService (send, retry, track)                       │
│  - ValidationService (input validation)                      │
│  - ErrorHandlingService (logging, Discord notify)            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Data Layer (Supabase)                           │
│  - subscribers table                                         │
│  - subscriber_contacts table                                 │
│  - Indexes on (channel_id, twitch_user_id)                   │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           External Services                                  │
│  - Twitch API (fetch subscribers, send whispers)             │
│  - Discord Webhooks (error notifications)                    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. TwitchSubscriberService

Handles all interactions with Twitch API and subscriber data storage.

```typescript
interface TwitchSubscriberService {
  // Fetch all subscribers from Twitch API with pagination
  fetchSubscribersFromTwitch(
    channelId: string,
    accessToken: string
  ): Promise<Subscriber[]>

  // Store or update subscribers in database
  storeSubscribers(
    channelId: string,
    subscribers: Subscriber[]
  ): Promise<{ created: number; updated: number }>

  // Get subscribers with optional filtering
  getSubscribers(
    channelId: string,
    filters?: {
      contactStatus?: ContactStatus
      page?: number
      limit?: number
    }
  ): Promise<PaginatedResult<Subscriber>>

  // Get subscriber statistics
  getSubscriberStats(channelId: string): Promise<SubscriberStats>
}
```

### 2. MessageService

Handles message sending, tracking, and retry logic.

```typescript
interface MessageService {
  // Send messages to uncontacted subscribers
  sendMessagesToUncontacted(
    channelId: string,
    message: string,
    accessToken: string
  ): Promise<MessageSendResult>

  // Send message to single subscriber with retry
  sendMessageWithRetry(
    subscriberId: string,
    message: string,
    accessToken: string,
    maxRetries?: number
  ): Promise<MessageSendResult>

  // Track message send in database
  trackMessageSend(
    subscriberId: string,
    status: ContactStatus,
    errorMessage?: string
  ): Promise<void>

  // Get uncontacted subscribers
  getUncontactedSubscribers(channelId: string): Promise<Subscriber[]>
}
```

### 3. ValidationService

Validates all input data.

```typescript
interface ValidationService {
  // Validate subscriber data from Twitch
  validateSubscriberData(data: unknown): Subscriber

  // Validate message content
  validateMessage(message: string): void

  // Validate contact status filter
  validateContactStatusFilter(status: unknown): ContactStatus

  // Validate pagination parameters
  validatePaginationParams(page: number, limit: number): void
}
```

### 4. ErrorHandlingService

Handles errors, logging, and Discord notifications.

```typescript
interface ErrorHandlingService {
  // Log error with context
  logError(
    level: 'error' | 'critical',
    title: string,
    message: string,
    context: Record<string, unknown>
  ): Promise<void>

  // Determine if error is retryable
  isRetryableError(errorCode: number): boolean

  // Get retry delay for rate limiting
  getRetryDelay(attempt: number, retryAfter?: number): number
}
```

## Data Models

### Subscriber

```typescript
interface Subscriber {
  id: string // UUID
  channelId: string
  twitchUserId: string
  twitchUsername: string
  subscriptionTier: 'tier_1' | 'tier_2' | 'tier_3'
  subscriptionDate: Date
  subscriptionStatus: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

### SubscriberContact

```typescript
interface SubscriberContact {
  id: string // UUID
  subscriberId: string
  messageSentAt: Date | null
  contactStatus: ContactStatus
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

type ContactStatus = 'sent' | 'not_sent' | 'failed' | 'blocked' | 'banned'
```

### API Response Types

```typescript
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface SubscriberStats {
  total: number
  sent: number
  notSent: number
  failed: number
  blocked: number
  banned: number
}

interface MessageSendResult {
  total: number
  sent: number
  failed: number
  blocked: number
  banned: number
  errors: Array<{
    subscriberId: string
    error: string
    status: ContactStatus
  }>
}

interface SyncResult {
  totalFetched: number
  totalUpdated: number
  totalNew: number
  duration: number
  timestamp: Date
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Pagination Completeness

*For any* Twitch API response with multiple pages, fetching all pages and combining results should produce the complete subscriber list without duplicates.

**Validates: Requirements 1.2**

### Property 2: Subscriber Idempotence

*For any* subscriber fetched from Twitch API, fetching the same subscriber twice should result in a single database record with updated fields, not a duplicate.

**Validates: Requirements 1.6, 2.4**

### Property 3: Contact Status Filtering

*For any* set of subscribers with different contact statuses, filtering by a specific status should return only subscribers matching that status.

**Validates: Requirements 3.3**

### Property 4: Duplicate Contact Prevention

*For any* subscriber whose subscription is renewed, the system should not create a duplicate contact record; instead, it should preserve the existing contact status.

**Validates: Requirements 3.2**

### Property 5: Message Send Atomicity

*For any* successful message send, the database record should be updated with message_sent_at timestamp and contact_status set to "sent" atomically.

**Validates: Requirements 3.1, 4.3**

### Property 6: Blocked User Detection

*For any* message send that fails with a "user blocked whispers" error, the contact_status should be set to "blocked" and no further retries should occur.

**Validates: Requirements 4.4**

### Property 7: Banned User Detection

*For any* message send that fails with a "user banned" error, the contact_status should be set to "banned" and no further retries should occur.

**Validates: Requirements 4.5**

### Property 8: Exponential Backoff Correctness

*For any* transient API error (500, 502, 503), retries should occur with exponential backoff delays (1s, 2s, 4s, 8s) up to 4 attempts, and the final attempt should update the contact_status.

**Validates: Requirements 4.6, 6.2**

### Property 9: Permanent Error Non-Retry

*For any* permanent API error (401, 403, 404), the system should not retry and should immediately record the error.

**Validates: Requirements 6.3**

### Property 10: Rate Limit Respect

*For any* Twitch API call that returns a 429 (Rate Limit) error with a Retry-After header, the system should wait for the specified duration before retrying.

**Validates: Requirements 6.1**

### Property 11: Sequential Message Processing

*For any* bulk message send operation, messages should be processed sequentially with at least 100ms delay between each message to avoid rate limiting.

**Validates: Requirements 4.8**

### Property 12: Authorization Enforcement

*For any* request to the subscriber management panel, the system should verify the user is authenticated and has the required role (channel owner or admin) before granting access.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 13: OAuth Scope Validation

*For any* admin accessing the panel, the system should verify the Twitch OAuth token contains both required scopes (channel:read:subscriptions, channel:manage:whispers).

**Validates: Requirements 7.4, 7.5**

### Property 14: Input Validation Completeness

*For any* subscriber data received from Twitch API, all required fields (twitch_user_id, twitch_username, subscription_tier, subscription_date) should be present and valid before storage.

**Validates: Requirements 8.1**

### Property 15: Message Length Validation

*For any* message prepared for sending, the message should not be empty and should not exceed 500 characters.

**Validates: Requirements 8.2**

### Property 16: SQL Injection Prevention

*For any* string field stored in the database, SQL injection attempts should be sanitized and stored as literal strings without executing SQL.

**Validates: Requirements 8.3**

### Property 17: Contact Status Filter Validation

*For any* filter request by contact_status, the filter value should be one of the valid statuses (sent, not_sent, failed, blocked, banned), and invalid values should be rejected.

**Validates: Requirements 8.4, 8.5**

### Property 18: Query Performance

*For any* subscriber query on a database with 1600+ records, the query should complete within 500ms using database indexes.

**Validates: Requirements 9.3**

### Property 19: Structured Logging Completeness

*For any* error that occurs, the structured log should contain all required context fields (error_code, error_message, operation, timestamp, user_id).

**Validates: Requirements 6.4, 10.3**

### Property 20: Discord Notification on Critical Error

*For any* critical error in production, the system should send a Discord notification with error level, title, message, and context.

**Validates: Requirements 6.5**

### Property 21: Successful Retry Status Update

*For any* message send that fails initially but succeeds on retry, the contact_status should be updated to "sent" and error_message should be cleared.

**Validates: Requirements 6.6**

### Property 22: Outdated Data Notification

*For any* admin accessing the panel when the last sync was over 1 hour ago, the system should display a notification that the data may be outdated.

**Validates: Requirements 1.7**

### Property 23: Duplicate Prevention on Sync

*For any* subscriber already in the database that is fetched again during sync, the system should update the existing record instead of creating a duplicate.

**Validates: Requirements 2.3**

### Property 24: Referential Integrity

*For any* subscriber deleted from the database, the system should maintain referential integrity with the subscriber_contacts table (either cascade delete or prevent deletion).

**Validates: Requirements 2.5**

### Property 25: Uncontacted Subscriber Identification

*For any* bulk message send operation, the system should correctly identify all subscribers with contact_status of "not_sent" or "failed" and attempt to send messages to them.

**Validates: Requirements 4.1**

### Property 26: Admin Authorization Enforcement

*For any* request to the subscriber management panel, the system should verify the user is EITHER the channel owner OR a channel admin, and grant full access to both roles with identical permissions.

**Validates: Requirements 7.1, 11.1**

### Property 27: Admin Access Revocation

*For any* channel admin removed from the channel, the system should immediately revoke their access to the subscriber management panel and prevent further operations.

**Validates: Requirements 7.7, 11.2**

### Property 28: Audit Trail Completeness

*For any* admin action (sync, send messages), the system should log the action with the admin's identity (user_id, username), timestamp, and operation details for accountability.

**Validates: Requirements 11.3, 11.5, 11.6**

### Property 29: Multi-Admin Concurrent Access

*For any* multiple admins accessing the subscriber management panel simultaneously, the system should allow concurrent access without conflicts or data corruption.

**Validates: Requirements 11.7**

## Error Handling

### Error Categories

1. **Twitch API Errors**
   - 401 Unauthorized: Invalid or expired token → Prompt re-authentication
   - 403 Forbidden: Missing scopes → Prompt re-authentication with correct scopes
   - 429 Rate Limited: Wait for Retry-After header
   - 500+ Server Errors: Retry with exponential backoff

2. **Message Send Errors**
   - User blocked whispers → Set status to "blocked", no retry
   - User banned → Set status to "banned", no retry
   - Transient errors (500, 502, 503) → Retry with backoff
   - Permanent errors (401, 403, 404) → No retry, record error

3. **Database Errors**
   - Connection failures → Log and notify Discord
   - Constraint violations → Log and return error to user
   - Query timeouts → Log and return error to user

4. **Validation Errors**
   - Invalid subscriber data → Log and skip subscriber
   - Invalid message content → Return error to user
   - Invalid filter parameters → Return error to user

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string // User-friendly message
  code: string // Error code for client handling
  details?: Record<string, unknown> // Additional context
}
```

## Testing Strategy

### Unit Tests

Unit tests validate specific examples, edge cases, and error conditions:

1. **Subscriber Fetching**
   - Test fetching single page of subscribers
   - Test fetching multiple pages with pagination
   - Test handling of empty subscriber list
   - Test handling of Twitch API errors (401, 403, 500)

2. **Subscriber Storage**
   - Test storing new subscribers
   - Test updating existing subscribers
   - Test preventing duplicates
   - Test handling of invalid data

3. **Message Sending**
   - Test sending message to single subscriber
   - Test sending messages to multiple subscribers
   - Test handling of blocked users
   - Test handling of banned users
   - Test retry logic with exponential backoff

4. **Filtering and Pagination**
   - Test filtering by contact status
   - Test pagination with various page sizes
   - Test edge cases (empty results, single page, exact page boundary)

5. **Validation**
   - Test validation of subscriber data
   - Test validation of message content
   - Test validation of filter parameters
   - Test SQL injection prevention

6. **Authorization**
   - Test access with valid credentials
   - Test access without authentication
   - Test access with insufficient permissions
   - Test OAuth scope validation

### Property-Based Tests

Property-based tests validate universal properties across all inputs:

1. **Pagination Completeness** (Property 1)
   - Generate random paginated API responses
   - Verify all pages are fetched and combined correctly
   - Verify no duplicates in combined results

2. **Subscriber Idempotence** (Property 2)
   - Generate random subscriber data
   - Fetch twice and verify single record with updated fields
   - Verify no duplicates created

3. **Contact Status Filtering** (Property 3)
   - Generate random subscribers with different statuses
   - Apply filter and verify only matching statuses returned
   - Verify no false positives or false negatives

4. **Exponential Backoff** (Property 8)
   - Simulate transient errors
   - Verify retries occur with correct delays (1s, 2s, 4s, 8s)
   - Verify max 4 attempts

5. **Sequential Message Processing** (Property 11)
   - Generate random message batches
   - Verify messages sent sequentially with 100ms+ delays
   - Verify no concurrent sends

6. **Input Validation** (Property 14, 15, 16, 17)
   - Generate random valid and invalid inputs
   - Verify validation accepts valid inputs
   - Verify validation rejects invalid inputs
   - Verify SQL injection attempts are sanitized

7. **Query Performance** (Property 18)
   - Generate 1600+ subscriber records
   - Execute queries and measure execution time
   - Verify all queries complete within 500ms

8. **Logging Completeness** (Property 19)
   - Simulate various errors
   - Verify logs contain all required context fields
   - Verify no sensitive data in logs

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with feature name and property number
- Tag format: `Feature: twitch-subscriber-management, Property {number}: {property_text}`
- Unit tests focus on specific examples and edge cases
- Property tests focus on universal correctness across all inputs

## Performance Considerations

1. **Database Indexing**: Create index on (channel_id, twitch_user_id) for fast lookups
2. **Pagination**: Fetch 100 from Twitch API, display 50 in admin panel
3. **Message Rate Limiting**: 100ms delay between messages to respect Twitch API limits
4. **Query Optimization**: Use indexes to ensure queries complete within 500ms
5. **Connection Pooling**: Use Supabase connection pooling for database efficiency

## Security Considerations

1. **Authentication**: Verify user is authenticated before accessing panel
2. **Authorization**: Verify user is EITHER the channel owner OR a channel admin with full access
3. **Multi-Admin Support**: Both channel owners and channel admins have identical permissions:
   - Full access to subscriber management panel
   - Can synchronize subscribers from Twitch
   - Can send messages in bulk to subscribers
   - Can view subscriber history and contact status
   - Can view audit trail of all admin actions
4. **Audit Trail**: All actions are logged with the admin's identity (user_id, username) for accountability
5. **OAuth Scopes**: Verify token has required scopes (channel:read:subscriptions, channel:manage:whispers)
6. **Input Validation**: Validate all input data before processing
7. **SQL Injection Prevention**: Sanitize all string fields before storage
8. **Sensitive Data**: Never log passwords, tokens, or personal information
9. **HTTPS**: All API calls use HTTPS in production
