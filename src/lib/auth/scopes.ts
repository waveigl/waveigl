/**
 * Configuração de escopos OAuth para cada plataforma
 * Quando os escopos mudam, os usuários precisam reautenticar
 */

import { UserRole } from '@/types'

// Re-exportar para manter compatibilidade com imports existentes
export type { UserRole }

// Versão dos escopos - incrementar quando adicionar novos escopos obrigatórios
export const SCOPES_VERSION = {
  twitch: 5,
  youtube: 1,
  kick: 1
}

// Escopos necessários para cada plataforma
export const REQUIRED_SCOPES = {
  twitch: [
    'user:read:email',
    'chat:read',
    'chat:edit',
    'moderator:manage:banned_users',
    'user:read:moderated_channels', // Para verificar em quais canais o usuário é moderador
    'channel:manage:moderators', // Para adicionar/remover moderadores (requer token do broadcaster)
    'user:manage:whispers' // Para enviar whispers (mensagens privadas)
  ],
  youtube: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube', // Permite gerenciar canal, chat, etc
    'https://www.googleapis.com/auth/contacts' // Permite gerenciar contatos
  ],
  kick: [
    'user:read',
    'chat:write',
    'channel:read'
  ]
} as const

/**
 * Converte array de escopos para string de URL
 */
export function scopesToString(platform: 'twitch' | 'youtube' | 'kick'): string {
  const scopes = REQUIRED_SCOPES[platform]

  if (platform === 'twitch') {
    return scopes.join('+')
  } else if (platform === 'youtube') {
    return scopes.join(' ')
  } else if (platform === 'kick') {
    return scopes.join(' ')
  }

  return scopes.join(' ')
}

/**
 * Verifica se os escopos autorizados incluem todos os escopos necessários
 */
export function hasAllRequiredScopes(
  platform: 'twitch' | 'youtube' | 'kick',
  authorizedScopes: string[] | null
): boolean {
  if (!authorizedScopes || authorizedScopes.length === 0) {
    return false
  }

  const required = REQUIRED_SCOPES[platform]
  return required.every(scope => authorizedScopes.includes(scope))
}

/**
 * Retorna os escopos que estão faltando
 */
export function getMissingScopes(
  platform: 'twitch' | 'youtube' | 'kick',
  authorizedScopes: string[] | null
): string[] {
  if (!authorizedScopes) {
    return [...REQUIRED_SCOPES[platform]]
  }

  const required = REQUIRED_SCOPES[platform]
  return required.filter(scope => !authorizedScopes.includes(scope))
}

/**
 * Hierarquia de cargos (maior número = maior permissão)
 * owner e streamer são equivalentes (nível máximo)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
  streamer: 3 // streamer = owner
}

/**
 * Verifica se um cargo tem permissão igual ou superior a outro
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Configuração visual dos cargos
 */
export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: string }> = {
  owner: { label: 'Streamer', color: 'bg-red-500', icon: '👑' },
  streamer: { label: 'Streamer', color: 'bg-red-500', icon: '👑' },
  admin: { label: 'Admin', color: 'bg-purple-500', icon: '⚡' },
  moderator: { label: 'Mod', color: 'bg-green-500', icon: '🛡️' },
  user: { label: 'Usuário', color: 'bg-gray-500', icon: '👤' }
}
