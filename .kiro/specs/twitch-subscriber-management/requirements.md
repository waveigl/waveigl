# Requirements Document: Twitch Subscriber Management System

## Introduction

The Twitch Subscriber Management System enables streamers to efficiently manage their subscriber base by fetching subscriber data from Twitch, tracking contact status, and sending bulk messages to subscribers. The system integrates with the Twitch API for real-time subscriber data, stores subscriber information in a database, and provides an admin panel for managing subscriber communications.

## Glossary

- **Subscriber**: A Twitch user who has an active subscription to a channel
- **Tier**: Subscription level (Tier 1, Tier 2, Tier 3)
- **Channel Owner**: The streamer who owns the channel (e.g., OGabrielToth)
- **Channel Admin**: A user with admin permissions on the channel, granted by the channel owner
- **Admin**: Either the channel owner or a channel admin with full access to the subscriber management panel
- **Whisper**: Direct message sent via Twitch to a user
- **Contact Status**: Indicates whether a message has been sent to a subscriber
- **Sync**: Process of fetching the latest subscriber list from Twitch API
- **Pagination**: Process of retrieving data in chunks (Twitch API returns 100 subscribers per page)
- **Twitch API**: Twitch's official API for accessing channel data and sending messages
- **Backoff**: Exponential delay strategy for retrying failed operations
- **Subscriber Renewal**: When a subscriber's subscription is renewed or upgraded

## Requirements

### Requirement 1: Fetch Subscribers from Twitch API

**User Story:** As a streamer, I want to fetch my subscriber list from Twitch, so that I can see who is currently subscribed to my channel.

#### Acceptance Criteria

1. WHEN the Admin accesses the subscriber management panel, THE System SHALL fetch subscribers from Twitch API using the channel:read:subscriptions scope
2. WHEN the Twitch API returns paginated results (100 subscribers per page), THE System SHALL automatically retrieve all pages until all subscribers are fetched
3. WHEN a subscriber is fetched from Twitch API, THE System SHALL store the subscriber data in the database with fields: twitch_user_id, twitch_username, subscription_tier, subscription_date, and subscription_status
4. WHEN the Admin clicks the "Sync with Twitch" button, THE System SHALL initiate a new fetch from Twitch API and update the database
5. IF the Twitch API returns an error (401 Unauthorized, 403 Forbidden, 500 Server Error), THEN THE System SHALL log the error, notify Discord, and return a user-friendly error message to the Admin
6. WHEN a subscriber is already in the database and is fetched again, THE System SHALL update the subscription_date and subscription_status fields
7. WHEN the Admin has not synced in over 1 hour AND the Admin accesses the subscriber panel, THE System SHALL display a notification that the data may be outdated

### Requirement 2: Store Subscriber Data in Database

**User Story:** As a system, I want to store subscriber information persistently, so that I can track subscribers and their contact status over time.

#### Acceptance Criteria

1. THE System SHALL create a subscribers table with columns: id (UUID), channel_id (VARCHAR), twitch_user_id (VARCHAR), twitch_username (VARCHAR), subscription_tier (VARCHAR), subscription_date (TIMESTAMP), subscription_status (VARCHAR), created_at (TIMESTAMP), updated_at (TIMESTAMP)
2. THE System SHALL create a subscriber_contacts table with columns: id (UUID), subscriber_id (UUID), message_sent_at (TIMESTAMP), contact_status (VARCHAR), error_message (VARCHAR), created_at (TIMESTAMP), updated_at (TIMESTAMP)
3. WHEN a subscriber is stored, THE System SHALL use twitch_user_id as a unique identifier to prevent duplicate entries
4. WHEN a subscriber's subscription is renewed or upgraded, THE System SHALL update the existing record instead of creating a duplicate
5. THE System SHALL maintain referential integrity between subscribers and subscriber_contacts tables

### Requirement 3: Track Contact Status

**User Story:** As a streamer, I want to track which subscribers have received messages, so that I can avoid sending duplicate messages and identify who still needs to be contacted.

#### Acceptance Criteria

1. WHEN a message is successfully sent to a subscriber via Twitch Whisper, THE System SHALL record the message_sent_at timestamp and set contact_status to "sent" in the subscriber_contacts table
2. WHEN a subscriber renews their subscription, THE System SHALL check if they already have a contact record and NOT create a duplicate contact entry
3. WHEN the Admin filters subscribers by contact status, THE System SHALL return only subscribers matching the selected status (sent, not_sent, failed)
4. WHEN a subscriber has contact_status of "sent", THE System SHALL prevent sending another message to that subscriber unless explicitly overridden by the Admin
5. IF a message fails to send to a subscriber, THEN THE System SHALL record the error_message and set contact_status to "failed"

### Requirement 4: Bulk Message Sending

**User Story:** As a streamer, I want to send messages in bulk to subscribers who have not been contacted, so that I can efficiently communicate with my subscriber base.

#### Acceptance Criteria

1. WHEN the Admin clicks "Send Messages to Uncontacted Subscribers", THE System SHALL identify all subscribers with contact_status of "not_sent" or "failed"
2. WHEN sending messages, THE System SHALL send each message via Twitch Whisper API using the channel:manage:whispers scope
3. WHEN a message is sent successfully, THE System SHALL update the subscriber_contacts record with message_sent_at timestamp and contact_status of "sent"
4. IF a message fails to send due to user blocking whispers, THEN THE System SHALL record the error and set contact_status to "blocked"
5. IF a message fails to send due to user being banned, THEN THE System SHALL record the error and set contact_status to "banned"
6. IF a message fails to send due to API error, THEN THE System SHALL retry the message with exponential backoff (1s, 2s, 4s, 8s) up to 4 attempts
7. WHEN all messages have been sent or retried, THE System SHALL display a summary showing total sent, failed, blocked, and banned counts
8. WHEN sending messages, THE System SHALL process messages sequentially with a 100ms delay between each message to avoid rate limiting

### Requirement 5: Admin Panel Interface

**User Story:** As a streamer, I want an admin panel to manage subscribers and messages, so that I can easily view, filter, and send messages to my subscribers.

#### Acceptance Criteria

1. WHEN the Admin accesses the subscriber management panel, THE System SHALL display a paginated list of all subscribers (showing 50 per page)
2. WHEN the Admin views the subscriber list, THE System SHALL display columns: username, subscription_tier, subscription_date, contact_status, and actions
3. WHEN the Admin filters by contact_status, THE System SHALL update the list to show only matching subscribers
4. WHEN the Admin clicks "Sync with Twitch", THE System SHALL initiate a sync operation and display a loading indicator
5. WHEN the Admin clicks "Send Messages", THE System SHALL initiate bulk message sending and display progress
6. WHEN a sync or message sending operation completes, THE System SHALL display a success or error notification
7. WHEN the Admin views the panel, THE System SHALL display the timestamp of the last successful sync
8. WHEN the Admin views the panel, THE System SHALL display the count of subscribers by contact_status (sent, not_sent, failed, blocked, banned)

### Requirement 6: Error Handling and Retry Logic

**User Story:** As a system, I want to handle errors gracefully and retry failed operations, so that temporary failures do not prevent message delivery.

#### Acceptance Criteria

1. WHEN a Twitch API call fails with a 429 (Rate Limit) error, THEN THE System SHALL wait for the duration specified in the Retry-After header before retrying
2. WHEN a message send fails with a transient error (500, 502, 503), THEN THE System SHALL retry with exponential backoff (1s, 2s, 4s, 8s) up to 4 attempts
3. WHEN a message send fails with a permanent error (401, 403, 404), THEN THE System SHALL not retry and record the error
4. WHEN any error occurs, THE System SHALL log the error with context (subscriber_id, error_code, error_message, timestamp) to structured logs
5. WHEN an error occurs in production, THE System SHALL notify Discord with error level, title, message, and context
6. WHEN a retry succeeds after previous failures, THE System SHALL update the contact_status to "sent" and clear the error_message

### Requirement 7: Authorization and Access Control

**User Story:** As a system, I want to ensure only authorized users can access subscriber data and send messages, so that subscriber privacy is protected.

#### Acceptance Criteria

1. WHEN a user accesses the subscriber management panel, THE System SHALL verify the user is authenticated and is EITHER the channel owner OR a channel admin
2. WHEN an unauthenticated user attempts to access the panel, THE System SHALL redirect to the login page
3. WHEN an unauthorized user attempts to access the panel, THE System SHALL return a 403 Forbidden error
4. WHEN the Admin (channel owner or channel admin) accesses the panel, THE System SHALL verify the Twitch OAuth token has the required scopes (channel:read:subscriptions, channel:manage:whispers)
5. IF the OAuth token is missing required scopes, THEN THE System SHALL prompt the Admin to re-authenticate with the correct scopes
6. WHEN a channel admin is added to the channel, THE System SHALL grant them access to the subscriber management panel immediately
7. WHEN a channel admin is removed from the channel, THE System SHALL revoke their access to the subscriber management panel immediately

### Requirement 8: Data Validation and Sanitization

**User Story:** As a system, I want to validate and sanitize all data, so that invalid or malicious data does not corrupt the system.

#### Acceptance Criteria

1. WHEN subscriber data is received from Twitch API, THE System SHALL validate that twitch_user_id, twitch_username, subscription_tier, and subscription_date are present and valid
2. WHEN a message is prepared for sending, THE System SHALL validate that the message content is not empty and does not exceed Twitch's character limit (500 characters)
3. WHEN subscriber data is stored in the database, THE System SHALL sanitize all string fields to prevent SQL injection
4. WHEN filtering subscribers by contact_status, THE System SHALL validate that the filter value is one of: sent, not_sent, failed, blocked, banned
5. IF validation fails, THEN THE System SHALL return a descriptive error message and not proceed with the operation

### Requirement 9: Performance and Scalability

**User Story:** As a system, I want to handle large subscriber lists efficiently, so that the system remains responsive even with 1600+ subscribers.

#### Acceptance Criteria

1. WHEN fetching subscribers from Twitch API, THE System SHALL use pagination to retrieve data in chunks of 100
2. WHEN storing subscribers in the database, THE System SHALL create an index on (channel_id, twitch_user_id) for fast lookups
3. WHEN querying subscribers, THE System SHALL use database indexes to ensure queries complete within 500ms
4. WHEN displaying the subscriber list in the admin panel, THE System SHALL paginate results (50 per page) to avoid loading all 1600+ records at once
5. WHEN sending bulk messages, THE System SHALL process messages sequentially with delays to avoid overwhelming the Twitch API

### Requirement 10: Logging and Monitoring

**User Story:** As a system, I want to log all operations and errors, so that I can monitor system health and debug issues.

#### Acceptance Criteria

1. WHEN a subscriber is fetched from Twitch API, THE System SHALL log the event with context: channel_id, subscriber_count, timestamp
2. WHEN a message is sent to a subscriber, THE System SHALL log the event with context: subscriber_id, twitch_username, timestamp, status
3. WHEN an error occurs, THE System SHALL log the error with context: error_code, error_message, operation, timestamp, user_id
4. WHEN a sync operation completes, THE System SHALL log the summary: total_fetched, total_updated, total_new, duration, timestamp
5. WHEN a bulk message operation completes, THE System SHALL log the summary: total_sent, total_failed, total_blocked, total_banned, duration, timestamp

### Requirement 11: Admin Management and Audit Trail

**User Story:** As a channel owner, I want to manage channel admins and track their actions, so that I can maintain control and accountability over subscriber management operations.

#### Acceptance Criteria

1. WHEN a channel admin is added to the channel, THE System SHALL grant them full access to the subscriber management panel with the same permissions as the channel owner
2. WHEN a channel admin is removed from the channel, THE System SHALL revoke their access to the subscriber management panel immediately
3. WHEN an admin (channel owner or channel admin) performs an action (sync, send messages), THE System SHALL log which admin performed the action with their user_id and username
4. WHEN the channel owner views the audit trail, THE System SHALL display all actions performed by any admin with timestamps and details
5. WHEN a channel admin synchronizes subscribers, THE System SHALL record the admin's identity in the sync log
6. WHEN a channel admin sends messages to subscribers, THE System SHALL record the admin's identity in the message send log
7. WHEN multiple admins are present, THE System SHALL allow concurrent access to the subscriber management panel without conflicts
