/**
 * Sistema de notificação de inscrições
 * Envia mensagens privadas, broadcasts no chat unificado e notificações no Discord
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { chatHub } from '@/lib/chat/hub'
import { sendDiscordSubNotification } from './discord'

export type Platform = 'twitch' | 'youtube' | 'kick'

// Mapeamento de cores/nomes das plataformas
const PLATFORM_NAMES: Record<Platform, { diminutivo: string; cor: string }> = {
  twitch: { diminutivo: 'roxinha', cor: '#9146FF' },
  youtube: { diminutivo: 'vermelhinha', cor: '#FF0000' },
  kick: { diminutivo: 'verdinha', cor: '#53FC18' }
}

export interface SubEvent {
  platform: Platform
  recipientUsername: string
  recipientPlatformUserId: string
  donorUsername?: string // undefined se for sub própria (não gift)
  donorPlatformUserId?: string
  tier?: string // tier1, tier2, tier3, prime
  isGift: boolean
}

/**
 * Processa um evento de inscrição
 * - Envia mensagem privada para quem recebeu
 * - Envia broadcast no chat unificado
 * - Envia notificação no Discord
 */
export async function handleSubscriptionEvent(event: SubEvent) {
  const platformInfo = PLATFORM_NAMES[event.platform]

  // Busca se o usuário está cadastrado no site e tem número
  const userInfo = await findLinkedUserWithProfile(event.platform, event.recipientPlatformUserId)

  // Mensagem para quem RECEBEU a inscrição (privada)
  const recipientMessage = event.isGift
    ? `Você recebeu uma inscrição de presente, vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp`
    : `Obrigado por se inscrever! Vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp`

  // Mensagem broadcast no chat (apenas para gifts)
  if (event.isGift && event.donorUsername) {
    const broadcastMessage = `Você @${event.recipientUsername} recebeu uma inscrição de @${event.donorUsername} na plataforma ${platformInfo.diminutivo}, vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp`

    // Envia no chat unificado via SSE
    chatHub.broadcast({
      id: `sub-${Date.now()}`,
      platform: event.platform,
      username: '🎁 WaveIGL',
      userId: 'system',
      message: broadcastMessage,
      timestamp: Date.now(),
      badges: ['sistema']
    })
  }

  // Tenta enviar mensagem privada na plataforma
  await sendPrivateMessage(event.platform, event.recipientPlatformUserId, recipientMessage)

  // Envia notificação no Discord
  await sendDiscordSubNotification({
    platform: event.platform,
    username: event.recipientUsername,
    platformUserId: event.recipientPlatformUserId,
    phoneNumber: userInfo?.phone_number || null,
    isRegistered: !!userInfo,
    isGift: event.isGift,
    donorUsername: event.donorUsername,
    tier: event.tier
  })

  // Log do evento
  console.log(`[SUB] ${event.platform}: ${event.recipientUsername} ${event.isGift ? `(gift de ${event.donorUsername})` : '(próprio)'} - ${userInfo ? 'cadastrado' : 'não cadastrado'}`)
}

/**
 * Envia mensagem privada/whisper na plataforma especificada
 */
async function sendPrivateMessage(platform: Platform, userId: string, message: string) {
  try {
    switch (platform) {
      case 'twitch':
        await sendTwitchWhisper(userId, message)
        break
      case 'youtube':
        // YouTube não tem whisper nativo
        console.log(`[YouTube] Whisper não disponível para ${userId}`)
        break
      case 'kick':
        // Kick não tem API pública de whisper
        console.log(`[Kick] Whisper não disponível para ${userId}`)
        break
    }
  } catch (error) {
    console.error(`Erro ao enviar mensagem privada (${platform}):`, error)
  }
}

/**
 * Envia whisper na Twitch usando a API
 */
async function sendTwitchWhisper(toUserId: string, message: string) {
  const clientId = process.env.TWITCH_CLIENT_ID
  const accessToken = process.env.TWITCH_BOT_ACCESS_TOKEN
  const fromUserId = process.env.TWITCH_BOT_USER_ID

  if (!clientId || !accessToken || !fromUserId) {
    console.warn('[Twitch] Credenciais de whisper não configuradas')
    return
  }

  const res = await fetch(`https://api.twitch.tv/helix/whispers?from_user_id=${fromUserId}&to_user_id=${toUserId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Twitch whisper failed: ${res.status} - ${error}`)
  }
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
