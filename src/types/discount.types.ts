export type DiscountType = 'direct_user' | 'link' | 'coupon'

export type DiscountStatus = 'active' | 'exhausted' | 'expired' | 'inactive'

export interface BaseDiscount {
  id: string
  discountPrice: number
  maxRedemptions: number
  currentRedemptions: number
  expirationDate: string
  createdBy: string
  createdAt: string
  isActive: boolean
  status: DiscountStatus
}

export interface DirectUserDiscount extends BaseDiscount {
  userId: string
  updatedAt: string
  deletedAt?: string | null
  user?: {
    id: string
    email: string
    fullName: string
  }
}

export interface DiscountLink extends BaseDiscount {
  token: string
  description?: string
  deletedAt?: string | null
}

export interface CouponCode extends BaseDiscount {
  code: string
  deletedAt?: string | null
}

export interface DiscountValidationResult {
  isValid: boolean
  discountAmount?: number
  finalPrice?: number
  discountType?: DiscountType
  discount?: DirectUserDiscount | DiscountLink | CouponCode
  error?: string
}

export interface DiscountRedemption {
  id: string
  discountType: DiscountType
  discountId: string
  userId: string
  subscriptionId: string
  discountAmount: number
  finalPrice: number
  redeemedAt: string
  ipAddress: string
  userAgent: string
}

export interface DiscountStats {
  totalRedeemed: number
  redemptionRate: number
  revenueImpact: number
  averageDiscountValue: number
  recentRedemptions: DiscountRedemption[]
}

export interface DiscountFilters {
  searchTerm?: string
  sortBy?: 'created_date' | 'expiration_date' | 'remaining_redemptions' | 'total_redeemed'
  sortOrder?: 'asc' | 'desc'
  status?: DiscountStatus | null
  dateRange?: {
    start: string
    end: string
  }
}

export interface AnalyticsFilters extends DiscountFilters {
  discountType?: DiscountType
}