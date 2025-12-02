import { LinkedAccount, UserRole } from '@/types'

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
  // Verificar owner
  if (linkedAccounts.some(a => 
    OWNER_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase()
  )) {
    return 'owner'
  }
  
  // Verificar admin
  if (linkedAccounts.some(a => 
    ADMIN_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase()
  )) {
    return 'admin'
  }
  
  // Verificar moderador
  if (linkedAccounts.some(a => a.is_moderator)) {
    return 'moderator'
  }
  
  return 'member'
}

export function canModerate(role: UserRole): boolean {
  return ['owner', 'admin', 'moderator'].includes(role)
}

export function canBan(role: UserRole): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canManageModerators(role: UserRole): boolean {
  return ['owner', 'admin'].includes(role)
}

export function isOwner(role: UserRole): boolean {
  return role === 'owner'
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isModerator(role: UserRole): boolean {
  return role === 'moderator'
}

export function isProtectedLinkedAccounts(linkedAccounts: LinkedAccount[]): boolean {
  // Usuários protegidos: owner e OGabrielToth (admin permanente)
  if (linkedAccounts.some(a => OWNER_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase())) {
    return true
  }
  if (linkedAccounts.some(a => ADMIN_ACCOUNTS[a.platform]?.toLowerCase() === a.platform_username.toLowerCase())) {
    return true
  }
  return false
}
