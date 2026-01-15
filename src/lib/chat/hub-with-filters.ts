/**
 * Chat Hub com suporte a filtros de admin
 * Wrapper que aplica filtros antes de publicar mensagens
 */

import { chatHub, ChatMessage } from '@/lib/chat/hub'
import { shouldProcessMessage } from '@/lib/admin/chat-filter'

/**
 * Publica uma mensagem no chat hub, respeitando filtros de admin
 */
export async function publishMessageWithFilters(message: ChatMessage): Promise<void> {
  try {
    // Verificar se a mensagem deve ser processada
    const shouldProcess = await shouldProcessMessage(message)

    if (!shouldProcess) {
      console.log(
        `[ChatHubFilters] Mensagem bloqueada por filtro de admin: ${message.username} (${message.platform})`
      )
      return
    }

    // Publicar no hub
    chatHub.publish(message)
  } catch (error) {
    console.error('[ChatHubFilters] Erro ao publicar mensagem:', error)
    // Em caso de erro, publicar mesmo assim (fail-open)
    chatHub.publish(message)
  }
}

/**
 * Broadcast de mensagem do sistema, respeitando filtros
 */
export async function broadcastSystemMessageWithFilters(message: string): Promise<void> {
  const systemMessage: ChatMessage = {
    id: `system-${Date.now()}`,
    platform: 'twitch', // Usar Twitch como padrão para mensagens do sistema
    username: 'System',
    userId: 'system',
    message,
    timestamp: Date.now(),
    badges: ['system']
  }

  await publishMessageWithFilters(systemMessage)
}
