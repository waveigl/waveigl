'use client'

/**
 * SubscriberStats
 * Display subscriber statistics by contact status
 */

import { FC } from 'react'
import { SubscriberStats } from '@/types/twitch.types'

interface SubscriberStatsDisplayProps {
  stats: SubscriberStats
}

const SubscriberStatsDisplay: FC<SubscriberStatsDisplayProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Subscribers',
      value: stats.total,
      color: 'bg-blue-100 text-blue-800',
      icon: '👥',
    },
    {
      label: 'Contacted',
      value: stats.sent,
      color: 'bg-green-100 text-green-800',
      icon: '✅',
    },
    {
      label: 'Not Contacted',
      value: stats.notSent,
      color: 'bg-gray-100 text-gray-800',
      icon: '⏳',
    },
    {
      label: 'Failed',
      value: stats.failed,
      color: 'bg-red-100 text-red-800',
      icon: '❌',
    },
    {
      label: 'Blocked',
      value: stats.blocked,
      color: 'bg-yellow-100 text-yellow-800',
      icon: '🚫',
    },
    {
      label: 'Banned',
      value: stats.banned,
      color: 'bg-purple-100 text-purple-800',
      icon: '⛔',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg p-4 ${item.color}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </div>
            <div className="text-3xl">{item.icon}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SubscriberStatsDisplay
