/**
 * Discount Stats Modal Component
 */

'use client'

import { FC, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { DirectUserDiscount, DiscountLink, CouponCode, DiscountStats } from '@/types/discount.types'

interface DiscountStatsModalProps {
  discount: DirectUserDiscount | DiscountLink | CouponCode
  discountType: 'direct_user' | 'link' | 'coupon'
  onClose: () => void
}

const DiscountStatsModal: FC<DiscountStatsModalProps> = ({ discount, discountType, onClose }) => {
  const [stats, setStats] = useState<DiscountStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [discount.id, discountType])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/discounts/analytics/${discount.id}?type=${discountType}`)
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('[DiscountStatsModal] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">Loading...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
          <p>No stats available</p>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h3 className="text-xl font-bold mb-6">Discount Statistics</h3>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-gray-600">Total Redeemed</p>
            <p className="text-2xl font-bold">{stats.totalRedeemed}</p>
          </div>

          <div className="border-b pb-4">
            <p className="text-gray-600">Revenue Impact</p>
            <p className="text-2xl font-bold">R$ {stats.revenueImpact.toFixed(2)}</p>
          </div>

          <div className="border-b pb-4">
            <p className="text-gray-600">Average Discount Value</p>
            <p className="text-2xl font-bold">R$ {stats.averageDiscountValue.toFixed(2)}</p>
          </div>

          <div className="border-b pb-4">
            <p className="text-gray-600">Redemption Rate</p>
            <p className="text-2xl font-bold">{stats.redemptionRate}</p>
          </div>

          {stats.recentRedemptions.length > 0 && (
            <div>
              <p className="text-gray-600 mb-2">Recent Redemptions</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="text-sm bg-gray-50 p-2 rounded">
                    <p className="font-mono">{redemption.userId.substring(0, 8)}...</p>
                    <p className="text-gray-600">
                      {new Date(redemption.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-6">
          Close
        </Button>
      </div>
    </div>
  )
}

export default DiscountStatsModal
