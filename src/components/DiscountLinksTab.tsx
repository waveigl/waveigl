/**
 * Discount Links Tab Component
 */

'use client'

import { FC, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import DiscountForm from '@/components/DiscountForm'
import DiscountStatsModal from '@/components/DiscountStatsModal'
import type { DiscountLink } from '@/types/discount.types'

interface DiscountLinksTabProps {
  onDiscountCreated?: (discount: any) => void
}

const DiscountLinksTab: FC<DiscountLinksTabProps> = ({ onDiscountCreated }) => {
  const [links, setLinks] = useState<DiscountLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedLink, setSelectedLink] = useState<DiscountLink | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [sortBy, setSortBy] = useState<'created_date' | 'expiration_date'>('created_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchLinks()
  }, [sortBy, sortOrder])

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/discounts/links?sortBy=${sortBy}&sortOrder=${sortOrder}`)
      const data = await response.json()
      if (data.success) {
        setLinks(data.data)
      }
    } catch (error) {
      console.error('[DiscountLinksTab] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (token: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/club?discount_link=${token}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const response = await fetch('/api/discounts/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deletedBy: 'current-user-id' }),
      })

      if (response.ok) {
        setLinks(links.filter((l) => l.id !== id))
      }
    } catch (error) {
      console.error('[DiscountLinksTab] Error deleting link:', error)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/discounts/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setLinks([data.data, ...links])
        setShowForm(false)
        onDiscountCreated?.(data.data)
      }
    } catch (error) {
      console.error('[DiscountLinksTab] Error creating link:', error)
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
        <Button onClick={() => setShowForm(true)}>Generate Link</Button>
      </div>

      {showForm && (
        <DiscountForm
          type="link"
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Token</th>
              <th className="border p-3 text-left">Discount Price</th>
              <th className="border p-3 text-left">Redemptions</th>
              <th className="border p-3 text-left">Expires</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="border p-3 font-mono text-sm">{link.token.substring(0, 16)}...</td>
                <td className="border p-3">R$ {link.discountPrice.toFixed(2)}</td>
                <td className="border p-3">
                  {link.currentRedemptions}/{link.maxRedemptions}
                </td>
                <td className="border p-3">{new Date(link.expirationDate).toLocaleDateString()}</td>
                <td className="border p-3">
                  <span
                    className={
                      link.status === 'active'
                        ? 'text-green-600'
                        : link.status === 'expired'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }
                  >
                    {link.status}
                  </span>
                </td>
                <td className="border p-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(link.token)}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLink(link)
                      setShowStats(true)
                    }}
                  >
                    Stats
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(link.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStats && selectedLink && (
        <DiscountStatsModal
          discount={selectedLink}
          discountType="link"
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}

export default DiscountLinksTab
