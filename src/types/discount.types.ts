/**
 * Discount Types and Interfaces
 * Comprehensive type definitions for all discount-related operations
 */

// ============================================================================
// Direct User Discount Types
// ============================================================================

/**
 * Direct user discount - assigns a specific discount price to an individual user
 */
export interface DirectUserDiscount {
  id: string
  userId: string
  discountPrice: number
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  deletedAt?: string | null
  user?: UserProfile
}

/**
 * Form data for creating/editing direct user discounts
 */
export interface DirectUserDiscountFormData {
  userId: string
  discountPrice: number
}

/**
 * Response from direct user discount API
 */
export interface DirectUserDiscountResponse {
  success: boolean
  data?: DirectUserDiscount
  error?: string
}

// ============================================================================
// Discount Link Types
// ============================================================================

/**
 * Discount link - unique URL with limited redemptions
 */
export interface DiscountLink {
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
  deletedAt?: string | null
  status: 'active' | 'exhausted' | 'expired' | 'inactive'
}

/**
 * Form data for generating discount links
 */
export interface DiscountLinkFormData {
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

/**
 * Response from discount link API
 */
export interface DiscountLinkResponse {
  success: boolean
  data?: DiscountLink
  shareUrl?: string
  error?: string
}

// ============================================================================
// Coupon Code Types
// ============================================================================

/**
 * Coupon code - reusable code with usage limits
 */
export interface CouponCode {
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
  deletedAt?: string | null
  status: 'active' | 'exhausted' | 'expired' | 'inactive'
}

/**
 * Form data for creating coupon codes
 */
export interface CouponCodeFormData {
  code: string
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

/**
 * Response from coupon code API
 */
export interface CouponCodeResponse {
  success: boolean
  data?: CouponCode
  error?: string
}

// ============================================================================
// Discount Validation Types
// ============================================================================

/**
 * Result of discount validation
 */
export interface DiscountValidationResult {
  isValid: boolean
  error?: string
  discount?: DirectUserDiscount | DiscountLink | CouponCode | null
  discountAmount?: number
  finalPrice?: number
  discountType?: 'direct_user' | 'link' | 'coupon'
}

/**
 * Request to validate a discount
 */
export interface ValidateDiscountRequest {
  discountType: 'direct_user' | 'link' | 'coupon'
  discountId?: string
  token?: string
  code?: string
  userId?: string
}

/**
 * Request to apply a discount to a subscription
 */
export interface ApplyDiscountRequest {
  discountType: 'direct_user' | 'link' | 'coupon'
  discountId?: string
  token?: string
  code?: string
  userId: string
  subscriptionId: string
}

// ============================================================================
// Discount Redemption Types
// ============================================================================

/**
 * Record of a discount redemption
 */
export interface DiscountRedemption {
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

// ============================================================================
// Discount Analytics Types
// ============================================================================

/**
 * Overall discount statistics
 */
export interface DiscountStats {
  totalRedeemed: number
  redemptionRate: number
  revenueImpact: number
  averageDiscountValue: number
  recentRedemptions: DiscountRedemption[]
}

/**
 * Redemption timeline data for charts
 */
export interface RedemptionTimeline {
  date: string
  count: number
  revenue: number
}

/**
 * Overall analytics data
 */
export interface OverallAnalytics {
  totalDiscountsCreated: number
  totalRedeemed: number
  totalRevenueFromDiscounts: number
  averageDiscountValue: number
  byType: {
    directUser: DiscountStats
    links: DiscountStats
    coupons: DiscountStats
  }
}

// ============================================================================
// Discount Audit Types
// ============================================================================

/**
 * Audit log entry for discount operations
 */
export interface DiscountAuditLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'redeem'
  discountType: 'direct_user' | 'link' | 'coupon'
  discountId?: string
  adminId?: string
  changesMade?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// ============================================================================
// Filter and Configuration Types
// ============================================================================

/**
 * Filters for discount queries
 */
export interface DiscountFilters {
  searchTerm?: string
  sortBy?: 'created_date' | 'expiration_date' | 'remaining_redemptions' | 'total_redeemed'
  sortOrder?: 'asc' | 'desc'
  status?: 'active' | 'exhausted' | 'expired' | 'inactive'
  dateRange?: {
    start: string
    end: string
  }
}

/**
 * Filters for analytics queries
 */
export interface AnalyticsFilters extends DiscountFilters {
  discountType?: 'direct_user' | 'link' | 'coupon'
}

/**
 * Configuration for discount link generation
 */
export interface DiscountLinkConfig {
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

/**
 * Configuration for coupon code creation
 */
export interface CouponCodeConfig {
  code: string
  discountPrice: number
  maxRedemptions: number
  expirationDate: string
  description?: string
}

// ============================================================================
// User Profile Type (referenced from other types)
// ============================================================================

/**
 * User profile information
 */
export interface UserProfile {
  id: string
  email: string
  fullName?: string
  role?: 'owner' | 'admin' | 'moderator' | 'user'
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Discount-specific error
 */
export class DiscountError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'DiscountError'
  }
}

/**
 * Validation error for discounts
 */
export class DiscountValidationError extends DiscountError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400)
    this.name = 'DiscountValidationError'
  }
}

/**
 * Not found error for discounts
 */
export class DiscountNotFoundError extends DiscountError {
  constructor(discountType: string, id: string) {
    super('NOT_FOUND', `${discountType} discount not found: ${id}`, 404)
    this.name = 'DiscountNotFoundError'
  }
}

/**
 * Permission error for discounts
 */
export class DiscountPermissionError extends DiscountError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super('PERMISSION_DENIED', message, 403)
    this.name = 'DiscountPermissionError'
  }
}

/**
 * Exhausted discount error
 */
export class DiscountExhaustedError extends DiscountError {
  constructor(discountType: string) {
    super('EXHAUSTED', `This ${discountType} discount has reached its usage limit`, 410)
    this.name = 'DiscountExhaustedError'
  }
}

/**
 * Expired discount error
 */
export class DiscountExpiredError extends DiscountError {
  constructor(discountType: string) {
    super('EXPIRED', `This ${discountType} discount has expired`, 410)
    this.name = 'DiscountExpiredError'
  }
}
