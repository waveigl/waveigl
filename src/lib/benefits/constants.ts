/**
 * Constantes e tipos para benefícios de subscribers
 * Este arquivo pode ser importado em Client Components
 */

export interface SubscriberBenefit {
  id: string
  user_id: string
  platform: 'twitch' | 'kick' | 'youtube'
  tier: string
  subscribed_at: string
  expires_at: string | null
  whatsapp_code: string | null
  whatsapp_claimed_at: string | null
  whatsapp_joined_at: string | null
  discord_linked: boolean
  discord_claimed_at: string | null
  onboarding_step: number
  onboarding_dismissed_at: string | null
  is_gift: boolean
  gifter_username: string | null
  created_at: string
  updated_at: string
}

export interface DiscordConnection {
  id: string
  user_id: string
  discord_id: string
  discord_username: string
  discord_discriminator: string | null
  discord_avatar: string | null
  connected_at: string
  updated_at: string
}

/**
 * Lista de vantagens de subscriber
 */
export const SUBSCRIBER_BENEFITS_LIST = [
  {
    id: 'no_ads',
    title: 'Sem propagandas',
    description: 'Não assiste propagandas da plataforma que virou sub',
    icon: '🚫'
  },
  {
    id: 'emotes',
    title: 'Emotes exclusivos',
    description: 'Use os emotes do WAVEIGL no chat',
    icon: '😎'
  },
  {
    id: 'sub_tag',
    title: 'Tag de SUB',
    description: 'Badge especial de subscriber no chat',
    icon: '🏷️'
  },
  {
    id: 'highlighted_messages',
    title: 'Mensagens em destaque',
    description: 'Suas mensagens aparecem destacadas no chat',
    icon: '✨'
  },
  {
    id: 'whatsapp_group',
    title: 'Grupo de WhatsApp',
    description: 'Acesso ao grupo exclusivo de subs',
    icon: '📱'
  },
  {
    id: 'discord_role',
    title: 'Discord exclusivo',
    description: 'Acesso ao Clã do Wave no Discord',
    icon: '🎮'
  }
] as const

export type BenefitId = typeof SUBSCRIBER_BENEFITS_LIST[number]['id']

/**
 * Gera um código único para WhatsApp no formato WAVE-XXXXXX
 * (função pura, pode ser usada no cliente)
 */
export function generateWhatsAppCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sem O, 0, I, 1 para evitar confusão
  let code = 'WAVE-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calcula a data de expiração do benefício (31 dias após inscrição)
 */
export function calculateExpiryDate(subscribedAt: Date = new Date()): Date {
  const expiry = new Date(subscribedAt)
  expiry.setDate(expiry.getDate() + 31)
  return expiry
}

/**
 * Verifica se um benefício está ativo (não expirou)
 */
export function isBenefitActive(benefit: SubscriberBenefit): boolean {
  if (!benefit.expires_at) return true
  return new Date(benefit.expires_at) > new Date()
}

