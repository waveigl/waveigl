# Requirements Document: Discount Coupons & Personalized Pricing

## Introduction

This feature enables streamers and admins to create personalized discount coupons and pricing links for their club subscriptions. It supports three discount strategies:

1. **Direct User Discounts**: Assign a specific discount price to an individual user
2. **Limited-Use Discount Links**: Generate shareable links with limited redemptions and custom pricing
3. **Coupon Codes**: Create reusable coupon codes with usage limits and custom pricing

The system integrates with Mercado Pago's PreApproval API to apply custom pricing at subscription creation time.

## Glossary

- **Streamer**: The content creator (WaveIGL) who owns the channel
- **Admin**: Gabriel Toth or other administrators with full permissions
- **Discount**: A reduction in subscription price (percentage or fixed amount)
- **Coupon**: A reusable code that applies a discount to subscriptions
- **Discount Link**: A unique URL that pre-applies a discount when clicked
- **PreApproval**: Mercado Pago's subscription/recurring payment system
- **Redemption**: When a user uses a coupon or discount link to subscribe
- **Usage Limit**: Maximum number of times a coupon or link can be redeemed

## Requirements

### Requirement 1: Direct User Discount Management

**User Story:** As a streamer/admin, I want to assign a specific discount price to individual users, so that I can offer personalized pricing to VIPs or special guests.

#### Acceptance Criteria

1. WHEN a streamer/admin navigates to the discount management panel THEN the system SHALL display a form to search and select users
2. WHEN a user is selected THEN the system SHALL display their current subscription status and pricing
3. WHEN a streamer/admin enters a custom price for a user THEN the system SHALL validate the price is between 0 and 100% of the original price
4. WHEN a streamer/admin saves a direct user discount THEN the system SHALL store it in the database with user_id, discount_price, and created_by
5. WHEN a user with a direct discount attempts to subscribe THEN the system SHALL apply the custom price instead of the default price
6. WHEN a streamer/admin views the discount list THEN the system SHALL display all active direct user discounts with user info, discount price, and creation date
7. WHEN a streamer/admin deletes a direct user discount THEN the system SHALL remove it and the user will pay the default price on next subscription renewal
8. WHEN a direct user discount expires or is removed THEN the system SHALL log the action with timestamp and admin who performed it

### Requirement 2: Limited-Use Discount Links

**User Story:** As a streamer/admin, I want to generate unique discount links with limited redemptions, so that I can share exclusive offers with specific audiences.

#### Acceptance Criteria

1. WHEN a streamer/admin clicks "Generate Discount Link" THEN the system SHALL display a form to configure the link
2. WHEN the form is displayed THEN the system SHALL show fields for: discount_price, max_redemptions, expiration_date, and optional description
3. WHEN a streamer/admin generates a discount link THEN the system SHALL create a unique token and store it with all configuration
4. WHEN a discount link is created THEN the system SHALL generate a shareable URL in format: `{app_url}/checkout/club?discount_token={unique_token}`
5. WHEN a user clicks a discount link THEN the system SHALL validate the token exists, hasn't expired, and has remaining redemptions
6. WHEN a user subscribes via a valid discount link THEN the system SHALL apply the custom price and decrement the redemption counter
7. WHEN a discount link reaches zero redemptions THEN the system SHALL mark it as exhausted and prevent further use
8. WHEN a discount link expires THEN the system SHALL prevent new redemptions and display an error message to users
9. WHEN a streamer/admin views discount links THEN the system SHALL display all links with: discount_price, remaining_redemptions, expiration_date, total_redeemed, and status
10. WHEN a streamer/admin deletes a discount link THEN the system SHALL mark it as inactive and prevent further redemptions
11. WHEN a discount link is used THEN the system SHALL log the redemption with user_id, timestamp, and resulting subscription_id

### Requirement 3: Coupon Code Management

**User Story:** As a streamer/admin, I want to create reusable coupon codes with usage limits, so that I can distribute discount codes across multiple channels.

#### Acceptance Criteria

1. WHEN a streamer/admin clicks "Create Coupon Code" THEN the system SHALL display a form to configure the coupon
2. WHEN the form is displayed THEN the system SHALL show fields for: coupon_code, discount_price, max_redemptions, expiration_date, and optional description
3. WHEN a streamer/admin enters a coupon code THEN the system SHALL validate it's unique and follows format: alphanumeric, 4-20 characters, case-insensitive
4. WHEN a streamer/admin creates a coupon THEN the system SHALL store it with all configuration and mark as active
5. WHEN a user enters a coupon code during checkout THEN the system SHALL validate the code exists, is active, hasn't expired, and has remaining redemptions
6. WHEN a valid coupon is applied THEN the system SHALL display the discount amount and new total price
7. WHEN a user subscribes with a valid coupon THEN the system SHALL apply the discount and decrement the redemption counter
8. WHEN a coupon reaches zero redemptions THEN the system SHALL mark it as exhausted and prevent further use
9. WHEN a coupon expires THEN the system SHALL prevent new redemptions and display an error message
10. WHEN a streamer/admin views coupons THEN the system SHALL display all coupons with: code, discount_price, remaining_redemptions, expiration_date, total_redeemed, and status
11. WHEN a streamer/admin deactivates a coupon THEN the system SHALL mark it as inactive and prevent further redemptions
12. WHEN a coupon is redeemed THEN the system SHALL log the redemption with user_id, timestamp, and resulting subscription_id

### Requirement 4: Discount Pricing Integration with Mercado Pago

**User Story:** As a system, I want to apply custom discount prices to Mercado Pago subscriptions, so that discounts are reflected in the actual payment.

#### Acceptance Criteria

1. WHEN a user subscribes with a direct user discount THEN the system SHALL create a PreApproval with the custom price instead of default price
2. WHEN a user subscribes via a discount link THEN the system SHALL create a PreApproval with the custom price from the link
3. WHEN a user subscribes with a coupon code THEN the system SHALL create a PreApproval with the discounted price
4. WHEN creating a PreApproval with custom pricing THEN the system SHALL include metadata with discount_type, discount_source, and discount_id
5. WHEN a PreApproval is created with a discount THEN the system SHALL store the relationship between subscription_id and discount_id for tracking
6. WHEN a subscription with discount is renewed THEN the system SHALL apply the same discount price on renewal (if still valid)
7. WHEN a discount expires but subscription is active THEN the system SHALL revert to default price on next renewal

### Requirement 5: Discount Management Dashboard

**User Story:** As a streamer/admin, I want a centralized dashboard to manage all discount types, so that I can easily track and modify discounts.

#### Acceptance Criteria

1. WHEN a streamer/admin opens the discount management panel THEN the system SHALL display three tabs: Direct Users, Discount Links, Coupon Codes
2. WHEN viewing the Direct Users tab THEN the system SHALL display a table with: user_info, discount_price, created_date, actions (edit, delete)
3. WHEN viewing the Discount Links tab THEN the system SHALL display a table with: discount_price, remaining_redemptions, expiration_date, status, actions (copy_link, view_stats, delete)
4. WHEN viewing the Coupon Codes tab THEN the system SHALL display a table with: code, discount_price, remaining_redemptions, expiration_date, status, actions (deactivate, view_stats, delete)
5. WHEN a streamer/admin clicks "View Stats" on any discount THEN the system SHALL display: total_redeemed, redemption_rate, revenue_impact, and list of recent redemptions
6. WHEN a streamer/admin searches for a discount THEN the system SHALL filter results by code, user, or discount_price
7. WHEN a streamer/admin sorts the discount list THEN the system SHALL support sorting by: created_date, expiration_date, remaining_redemptions, total_redeemed
8. WHEN a discount is created, modified, or deleted THEN the system SHALL log the action with admin_id, timestamp, and changes made

### Requirement 6: Discount Validation & Error Handling

**User Story:** As a system, I want to validate all discount operations and provide clear error messages, so that users and admins understand why operations fail.

#### Acceptance Criteria

1. WHEN a discount price is invalid THEN the system SHALL display an error: "Discount price must be between R$ 0.00 and R$ 9.90"
2. WHEN a coupon code format is invalid THEN the system SHALL display an error: "Code must be 4-20 alphanumeric characters"
3. WHEN a coupon code already exists THEN the system SHALL display an error: "This coupon code already exists"
4. WHEN a discount link token is invalid or expired THEN the system SHALL display an error: "This discount link is no longer valid"
5. WHEN a coupon code is exhausted THEN the system SHALL display an error: "This coupon has reached its usage limit"
6. WHEN a discount link is exhausted THEN the system SHALL display an error: "This discount link has reached its usage limit"
7. WHEN a user tries to use multiple discounts THEN the system SHALL apply only the first valid discount and display: "Only one discount can be applied per subscription"
8. WHEN a discount operation fails THEN the system SHALL log the error with context and notify admin via Discord

### Requirement 7: Discount Analytics & Reporting

**User Story:** As a streamer/admin, I want to see analytics on discount usage and revenue impact, so that I can optimize my discount strategy.

#### Acceptance Criteria

1. WHEN viewing discount analytics THEN the system SHALL display: total_discounts_created, total_redeemed, total_revenue_from_discounts, average_discount_value
2. WHEN viewing a specific discount's stats THEN the system SHALL display: redemption_timeline (chart), revenue_impact, list of users who redeemed
3. WHEN viewing analytics THEN the system SHALL support filtering by: date_range, discount_type, status
4. WHEN exporting discount data THEN the system SHALL generate a CSV with: discount_id, type, code/user/link, price, redemptions, revenue, created_date, status
5. WHEN a discount is redeemed THEN the system SHALL track: user_id, timestamp, subscription_id, discount_amount, final_price

### Requirement 8: Discount Permissions & Security

**User Story:** As a system, I want to ensure only authorized users can manage discounts, so that discount operations are secure and auditable.

#### Acceptance Criteria

1. WHEN a non-admin user tries to access discount management THEN the system SHALL deny access and redirect to dashboard
2. WHEN a streamer/admin creates a discount THEN the system SHALL record their user_id as created_by
3. WHEN a discount is modified THEN the system SHALL record the admin_id and timestamp of modification
4. WHEN a discount is deleted THEN the system SHALL soft-delete it (mark as deleted) and preserve audit trail
5. WHEN viewing discount audit logs THEN the system SHALL display: action, admin_id, timestamp, changes_made, ip_address
6. WHEN a discount operation fails due to permissions THEN the system SHALL log the attempt with user_id and ip_address

## Notes

### Mercado Pago Integration Notes

- **PreApproval API**: Supports custom `transaction_amount` for each subscription
- **Metadata**: Can include custom fields to track discount source
- **Renewal**: Subscriptions renew at the same price unless explicitly modified
- **No Built-in Coupons**: Mercado Pago doesn't have native coupon system, so we implement it in our database
- **First Payment Different**: Can be achieved by creating PreApproval with custom amount

### Implementation Considerations

1. **Discount Types Priority**: If user has multiple discounts, apply the highest discount value
2. **Expiration Handling**: Check expiration at redemption time, not at creation time
3. **Soft Deletes**: Keep audit trail by soft-deleting instead of hard-deleting
4. **Rate Limiting**: Limit discount creation to prevent abuse (e.g., max 100 per day)
5. **Notification**: Notify admin when discount is created/redeemed/exhausted

### Future Enhancements

- Percentage-based discounts (e.g., 20% off)
- Tiered discounts (e.g., buy 3 months, get 1 free)
- Seasonal discount templates
- Automatic discount generation for milestones
- A/B testing different discount strategies
