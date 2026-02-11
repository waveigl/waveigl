# Design Document: Subscription System Fix

## Overview

The subscription detection system requires comprehensive improvements to restore reliability and prevent data loss. This design implements error handling, retry logic with exponential backoff, rigorous validation, and structured logging across the webhook processing pipeline. The solution ensures that subscription events are reliably processed, notifications are delivered, and failures are properly tracked and reported.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Receivers                         │
├─────────────────────────────────────────────────────────────┤
│  • Mercado Pago Webhook (/api/subscription/webhook)         │
│  • Twitch EventSub Webhook (/api/webhooks/twitch/eventsub)  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Validation & Processing Layer                   │
├─────────────────────────────────────────────────────────────┤
│  • UUID Validation (standardized function)                  │
│  • Event Field Validation                                   │
│  • Subscription Amount Validation                           │
│  • Status Validation                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Retry & Error Handling Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • Exponential Backoff Retry (1s, 2s, 4s, 8s)              │
│  • Event Storage for Failed Operations                      │
│  • Error Logging with Full Context                          │
│  • Discord Error Notifications                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          Notification Delivery Layer                         │
├─────────────────────────────────────────────────────────────┤
│  • Discord Notifications (Admin Channel)                    │
│  • Twitch Whispers (Private Messages)                       │
│  • Discord DMs (User Notifications)                         │
│  • Delivery Status Logging                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Health Check Endpoint                           │
├─────────────────────────────────────────────────────────────┤
│  • /api/health/webhooks                                     │
│  • Connectivity Verification                                │
│  • Status Reporting                                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Webhook Event
    │
    ▼
Validate UUID (v4 format)
    │
    ├─ Invalid ──► Return 400 + Log + Discord Alert
    │
    ▼
Validate Required Fields
    │
    ├─ Missing ──► Return 400 + Log + Discord Alert
    │
    ▼
Validate Amount & Status
    │
    ├─ Invalid ──► Return 400 + Log + Discord Alert
    │
    ▼
Create Subscription (with retry)
    │
    ├─ Fail ──► Retry with Backoff
    │   │
    │   ├─ Max Retries ──► Store Event + Critical Alert
    │   │
    │   ▼
    │ Success ──► Continue
    │
    ▼
Send Notifications (with retry)
    │
    ├─ Discord Admin Channel
    ├─ Twitch Whisper
    └─ Discord DM
    │
    ▼
Log Success Summary
    │
    ▼
Return 200 OK
```

## Components and Interfaces

### 1. UUID Validation Module

```typescript
interface UUIDValidationResult {
  valid: boolean
  error?: string
}

function validateUUIDv4(value: unknown): UUIDValidationResult
// Returns { valid: true } or { valid: false, error: "Invalid UUID format" }
// Used across all webhook endpoints
```

### 2. Retry Handler with Exponential Backoff

```typescript
interface RetryOptions {
  maxRetries: number      // Default: 3
  baseDelay: number       // Default: 1000ms
  maxDelay: number        // Default: 8000ms
}

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  lastError?: Error
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>>
// Implements exponential backoff: 1s, 2s, 4s, 8s
// Logs each retry attempt with attempt number and delay
// Returns result with attempt count
```

### 3. Event Storage for Failed Operations

```typescript
interface StoredEvent {
  id: string
  eventType: string
  payload: unknown
  createdAt: Date
  attempts: number
  lastError?: string
  status: 'pending' | 'processed' | 'failed'
}

interface EventStore {
  store(event: StoredEvent): Promise<void>
  retrieve(id: string): Promise<StoredEvent | null>
  list(status: string): Promise<StoredEvent[]>
  markProcessed(id: string): Promise<void>
  markFailed(id: string, error: string): Promise<void>
}
```

### 4. Structured Logging

```typescript
interface LogContext {
  userId?: string
  subscriptionId?: string
  eventType?: string
  timestamp: string
  source: string
  [key: string]: unknown
}

function logWebhookEvent(
  level: 'info' | 'warn' | 'error' | 'critical',
  message: string,
  context: LogContext
): void
// Format: [SubscriptionSystem] <level> <message> <context>
// Example: [SubscriptionSystem] error Subscription creation failed { userId, error, timestamp }
```

### 5. Discord Notification Handler

```typescript
interface DiscordNotification {
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  context?: Record<string, unknown>
  channel?: 'admin' | 'alerts'
}

async function notifyDiscordOnError(
  notification: DiscordNotification
): Promise<{ success: boolean; error?: string }>
// Sends to appropriate Discord channel based on level
// Includes retry logic for Discord API failures
// Logs notification status
```

### 6. Twitch Whisper Handler

```typescript
interface WhisperResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

async function sendTwitchWhisper(
  recipientId: string,
  message: string
): Promise<WhisperResult>
// Sends private message to Twitch user
// Captures and re-throws errors
// Logs delivery status with recipient and timestamp
// Sends Discord warning on failure
```

### 7. Health Check Endpoint

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  webhooks: {
    mercadoPago: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
    discord: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
    twitch: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
  }
  pendingEvents: number
  failedEvents: number
}

GET /api/health/webhooks → HealthCheckResponse
```

## Data Models

### Subscription Event

```typescript
interface SubscriptionEvent {
  id: string                    // UUID v4
  userId: string                // UUID v4
  subscriptionId: string        // Mercado Pago PreApproval ID
  amount: number                // In cents (e.g., 990 = R$ 9.90)
  currency: string              // "BRL"
  status: 'active' | 'pending' | 'cancelled' | 'expired'
  createdAt: string             // ISO 8601
  expiresAt?: string            // ISO 8601
  metadata?: {
    platform?: string
    tier?: string
    [key: string]: unknown
  }
}
```

### Webhook Payload (Mercado Pago)

```typescript
interface MercadoPagoWebhookPayload {
  id: string
  type: string                  // "payment.created", "preapproval.created", etc
  data: {
    id: string
    external_reference: string  // User ID (UUID)
    status: string
    amount: number
    [key: string]: unknown
  }
}
```

### Webhook Payload (Twitch EventSub)

```typescript
interface TwitchEventSubPayload {
  subscription: {
    id: string
    type: string
    version: string
    status: string
    created_at: string
  }
  event: {
    user_id: string
    user_login: string
    user_name: string
    broadcaster_user_id: string
    broadcaster_user_login: string
    broadcaster_user_name: string
    tier: string
    is_gift: boolean
  }
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: UUID Validation Consistency

*For any* webhook payload with a user ID, the system should validate it against UUID v4 format before processing, and reject invalid UUIDs with HTTP 400.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 2: Error Notification on Validation Failure

*For any* validation failure (UUID, fields, amount, status), the system should send a Discord notification with error details and log the failure.

**Validates: Requirements 1.2, 1.3, 9.2, 9.3, 9.4**

### Property 3: Exponential Backoff Retry Pattern

*For any* failed webhook operation, the system should retry with exponential backoff delays (1s, 2s, 4s, 8s) and log each attempt with the attempt number and delay.

**Validates: Requirements 2.1, 2.4**

### Property 4: Successful Retry Completion

*For any* webhook operation that fails then succeeds on retry, the system should log the success and continue normal processing without additional retries.

**Validates: Requirements 2.3, 2.5**

### Property 5: Maximum Retry Exhaustion

*For any* webhook operation that fails after maximum retries, the system should send a critical Discord notification and store the event for manual review.

**Validates: Requirements 2.2, 8.1, 8.4**

### Property 6: Twitch Whisper Error Propagation

*For any* Twitch whisper operation that fails, the system should capture the error, log it with full context (recipient, message, error), re-throw the error, and send a Discord warning.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

### Property 7: Graceful Discord Notification Failure

*For any* Discord notification that fails, the system should log the failure and continue processing subscriptions without interruption.

**Validates: Requirements 1.4**

### Property 8: Notification Configuration Respect

*For any* subscription event, if NOTIFY_UNREGISTERED_SUBS is disabled, the system should skip Discord notifications but continue processing subscriptions normally.

**Validates: Requirements 5.3, 5.5**

### Property 9: Comprehensive Structured Logging

*For any* critical operation (webhook receipt, validation, subscription creation, notification sending), the system should log with structured context including timestamp, user ID, operation type, and status.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 10: Health Check Connectivity Verification

*For any* health check request, the system should verify connectivity to Mercado Pago, Discord, and Twitch webhooks, and return HTTP 200 if all are reachable or HTTP 503 if any are unreachable.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Event Storage Round Trip

*For any* failed webhook event that is stored, when the event is retried, the system should process it identically to a new webhook event, and upon success, mark it as processed and remove it from the retry queue.

**Validates: Requirements 8.2, 8.3**

### Property 12: Notification Delivery Retry

*For any* notification (Discord, Twitch, Discord DM) that fails, the system should retry with backoff before giving up, and log the final delivery status.

**Validates: Requirements 10.4, 10.5**

### Property 13: Successful Subscription Confirmation

*For any* successfully created subscription, the system should send a Discord notification to the admin channel with subscription details and log a success summary with all delivery statuses.

**Validates: Requirements 1.5, 10.1, 10.5**

### Property 14: No Retry on First Success

*For any* webhook operation that succeeds on the first attempt, the system should not perform any retries and should proceed directly to notification delivery.

**Validates: Requirements 2.5**

## Error Handling

### Validation Errors

```typescript
// UUID validation fails
→ Log error with invalid UUID and source
→ Return HTTP 400 with descriptive message
→ Send Discord notification (if enabled)
→ Do NOT retry

// Required fields missing
→ Log error with missing fields
→ Return HTTP 400 with field list
→ Send Discord notification (if enabled)
→ Do NOT retry

// Invalid amount or status
→ Log error with invalid value
→ Return HTTP 400 with validation details
→ Send Discord notification (if enabled)
→ Do NOT retry
```

### Operation Errors

```typescript
// Subscription creation fails
→ Log error with full context
→ Retry with exponential backoff (1s, 2s, 4s, 8s)
→ If max retries exhausted:
  → Store event for manual review
  → Send critical Discord notification
  → Return HTTP 500

// Notification delivery fails
→ Log error with notification type and recipient
→ Retry with exponential backoff
→ If max retries exhausted:
  → Log final failure
  → Send warning Discord notification
  → Continue processing (fail gracefully)

// Discord notification fails
→ Log failure
→ Continue processing (fail gracefully)
→ Do NOT retry Discord notifications
```

## Testing Strategy

### Unit Tests

**Validation Tests:**
- Valid UUID v4 formats are accepted
- Invalid UUID formats are rejected
- Missing required fields are rejected
- Invalid amounts are rejected
- Invalid statuses are rejected

**Retry Logic Tests:**
- Exponential backoff delays are correct (1s, 2s, 4s, 8s)
- Retry stops on first success
- Maximum retries are respected
- Retry attempts are logged

**Notification Tests:**
- Discord notifications are sent on errors
- Twitch whispers are sent on success
- Discord DMs are sent on success
- Notification failures are logged
- Notification configuration is respected

**Logging Tests:**
- Logs contain required context fields
- Logs are structured with consistent format
- Error logs include stack traces
- Success logs include delivery status

### Property-Based Tests

**Property 1: UUID Validation Consistency**
- Generate random valid and invalid UUIDs
- Send through webhook
- Verify only valid UUIDs are processed
- Verify invalid UUIDs return 400

**Property 2: Error Notification on Validation Failure**
- Generate invalid payloads (missing fields, invalid amounts, etc)
- Verify Discord is called for each failure
- Verify error details are included

**Property 3: Exponential Backoff Retry Pattern**
- Mock operation to fail N times then succeed
- Verify retry delays follow exponential pattern
- Verify attempt numbers are logged

**Property 4: Successful Retry Completion**
- Mock operation to fail once then succeed
- Verify no additional retries occur
- Verify normal processing continues

**Property 5: Maximum Retry Exhaustion**
- Mock operation to always fail
- Verify critical notification is sent after max retries
- Verify event is stored for review

**Property 6: Twitch Whisper Error Propagation**
- Mock Twitch to fail
- Verify error is re-thrown
- Verify Discord warning is sent
- Verify error context is logged

**Property 7: Graceful Discord Notification Failure**
- Mock Discord to fail
- Verify subscription processing continues
- Verify failure is logged

**Property 8: Notification Configuration Respect**
- Set NOTIFY_UNREGISTERED_SUBS to false
- Process subscription
- Verify Discord notifications are skipped
- Verify subscription is still processed

**Property 9: Comprehensive Structured Logging**
- Process subscription through full flow
- Verify logs at each critical point
- Verify logs contain required context fields

**Property 10: Health Check Connectivity Verification**
- Mock webhooks as reachable
- Verify health check returns 200
- Mock webhooks as unreachable
- Verify health check returns 503

**Property 11: Event Storage Round Trip**
- Store failed event
- Retry stored event
- Verify it's processed identically to new event
- Verify it's marked as processed and removed

**Property 12: Notification Delivery Retry**
- Mock notification to fail then succeed
- Verify retry occurs
- Verify final status is logged

**Property 13: Successful Subscription Confirmation**
- Create subscription successfully
- Verify Discord notification is sent
- Verify success summary is logged

**Property 14: No Retry on First Success**
- Mock operation to succeed immediately
- Verify retry function is not called
- Verify processing continues normally

### Integration Tests

- Full subscription flow from webhook to notifications
- Error recovery and retry scenarios
- Health check endpoint functionality
- Event storage and retrieval
- Configuration changes (NOTIFY_UNREGISTERED_SUBS)

### End-to-End Tests

- Complete subscription creation flow
- Error scenarios with recovery
- Notification delivery verification
- Health check monitoring
