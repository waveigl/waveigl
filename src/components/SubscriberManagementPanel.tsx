'use client'

/**
 * SubscriberManagementPanel
 * Main admin panel for managing Twitch subscribers
 */

import { FC, useState, useEffect, useCallback } from 'react'
import { SubscriberStats } from '@/types/twitch.types'
import SubscriberList from './SubscriberList'
import SubscriberFilter from './SubscriberFilter'
import SyncButton from './SyncButton'
import SendMessagesButton from './SendMessagesButton'
import SubscriberStatsDisplay from './SubscriberStats'

interface SubscriberManagementPanelProps {
  channelId: string
}

const SubscriberManagementPanel: FC<SubscriberManagementPanelProps> = ({
  channelId,
}) => {
  const [stats, setStats] = useState<SubscriberStats | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [channelId])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/subscribers/stats?channelId=${channelId}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error('[SubscriberManagementPanel] Error fetching stats:', err)
    }
  }, [channelId])

  const handleSync = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/subscribers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })

      if (!response.ok) throw new Error('Failed to sync subscribers')

      const data = await response.json()
      setLastSyncTime(new Date())
      setSuccessMessage(
        `Synced ${data.data.totalFetched} subscribers successfully`
      )

      // Refresh stats
      await fetchStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [channelId, fetchStats])

  const handleSendMessages = useCallback(
    async (message: string) => {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const response = await fetch('/api/subscribers/send-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, message }),
        })

        if (!response.ok) throw new Error('Failed to send messages')

        const data = await response.json()
        setSuccessMessage(
          `Sent ${data.data.sent} messages, ${data.data.blocked} blocked, ${data.data.banned} banned`
        )

        // Refresh stats
        await fetchStats()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [channelId, fetchStats]
  )

  const isDataOutdated =
    lastSyncTime && new Date().getTime() - lastSyncTime.getTime() > 3600000 // 1 hour

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscriber Management</h1>
        <div className="text-sm text-gray-500">
          {lastSyncTime ? (
            <>
              Last sync: {lastSyncTime.toLocaleString()}
              {isDataOutdated && (
                <span className="ml-2 text-yellow-600">⚠️ Data may be outdated</span>
              )}
            </>
          ) : (
            'Never synced'
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          <p className="font-semibold">Success</p>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      {stats && <SubscriberStatsDisplay stats={stats} />}

      {/* Controls */}
      <div className="flex gap-4">
        <SyncButton onSync={handleSync} isLoading={isLoading} />
        <SendMessagesButton onSend={handleSendMessages} isLoading={isLoading} />
      </div>

      {/* Filter */}
      <SubscriberFilter
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* List */}
      <SubscriberList
        channelId={channelId}
        contactStatusFilter={selectedFilter === 'all' ? undefined : selectedFilter}
      />
    </div>
  )
}

export default SubscriberManagementPanel
