'use client'

/**
 * SubscriberFilter
 * Filter subscribers by contact status
 */

import { FC } from 'react'
import { ContactStatus } from '@/types/twitch.types'

interface SubscriberFilterProps {
  selectedFilter: ContactStatus | 'all'
  onFilterChange: (filter: ContactStatus | 'all') => void
}

const SubscriberFilter: FC<SubscriberFilterProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const filters = [
    { value: 'all', label: 'All Subscribers' },
    { value: 'sent', label: 'Contacted' },
    { value: 'not_sent', label: 'Not Contacted' },
    { value: 'failed', label: 'Failed' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'banned', label: 'Banned' },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value as ContactStatus | 'all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default SubscriberFilter
