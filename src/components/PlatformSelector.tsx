'use client'

import { Button } from '@/components/ui/button'
import { PlatformSelectorProps } from '@/types'
import { Twitch, Youtube, Github } from 'lucide-react'

export function PlatformSelector({ selectedPlatform, onPlatformChange, availablePlatforms }: PlatformSelectorProps) {
  const platforms = [
    {
      id: 'twitch' as const,
      name: 'Twitch',
      icon: Twitch,
      color: 'bg-purple-600 hover:bg-purple-700',
      activeColor: 'bg-purple-500'
    },
    {
      id: 'youtube' as const,
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-red-600 hover:bg-red-700',
      activeColor: 'bg-red-500'
    },
    {
      id: 'kick' as const,
      name: 'Kick',
      icon: Github,
      color: 'bg-green-600 hover:bg-green-700',
      activeColor: 'bg-green-500'
    }
  ]

  return (
    <div className="flex space-x-2">
      {platforms.map((platform) => {
        const Icon = platform.icon
        const isSelected = selectedPlatform === platform.id
        const isAvailable = availablePlatforms.includes(platform.id)
        
        return (
          <Button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            disabled={!isAvailable}
            className={`
              ${isSelected ? platform.activeColor : platform.color}
              ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
              text-white
            `}
          >
            <Icon className="w-4 h-4 mr-2" />
            {platform.name}
          </Button>
        )
      })}
    </div>
  )
}
