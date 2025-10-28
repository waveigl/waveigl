'use client'

import { useEffect, useRef } from 'react'
import { VideoPlayerProps } from '@/types'

export function VideoPlayer({ platform, channelId = 'waveigl', className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Limpar container anterior
    containerRef.current.innerHTML = ''

    const createEmbed = () => {
      switch (platform) {
        case 'twitch':
          const twitchEmbed = document.createElement('iframe')
          twitchEmbed.src = `https://player.twitch.tv/?channel=${channelId}&parent=${window.location.hostname}`
          twitchEmbed.width = '100%'
          twitchEmbed.height = '100%'
          twitchEmbed.frameBorder = '0'
          twitchEmbed.allowFullscreen = true
          twitchEmbed.allow = 'autoplay; fullscreen'
          containerRef.current?.appendChild(twitchEmbed)
          break

        case 'youtube':
          const youtubeEmbed = document.createElement('iframe')
          youtubeEmbed.src = `https://www.youtube.com/embed/${channelId}?autoplay=1&mute=0`
          youtubeEmbed.width = '100%'
          youtubeEmbed.height = '100%'
          youtubeEmbed.frameBorder = '0'
          youtubeEmbed.allowFullscreen = true
          youtubeEmbed.allow = 'autoplay; fullscreen'
          containerRef.current?.appendChild(youtubeEmbed)
          break

        case 'kick':
          const kickEmbed = document.createElement('iframe')
          kickEmbed.src = `https://player.kick.com/${channelId}`
          kickEmbed.width = '100%'
          kickEmbed.height = '100%'
          kickEmbed.frameBorder = '0'
          kickEmbed.allowFullscreen = true
          containerRef.current?.appendChild(kickEmbed)
          break

        default:
          const defaultDiv = document.createElement('div')
          defaultDiv.className = 'flex items-center justify-center h-full bg-gray-800 rounded-lg'
          defaultDiv.innerHTML = `
            <div class="text-center text-white">
              <div class="text-6xl mb-4">📺</div>
              <h3 class="text-xl font-semibold mb-2">Player de Vídeo</h3>
              <p class="text-gray-400">Selecione uma plataforma para começar</p>
            </div>
          `
          containerRef.current?.appendChild(defaultDiv)
      }
    }

    createEmbed()
  }, [platform, channelId])

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full ${className}`}
    />
  )
}
