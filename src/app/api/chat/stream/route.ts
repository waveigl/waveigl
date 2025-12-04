import { NextRequest } from 'next/server'
import { chatHub, moderationHub, youtubeStatusHub } from '@/lib/chat/hub'
import { startTwitchReader } from '@/lib/chat/twitch'
import { startKickReader } from '@/lib/chat/kick'
import { startYouTubeReader } from '@/lib/chat/youtube'
import { messageQueue } from '@/lib/chat/queue'
import { initializeQueueSenders } from '@/lib/chat/queue-init'

export const dynamic = 'force-dynamic'

let connectorsStarted = false

export async function GET(_req: NextRequest) {
  if (!connectorsStarted) {
    // inicializa leitores de chat de todas as plataformas
    connectorsStarted = true
    
    // Inicializar funções de envio na fila
    initializeQueueSenders(messageQueue)
    
    // Iniciar leitor da Twitch
    startTwitchReader().catch((err) => {
      console.error('[Chat Stream] Erro ao iniciar Twitch reader:', err)
    })
    
    // Iniciar leitor da Kick
    startKickReader().catch((err) => {
      console.error('[Chat Stream] Erro ao iniciar Kick reader:', err)
    })
    
    // Iniciar leitor do YouTube
    startYouTubeReader().catch((err) => {
      console.error('[Chat Stream] Erro ao iniciar YouTube reader:', err)
    })
  }
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let isClosed = false

      const send = (event: object) => {
        if (isClosed) return
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          // Ignore error if controller is already closed
        }
      }
      
      // Subscribe para mensagens de chat
      const unsubscribeChat = chatHub.subscribe(send)
      
      // Subscribe para eventos de moderação
      const unsubscribeMod = moderationHub.subscribe((event) => {
        send({ ...event, eventType: 'moderation' })
      })
      
      // Subscribe para status do YouTube (evita polling no frontend)
      const unsubscribeYoutube = youtubeStatusHub.subscribe((event) => {
        send({ ...event, eventType: 'youtube_status' })
      })
      
      // hello event
      send({ type: 'hello', ts: Date.now() })
      
      // Enviar status atual do YouTube imediatamente (se disponível)
      const currentYtStatus = youtubeStatusHub.getLastStatus()
      if (currentYtStatus) {
        send({ ...currentYtStatus, eventType: 'youtube_status' })
      }
      
      // keep-alive
      const interval = setInterval(() => {
        if (isClosed) {
            clearInterval(interval)
            return
        }
        send({ type: 'ping', ts: Date.now() })
      }, 25000)
      
      // cleanup
      return () => {
        isClosed = true
        clearInterval(interval)
        unsubscribeChat()
        unsubscribeMod()
        unsubscribeYoutube()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
