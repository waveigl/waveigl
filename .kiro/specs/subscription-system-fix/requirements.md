# Requirements Document: Subscription System Fix

## Introduction

The subscription detection system stopped functioning on 02/02/26, failing to detect new subscriptions, send Discord notifications, and deliver private messages to subscribers. This document outlines the requirements to restore and improve the reliability of the subscription webhook system, including error handling, retry logic, and comprehensive logging.

## Glossary

- **Webhook**: HTTP callback mechanism used by Mercado Pago and Twitch to notify the system of events
- **Subscription**: A recurring payment arrangement created through Mercado Pago's PreApproval system
- **Discord Notification**: Alert message sent to Discord channels or users via webhooks
- **Whisper**: Private message sent to a Twitch user
- **Backoff**: Exponential delay strategy for retrying failed operations
- **UUID**: Universally Unique Identifier used to identify users
- **PreApproval**: Mercado Pago's recurring subscription product
- **EventSub**: Twitch's event subscription system for real-time notifications
- **Health Check**: Endpoint that verifies webhook functionality and system status

## Requirements

### Requirement 1: Mercado Pago Webhook Error Notification

**User Story:** As a system administrator, I want to be notified immediately when the Mercado Pago webhook fails to process a subscription, so that I can investigate and fix issues quickly.

#### Acceptance Criteria

1. WHEN the Mercado Pago webhook receives a payment notification THEN the system SHALL validate the UUID format before processing
2. WHEN UUID validation fails THEN the system SHALL log the error with full context and return HTTP 400
3. WHEN subscription creation fails THEN the system SHALL send a Discord notification with error details, user context, and timestamp
4. WHEN Discord notification fails THEN the system SHALL log the failure and continue processing (fail gracefully)
5. WHEN a subscription is successfully created THEN the system SHALL send a confirmation Discord notification with subscription details

### Requirement 2: Retry Logic with Exponential Backoff

**User Story:** As a system operator, I want failed webhook operations to be automatically retried with exponential backoff, so that temporary network issues don't result in lost subscriptions.

#### Acceptance Criteria

1. WHEN a webhook operation fails due to network error THEN the system SHALL retry with exponential backoff (1s, 2s, 4s, 8s)
2. WHEN maximum retries are exhausted THEN the system SHALL log the final failure and send a critical Discord notification
3. WHEN a retry succeeds THEN the system SHALL log the success and continue normal processing
4. WHEN retrying THEN the system SHALL include retry attempt number and delay in logs
5. WHEN a webhook operation succeeds on first attempt THEN the system SHALL not perform any retries

### Requirement 3: Twitch Whisper Error Handling

**User Story:** As a developer, I want Twitch whisper failures to be properly caught and reported, so that I can identify when private messages fail to send.

#### Acceptance Criteria

1. WHEN sending a Twitch whisper fails THEN the system SHALL capture the error and log it with full context
2. WHEN a whisper fails THEN the system SHALL re-throw the error to allow upstream handling
3. WHEN a whisper fails THEN the system SHALL include the recipient user ID, message content, and error details in logs
4. WHEN a whisper succeeds THEN the system SHALL log the success with recipient and timestamp
5. IF a whisper fails THEN the system SHALL send a warning Discord notification with error details

### Requirement 4: Rigorous UUID Validation

**User Story:** As a security officer, I want the system to validate UUIDs rigorously before processing subscriptions, so that invalid data doesn't corrupt the system.

#### Acceptance Criteria

1. WHEN a webhook receives a user ID THEN the system SHALL validate it matches UUID v4 format exactly
2. WHEN UUID validation fails THEN the system SHALL reject the request with HTTP 400 and descriptive error message
3. WHEN UUID validation fails THEN the system SHALL log the invalid UUID and source for audit purposes
4. WHEN UUID is valid THEN the system SHALL proceed with subscription processing
5. WHEN UUID validation is performed THEN the system SHALL use a standardized validation function across all endpoints

### Requirement 5: Discord Notification Configuration Verification

**User Story:** As a system administrator, I want to verify that Discord notifications are properly configured and enabled, so that I receive alerts about subscription events.

#### Acceptance Criteria

1. WHEN the system starts THEN the system SHALL verify that NOTIFY_UNREGISTERED_SUBS environment variable is set
2. WHEN NOTIFY_UNREGISTERED_SUBS is disabled THEN the system SHALL log a warning at startup
3. WHEN a subscription event occurs THEN the system SHALL check NOTIFY_UNREGISTERED_SUBS before sending notifications
4. WHEN NOTIFY_UNREGISTERED_SUBS is enabled THEN the system SHALL send Discord notifications for all subscription events
5. WHEN NOTIFY_UNREGISTERED_SUBS is disabled THEN the system SHALL skip Discord notifications but continue processing subscriptions

### Requirement 6: Structured Logging at Critical Points

**User Story:** As a developer, I want comprehensive structured logs at every critical point in the subscription flow, so that I can trace issues and debug problems.

#### Acceptance Criteria

1. WHEN a webhook is received THEN the system SHALL log the event type, timestamp, and source
2. WHEN subscription validation begins THEN the system SHALL log the user ID and validation steps
3. WHEN a subscription is created THEN the system SHALL log the subscription ID, user ID, and status
4. WHEN a Discord notification is sent THEN the system SHALL log the notification type, recipient, and status
5. WHEN a Twitch whisper is sent THEN the system SHALL log the recipient, message type, and delivery status
6. WHEN any operation fails THEN the system SHALL log the error with full context including stack trace

### Requirement 7: Webhook Health Check Endpoint

**User Story:** As a system operator, I want a health check endpoint to verify that webhooks are functioning correctly, so that I can monitor system status.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/health/webhooks THEN the system SHALL return HTTP 200 with status information
2. WHEN the health check runs THEN the system SHALL verify Mercado Pago webhook connectivity
3. WHEN the health check runs THEN the system SHALL verify Discord webhook connectivity
4. WHEN any webhook is unreachable THEN the system SHALL return HTTP 503 with error details
5. WHEN the health check runs THEN the system SHALL include timestamp and last successful webhook timestamp

### Requirement 8: Comprehensive Error Recovery

**User Story:** As a system architect, I want the subscription system to recover gracefully from errors without losing data, so that the system remains reliable.

#### Acceptance Criteria

1. WHEN a subscription webhook fails THEN the system SHALL store the event for later retry
2. WHEN a stored event is retried THEN the system SHALL process it as if it were a new webhook
3. WHEN a retry succeeds THEN the system SHALL mark the event as processed and remove it from retry queue
4. WHEN a retry fails after maximum attempts THEN the system SHALL send a critical alert and mark for manual review
5. WHEN the system recovers from an error THEN the system SHALL resume normal operation without data loss

### Requirement 9: Subscription Event Validation

**User Story:** As a quality assurance engineer, I want all subscription events to be validated before processing, so that only valid subscriptions are created.

#### Acceptance Criteria

1. WHEN a subscription event is received THEN the system SHALL validate all required fields are present
2. WHEN required fields are missing THEN the system SHALL reject the event and log the validation error
3. WHEN a subscription amount is invalid THEN the system SHALL reject the event and notify Discord
4. WHEN a subscription status is invalid THEN the system SHALL reject the event and log the invalid status
5. WHEN all validations pass THEN the system SHALL proceed with subscription creation

### Requirement 10: Notification Delivery Confirmation

**User Story:** As a user, I want to receive confirmation that my subscription was processed and notifications were sent, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a subscription is successfully created THEN the system SHALL send a Discord notification to the admin channel
2. WHEN a Twitch whisper is sent to the subscriber THEN the system SHALL log the delivery status
3. WHEN a Discord DM is sent to the subscriber THEN the system SHALL log the delivery status
4. WHEN any notification fails THEN the system SHALL retry with backoff before giving up
5. WHEN all notifications are delivered THEN the system SHALL log a success summary with all delivery statuses
