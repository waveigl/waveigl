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
    for (const sub of this.subscribers) {
      try {
        sub(event)
      } catch {
        // ignore subscriber errors
      }
    }
  }
}

// Usar globalThis para persistir hubs entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __chatHub: ChatHub | undefined
  // eslint-disable-next-line no-var
  var __moderationHub: ModerationHub | undefined
}

// Criar ou reutilizar instâncias existentes
if (!globalThis.__chatHub) {
  globalThis.__chatHub = new ChatHub()
}
if (!globalThis.__moderationHub) {
  globalThis.__moderationHub = new ModerationHub()
}

export const chatHub = globalThis.__chatHub
export const moderationHub = globalThis.__moderationHub


