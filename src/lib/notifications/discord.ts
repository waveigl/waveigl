/**
 * Sistema de notificação via Discord
 * Envia mensagens para um canal específico quando alguém se inscreve
 */

export type Platform = 'twitch' | 'youtube' | 'kick'

// Cores das plataformas para embed do Discord
const PLATFORM_COLORS: Record<Platform, number> = {
  twitch: 0x9146FF,  // Roxo
  youtube: 0xFF0000, // Vermelho
  kick: 0x53FC18     // Verde
}

const PLATFORM_NAMES: Record<Platform, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  kick: 'Kick'
}

export interface DiscordSubNotification {
  platform: Platform
  username: string
  platformUserId: string
  phoneNumber: string | null
  isRegistered: boolean
  isGift: boolean
  donorUsername?: string
  tier?: string
}

/**
 * Formata número de telefone para exibição
 */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Formato: +55 (11) 99999-9999
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return `+${digits}`
}

/**
 * Envia notificação de sub para o Discord
 */
export async function sendDiscordSubNotification(notification: DiscordSubNotification): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_SUB_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL
  const notifyUnregistered = process.env.NOTIFY_UNREGISTERED_SUBS !== 'false' // Default: true

  // Se não tiver webhook configurado, apenas loga
  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_SUB_WEBHOOK_URL nem DISCORD_WEBHOOK_URL configurados')
    return false
  }

  // Se não for cadastrado e a variável estiver desativada, não envia
  if (!notification.isRegistered && !notifyUnregistered) {
    console.log(`[Discord] Notificação ignorada (usuário não cadastrado): ${notification.username}`)
    return false
  }

  const platformName = PLATFORM_NAMES[notification.platform]
  const platformColor = PLATFORM_COLORS[notification.platform]

  // Monta a descrição baseada no status de cadastro
  let description: string
  let title: string

  if (notification.isRegistered && notification.phoneNumber) {
    // Usuário CADASTRADO com número
    const formattedPhone = formatPhoneDisplay(notification.phoneNumber)
    title = '🎉 Nova Inscrição (CADASTRADA)'
    description = [
      `**Usuário:** ${notification.username}`,
      `**Plataforma:** ${platformName}`,
      `**Número:** ${formattedPhone}`,
      notification.isGift ? `**Presente de:** ${notification.donorUsername || 'Anônimo'}` : '',
      notification.tier ? `**Tier:** ${notification.tier}` : ''
    ].filter(Boolean).join('\n')
  } else {
    // Usuário NÃO cadastrado ou sem número
    title = '📢 Nova Inscrição (NÃO CADASTRADA)'
    description = [
      `**Usuário:** ${notification.username}`,
      `**Plataforma:** ${platformName}`,
      `**Status:** Sem número vinculado`,
      notification.isGift ? `**Presente de:** ${notification.donorUsername || 'Anônimo'}` : '',
      notification.tier ? `**Tier:** ${notification.tier}` : ''
    ].filter(Boolean).join('\n')
  }

  // Payload do webhook do Discord
  const payload = {
    embeds: [{
      title,
      description,
      color: platformColor,
      timestamp: new Date().toISOString(),
      footer: {
        text: `WaveIGL • ${notification.isRegistered ? 'Cadastrado' : 'Não cadastrado'}`
      }
    }]
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const error = await res.text()
      console.error(`[Discord] Erro ao enviar webhook: ${res.status} - ${error}`)
      return false
    }

    console.log(`[Discord] Notificação enviada: ${notification.username} (${notification.isRegistered ? 'cadastrado' : 'não cadastrado'})`)
    return true

  } catch (error) {
    console.error('[Discord] Erro ao enviar notificação:', error)
    return false
  }
}

/**
 * Envia mensagem simples para o Discord (para testes ou alertas)
 */
export async function sendDiscordMessage(content: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_SUB_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_SUB_WEBHOOK_URL não configurado')
    return false
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })

    return res.ok
  } catch {
    return false
  }
}

