/**
 * Coupon Codes Tab Component
 */

'use client'

import { FC, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import DiscountForm from '@/components/DiscountForm'
import DiscountStatsModal from '@/components/DiscountStatsModal'
import type { CouponCode } from '@/types/discount.types'

interface CouponCodesTabProps {
  onDiscountCreated?: (discount: any) => void
}

const CouponCodesTab: FC<CouponCodesTabProps> = ({ onDiscountCreated }) => {
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<CouponCode | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [sortBy, setSortBy] = useState<'created_date' | 'expiration_date'>('created_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCoupons()
  }, [sortBy, sortOrder])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/discounts/coupons?sortBy=${sortBy}&sortOrder=${sortOrder}`)
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('[CouponCodesTab] Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) return

    try {
      const response = await fetch('/api/discounts/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: false, updatedBy: 'current-user-id' }),
      })

      if (response.ok) {
        const data = await response.json()
        setCoupons(coupons.map((c) => (c.id === id ? data.data : c)))
      }
    } catch (error) {
      console.error('[CouponCodesTab] Error deactivating coupon:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch('/api/discounts/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deletedBy: 'current-user-id' }),
      })

      if (response.ok) {
        setCoupons(coupons.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('[CouponCodesTab] Error deleting coupon:', error)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/discounts/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setCoupons([data.data, ...coupons])
        setShowForm(false)
        onDiscountCreated?.(data.data)
      }
    } catch (error) {
      console.error('[CouponCodesTab] Error creating coupon:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded"
          >
            <option value="created_date">Created Date</option>
            <option value="expiration_date">Expiration Date</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-4 py-2 border rounded"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <Button onClick={() => setShowForm(true)}>Create Coupon</Button>
      </div>

      {showForm && (
        <DiscountForm
          type="coupon"
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Code</th>
              <th className="border p-3 text-left">Discount Price</th>
              <th className="border p-3 text-left">Redemptions</th>
              <th className="border p-3 text-left">Expires</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-gray-50">
                <td className="border p-3 font-bold">{coupon.code}</td>
                <td className="border p-3">R$ {coupon.discountPrice.toFixed(2)}</td>
                <td className="border p-3">
                  {coupon.currentRedemptions}/{coupon.maxRedemptions}
                </td>
                <td className="border p-3">{new Date(coupon.expirationDate).toLocaleDateString()}</td>
                <td className="border p-3">
                  <span
                    className={
                      coupon.status === 'active'
                        ? 'text-green-600'
                        : coupon.status === 'expired'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }
                  >
                    {coupon.status}
                  </span>
                </td>
                <td className="border p-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCoupon(coupon)
                      setShowStats(true)
                    }}
                  >
                    Stats
                  </Button>
                  {coupon.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeactivate(coupon.id)}
                    >
                      Deactivate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStats && selectedCoupon && (
        <DiscountStatsModal
          discount={selectedCoupon}
          discountType="coupon"
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}

export default CouponCodesTab
