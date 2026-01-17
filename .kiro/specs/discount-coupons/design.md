# Design Document: Discount Coupons & Personalized Pricing

## Overview

This design implements a comprehensive discount management system for WaveIGL's club subscriptions. The system supports three discount strategies (direct user discounts, limited-use discount links, and coupon codes) and integrates with Mercado Pago's PreApproval API to apply custom pricing at subscription creation time.

The implementation follows a modular architecture with separate components for each discount type, a centralized management dashboard, and comprehensive audit logging for compliance and analytics.

## Architecture

### High-Level Flow

```
Discount Creation (Admin)
    ↓
Store in Database
    ↓
User Attempts Subscription
    ↓
Validate Discount (exists, active, not expired, has redemptions)
    ↓
Apply Custom Price to PreApproval
    ↓
Create Subscription with Discount Metadata
    ↓
Log Redemption & Decrement Counter
    ↓
Track Revenue Impact
```

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Discount Management Panel                 │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Direct Users │ Discount     │ Coupon Codes             │ │
│  │              │ Links        │                          │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Discount Service Layer                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Direct User  │ Discount     │ Coupon Code              │ │
│  │ Service      │ Link Service │ Service                  │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Discount Validator                        │
│  - Validate discount exists                                 │
│  - Check if active/not expired                              │
│  - Verify redemptions available                             │
│  - Check permissions                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Mercado Pago Integration                  │
│  - Create PreApproval with custom price                     │
│  - Include discount metadata                                │
│  - Store subscription-discount relationship                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Audit & Analytics                         │
│  - Log redemptions                                          │
│  - Track revenue impact                                     │
│  - Generate reports                                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

#### Direct User Discounts Table
```sql
CREATE TABLE direct_user_discounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  discount_price DECIMAL(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### Discount Links Table
```sql
CREATE TABLE discount_links (
  id UUID PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  discount_price DECIMAL(10, 2) NOT NULL,
  max_redemptions INT NOT NULL,
  current_redemptions INT DEFAULT 0,
  expiration_date TIMESTAMP NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### Coupon Codes Table
```sql
CREATE TABLE coupon_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  discount_price DECIMAL(10, 2) NOT NULL,
  max_redemptions INT NOT NULL,
  current_redemptions INT DEFAULT 0,
  expiration_date TIMESTAMP NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### Discount Redemptions Table
```sql
CREATE TABLE discount_redemptions (
  id UUID PRIMARY KEY,
  discount_type VARCHAR(20) NOT NULL, -- 'direct_user', 'link', 'coupon'
  discount_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  subscription_id VARCHAR(255) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

#### Discount Audit Log Table
```sql
CREATE TABLE discount_audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'redeem'
  discount_type VARCHAR(20) NOT NULL,
  discount_id UUID,
  admin_id UUID REFERENCES profiles(id),
  changes_made JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// Direct User Discount
interface DirectUserDiscount {
  id: string
  userId: string
  discountPrice: number
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  user?: UserProfile
}

// Discount Link
interface DiscountLink {
  id: string
  token: string
  discountPrice: number
  maxRedemptions: number
  currentRedemptions: number
  expirationDate: string
  description?: string
  createdBy: string
  createdAt: string
  isActive: boolean
  status: 'active' | 'exhausted' | 'expired' | 'inactive'
}

// Coupon Code
interface CouponCode {
  id: string
  code: string
  discountPrice: number
  maxRedemptions: number
  currentRedemptions: number
  expirationDate: string
  description?: string
  createdBy: string
  createdAt: string
  isActive: boolean
  status: 'active' | 'exhausted' | 'expired' | 'inactive'
}

// Discount Redemption
interface DiscountRedemption {
  id: string
  discountType: 'direct_user' | 'link' | 'coupon'
  discountId: string
  userId: string
  subscriptionId: string
  discountAmount: number
  finalPrice: number
  redeemedAt: string
  ipAddress?: string
  userAgent?: string
}

// Discount Validation Result
interface DiscountValidationResult {
  isValid: boolean
  error?: string
  discount?: DirectUserDiscount | DiscountLink | CouponCode
  discountAmount?: number
  finalPrice?: number
}

// Discount Stats
interface DiscountStats {
  totalRedeemed: number
  redemptionRate: number
  revenueImpact: number
  averageDiscountValue: number
  recentRedemptions: DiscountRedemption[]
}
```

### API Endpoints

#### Direct User Discounts
- `POST /api/discounts/direct-user` - Create direct user discount
- `GET /api/discounts/direct-user` - List all direct user discounts
- `GET /api/discounts/direct-user/:id` - Get specific discount
- `PUT /api/discounts/direct-user/:id` - Update discount
- `DELETE /api/discounts/direct-user/:id` - Delete discount (soft-delete)

#### Discount Links
- `POST /api/discounts/links` - Generate discount link
- `GET /api/discounts/links` - List all discount links
- `GET /api/discounts/links/:id` - Get specific link
- `GET /api/discounts/links/validate/:token` - Validate link token
- `DELETE /api/discounts/links/:id` - Delete link (soft-delete)

#### Coupon Codes
- `POST /api/discounts/coupons` - Create coupon code
- `GET /api/discounts/coupons` - List all coupons
- `GET /api/discounts/coupons/:id` - Get specific coupon
- `POST /api/discounts/coupons/validate` - Validate coupon code
- `PUT /api/discounts/coupons/:id` - Update coupon
- `DELETE /api/discounts/coupons/:id` - Delete coupon (soft-delete)

#### Discount Validation & Application
- `POST /api/discounts/validate` - Validate any discount type
- `POST /api/discounts/apply` - Apply discount to subscription

#### Analytics
- `GET /api/discounts/analytics` - Get overall discount analytics
- `GET /api/discounts/:id/stats` - Get specific discount stats
- `GET /api/discounts/audit-logs` - Get audit logs
- `POST /api/discounts/export` - Export discount data as CSV

### React Components

#### DiscountManagementPanel
Main component with three tabs for managing all discount types.

```typescript
interface DiscountManagementPanelProps {
  isAdmin: boolean
  onDiscountCreated?: (discount: any) => void
}

// Tabs:
// - DirectUserDiscountsTab
// - DiscountLinksTab
// - CouponCodesTab
```

#### DirectUserDiscountsTab
Manage direct user discounts with search, sort, and CRUD operations.

#### DiscountLinksTab
Manage discount links with copy-to-clipboard, stats, and CRUD operations.

#### CouponCodesTab
Manage coupon codes with stats and CRUD operations.

#### DiscountStatsModal
Display detailed statistics for a specific discount.

#### DiscountForm
Reusable form component for creating/editing discounts.

### Service Layer

#### DirectUserDiscountService
```typescript
class DirectUserDiscountService {
  async createDiscount(userId: string, discountPrice: number, createdBy: string): Promise<DirectUserDiscount>
  async getDiscount(id: string): Promise<DirectUserDiscount | null>
  async listDiscounts(filters?: DiscountFilters): Promise<DirectUserDiscount[]>
  async updateDiscount(id: string, updates: Partial<DirectUserDiscount>): Promise<DirectUserDiscount>
  async deleteDiscount(id: string, deletedBy: string): Promise<void>
  async getDiscountForUser(userId: string): Promise<DirectUserDiscount | null>
}
```

#### DiscountLinkService
```typescript
class DiscountLinkService {
  async generateLink(config: DiscountLinkConfig, createdBy: string): Promise<DiscountLink>
  async getLink(id: string): Promise<DiscountLink | null>
  async listLinks(filters?: DiscountFilters): Promise<DiscountLink[]>
  async validateToken(token: string): Promise<DiscountValidationResult>
  async redeemLink(token: string, userId: string): Promise<DiscountRedemption>
  async deleteLink(id: string, deletedBy: string): Promise<void>
}
```

#### CouponCodeService
```typescript
class CouponCodeService {
  async createCoupon(config: CouponCodeConfig, createdBy: string): Promise<CouponCode>
  async getCoupon(id: string): Promise<CouponCode | null>
  async listCoupons(filters?: DiscountFilters): Promise<CouponCode[]>
  async validateCode(code: string): Promise<DiscountValidationResult>
  async redeemCoupon(code: string, userId: string): Promise<DiscountRedemption>
  async deactivateCoupon(id: string, deactivatedBy: string): Promise<void>
  async deleteCoupon(id: string, deletedBy: string): Promise<void>
}
```

#### DiscountValidator
```typescript
class DiscountValidator {
  async validateDiscount(discountType: string, discountId: string): Promise<DiscountValidationResult>
  validatePrice(price: number, maxPrice: number): boolean
  validateCouponCode(code: string): boolean
  validateExpirationDate(date: string): boolean
  validateRedemptionsAvailable(discount: any): boolean
}
```

#### DiscountAnalyticsService
```typescript
class DiscountAnalyticsService {
  async getOverallAnalytics(filters?: AnalyticsFilters): Promise<DiscountStats>
  async getDiscountStats(discountId: string, discountType: string): Promise<DiscountStats>
  async getRedemptionTimeline(discountId: string, discountType: string): Promise<RedemptionTimeline>
  async exportData(filters?: AnalyticsFilters): Promise<string> // CSV
}
```

## Data Models

### Discount Configuration
```typescript
interface DiscountLinkConfig {
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

interface CouponCodeConfig {
  code: string
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

interface DiscountFilters {
  searchTerm?: string
  sortBy?: 'created_date' | 'expiration_date' | 'remaining_redemptions' | 'total_redeemed'
  sortOrder?: 'asc' | 'desc'
  status?: 'active' | 'exhausted' | 'expired' | 'inactive'
  dateRange?: { start: string; end: string }
}

interface AnalyticsFilters extends DiscountFilters {
  discountType?: 'direct_user' | 'link' | 'coupon'
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Direct User Discount Uniqueness
*For any* user, there should be at most one active direct user discount at any given time. If a new discount is created for a user who already has one, the old one should be deactivated.

**Validates: Requirements 1.4, 1.7**

### Property 2: Discount Price Validation
*For any* discount price, it must be between 0 and the original subscription price (R$ 9.90). Invalid prices should be rejected with an appropriate error message.

**Validates: Requirements 1.3, 6.1**

### Property 3: Discount Link Token Uniqueness
*For any* discount link, the generated token must be unique across all discount links in the system. No two links should have the same token.

**Validates: Requirements 2.3, 2.4**

### Property 4: Discount Link Redemption Counter Consistency
*For any* discount link, the current_redemptions counter should never exceed max_redemptions. When a link is redeemed, the counter should increment by exactly 1.

**Validates: Requirements 2.6, 2.7**

### Property 5: Coupon Code Format Validation
*For any* coupon code, it must be alphanumeric, 4-20 characters long, and unique across all active coupons. Duplicate codes should be rejected.

**Validates: Requirements 3.3, 6.2, 6.3**

### Property 6: Coupon Code Redemption Counter Consistency
*For any* coupon code, the current_redemptions counter should never exceed max_redemptions. When a coupon is redeemed, the counter should increment by exactly 1.

**Validates: Requirements 3.7, 3.8**

### Property 7: Discount Expiration Validation
*For any* discount (link or coupon), if the current time is after expiration_date, the discount should be marked as expired and new redemptions should be rejected.

**Validates: Requirements 2.8, 3.9, 6.4**

### Property 8: PreApproval Custom Price Application
*For any* subscription created with a valid discount, the PreApproval's transaction_amount should equal the discount_price, not the original price.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Discount Metadata Persistence
*For any* subscription created with a discount, the database should contain a record linking the subscription_id to the discount_id with discount_type and discount_source metadata.

**Validates: Requirements 4.4, 4.5**

### Property 10: Discount Renewal Price Consistency
*For any* subscription with an active discount, when the subscription renews, the renewal PreApproval should use the same discount price if the discount is still valid.

**Validates: Requirements 4.6, 4.7**

### Property 11: Discount Audit Trail Completeness
*For any* discount operation (create, update, delete, redeem), an audit log entry should be created with action, admin_id, timestamp, and changes_made fields.

**Validates: Requirements 1.8, 5.8, 8.3, 8.5**

### Property 12: Permission-Based Access Control
*For any* non-admin user attempting to access discount management, the system should deny access and redirect to the dashboard. Only users with admin role should be able to create, modify, or delete discounts.

**Validates: Requirements 8.1, 8.2**

### Property 13: Soft Delete Preservation
*For any* deleted discount, the record should remain in the database with deleted_at timestamp set, but should not appear in active discount lists or be available for redemption.

**Validates: Requirements 1.7, 8.4**

### Property 14: Single Discount Per Subscription
*For any* subscription, only one discount should be applied. If a user attempts to use multiple discounts, only the first valid one should be applied.

**Validates: Requirements 6.7**

### Property 15: Redemption Logging Completeness
*For any* discount redemption, a record should be created in discount_redemptions table with user_id, subscription_id, discount_amount, final_price, and timestamp.

**Validates: Requirements 2.11, 3.12, 7.5**

### Property 16: Analytics Aggregation Accuracy
*For any* discount, the analytics should accurately reflect: total_redeemed (count of redemptions), revenue_impact (sum of discount_amounts), and average_discount_value (mean of discount_amounts).

**Validates: Requirements 7.1, 7.2, 7.5**

## Error Handling

### Validation Errors
- Invalid discount price: Return 400 with message "Discount price must be between R$ 0.00 and R$ 9.90"
- Invalid coupon code format: Return 400 with message "Code must be 4-20 alphanumeric characters"
- Duplicate coupon code: Return 409 with message "This coupon code already exists"
- Invalid discount link token: Return 404 with message "This discount link is no longer valid"
- Exhausted discount: Return 410 with message "This discount has reached its usage limit"
- Expired discount: Return 410 with message "This discount has expired"

### Permission Errors
- Non-admin access: Return 403 with message "You don't have permission to manage discounts"
- Unauthorized modification: Return 403 with message "You can only modify discounts you created"

### System Errors
- Database errors: Log to Discord with level 'error', return 500 with generic message
- Mercado Pago integration errors: Log to Discord with level 'error', return 500 with generic message
- Discount operation failures: Log to Discord with level 'error', include context (discount_id, user_id, operation)

## Testing Strategy

### Unit Tests
- Discount price validation (valid, invalid, boundary values)
- Coupon code format validation (valid, invalid, duplicate)
- Discount expiration logic (expired, not expired, edge cases)
- Redemption counter logic (increment, max reached, edge cases)
- Permission checks (admin, non-admin, edge cases)
- Soft delete logic (deleted records not appearing in lists)

### Property-Based Tests
- **Property 1**: Generate random users and verify at most one active discount per user
- **Property 2**: Generate random prices and verify validation works correctly
- **Property 3**: Generate multiple discount links and verify all tokens are unique
- **Property 4**: Generate discount links, redeem them, and verify counter consistency
- **Property 5**: Generate random coupon codes and verify format validation
- **Property 6**: Generate coupons, redeem them, and verify counter consistency
- **Property 7**: Generate discounts with various expiration dates and verify expiration logic
- **Property 8**: Create subscriptions with discounts and verify PreApproval prices
- **Property 9**: Create subscriptions with discounts and verify database relationships
- **Property 10**: Create subscriptions, simulate renewal, and verify discount persistence
- **Property 11**: Perform discount operations and verify audit logs are created
- **Property 12**: Test access control with various user roles
- **Property 13**: Delete discounts and verify soft-delete behavior
- **Property 14**: Apply multiple discounts and verify only one is applied
- **Property 15**: Redeem discounts and verify redemption logs
- **Property 16**: Create and redeem discounts, verify analytics accuracy

### Integration Tests
- End-to-end discount creation and redemption flow
- Discount application during subscription checkout
- Mercado Pago PreApproval creation with custom pricing
- Discount renewal on subscription renewal
- Analytics calculation and reporting
- CSV export functionality
- Discord notifications on errors

### E2E Tests
- Admin creates direct user discount and user subscribes with it
- Admin generates discount link and user subscribes via link
- Admin creates coupon code and user applies it during checkout
- Admin views discount analytics and exports data
- Admin deletes discount and verifies it's no longer available

## Notes

### Implementation Priorities
1. Core discount creation and validation (Requirements 1, 2, 3)
2. Mercado Pago integration (Requirement 4)
3. Management dashboard (Requirement 5)
4. Analytics and reporting (Requirement 7)
5. Advanced features (percentage discounts, tiered discounts)

### Mercado Pago Integration Details
- Use PreApproval API with custom `transaction_amount` for each subscription
- Include discount metadata in PreApproval `reason` or custom fields
- Store subscription_id returned by Mercado Pago for tracking
- Handle renewal by checking if discount is still valid before creating new PreApproval

### Security Considerations
- Validate all user inputs server-side
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on discount creation endpoints
- Log all discount operations for audit trail
- Sanitize error messages to avoid information disclosure
- Use HTTPS for all discount-related endpoints

### Performance Considerations
- Index discount tables on: user_id, token, code, expiration_date, is_active
- Cache active discounts in Redis for fast validation
- Batch process discount expirations (e.g., daily cleanup job)
- Optimize analytics queries with materialized views or aggregation tables
