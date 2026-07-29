import { getSupabaseAdmin } from '@/lib/supabase/server'

export type Platform = 'twitch' | 'youtube' | 'kick'

export interface SubEvent {
  platform: Platform
  recipientUsername: string
  recipientPlatformUserId: string
  donorUsername?: string
  donorPlatformUserId?: string
  tier?: string
  isGift: boolean
}

export async function handleSubscriptionEvent(event: SubEvent) {
  console.log(`[SUB] ${event.platform}: ${event.recipientUsername} ${event.isGift ? `(gift de ${event.donorUsername})` : '(próprio)'}`)
}

/**
 * Busca usuário vinculado por platform_user_id (simples)
 */
export async function findLinkedUser(platform: Platform, platformUserId: string) {
  const { data } = await getSupabaseAdmin()
    .from('linked_accounts')
    .select('user_id, platform_username')
    .eq('platform', platform)
    .eq('platform_user_id', platformUserId)
    .single()

  return data
}

/**
 * Busca usuário vinculado com dados do perfil (incluindo telefone)
 */
export async function findLinkedUserWithProfile(platform: Platform, platformUserId: string) {
  const { data } = await getSupabaseAdmin()
    .from('linked_accounts')
    .select(`
      user_id,
      platform_username,
      profiles:user_id (
        id,
        phone_number,
        email,
        username
      )
    `)
    .eq('platform', platform)
    .eq('platform_user_id', platformUserId)
    .single()

  if (!data) return null

  // Extrai dados do perfil
  const profile = data.profiles as any
  return {
    user_id: data.user_id,
    platform_username: data.platform_username,
    phone_number: profile?.phone_number || null,
    email: profile?.email || null,
    username: profile?.username || null
  }
}

/**
 * Busca usuário vinculado com dados do perfil (incluindo telefone) pelo username
 */
export async function findLinkedUserWithProfileByUsername(platform: Platform, username: string) {
  const { data } = await getSupabaseAdmin()
    .from('linked_accounts')
    .select(`
      user_id,
      platform_username,
      platform_user_id,
      profiles:user_id (
        id,
        phone_number,
        email,
        username
      )
    `)
    .eq('platform', platform)
    .ilike('platform_username', username)
    .maybeSingle()

  if (!data) return null

  // Extrai dados do perfil
  const profile = data.profiles as any
  return {
    user_id: data.user_id,
    platform_username: data.platform_username,
    platform_user_id: data.platform_user_id,
    phone_number: profile?.phone_number || null,
    email: profile?.email || null,
    username: profile?.username || null
  }
}
