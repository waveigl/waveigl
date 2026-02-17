'use client'

/**
 * SubscriberList
 * Displays paginated list of subscribers
 */

import { FC, useState, useEffect } from 'react'
import { SubscriberWithContact, ContactStatus } from '@/types/twitch.types'

interface SubscriberListProps {
  channelId: string
  contactStatusFilter?: ContactStatus
}

const SubscriberList: FC<SubscriberListProps> = ({
  channelId,
  contactStatusFilter,
}) => {
  const [subscribers, setSubscribers] = useState<SubscriberWithContact[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = 50

  useEffect(() => {
    fetchSubscribers()
  }, [page, contactStatusFilter, channelId])

  const fetchSubscribers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        channelId,
      })

      if (contactStatusFilter) {
        params.append('contactStatus', contactStatusFilter)
      }

      const response = await fetch(`/api/subscribers?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch subscribers')

      const data = await response.json()
      setSubscribers(data.data.data)
      setTotal(data.data.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: ContactStatus) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'not_sent':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800'
      case 'banned':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Error loading subscribers: {error}</p>
      </div>
    )
  }

  if (isLoading && subscribers.length === 0) {
    return <div className="text-center py-8">Loading subscribers...</div>
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Username
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Subscribed
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {sub.twitchUsername}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {sub.subscriptionTier.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(sub.subscriptionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      sub.contact?.contactStatus || 'not_sent'
                    )}`}
                  >
                    {(sub.contact?.contactStatus || 'not_sent').replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
          {total} subscribers
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriberList
