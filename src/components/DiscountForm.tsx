/**
 * Discount Form Component
 * Reusable form for creating/editing discounts
 */

'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DiscountValidator } from '@/lib/discounts/validator'

interface DiscountFormProps {
  type: 'direct_user' | 'link' | 'coupon'
  onSubmit: (data: any) => void
  onCancel: () => void
}

const DiscountForm: FC<DiscountFormProps> = ({ type, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    userId: '',
    code: '',
    discountPrice: '',
    maxRedemptions: '',
    expirationDate: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (type === 'direct_user') {
      if (!formData.userId) newErrors.userId = 'User ID is required'
      if (!formData.discountPrice) newErrors.discountPrice = 'Discount price is required'
    } else if (type === 'link') {
      if (!formData.discountPrice) newErrors.discountPrice = 'Discount price is required'
      if (!formData.maxRedemptions) newErrors.maxRedemptions = 'Max redemptions is required'
      if (!formData.expirationDate) newErrors.expirationDate = 'Expiration date is required'
    } else if (type === 'coupon') {
      if (!formData.code) newErrors.code = 'Coupon code is required'
      if (!formData.discountPrice) newErrors.discountPrice = 'Discount price is required'
      if (!formData.maxRedemptions) newErrors.maxRedemptions = 'Max redemptions is required'
      if (!formData.expirationDate) newErrors.expirationDate = 'Expiration date is required'
    }

    // Validate discount price
    if (formData.discountPrice) {
      const price = parseFloat(formData.discountPrice)
      if (isNaN(price) || price < 0 || price > 9.9) {
        newErrors.discountPrice = 'Price must be between 0 and 9.90'
      }
    }

    // Validate coupon code format
    if (type === 'coupon' && formData.code) {
      if (!/^[A-Z0-9]{4,20}$/.test(formData.code.toUpperCase())) {
        newErrors.code = 'Code must be 4-20 alphanumeric characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const submitData: any = {
        createdBy: 'current-user-id',
      }

      if (type === 'direct_user') {
        submitData.userId = formData.userId
        submitData.discountPrice = parseFloat(formData.discountPrice)
      } else if (type === 'link') {
        submitData.discountPrice = parseFloat(formData.discountPrice)
        submitData.maxRedemptions = parseInt(formData.maxRedemptions)
        submitData.expirationDate = formData.expirationDate
        if (formData.description) submitData.description = formData.description
      } else if (type === 'coupon') {
        submitData.code = formData.code.toUpperCase()
        submitData.discountPrice = parseFloat(formData.discountPrice)
        submitData.maxRedemptions = parseInt(formData.maxRedemptions)
        submitData.expirationDate = formData.expirationDate
        if (formData.description) submitData.description = formData.description
      }

      onSubmit(submitData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
      {type === 'direct_user' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">User ID</label>
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              placeholder="UUID of the user"
            />
            {errors.userId && <p className="text-red-600 text-sm mt-1">{errors.userId}</p>}
          </div>
        </>
      )}

      {type === 'coupon' && (
        <div>
          <label className="block text-sm font-medium mb-2">Coupon Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2 border rounded"
            placeholder="e.g., SAVE50"
            maxLength={20}
          />
          {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Discount Price (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="9.90"
          value={formData.discountPrice}
          onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
          className="w-full px-4 py-2 border rounded"
          placeholder="e.g., 5.00"
        />
        {errors.discountPrice && <p className="text-red-600 text-sm mt-1">{errors.discountPrice}</p>}
      </div>

      {(type === 'link' || type === 'coupon') && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Max Redemptions</label>
            <input
              type="number"
              min="1"
              value={formData.maxRedemptions}
              onChange={(e) => setFormData({ ...formData, maxRedemptions: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              placeholder="e.g., 100"
            />
            {errors.maxRedemptions && (
              <p className="text-red-600 text-sm mt-1">{errors.maxRedemptions}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date</label>
            <input
              type="datetime-local"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            />
            {errors.expirationDate && (
              <p className="text-red-600 text-sm mt-1">{errors.expirationDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              placeholder="e.g., Summer promotion"
              maxLength={500}
              rows={3}
            />
            <p className="text-gray-600 text-sm mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>
        </>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default DiscountForm
