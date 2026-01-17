/**
 * Admin Discount Management Page
 */

import { redirect } from 'next/navigation'
import DiscountManagementPanel from '@/components/DiscountManagementPanel'
import { requireAdminAccess } from '@/lib/discounts/permissions'

/**
 * Discount Management Page
 * Admin-only page for managing all discount types
 */
export default async function DiscountManagementPage() {
  // Check admin access
  try {
    // In a real app, get user from session
    const userRole = 'admin' // TODO: Get from session
    await requireAdminAccess('user-id', userRole)
  } catch (error) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <DiscountManagementPanel isAdmin={true} />
      </div>
    </div>
  )
}
