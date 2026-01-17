/**
 * Direct User Discounts Tab Component
 * Display and manage direct user discounts
 */

'use client'

import { FC, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import DiscountForm from '@/components/DiscountForm'
import DiscountStatsModal from '@/components/DiscountStatsModal'
import type { DirectUserDiscount } from '@/types/discount.types'

interface DirectUserDiscountsTabProps {
  onDiscountCreated?: (discount: any) => void
}

/**
 * Direct User Discounts Tab
 * Manage direct user discounts with search, sort, and CRUD operations
 */
const DirectUserDiscountsTab: FC<DirectUserDiscountsTabProps> = ({ onDiscountCreated }) => {
  const [discounts, setDiscounts] = useState<DirectUserDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<DirectUserDiscount | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_date' | 'discount_price'>('created_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchDiscounts()
  }, [sortBy, sortOrder])

  const fetchDiscounts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/discounts/direct-user?sortBy=${sortBy}&sortOrder=${sortOrder}`
      )
      const data = await response.json()
      if (data.success) {
        setDiscounts(data.data)
      }
    } catch (error) {
      console.error('[DirectUserDiscountsTab] Error fetching discounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return

    try {
      const response = await fetch('/api/discounts/direct-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deletedBy: 'current-user-id' }),
      })

      if (response.ok) {
        setDiscounts(discounts.filter((d) => d.id !== id))
      }
    } catch (error) {
      console.error('[DirectUserDiscountsTab] Error deleting discount:', error)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/discounts/direct-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setDiscounts([data.data, ...discounts])
        setShowForm(false)
        onDiscountCreated?.(data.data)
      }
    } catch (error) {
      console.error('[DirectUserDiscountsTab] Error creating discount:', error)
    }
  }

  const filteredDiscounts = discounts.filter((d) =>
    d.userId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <input
            type="text"
            placeholder="Search by user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded"
          >
            <option value="created_date">Created Date</option>
            <option value="discount_price">Discount Price</option>
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
        <Button onClick={() => setShowForm(true)}>Create Discount</Button>
      </div>

      {showForm && (
        <DiscountForm
          type="direct_user"
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">User ID</th>
              <th className="border p-3 text-left">Discount Price</th>
              <th className="border p-3 text-left">Created</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiscounts.map((discount) => (
              <tr key={discount.id} className="hover:bg-gray-50">
                <td className="border p-3">{discount.userId}</td>
                <td className="border p-3">R$ {discount.discountPrice.toFixed(2)}</td>
                <td className="border p-3">{new Date(discount.createdAt).toLocaleDateString()}</td>
                <td className="border p-3">
                  <span className={discount.isActive ? 'text-green-600' : 'text-red-600'}>
                    {discount.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="border p-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDiscount(discount)
                      setShowStats(true)
                    }}
                  >
                    Stats
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(discount.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStats && selectedDiscount && (
        <DiscountStatsModal
          discount={selectedDiscount}
          discountType="direct_user"
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}

export default DirectUserDiscountsTab
