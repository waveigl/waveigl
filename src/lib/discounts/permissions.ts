/**
 * Permission Checks for Discount Management
 * Validates admin access and authorization
 */

import { notifyDiscord } from '@/lib/notifications/discord'

/**
 * Check if user is admin
 * @param userId - User ID
 * @param userRole - User role
 * @returns true if user is admin
 */
export function isAdmin(userRole?: string): boolean {
  return userRole === 'admin' || userRole === 'moderator'
}

/**
 * Verify admin access
 * @param userId - User ID
 * @param userRole - User role
 * @throws Error if not admin
 */
export async function requireAdminAccess(userId: string, userRole?: string): Promise<void> {
  if (!isAdmin(userRole)) {
    console.error('[DiscountPermissions] Unauthorized access attempt:', { userId, userRole })

    await notifyDiscord({
      level: 'warning',
      title: 'Unauthorized Discount Access Attempt',
      message: `User ${userId} attempted to access discount management without admin role`,
      context: { userId, userRole },
    })

    throw new Error('You do not have permission to manage discounts')
  }
}

/**
 * Verify discount ownership
 * @param createdBy - User who created the discount
 * @param currentUserId - Current user ID
 * @returns true if user created the discount or is admin
 */
export function canModifyDiscount(createdBy: string, currentUserId: string): boolean {
  return createdBy === currentUserId
}

/**
 * Verify discount modification permission
 * @param createdBy - User who created the discount
 * @param currentUserId - Current user ID
 * @param userRole - Current user role
 * @throws Error if not authorized
 */
export async function requireDiscountModificationAccess(
  createdBy: string,
  currentUserId: string,
  userRole?: string
): Promise<void> {
  const isAdminUser = isAdmin(userRole)
  const isOwner = canModifyDiscount(createdBy, currentUserId)

  if (!isAdminUser && !isOwner) {
    console.error('[DiscountPermissions] Unauthorized modification attempt:', {
      createdBy,
      currentUserId,
      userRole,
    })

    await notifyDiscord({
      level: 'warning',
      title: 'Unauthorized Discount Modification Attempt',
      message: `User ${currentUserId} attempted to modify discount created by ${createdBy}`,
      context: { createdBy, currentUserId, userRole },
    })

    throw new Error('You can only modify discounts you created')
  }
}

/**
 * Audit log for discount operation
 * @param action - Action performed
 * @param discountId - Discount ID
 * @param userId - User ID
 * @param details - Additional details
 */
export async function logDiscountAudit(
  action: 'create' | 'update' | 'delete' | 'view',
  discountId: string,
  userId: string,
  details?: Record<string, unknown>
): Promise<void> {
  console.log('[DiscountAudit]', action, {
    discountId,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  })
}
