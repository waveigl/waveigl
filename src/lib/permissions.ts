import { LinkedAccount, UserRole } from '@/types'

// IDs das contas owner (streamer) - mais seguro que usernames
export const OWNER_ACCOUNT_IDS: Record<string, string> = {
  twitch: '173162545',      // waveigl
  youtube: 'waveigl',       // YouTube usa channel handle
  kick: '54454625'          // waveigl
}

// IDs das contas admin - mais seguro que usernames
export const ADMIN_ACCOUNT_IDS: Record<string, string> = {
  twitch: '129980106',      // ogabrieltoth
  youtube: 'OGabrielToth',  // YouTube usa channel handle
  kick: '4053403'           // OGabrielToth
}

// Fallback: usernames (caso IDs não batam)
export const OWNER_ACCOUNTS = {
  twitch: 'waveigl',
  youtube: '@waveigl',
  kick: 'waveigl'
}

export const ADMIN_ACCOUNTS = {
  twitch: 'ogabrieltoth',
  youtube: 'OGabrielToth',
  kick: 'OGabrielToth'
}

export function getUserRole(linkedAccounts: LinkedAccount[]): UserRole {
  // 1. OWNER (WaveIgl) - Strict check by Platform ID
  // WaveIgl is the ONLY owner of this platform.
  const isWaveIgl = linkedAccounts.some(a =>
    OWNER_ACCOUNT_IDS[a.platform] === a.platform_user_id
  )
  if (isWaveIgl) return 'owner'

  // 2. ADMIN (OGabrielToth) - Strict check by Platform ID
  // OGabrielToth is the ONLY admin of this platform.
  const isGabrielAdmin = linkedAccounts.some(a =>
    ADMIN_ACCOUNT_IDS[a.platform] === a.platform_user_id
  )
  if (isGabrielAdmin) return 'admin'

  // 3. MODERATOR - Check if designated by owner/admin
  if (linkedAccounts.some(a => a.is_moderator)) {
    return 'moderator'
  }

  return 'user'
}

export function canModerate(role: UserRole): boolean {
  return ['owner', 'streamer', 'admin', 'moderator'].includes(role)
}

export function canBan(role: UserRole): boolean {
  return ['owner', 'streamer', 'admin'].includes(role)
}

export function canManageModerators(role: UserRole): boolean {
  return ['owner', 'streamer', 'admin'].includes(role)
}

export function isOwner(role: UserRole): boolean {
  return role === 'owner' || role === 'streamer'
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isModerator(role: UserRole): boolean {
  return role === 'moderator'
}

export function isProtectedLinkedAccounts(linkedAccounts: LinkedAccount[]): boolean {
  // Usuários protegidos: owner (WaveIgl) e admin (OGabrielToth)
  // Verificar estritamente por Platform ID

  // 1. Verificar se é WaveIgl (Owner)
  if (linkedAccounts.some(a => OWNER_ACCOUNT_IDS[a.platform] === a.platform_user_id)) {
    return true
  }

  // 2. Verificar se é OGabrielToth (Admin)
  if (linkedAccounts.some(a => ADMIN_ACCOUNT_IDS[a.platform] === a.platform_user_id)) {
    return true
  }

  return false
}
