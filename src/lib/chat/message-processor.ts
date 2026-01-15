/**
 * Processador de mensagens com suporte a filtros de admin
 * Verifica se uma mensagem deve ser processada antes de enviar
 */

import { ChatMessage } from '@/lib/chat/hub'
import { shouldProcessMessage } from '@/lib/admin/chat-filter'

/**
 * Processa uma mensagem verificando filtros de admin
 * Retorna true se a mensagem deve ser processada
 */
export async function processMessageWithFilters(message: ChatMessage): Promise<boolean> {
  try {
    // Verificar se a mensagem deve ser processada
    const shouldProcess = await shouldProcessMessage(message)

    if (!shouldProcess) {
      console.log(`[MessageProcessor] Mensagem bloqueada por filtro de admin: ${message.username}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[MessageProcessor] Erro ao processar mensagem:', error)
    // Em caso de erro, permitir a mensagem (fail-open)
    return true
  }
}

/**
 * Processa um lote de mensagens
 */
export async function processBatchMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const results = await Promise.all(
    messages.map(async msg => ({
      message: msg,
      shouldProcess: await processMessageWithFilters(msg)
    }))
  )

  return results
    .filter(r => r.shouldProcess)
    .map(r => r.message)
}
