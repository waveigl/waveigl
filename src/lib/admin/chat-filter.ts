/**
 * Filtro de mensagens baseado em configurações de admin
 * Verifica se uma mensagem deve ser enviada ou bloqueada
 */

import { getCachedModuleState, isModuleEnabled, isMessageEnabled } from './modules'
import { ChatMessage } from '@/lib/chat/hub'
import { MessageType } from '@/types/admin.types'

/**
 * Detecta o tipo de mensagem baseado no conteúdo
 */
export function detectMessageType(message: string, badges: string[]): MessageType | null {
  const lowerMessage = message.toLowerCase()

  // Detectar por badges (mais confiável)
  if (badges.includes('subscriber')) {
    if (message.includes('gift') || message.includes('presenteado')) {
      return 'gift_subscription'
    }
    return 'subscription'
  }

  // Detectar por conteúdo de mensagem
  if (lowerMessage.includes('raid') || lowerMessage.includes('raided')) {
    return 'raid'
  }

  if (lowerMessage.includes('follow') || lowerMessage.includes('seguindo')) {
    return 'follow'
  }

  if (lowerMessage.includes('cheer') || lowerMessage.includes('bits')) {
    return 'cheer'
  }

  if (lowerMessage.includes('host') || lowerMessage.includes('hospedando')) {
    return 'host'
  }

  // Mensagens do sistema
  if (badges.includes('system') || message.startsWith('[System]')) {
    return 'system_message'
  }

  return null
}

/**
 * Verifica se uma mensagem deve ser processada
 * Retorna false se o módulo ou tipo de mensagem está desabilitado
 */
export async function shouldProcessMessage(
  message: ChatMessage
): Promise<boolean> {
  try {
    // Verificar se o módulo de chat está ativo
    const moduleName = `chat_${message.platform}` as any
    const moduleEnabled = await isModuleEnabled(moduleName)

    if (!moduleEnabled) {
      console.log(`[ChatFilter] Módulo ${moduleName} desabilitado, bloqueando mensagem`)
      return false
    }

    // Detectar tipo de mensagem
    const messageType = detectMessageType(message.message, message.badges || [])

    // Se é um tipo de mensagem especial, verificar se está habilitado
    if (messageType) {
      const messageEnabled = await isMessageEnabled(messageType)

      if (!messageEnabled) {
        console.log(`[ChatFilter] Tipo de mensagem ${messageType} desabilitado, bloqueando`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('[ChatFilter] Erro ao verificar mensagem:', error)
    // Em caso de erro, permitir a mensagem (fail-open)
    return true
  }
}

/**
 * Verifica se um módulo de chat está offline (desabilitado)
 */
export async function isChatOffline(platform: 'twitch' | 'kick' | 'youtube'): Promise<boolean> {
  const moduleName = `chat_${platform}` as any
  const isEnabled = await isModuleEnabled(moduleName)
  return !isEnabled
}

/**
 * Verifica se o player de vídeo está desabilitado
 */
export async function isVideoPlayerOffline(): Promise<boolean> {
  const isEnabled = await isModuleEnabled('video_player')
  return !isEnabled
}

/**
 * Obtém o estado de todos os módulos de chat
 */
export async function getChatModulesStatus(): Promise<{
  twitch: boolean
  kick: boolean
  youtube: boolean
}> {
  const { modules } = await getCachedModuleState()

  return {
    twitch: modules.chat_twitch,
    kick: modules.chat_kick,
    youtube: modules.chat_youtube
  }
}
