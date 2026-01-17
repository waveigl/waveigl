/**
 * Discount Management Panel Component
 * Main component with three tabs for managing all discount types
 */

'use client'

import { FC, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DirectUserDiscountsTab from '@/components/DirectUserDiscountsTab'
import DiscountLinksTab from '@/components/DiscountLinksTab'
import CouponCodesTab from '@/components/CouponCodesTab'

interface DiscountManagementPanelProps {
  isAdmin: boolean
  onDiscountCreated?: (discount: any) => void
}

/**
 * Discount Management Panel
 * Provides interface for managing direct user discounts, discount links, and coupon codes
 */
const DiscountManagementPanel: FC<DiscountManagementPanelProps> = ({
  isAdmin,
  onDiscountCreated,
}) => {
  const [activeTab, setActiveTab] = useState('direct-users')

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">You don't have permission to manage discounts</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Discount Management</h2>
        <p className="text-gray-600">Manage direct user discounts, discount links, and coupon codes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="direct-users">Direct User Discounts</TabsTrigger>
          <TabsTrigger value="links">Discount Links</TabsTrigger>
          <TabsTrigger value="coupons">Coupon Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="direct-users" className="mt-6">
          <DirectUserDiscountsTab onDiscountCreated={onDiscountCreated} />
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <DiscountLinksTab onDiscountCreated={onDiscountCreated} />
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <CouponCodesTab onDiscountCreated={onDiscountCreated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DiscountManagementPanel
