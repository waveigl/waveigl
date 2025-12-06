import { LinkedAccount, UserRole } from '@/types'

// IDs das contas owner (streamer) - mais seguro que usernames
export const OWNER_ACCOUNT_IDS: Record<string, string> = {
  twitch: '173162545',      // waveigl
  youtube: 'waveigl',       // YouTube usa channel handle
  kick: '54454625'          // waveigloficial
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
  kick: 'waveigloficial'
}

export const ADMIN_ACCOUNTS = {
  twitch: 'ogabrieltoth',
  youtube: 'OGabrielToth',
  kick: 'OGabrielToth'
}

export function getUserRole(linkedAccounts: LinkedAccount[]): UserRole {
  // Verificar owner por ID primeiro (mais seguro)
  if (linkedAccounts.some(a => 
    OWNER_ACCOUNT_IDS[a.platform] === a.platform_user_id
  )) {
    return 'owner'
  }
  
  // Fallback: verificar owner por username
  if (linkedAccounts.some(a => 
    OWNER_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase()
  )) {
    return 'owner'
  }
  
  // Verificar admin por ID primeiro (mais seguro)
  if (linkedAccounts.some(a => 
    ADMIN_ACCOUNT_IDS[a.platform] === a.platform_user_id
  )) {
    return 'admin'
  }
  
  // Fallback: verificar admin por username
  if (linkedAccounts.some(a => 
    ADMIN_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase()
  )) {
    return 'admin'
  }
  
  // Verificar moderador
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
  // Usuários protegidos: owner e admin (verificar por ID primeiro, depois username)
  
  // Verificar owner por ID
  if (linkedAccounts.some(a => OWNER_ACCOUNT_IDS[a.platform] === a.platform_user_id)) {
    return true
  }
  // Verificar owner por username
  if (linkedAccounts.some(a => OWNER_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase())) {
    return true
  }
  
  // Verificar admin por ID
  if (linkedAccounts.some(a => ADMIN_ACCOUNT_IDS[a.platform] === a.platform_user_id)) {
    return true
  }
  // Verificar admin por username
  if (linkedAccounts.some(a => ADMIN_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase())) {
    return true
  }
  
  return false
}
