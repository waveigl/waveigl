import { describe, it, expect } from 'vitest'
import { getUserRole, canModerate, canBan, isOwner, isProtectedLinkedAccounts } from '@/lib/permissions'
import type { LinkedAccount } from '@/types'

describe('permissions', () => {
  it('owner se plataforma e platform_user_id batem com OWNER_ACCOUNT_IDS', () => {
    const linked: LinkedAccount[] = [
      { platform: 'twitch', platform_username: 'waveigl', platform_user_id: '173162545', user_id: 'u', id: 'la', is_moderator: false, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    const role = getUserRole(linked)
    expect(role).toBe('owner')
    expect(isOwner(role)).toBe(true)
    expect(canModerate(role)).toBe(true)
    expect(canBan(role)).toBe(true)
  })

  it('admin se plataforma e platform_user_id batem com ADMIN_ACCOUNT_IDS', () => {
    const linked: LinkedAccount[] = [
      { platform: 'twitch', platform_username: 'ogabrieltoth', platform_user_id: '129980106', user_id: 'u', id: 'la', is_moderator: false, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    const role = getUserRole(linked)
    expect(role).toBe('admin')
    expect(canModerate(role)).toBe(true)
    expect(canBan(role)).toBe(true)
  })

  it('moderator se is_moderator = true e não é owner/admin', () => {
    const linked: LinkedAccount[] = [
      { platform: 'twitch', platform_username: 'alguem', platform_user_id: '999', user_id: 'u', id: 'la', is_moderator: true, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    const role = getUserRole(linked)
    expect(role).toBe('moderator')
    expect(canModerate(role)).toBe(true)
    expect(canBan(role)).toBe(false)
  })

  it('user caso contrário', () => {
    const linked: LinkedAccount[] = [
      { platform: 'twitch', platform_username: 'user', platform_user_id: '123', user_id: 'u', id: 'la', is_moderator: false, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    const role = getUserRole(linked)
    expect(role).toBe('user')
    expect(canModerate(role)).toBe(false)
    expect(canBan(role)).toBe(false)
  })

  it('isProtectedLinkedAccounts detecta owner/admin permanentes por ID', () => {
    const ownerLinked: LinkedAccount[] = [
      { platform: 'twitch', platform_username: 'qualquer', platform_user_id: '173162545', user_id: 'u', id: 'la', is_moderator: false, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    expect(isProtectedLinkedAccounts(ownerLinked)).toBe(true)
    const adminLinked: LinkedAccount[] = [
      { platform: 'kick', platform_username: 'qualquer', platform_user_id: '4053403', user_id: 'u', id: 'la', is_moderator: false, access_token: null, refresh_token: null, created_at: '' }
    ] as any
    expect(isProtectedLinkedAccounts(adminLinked)).toBe(true)
  })
})


