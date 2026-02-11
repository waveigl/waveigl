# Requirements Document: Real-Time Viewer Counter

## Introduction

The Real-Time Viewer Counter is a feature that displays live viewer counts from Twitch and Kick streaming platforms in a transparent, OBS-compatible format. This feature enables streamers to embed live viewer statistics directly into their stream overlays via OBS browser source, providing real-time visibility of audience engagement across multiple platforms.

## Glossary

- **Viewer_Counter**: The system component that fetches and displays real-time viewer counts
- **Twitch_API**: Twitch's official REST API for retrieving stream information
- **Kick_API**: Kick's API for retrieving stream information
- **OBS**: Open Broadcaster Software - streaming software that supports browser sources
- **Transparent_Page**: A web page with transparent background suitable for OBS overlay
- **Rate_Limiting**: Mechanism to respect API quotas and prevent excessive requests
- **Fallback_Display**: Default display when APIs are unavailable or data cannot be fetched
- **Real_Time_Update**: Automatic refresh of viewer counts without page reload
- **Platform_Icon**: Visual identifier (SVG) for Twitch or Kick platform

## Requirements

### Requirement 1: Display Real-Time Viewer Counts

**User Story:** As a streamer, I want to see live viewer counts from my Twitch and Kick streams, so that I can monitor audience engagement in real-time during my broadcast.

#### Acceptance Criteria

1. WHEN the Viewer_Counter page loads, THE Viewer_Counter SHALL fetch current viewer counts from both Twitch and Kick APIs
2. WHEN viewer counts are successfully retrieved, THE Viewer_Counter SHALL display them in a horizontal layout with platform icons
3. WHEN the Viewer_Counter updates, THE display SHALL refresh without requiring a page reload
4. WHEN a platform has no active stream, THE Viewer_Counter SHALL display zero viewers for that platform
5. WHEN both platforms have active streams, THE Viewer_Counter SHALL display both counts in a single horizontal line

### Requirement 2: OBS-Compatible Transparent Display

**User Story:** As a streamer, I want a transparent background page that I can add to OBS as a browser source, so that the viewer counter integrates seamlessly into my stream overlay.

#### Acceptance Criteria

1. WHEN the Viewer_Counter page is loaded, THE page background SHALL be completely transparent
2. WHEN the page is displayed, THE maximum height SHALL NOT exceed 100 pixels
3. WHEN the page is rendered, THE platform icons SHALL be positioned at the far left with no edge spacing
4. WHEN icons are displayed, THE text SHALL be vertically centered relative to the icon height
5. WHEN the page is viewed in OBS, THE transparency SHALL be preserved and recognized by OBS browser source

### Requirement 3: Visual Layout and Styling

**User Story:** As a streamer, I want a clean, bold visual design that is easily readable during a live broadcast, so that viewers can clearly see the viewer counts.

#### Acceptance Criteria

1. WHEN the Viewer_Counter is displayed, THE text SHALL be bold for maximum visibility
2. WHEN platform icons are shown, THE icons SHALL be small and positioned to the left of their respective viewer counts
3. WHEN multiple platforms are displayed, THE counts SHALL be arranged horizontally in a single line
4. WHEN the page is rendered, THE layout SHALL use horizontal spacing between platform entries
5. WHEN the Viewer_Counter is displayed, THE design SHALL maintain readability at typical OBS overlay sizes

### Requirement 4: Real-Time Updates with Rate Limiting

**User Story:** As a platform operator, I want the viewer counter to update frequently without overwhelming the APIs, so that the system remains stable and respects API quotas.

#### Acceptance Criteria

1. WHEN the Viewer_Counter is active, THE system SHALL update viewer counts at regular intervals
2. WHEN updating viewer counts, THE system SHALL respect Twitch API rate limits (60 requests per minute per user)
3. WHEN updating viewer counts, THE system SHALL respect Kick API rate limits
4. WHEN an API rate limit is approached, THE system SHALL reduce update frequency to prevent quota exhaustion
5. WHEN the update interval is configured, THE system SHALL use a default interval of 30 seconds between updates

### Requirement 5: Error Handling and Fallback Display

**User Story:** As a streamer, I want the viewer counter to gracefully handle API errors, so that the overlay remains visible even when data cannot be fetched.

#### Acceptance Criteria

1. IF a Twitch API request fails, THEN THE Viewer_Counter SHALL display a fallback value (e.g., "—" or "0") for Twitch
2. IF a Kick API request fails, THEN THE Viewer_Counter SHALL display a fallback value for Kick
3. WHEN an API error occurs, THE Viewer_Counter SHALL continue attempting to fetch data at the next update interval
4. IF both APIs are unavailable, THEN THE Viewer_Counter SHALL display both platforms with fallback values
5. WHEN an error occurs, THE system SHALL log the error for debugging purposes

### Requirement 6: API Integration and Authentication

**User Story:** As a system administrator, I want the viewer counter to securely authenticate with Twitch and Kick APIs, so that the feature can reliably fetch viewer data.

#### Acceptance Criteria

1. WHEN the Viewer_Counter initializes, THE system SHALL use TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET from environment variables
2. WHEN the Viewer_Counter initializes, THE system SHALL use KICK_BROADCASTER_USER_ID from environment variables
3. WHEN authenticating with Twitch, THE system SHALL obtain an OAuth token using client credentials flow
4. WHEN authenticating with Kick, THE system SHALL use appropriate authentication method for Kick API
5. WHEN credentials are missing or invalid, THE system SHALL log an error and display fallback values

### Requirement 7: Vercel Deployment Compatibility

**User Story:** As a DevOps engineer, I want the viewer counter to work reliably on Vercel serverless infrastructure, so that the feature is available in production.

#### Acceptance Criteria

1. WHEN the Viewer_Counter runs on Vercel, THE system SHALL use server-side API calls (not client-side scraping)
2. WHEN fetching Kick viewer data, THE system SHALL use Kick's official API (not web scraping)
3. WHEN deployed to Vercel, THE system SHALL handle cold starts gracefully
4. WHEN the system runs on Vercel, THE API calls SHALL complete within serverless timeout limits
5. WHEN environment variables are configured, THE system SHALL access them correctly in Vercel environment

### Requirement 8: Production URL Configuration

**User Story:** As a streamer, I want the viewer counter to work on the production URL (https://www.waveigl.com), so that I can use it in my live broadcasts.

#### Acceptance Criteria

1. WHEN the Viewer_Counter page is accessed, THE system SHALL work correctly on https://www.waveigl.com
2. WHEN the page is loaded from production, THE system SHALL fetch viewer data from production APIs
3. WHEN the page is accessed from OBS, THE CORS headers SHALL allow the browser source to function
4. WHEN the page is displayed, THE production URL SHALL be accessible without authentication
5. WHEN the page is accessed, THE system SHALL use production API credentials from environment variables

### Requirement 9: Caching and Performance

**User Story:** As a platform operator, I want the viewer counter to cache data efficiently, so that the system performs well under load.

#### Acceptance Criteria

1. WHEN viewer data is fetched, THE system SHALL cache the results for a configurable duration (default 10 seconds)
2. WHEN multiple requests arrive within the cache duration, THE system SHALL return cached data instead of making new API calls
3. WHEN the cache expires, THE system SHALL automatically fetch fresh data on the next request
4. WHEN data is cached, THE cache key SHALL include the platform identifier to prevent cross-platform data mixing
5. WHEN the system is under high load, THE caching mechanism SHALL reduce API calls and improve response times

### Requirement 10: Monitoring and Logging

**User Story:** As a system administrator, I want to monitor the viewer counter's performance and errors, so that I can quickly identify and resolve issues.

#### Acceptance Criteria

1. WHEN the Viewer_Counter fetches data, THE system SHALL log structured information including timestamp and platform
2. WHEN an API error occurs, THE system SHALL log the error with context (platform, error code, error message)
3. WHEN the system detects rate limiting, THE system SHALL log a warning with the current request count
4. WHEN critical errors occur, THE system SHALL send notifications to Discord for immediate alerting
5. WHEN the system operates normally, THE system SHALL log INFO level events for audit trail purposes
