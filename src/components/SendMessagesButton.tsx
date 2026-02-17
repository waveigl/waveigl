'use client'

/**
 * SendMessagesButton
 * Button to send bulk messages to uncontacted subscribers
 */

import { FC, useState } from 'react'

interface SendMessagesButtonProps {
  onSend: (message: string) => Promise<void>
  isLoading: boolean
}

const SendMessagesButton: FC<SendMessagesButtonProps> = ({
  onSend,
  isLoading,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setError(null)

    // Validate message
    if (!message.trim()) {
      setError('Message cannot be empty')
      return
    }

    if (message.length > 500) {
      setError('Message cannot exceed 500 characters')
      return
    }

    try {
      await onSend(message)
      setMessage('')
      setShowModal(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <span>💬</span>
            Send Messages
          </>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Send Messages to Uncontacted Subscribers</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (max 500 characters)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setMessage('')
                  setError(null)
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SendMessagesButton
