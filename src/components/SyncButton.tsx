'use client'

/**
 * SyncButton
 * Button to trigger sync with Twitch API
 */

import { FC } from 'react'

interface SyncButtonProps {
  onSync: () => Promise<void>
  isLoading: boolean
}

const SyncButton: FC<SyncButtonProps> = ({ onSync, isLoading }) => {
  return (
    <button
      onClick={onSync}
      disabled={isLoading}
      className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <span>🔄</span>
          Sync with Twitch
        </>
      )}
    </button>
  )
}

export default SyncButton
