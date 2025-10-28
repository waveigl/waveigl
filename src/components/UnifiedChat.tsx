'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnifiedChatProps, UnifiedMessage } from '@/types'
import { Send, Shield, Clock, Ban } from 'lucide-react'

export function UnifiedChat({ messages, onSendMessage, isModerator, onModerate }: UnifiedChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showModerationMenu, setShowModerationMenu] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return 'bg-purple-500'
      case 'youtube':
        return 'bg-red-500'
      case 'kick':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return '📺'
      case 'youtube':
        return '📺'
      case 'kick':
        return '👑'
      default:
        return '💬'
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleModeration = (userId: string, action: string, duration?: number) => {
    onModerate(userId, action as any, duration, 'Moderação via chat unificado')
    setShowModerationMenu(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="relative group">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${getPlatformColor(message.platform)} flex items-center justify-center text-white text-xs`}>
                  {getPlatformIcon(message.platform)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-sm">
                    {message.username}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {message.platform}
                  </Badge>
                  {message.badges?.map((badge, index) => (
                    <Badge key={index} className="text-xs bg-yellow-500">
                      {badge}
                    </Badge>
                  ))}
                  <span className="text-xs text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1 break-words">
                  {message.message}
                </p>
              </div>

              {/* Moderation Menu */}
              {isModerator && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowModerationMenu(
                      showModerationMenu === message.id ? null : message.id
                    )}
                    className="text-gray-400 hover:text-white border-gray-600"
                  >
                    <Shield className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Moderation Dropdown */}
            {showModerationMenu === message.id && isModerator && (
              <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="p-2 space-y-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleModeration(message.userId, 'timeout', 300)}
                    className="w-full justify-start text-yellow-400 hover:bg-yellow-400/20"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Timeout 5min
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleModeration(message.userId, 'timeout', 1800)}
                    className="w-full justify-start text-yellow-400 hover:bg-yellow-400/20"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Timeout 30min
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleModeration(message.userId, 'ban')}
                    className="w-full justify-start text-red-400 hover:bg-red-400/20"
                  >
                    <Ban className="w-3 h-3 mr-2" />
                    Banir
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            type="submit"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
