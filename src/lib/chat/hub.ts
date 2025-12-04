export interface ChatMessage {
  id: string
  platform: 'twitch' | 'youtube' | 'kick'
  username: string
  userId: string
  message: string
  timestamp: number
  badges?: string[]
}

export interface ModerationEvent {
  type: 'mod_added' | 'mod_removed' | 'vip_added' | 'vip_removed' | 'ban' | 'unban' | 'timeout'
  platform: 'twitch' | 'youtube' | 'kick'
  username: string
  userId?: string
  duration?: number
  reason?: string
  timestamp: number
  moderatorName?: string // Nome do moderador que aplicou a punição
}

type ChatSubscriber = (event: ChatMessage) => void
type ModerationSubscriber = (event: ModerationEvent) => void

class ChatHub {
  private subscribers: Set<ChatSubscriber> = new Set()

  subscribe(handler: ChatSubscriber): () => void {
    this.subscribers.add(handler)
    return () => {
      this.subscribers.delete(handler)
    }
  }

  publish(event: ChatMessage): void {
    console.log(`[ChatHub] Publicando mensagem de ${event.username} (${event.platform}): ${event.message.substring(0, 30)}...`)
    console.log(`[ChatHub] Subscribers ativos: ${this.subscribers.size}`)
    for (const sub of this.subscribers) {
      try {
        sub(event)
      } catch (err) {
        console.error('[ChatHub] Erro no subscriber:', err)
      }
    }
  }

  /**
   * Broadcast uma mensagem para todos os subscribers
   * Alias para publish, usado para mensagens de sistema
   */
  broadcast(message: ChatMessage): void {
    this.publish(message)
  }
}

class ModerationHub {
  private subscribers: Set<ModerationSubscriber> = new Set()

  subscribe(handler: ModerationSubscriber): () => void {
    this.subscribers.add(handler)
    return () => {
      this.subscribers.delete(handler)
    }
  }

  publish(event: ModerationEvent): void {
    console.log(`[ModerationHub] Publicando evento: ${event.type} para ${event.username} (${event.platform})`)
    console.log(`[ModerationHub] Subscribers ativos: ${this.subscribers.size}`)
    for (const sub of this.subscribers) {
      try {
        sub(event)
      } catch (err) {
        console.error('[ModerationHub] Erro no subscriber:', err)
      }
    }
  }
}

// Hub para status do YouTube
export interface YouTubeStatusEvent {
  type: 'youtube_status'
  isLive: boolean
  videoId: string | null
  liveChatId: string | null
  timestamp: number
}

type YouTubeStatusSubscriber = (event: YouTubeStatusEvent) => void

class YouTubeStatusHub {
  private subscribers: Set<YouTubeStatusSubscriber> = new Set()
  private lastStatus: YouTubeStatusEvent | null = null

  subscribe(callback: YouTubeStatusSubscriber): () => void {
    this.subscribers.add(callback)
    // Enviar status atual imediatamente se disponível
    if (this.lastStatus) {
      callback(this.lastStatus)
    }
    return () => this.subscribers.delete(callback)
  }

  publish(event: YouTubeStatusEvent): void {
    // Só publicar se o status mudou
    if (this.lastStatus?.isLive === event.isLive && this.lastStatus?.liveChatId === event.liveChatId) {
      return
    }
    
    console.log(`[YouTubeStatusHub] Status mudou: isLive=${event.isLive}, liveChatId=${event.liveChatId}`)
    this.lastStatus = event
    
    for (const sub of this.subscribers) {
      try {
        sub(event)
      } catch (err) {
        console.error('[YouTubeStatusHub] Erro no subscriber:', err)
      }
    }
  }
  
  getLastStatus(): YouTubeStatusEvent | null {
    return this.lastStatus
  }
}

// Usar globalThis para persistir hubs entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __chatHub: ChatHub | undefined
  // eslint-disable-next-line no-var
  var __moderationHub: ModerationHub | undefined
  // eslint-disable-next-line no-var
  var __youtubeStatusHub: YouTubeStatusHub | undefined
}

// Criar ou reutilizar instâncias existentes
if (!globalThis.__chatHub) {
  globalThis.__chatHub = new ChatHub()
}
if (!globalThis.__moderationHub) {
  globalThis.__moderationHub = new ModerationHub()
}
if (!globalThis.__youtubeStatusHub) {
  globalThis.__youtubeStatusHub = new YouTubeStatusHub()
}

export const chatHub = globalThis.__chatHub
export const moderationHub = globalThis.__moderationHub
export const youtubeStatusHub = globalThis.__youtubeStatusHub


