'use client'

import { useEffect, useRef, useState } from 'react'
import { VideoPlayerProps } from '@/types'

interface YouTubeLiveInfo {
  isLive: boolean
  videoId: string | null
  title: string | null
}

interface YouTubeStatusFromProps {
  isLive: boolean
  videoId: string | null
}

interface ExtendedVideoPlayerProps extends VideoPlayerProps {
  youtubeStatusFromSSE?: YouTubeStatusFromProps
}

export function VideoPlayer({ platform, channelId = 'waveigl', className, youtubeStatusFromSSE }: ExtendedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const [isYoutubeLive, setIsYoutubeLive] = useState(false)
  const [youtubeTitle, setYoutubeTitle] = useState<string | null>(null)
  const initialFetchDone = useRef(false)

  // Receber status do YouTube via prop (SSE) - SEM POLLING!
  useEffect(() => {
    if (youtubeStatusFromSSE) {
      setIsYoutubeLive(youtubeStatusFromSSE.isLive)
      setYoutubeVideoId(youtubeStatusFromSSE.videoId)
    }
  }, [youtubeStatusFromSSE])

  // Buscar live do YouTube apenas UMA VEZ na inicialização
  useEffect(() => {
    if (platform !== 'youtube') return
    if (initialFetchDone.current) return
    
    // Se já recebemos via SSE, não precisa buscar
    if (youtubeStatusFromSSE?.videoId) {
      initialFetchDone.current = true
      return
    }

    const fetchYouTubeLive = async () => {
      try {
        const res = await fetch('/api/youtube/live')
        const data: YouTubeLiveInfo = await res.json()
        
        setIsYoutubeLive(data.isLive)
        setYoutubeVideoId(data.videoId)
        setYoutubeTitle(data.title)
        initialFetchDone.current = true
      } catch (error) {
        console.error('Erro ao buscar live YouTube:', error)
      }
    }

    // Delay de 1 segundo para dar tempo do SSE conectar
    const timeout = setTimeout(fetchYouTubeLive, 1000)
    return () => clearTimeout(timeout)
  }, [platform, youtubeStatusFromSSE])

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
          if (youtubeVideoId) {
            // Embed da live atual
            const youtubeEmbed = document.createElement('iframe')
            youtubeEmbed.src = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0`
            youtubeEmbed.width = '100%'
            youtubeEmbed.height = '100%'
            youtubeEmbed.frameBorder = '0'
            youtubeEmbed.allowFullscreen = true
            youtubeEmbed.allow = 'autoplay; fullscreen; encrypted-media'
            containerRef.current?.appendChild(youtubeEmbed)
          } else {
            // Sem live - mostrar embed do canal
            const noLiveDiv = document.createElement('div')
            noLiveDiv.className = 'flex flex-col items-center justify-center h-full bg-card border border-border rounded-lg p-6'
            noLiveDiv.innerHTML = `
              <div class="text-center text-foreground">
                <div class="text-6xl mb-4">📺</div>
                <h3 class="text-xl font-semibold mb-2">Canal WaveIGL</h3>
                <p class="text-muted-foreground mb-4">
                  ${isYoutubeLive ? 'Carregando live...' : 'Nenhuma live ativa no momento'}
                </p>
                <a 
                  href="https://www.youtube.com/@waveigl/live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Abrir Canal no YouTube
                </a>
              </div>
            `
            containerRef.current?.appendChild(noLiveDiv)
          }
          break

        case 'kick':
          const kickEmbed = document.createElement('iframe')
          // Canal da Kick corrigido: waveigloficial
          const kickChannel = channelId === 'waveigl' ? 'waveigloficial' : channelId
          kickEmbed.src = `https://player.kick.com/${kickChannel}`
          kickEmbed.width = '100%'
          kickEmbed.height = '100%'
          kickEmbed.frameBorder = '0'
          kickEmbed.allowFullscreen = true
          containerRef.current?.appendChild(kickEmbed)
          break

        default:
          const defaultDiv = document.createElement('div')
          defaultDiv.className = 'flex items-center justify-center h-full bg-card border border-border rounded-lg'
          defaultDiv.innerHTML = `
            <div class="text-center text-foreground">
              <div class="text-6xl mb-4">📺</div>
              <h3 class="text-xl font-semibold mb-2">Player de Vídeo</h3>
              <p class="text-muted-foreground">Selecione uma plataforma para começar</p>
            </div>
          `
          containerRef.current?.appendChild(defaultDiv)
      }
    }

    createEmbed()
  }, [platform, channelId, youtubeVideoId, isYoutubeLive])

  return (
    <div className="relative w-full h-full">
      {/* Título da live (se disponível) */}
      {platform === 'youtube' && youtubeTitle && (
        <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/70 to-transparent p-3 z-10">
          <div className="flex items-center gap-2">
            {isYoutubeLive && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                AO VIVO
              </span>
            )}
            <span className="text-white text-sm font-medium truncate">
              {youtubeTitle}
            </span>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`w-full h-full ${className}`}
      />
    </div>
  )
}
