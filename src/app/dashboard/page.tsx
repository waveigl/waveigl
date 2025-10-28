'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from '@/components/VideoPlayer'
import { UnifiedChat } from '@/components/UnifiedChat'
import { PlatformSelector } from '@/components/PlatformSelector'
import { Platform, UnifiedMessage } from '@/types'
import { Twitch, Youtube, Github, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitch')
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [isModerator, setIsModerator] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Mock data para demonstração
  useEffect(() => {
    // Simular mensagens do chat
    const mockMessages: UnifiedMessage[] = [
      {
        id: '1',
        platform: 'twitch',
        username: 'user1',
        userId: 'user1',
        message: 'Olá pessoal!',
        timestamp: Date.now() - 10000,
        badges: ['subscriber']
      },
      {
        id: '2',
        platform: 'youtube',
        username: 'user2',
        userId: 'user2',
        message: 'Primeira vez aqui!',
        timestamp: Date.now() - 8000,
        badges: ['member']
      },
      {
        id: '3',
        platform: 'kick',
        username: 'user3',
        userId: 'user3',
        message: 'Chat unificado é incrível!',
        timestamp: Date.now() - 5000,
        badges: []
      }
    ]
    setMessages(mockMessages)
  }, [])

  const handleSendMessage = (message: string) => {
    // Implementar envio de mensagem
    console.log('Enviando mensagem:', message)
  }

  const handleModerate = (userId: string, action: string, duration?: number, reason?: string) => {
    // Implementar moderação
    console.log('Moderando usuário:', userId, action, duration, reason)
  }

  const handleLogout = () => {
    // Implementar logout
    console.log('Logout')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg"></div>
              <span className="text-xl font-bold text-white">WaveIGL</span>
            </div>
            <Badge className="bg-green-500 text-white">
              Clube Ativo
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              <span className="text-white">Usuário</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              availablePlatforms={['twitch', 'youtube', 'kick']}
            />
          </div>
          
          <div className="flex-1 p-6">
            <VideoPlayer
              platform={selectedPlatform}
              channelId="waveigl"
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-96 border-l border-gray-700 bg-gray-800">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Chat Unificado</h3>
              <p className="text-sm text-gray-400">
                Mensagens de Twitch, YouTube e Kick
              </p>
            </div>
            
            <div className="flex-1">
              <UnifiedChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isModerator={isModerator}
                onModerate={handleModerate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
