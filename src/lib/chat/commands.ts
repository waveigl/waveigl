/**
 * Processador de comandos do chat
 * Gerencia comandos como !testsub
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { queueMessage } from './queue'
import { createOrUpdateBenefit } from '@/lib/benefits'
import { sendDiscordSubNotification } from '@/lib/notifications/discord'
import { findLinkedUserWithProfileByUsername } from '@/lib/notifications/subscription'
import tmi from 'tmi.js'

// Configuração
const TWITCH_CHANNEL = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

// Cache para evitar processamento duplicado de comandos
// Armazena hash do comando -> timestamp
const processedCommands = new Map<string, number>()
const COMMAND_COOLDOWN_MS = 5000 // 5 segundos de cooldown entre comandos iguais do mesmo usuário

interface CommandContext {
  username: string
  userId: string
  message: string
  platform: 'twitch' | 'kick' | 'youtube'
  badges: string[]
}

/**
 * Gera um hash único para o comando
 */
function getCommandHash(ctx: CommandContext): string {
  return `${ctx.platform}:${ctx.userId}:${ctx.message.toLowerCase().trim()}`
}

/**
 * Verifica se o comando já foi processado recentemente (debounce)
 */
function isCommandDuplicate(ctx: CommandContext): boolean {
  const hash = getCommandHash(ctx)
  const lastProcessed = processedCommands.get(hash)
  const now = Date.now()

  if (lastProcessed && (now - lastProcessed) < COMMAND_COOLDOWN_MS) {
    console.log(`[Commands] Comando duplicado ignorado: ${ctx.message} de ${ctx.username}`)
    return true
  }

  // Registrar este comando
  processedCommands.set(hash, now)

  // Limpar comandos antigos (mais de 1 minuto)
  for (const [key, timestamp] of processedCommands.entries()) {
    if (now - timestamp > 60000) {
      processedCommands.delete(key)
    }
  }

  return false
}

/**
 * Envia mensagem no Discord via Webhook
 */
async function sendDiscordNotification(content: string, embedTitle?: string, embedDescription?: string): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('[Commands] DISCORD_WEBHOOK_URL não configurado')
    return false
  }

  try {
    const payload: any = {}

    if (embedTitle || embedDescription) {
      payload.embeds = [{
        title: embedTitle || 'Notificação',
        description: embedDescription || content,
        color: 0x9146FF, // Roxo Twitch
        timestamp: new Date().toISOString()
      }]
    } else {
      payload.content = content
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('[Commands] Erro ao enviar para Discord:', response.status)
      return false
    }

    console.log('[Commands] ✅ Notificação enviada ao Discord')
    return true
  } catch (error) {
    console.error('[Commands] Erro ao enviar para Discord:', error)
    return false
  }
}

/**
 * Envia mensagem no chat da Twitch usando a conta do streamer
 */
async function sendStreamerMessage(message: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar token do streamer waveigl
    const { data: streamerAccount } = await supabase
      .from('linked_accounts')
      .select('platform_username, access_token')
      .eq('platform', 'twitch')
      .ilike('platform_username', TWITCH_CHANNEL)
      .maybeSingle()

    if (!streamerAccount?.access_token) {
      console.log('[Commands] Token do streamer não encontrado')
      return false
    }

    const client = new tmi.Client({
      identity: {
        username: streamerAccount.platform_username,
        password: `oauth:${streamerAccount.access_token}`
      },
      channels: [TWITCH_CHANNEL],
      connection: { secure: true, reconnect: false }
    })

    await client.connect()
    await client.say(TWITCH_CHANNEL, message)
    await client.disconnect()

    console.log('[Commands] ✅ Mensagem enviada no chat como streamer')
    return true
  } catch (error) {
    console.error('[Commands] Erro ao enviar mensagem como streamer:', error)
    return false
  }
}

/**
 * Envia whisper (mensagem privada) na Twitch usando a conta do streamer
 * 
 * IMPORTANTE: Requer que o streamer tenha reautenticado com o scope 'user:manage:whispers'
 * A Twitch também tem restrições:
 * - A conta precisa ter verificação de telefone
 * - Há rate limits (3 whispers por segundo, 100 por minuto)
 * - Só pode enviar para usuários que seguem o canal ou já interagiram
 */
async function sendStreamerWhisper(targetUsername: string, message: string): Promise<boolean> {
  console.log(`[Whisper] 📤 Iniciando envio de whisper para: ${targetUsername}`)
  
  try {
    const supabase = getSupabaseAdmin()

    // Buscar token do streamer waveigl
    console.log(`[Whisper] Buscando conta do streamer: ${TWITCH_CHANNEL}`)
    const { data: streamerAccount, error: dbError } = await supabase
      .from('linked_accounts')
      .select('platform_username, access_token, platform_user_id, authorized_scopes, refresh_token')
      .eq('platform', 'twitch')
      .ilike('platform_username', TWITCH_CHANNEL)
      .maybeSingle()

    if (dbError) {
      console.error('[Whisper] ❌ Erro ao buscar conta do streamer:', dbError)
      return false
    }

    if (!streamerAccount) {
      console.error('[Whisper] ❌ Conta do streamer não encontrada no banco de dados')
      console.error('[Whisper] Verifique se existe uma conta com platform=twitch e platform_username=waveigl')
      return false
    }

    console.log('[Whisper] ✅ Conta do streamer encontrada:', {
      username: streamerAccount.platform_username,
      hasToken: !!streamerAccount.access_token,
      hasUserId: !!streamerAccount.platform_user_id,
      scopes: streamerAccount.authorized_scopes
    })

    if (!streamerAccount.access_token) {
      console.error('[Whisper] ❌ Token do streamer não encontrado')
      return false
    }

    if (!streamerAccount.platform_user_id) {
      console.error('[Whisper] ❌ platform_user_id do streamer não encontrado')
      return false
    }

    // Verificar se o streamer tem o scope necessário
    // O campo authorized_scopes pode ser string, array, ou null
    let scopes: string[] = []
    if (streamerAccount.authorized_scopes) {
      if (Array.isArray(streamerAccount.authorized_scopes)) {
        scopes = streamerAccount.authorized_scopes
      } else if (typeof streamerAccount.authorized_scopes === 'string') {
        // Pode ser uma string separada por espaços ou vírgulas
        scopes = streamerAccount.authorized_scopes.split(/[\s,]+/).filter(Boolean)
      }
    }

    console.log('[Whisper] Scopes do streamer:', scopes)

    // NOTA: Vamos tentar enviar mesmo sem o scope registrado no banco
    // porque o scope pode ter sido concedido mas não salvo no banco
    const hasWhisperScope = scopes.includes('user:manage:whispers')
    if (!hasWhisperScope) {
      console.warn('[Whisper] ⚠️ Scope user:manage:whispers NÃO encontrado no banco de dados')
      console.warn('[Whisper] Tentando enviar mesmo assim (scope pode existir mas não estar salvo)...')
    }

    // Buscar ID do usuário alvo
    console.log(`[Whisper] Buscando ID do usuário: ${targetUsername}`)
    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${targetUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${streamerAccount.access_token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!
        }
      }
    )

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error(`[Whisper] ❌ Erro ao buscar usuário: ${userResponse.status}`, errorText)
      
      // Se token expirado, tentar renovar
      if (userResponse.status === 401 && streamerAccount.refresh_token) {
        console.log('[Whisper] 🔄 Token expirado, tentando renovar...')
        console.log('[Whisper] Refresh token presente:', !!streamerAccount.refresh_token)
        
        const { refreshTwitchToken } = await import('./twitch')
        // Precisamos do user_id do banco, não do platform_user_id
        const { data: fullAccount } = await supabase
          .from('linked_accounts')
          .select('user_id')
          .eq('platform', 'twitch')
          .ilike('platform_username', TWITCH_CHANNEL)
          .maybeSingle()
        
        if (fullAccount?.user_id) {
          console.log('[Whisper] Chamando refreshTwitchToken...')
          const newToken = await refreshTwitchToken(streamerAccount.refresh_token, fullAccount.user_id)
          if (newToken) {
            console.log('[Whisper] ✅ Token renovado com sucesso! Tentando whisper novamente...')
            return sendStreamerWhisper(targetUsername, message) // Retry com novo token
          } else {
            console.error('[Whisper] ❌ Falha ao renovar token - refresh_token pode estar inválido')
            console.error('[Whisper] → O streamer precisa reautenticar na Twitch')
          }
        } else {
          console.error('[Whisper] ❌ user_id não encontrado para renovar token')
        }
      } else if (userResponse.status === 401 && !streamerAccount.refresh_token) {
        console.error('[Whisper] ❌ Token expirado e SEM refresh_token no banco')
        console.error('[Whisper] → O streamer precisa reautenticar na Twitch')
      }
      return false
    }

    const userData = await userResponse.json()
    const targetUserId = userData.data?.[0]?.id

    if (!targetUserId) {
      console.error(`[Whisper] ❌ Usuário não encontrado na Twitch: ${targetUsername}`)
      return false
    }

    console.log(`[Whisper] ✅ ID do usuário encontrado: ${targetUserId}`)

    // Enviar whisper via API
    console.log(`[Whisper] Enviando whisper de ${streamerAccount.platform_user_id} para ${targetUserId}...`)
    const whisperResponse = await fetch(
      `https://api.twitch.tv/helix/whispers?from_user_id=${streamerAccount.platform_user_id}&to_user_id=${targetUserId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${streamerAccount.access_token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }
    )

    if (whisperResponse.status === 204) {
      console.log(`[Whisper] ✅ Whisper enviado com sucesso para ${targetUsername}!`)
      return true
    }

    const errorData = await whisperResponse.json().catch(() => ({}))
    const errorMessage = errorData.message || `Erro ${whisperResponse.status}`

    console.error(`[Whisper] ❌ Erro ${whisperResponse.status}:`, errorData)

    // Tratar erros específicos com diagnóstico detalhado
    if (whisperResponse.status === 401) {
      console.error('[Whisper] 🔐 ERRO 401 - Não autorizado')
      if (errorMessage.includes('Missing scope')) {
        console.error('[Whisper] → Scope user:manage:whispers não foi concedido')
        console.error('[Whisper] → O streamer precisa reautenticar com o scope correto')
        console.error('[Whisper] → URL de reautenticação: https://id.twitch.tv/oauth2/authorize?...')
      } else {
        console.error('[Whisper] → Token pode estar expirado ou inválido')
      }
      
      // Marcar que precisa reautenticação
      await supabase
        .from('linked_accounts')
        .update({ needs_reauth: true })
        .eq('platform', 'twitch')
        .ilike('platform_username', TWITCH_CHANNEL)
        
    } else if (whisperResponse.status === 400) {
      console.error('[Whisper] ⚠️ ERRO 400 - Requisição inválida')
      console.error('[Whisper] Possíveis causas:')
      console.error('  → Usuário não segue o canal')
      console.error('  → Usuário bloqueou whispers')
      console.error('  → Usuário é o próprio streamer')
      console.error('  → Rate limit excedido (3/s, 100/min)')
      
    } else if (whisperResponse.status === 403) {
      console.error('[Whisper] 🚫 ERRO 403 - Acesso negado')
      console.error('[Whisper] Possíveis causas:')
      console.error('  → Conta do streamer precisa de verificação de telefone')
      console.error('  → Conta do streamer está suspensa')
      console.error('  → Whispers desabilitados para a conta')
      
    } else if (whisperResponse.status === 404) {
      console.error('[Whisper] 🔍 ERRO 404 - Usuário não encontrado')
      console.error(`  → Verifique se ${targetUsername} existe na Twitch`)
      
    } else if (whisperResponse.status === 429) {
      console.error('[Whisper] ⏱️ ERRO 429 - Rate limit excedido')
      console.error('  → Aguarde alguns segundos antes de tentar novamente')
    }

    return false

  } catch (error) {
    console.error('[Whisper] ❌ Erro inesperado ao enviar whisper:', error)
    return false
  }
}

// Badges que indicam moderador
const MODERATOR_BADGES = ['moderator', 'mod', 'broadcaster', 'owner', 'staff', 'admin']

/**
 * Verifica se o usuário é moderador
 */
function isModerator(badges: string[]): boolean {
  return badges.some(badge => MODERATOR_BADGES.includes(badge.toLowerCase()))
}

/**
 * Mapeia nome da plataforma para exibição
 */
function getPlatformDisplayName(platform: string): string {
  switch (platform) {
    case 'twitch': return 'Twitch'
    case 'kick': return 'Kick'
    case 'youtube': return 'YouTube'
    default: return platform
  }
}

/**
 * Envia mensagem de inscrição em todas as plataformas usando o sistema de filas
 * Isso garante rate limiting adequado para não ser bloqueado pelas plataformas
 */
async function broadcastSubscriptionMessage(message: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
  // Usar o sistema de filas para respeitar rate limits
  queueMessage(message, 'all', priority)
  console.log(`[Commands] Mensagem adicionada à fila para todas as plataformas: ${message.substring(0, 50)}...`)
}

/**
 * Processa o comando !testsub (apenas mods)
 * Simula uma inscrição do próprio usuário
 * Cria o benefício no sistema para triggar o popup de onboarding
 */
async function handleTestSubCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testsub de ${ctx.username}`)

  // Verificar se é moderador
  if (!isModerator(ctx.badges)) {
    console.log(`[Commands] !testsub negado - ${ctx.username} não é moderador`)
    return
  }

  const platformName = getPlatformDisplayName(ctx.platform)
  const db = getSupabaseAdmin()

  // Buscar user_id do usuário que executou o comando
  const { data: linkedAccount } = await db
    .from('linked_accounts')
    .select('user_id')
    .eq('platform', ctx.platform)
    .eq('platform_user_id', ctx.userId)
    .maybeSingle()

  if (linkedAccount?.user_id) {
    // Criar benefício para o usuário (isso vai triggar o popup no frontend)
    const benefit = await createOrUpdateBenefit(
      linkedAccount.user_id,
      ctx.platform as 'twitch' | 'kick' | 'youtube',
      'Tier 1 (Teste)',
      false
    )

    if (benefit) {
      console.log(`[Commands] ✅ Benefício criado para ${ctx.username} (ID: ${benefit.id})`)
    } else {
      console.warn(`[Commands] ⚠️ Não foi possível criar benefício para ${ctx.username}`)
    }
  } else {
    console.log(`[Commands] ⚠️ Usuário ${ctx.username} não está cadastrado no sistema`)
  }

  // Mensagem de inscrição
  const subMessage = `🎉 @${ctx.username} se inscreveu com Tier 1 na ${platformName} - Por enquanto, envie seu whatsapp no sussuro para ser convidado para o grupo exclusivo.`

  // Enviar em todas as plataformas
  await broadcastSubscriptionMessage(subMessage)

  // Notificar no Discord
  await sendDiscordNotification(
    '',
    '🎉 Nova Inscrição (Teste)',
    `**Usuário:** ${ctx.username}\n**Tier:** Tier 1\n**Plataforma:** ${platformName}\n**Tipo:** Teste (!testsub)\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
  )

  console.log('[Commands] ✅ !testsub executado com sucesso')
}

/**
 * Processa o comando !testrecebersub (apenas mods)
 * Simula o recebimento de uma inscrição de presente
 * Cria o benefício no sistema (quem recebe gift sub ganha benefício)
 */
async function handleTestReceiveSubCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testrecebersub de ${ctx.username}`)

  // Verificar se é moderador
  if (!isModerator(ctx.badges)) {
    console.log(`[Commands] !testrecebersub negado - ${ctx.username} não é moderador`)
    return
  }

  const platformName = getPlatformDisplayName(ctx.platform)
  const gifterName = 'principedosdragoes'
  const db = getSupabaseAdmin()

  // Buscar user_id do usuário que executou o comando (recebedor)
  const { data: linkedAccount } = await db
    .from('linked_accounts')
    .select('user_id')
    .eq('platform', ctx.platform)
    .eq('platform_user_id', ctx.userId)
    .maybeSingle()

  if (linkedAccount?.user_id) {
    // Criar benefício para o recebedor (isso vai triggar o popup no frontend)
    const benefit = await createOrUpdateBenefit(
      linkedAccount.user_id,
      ctx.platform as 'twitch' | 'kick' | 'youtube',
      'Tier 1 (Teste - Gift)',
      true, // É um gift
      gifterName
    )

    if (benefit) {
      console.log(`[Commands] ✅ Benefício gift criado para ${ctx.username} (ID: ${benefit.id})`)
    } else {
      console.warn(`[Commands] ⚠️ Não foi possível criar benefício para ${ctx.username}`)
    }
  } else {
    console.log(`[Commands] ⚠️ Usuário ${ctx.username} não está cadastrado no sistema`)
  }

  // Mensagem de recebimento de sub
  const subMessage = `🎁 @${ctx.username} recebeu inscrição de presente com Tier 1 de @${gifterName} na ${platformName} - Por enquanto, envie seu whatsapp no sussuro para ser convidado para o grupo exclusivo.`

  // Enviar em todas as plataformas
  await broadcastSubscriptionMessage(subMessage)

  // Notificar no Discord
  await sendDiscordNotification(
    '',
    '🎁 Inscrição de Presente Recebida (Teste)',
    `**Recebedor:** ${ctx.username}\n**Doador:** ${gifterName}\n**Tier:** Tier 1\n**Plataforma:** ${platformName}\n**Tipo:** Teste (!testrecebersub)\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
  )

  console.log('[Commands] ✅ !testrecebersub executado com sucesso')
}

/**
 * Processa o comando !testdoarsub (apenas mods)
 * Simula a doação de uma inscrição
 */
async function handleTestGiftSubCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testdoarsub de ${ctx.username}`)

  // Verificar se é moderador
  if (!isModerator(ctx.badges)) {
    console.log(`[Commands] !testdoarsub negado - ${ctx.username} não é moderador`)
    return
  }

  const platformName = getPlatformDisplayName(ctx.platform)
  const receiverName = 'principedosdragoes'

  // Mensagem de doação de sub
  const subMessage = `🎁 @${ctx.username} enviou uma assinatura de presente para @${receiverName}, portanto o @${ctx.username} pode enviar no sussurro do @waveigl o link da steam para receber assinatura`

  // Enviar em todas as plataformas
  await broadcastSubscriptionMessage(subMessage)

  // Notificar no Discord
  await sendDiscordNotification(
    '',
    '🎁 Inscrição de Presente Enviada (Teste)',
    `**Doador:** ${ctx.username}\n**Recebedor:** ${receiverName}\n**Tier:** Tier 1\n**Plataforma:** ${platformName}\n**Tipo:** Teste (!testdoarsub)\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
  )

  console.log('[Commands] ✅ !testdoarsub executado com sucesso')
}

/**
 * Processa o comando !testmod (apenas Kick)
 * Verifica se o usuário está cadastrado e é moderador no sistema
 * Se for moderador mas não tiver mod na Kick, notifica no Discord para adicionar manualmente
 */
async function handleTestModCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testmod de ${ctx.username} na ${ctx.platform}`)

  // Comando só funciona na Kick
  if (ctx.platform !== 'kick') {
    console.log(`[Commands] !testmod ignorado - plataforma ${ctx.platform} não suportada`)
    return
  }

  const supabase = getSupabaseAdmin()

  // 1. Verificar se o usuário está cadastrado no sistema
  const { data: linkedAccount } = await supabase
    .from('linked_accounts')
    .select('user_id, is_moderator, platform_username')
    .eq('platform', 'kick')
    .eq('platform_user_id', ctx.userId)
    .maybeSingle()

  if (!linkedAccount) {
    console.log(`[Commands] !testmod: Usuário ${ctx.username} não está cadastrado no sistema`)
    // Enviar mensagem na Kick informando que precisa se cadastrar
    await sendKickMessage(`@${ctx.username} você precisa vincular sua conta Kick no nosso sistema para usar !testmod`)
    return
  }

  // 2. Verificar se o usuário é moderador no sistema
  if (!linkedAccount.is_moderator) {
    console.log(`[Commands] !testmod: Usuário ${ctx.username} não é moderador no sistema`)
    await sendKickMessage(`@${ctx.username} você não tem status de moderador no sistema. Vincule uma conta onde você é moderador primeiro.`)
    return
  }

  // 3. Usuário é moderador no sistema! Verificar se já tem mod na Kick
  // Verificar se tem badge de moderador nas badges recebidas
  const hasKickModBadge = ctx.badges.some(b =>
    b.toLowerCase() === 'moderator' || b.toLowerCase() === 'mod'
  )

  if (hasKickModBadge) {
    // Já é moderador na Kick
    console.log(`[Commands] !testmod: ${ctx.username} já é moderador na Kick`)
    await sendKickMessage(`@${ctx.username} você já é moderador na Kick! 🛡️`)
    return
  }

  // 4. É moderador no sistema mas NÃO tem mod na Kick - notificar Discord
  console.log(`[Commands] !testmod: ${ctx.username} é moderador no sistema mas NÃO tem mod na Kick. Notificando Discord...`)

  try {
    // Enviar mensagem no chat da Kick
    await sendKickMessage(`@${ctx.username} você foi identificado como moderador no sistema WaveIGL! 🎉 O streamer foi notificado para adicionar você como mod na Kick.`)

    // Enviar notificação IMPORTANTE no Discord para o streamer/admin adicionar manualmente
    await sendDiscordNotification(
      '@everyone', // Ping para chamar atenção
      '🚨 AÇÃO NECESSÁRIA: Adicionar Moderador na Kick',
      `**Usuário solicitando mod:** \`${ctx.username}\`\n\n` +
      `**Status no sistema:** ✅ Identificado como moderador\n` +
      `**Plataforma:** Kick\n` +
      `**User ID:** ${ctx.userId}\n\n` +
      `⚠️ **AÇÃO MANUAL NECESSÁRIA:**\n` +
      `O streamer ou admin precisa digitar no chat da Kick:\n` +
      `\`\`\`\n/mod ${ctx.username}\n\`\`\`\n\n` +
      `**Horário:** ${new Date().toLocaleString('pt-BR')}`
    )

    console.log(`[Commands] !testmod: Notificação enviada ao Discord para adicionar ${ctx.username} como mod`)

  } catch (error) {
    console.error('[Commands] !testmod: Erro ao processar:', error)
    await sendKickMessage(`@${ctx.username} erro ao processar !testmod. Tente novamente mais tarde.`)
  }
}

/**
 * Envia mensagem no chat da Kick como broadcaster
 */
/**
 * Renova o token da Kick usando refresh_token
 */
async function refreshKickTokenInternal(
  refreshToken: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KICK_CLIENT_ID!,
        client_secret: process.env.KICK_CLIENT_SECRET!,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Commands] Erro ao renovar token Kick:', response.status, errorData)
      return null
    }

    const tokenData = await response.json()

    if (tokenData.access_token) {
      // Atualizar no banco de dados
      const supabase = getSupabaseAdmin()
      await supabase
        .from('linked_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || refreshToken
        })
        .eq('user_id', userId)
        .eq('platform', 'kick')

      console.log('[Commands] ✅ Token Kick renovado com sucesso')
      return tokenData.access_token
    }

    return null
  } catch (error) {
    console.error('[Commands] Erro ao renovar token Kick:', error)
    return null
  }
}

/**
 * Envia mensagem na Kick como streamer (waveigl)
 * Inclui refresh automático de token se expirado
 */
async function sendKickMessage(message: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  // Buscar token do broadcaster da Kick
  const { data: broadcasterAccount } = await supabase
    .from('linked_accounts')
    .select('user_id, access_token, refresh_token, platform_user_id')
    .eq('platform', 'kick')
    .ilike('platform_username', 'waveigl')
    .maybeSingle()

  if (!broadcasterAccount?.access_token) {
    console.error('[Commands] sendKickMessage: Token do broadcaster Kick não encontrado')
    return false
  }

  // Função para tentar enviar
  const tryToSend = async (token: string): Promise<Response> => {
    return fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        broadcaster_user_id: parseInt(broadcasterAccount.platform_user_id),
        content: message,
        type: 'user'
      })
    })
  }

  try {
    // Primeira tentativa
    let response = await tryToSend(broadcasterAccount.access_token)

    // Se receber 401, tentar renovar o token
    if (response.status === 401 && broadcasterAccount.refresh_token) {
      console.log('[Commands] Token Kick expirado, tentando renovar...')

      const newToken = await refreshKickTokenInternal(
        broadcasterAccount.refresh_token,
        broadcasterAccount.user_id
      )

      if (newToken) {
        // Tentar novamente com o novo token
        response = await tryToSend(newToken)
      }
    }

    if (response.ok) {
      console.log('[Commands] ✅ Mensagem enviada na Kick')
      return true
    }

    const errorData = await response.json().catch(() => ({}))
    console.error('[Commands] Erro ao enviar mensagem na Kick:', response.status, errorData)
    return false

  } catch (error) {
    console.error('[Commands] Erro ao enviar mensagem na Kick:', error)
    return false
  }
}

// ============================================
// SISTEMA DE TIMEOUT COM REAPLICAÇÃO AUTOMÁTICA
// ============================================

// Limites máximos de timeout por plataforma (em segundos)
const PLATFORM_MAX_TIMEOUT: Record<string, number> = {
  twitch: 14 * 24 * 60 * 60,  // 14 dias = 1.209.600 segundos
  kick: 7 * 24 * 60 * 60,     // 7 dias = 604.800 segundos
  youtube: 24 * 60 * 60       // 1 dia = 86.400 segundos (banimento temporário)
}

// Cache de timeouts ativos para reaplicação
interface ActiveTimeout {
  targetUserId: string
  targetPlatform: string
  totalDurationSeconds: number
  remainingSeconds: number
  maxDurationOverride?: number // Para testes com limite menor
  reason?: string
  moderatorId?: string
  startedAt: number
  nextReapplyAt: number
}

// Usar globalThis para persistir entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __activeTimeouts: Map<string, ActiveTimeout>
  // eslint-disable-next-line no-var
  var __timeoutIntervalId: NodeJS.Timeout | null
}

globalThis.__activeTimeouts = globalThis.__activeTimeouts || new Map<string, ActiveTimeout>()
globalThis.__timeoutIntervalId = globalThis.__timeoutIntervalId || null

/**
 * Aplica timeout com reaplicação automática para durações maiores que o limite da plataforma
 * Exportado para uso na API de moderação
 * @param maxDurationOverride - Opcional: limite máximo customizado (para testes)
 */
export async function applyTimeoutWithReapply(
  targetUserId: string,
  targetPlatform: 'twitch' | 'kick' | 'youtube',
  totalDurationSeconds: number,
  reason?: string,
  moderatorId?: string,
  maxDurationOverride?: number
): Promise<{ success: boolean; error?: string }> {
  const maxDuration = maxDurationOverride || PLATFORM_MAX_TIMEOUT[targetPlatform] || 86400

  // Calcular duração do primeiro timeout (mínimo entre total e máximo da plataforma)
  const firstTimeoutDuration = Math.min(totalDurationSeconds, maxDuration)

  console.log(`[Timeout] Iniciando timeout de ${totalDurationSeconds}s para ${targetUserId} no ${targetPlatform}`)
  console.log(`[Timeout] Máximo da plataforma: ${maxDuration}s, primeiro timeout: ${firstTimeoutDuration}s`)

  // Importar dinamicamente para evitar dependência circular
  const { applyPlatformTimeout } = await import('@/lib/moderation/actions')

  // Aplicar primeiro timeout
  const result = await applyPlatformTimeout(
    targetPlatform,
    targetUserId,
    firstTimeoutDuration,
    reason,
    moderatorId
  )

  if (!result.success) {
    return result
  }

  // Se a duração total é maior que o máximo, agendar reaplicação
  if (totalDurationSeconds > maxDuration) {
    const timeoutKey = `${targetPlatform}:${targetUserId}`
    const now = Date.now()

    globalThis.__activeTimeouts.set(timeoutKey, {
      targetUserId,
      targetPlatform,
      totalDurationSeconds,
      remainingSeconds: totalDurationSeconds - firstTimeoutDuration,
      maxDurationOverride, // Preservar o limite customizado para reaplicações
      reason,
      moderatorId,
      startedAt: now,
      nextReapplyAt: now + (firstTimeoutDuration * 1000) - 5000 // 5s antes de expirar
    })

    console.log(`[Timeout] ⏰ Agendada reaplicação em ${firstTimeoutDuration - 5}s, restam ${totalDurationSeconds - firstTimeoutDuration}s`)

    // Iniciar o verificador de reaplicação se não estiver rodando
    startTimeoutReapplyChecker()
  }

  return { success: true }
}

/**
 * Inicia o verificador de reaplicação de timeouts
 */
function startTimeoutReapplyChecker(): void {
  // Se já está rodando, não iniciar novamente
  if (globalThis.__timeoutIntervalId) {
    return
  }

  console.log('[Timeout] Iniciando verificador de reaplicação...')

  globalThis.__timeoutIntervalId = setInterval(async () => {
    const now = Date.now()

    for (const [key, timeout] of globalThis.__activeTimeouts.entries()) {
      if (now >= timeout.nextReapplyAt) {
        console.log(`[Timeout] ⏰ Reaplicando timeout para ${key}...`)

        // Usar o override se existir, senão usar o limite padrão da plataforma
        const maxDuration = timeout.maxDurationOverride || PLATFORM_MAX_TIMEOUT[timeout.targetPlatform] || 86400
        const nextDuration = Math.min(timeout.remainingSeconds, maxDuration)

        console.log(`[Timeout] Máximo: ${maxDuration}s, próximo timeout: ${nextDuration}s, restam: ${timeout.remainingSeconds}s`)

        const { applyPlatformTimeout } = await import('@/lib/moderation/actions')

        const result = await applyPlatformTimeout(
          timeout.targetPlatform,
          timeout.targetUserId,
          nextDuration,
          timeout.reason,
          timeout.moderatorId
        )

        if (result.success) {
          timeout.remainingSeconds -= nextDuration

          if (timeout.remainingSeconds <= 0) {
            // Timeout completo, remover da lista
            globalThis.__activeTimeouts.delete(key)
            console.log(`[Timeout] ✅ Timeout completo para ${key}`)
          } else {
            // Agendar próxima reaplicação
            timeout.nextReapplyAt = now + (nextDuration * 1000) - 5000
            console.log(`[Timeout] ⏰ Próxima reaplicação em ${nextDuration - 5}s, restam ${timeout.remainingSeconds}s`)
          }
        } else {
          console.error(`[Timeout] ❌ Falha ao reaplicar timeout: ${result.error}`)
          // Remover da lista em caso de falha persistente
          globalThis.__activeTimeouts.delete(key)
        }
      }
    }

    // Se não há mais timeouts ativos, parar o verificador
    if (globalThis.__activeTimeouts.size === 0 && globalThis.__timeoutIntervalId) {
      clearInterval(globalThis.__timeoutIntervalId)
      globalThis.__timeoutIntervalId = null
      console.log('[Timeout] Verificador de reaplicação parado (sem timeouts ativos)')
    }
  }, 10000) // Verificar a cada 10 segundos
}

/**
 * Processa o comando !testto (apenas mods)
 * Testa o sistema de timeout com reaplicação automática
 * Aplica timeout de 5 minutos (300s) usando timeouts de 20s
 */
async function handleTestTimeoutCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testto de ${ctx.username}`)

  // Verificar se é moderador
  if (!isModerator(ctx.badges)) {
    console.log(`[Commands] !testto negado - ${ctx.username} não é moderador`)
    return
  }

  const targetUsername = 'principedosdragoes'
  const totalDurationSeconds = 5 * 60 // 5 minutos = 300 segundos
  const testTimeoutDuration = 20 // Timeout de teste de 20 segundos

  const supabase = getSupabaseAdmin()

  // Primeiro, buscar o token do moderador que executou o comando
  const { data: modAccount } = await supabase
    .from('linked_accounts')
    .select('access_token, platform_user_id, user_id')
    .eq('platform', 'twitch')
    .ilike('platform_username', ctx.username)
    .maybeSingle()

  if (!modAccount?.access_token) {
    console.log(`[Commands] !testto: Token do moderador ${ctx.username} não encontrado`)
    return
  }

  // Buscar ID do usuário alvo na Twitch (primeiro no sistema, depois via API)
  let targetUserId: string | null = null

  const { data: targetAccount } = await supabase
    .from('linked_accounts')
    .select('platform_user_id')
    .eq('platform', 'twitch')
    .ilike('platform_username', targetUsername)
    .maybeSingle()

  if (targetAccount?.platform_user_id) {
    targetUserId = targetAccount.platform_user_id
    console.log(`[Commands] !testto: ID do alvo encontrado no sistema: ${targetUserId}`)
  } else {
    // Buscar via API da Twitch usando o token do moderador
    console.log(`[Commands] !testto: Buscando ${targetUsername} via API da Twitch...`)

    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${targetUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${modAccount.access_token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!
        }
      }
    )

    if (userResponse.ok) {
      const userData = await userResponse.json()
      targetUserId = userData.data?.[0]?.id

      if (targetUserId) {
        console.log(`[Commands] !testto: ID do alvo obtido via API: ${targetUserId}`)
      }
    } else {
      const errorData = await userResponse.json().catch(() => ({}))
      console.error(`[Commands] !testto: Erro ao buscar usuário via API:`, userResponse.status, errorData)
    }
  }

  if (!targetUserId) {
    console.log(`[Commands] !testto: Usuário ${targetUsername} não encontrado`)
    // Notificar no Discord sobre a falha
    await sendDiscordNotification(
      '',
      '❌ Teste de Timeout Falhou',
      `**Iniciado por:** ${ctx.username}\n**Alvo:** ${targetUsername}\n**Erro:** Usuário não encontrado\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
    )
    return
  }

  console.log(`[Commands] !testto: Iniciando timeout de ${totalDurationSeconds}s em blocos de ${testTimeoutDuration}s`)

  // Aplicar timeout com sistema de reaplicação
  // Passando testTimeoutDuration como maxDurationOverride para forçar blocos de 20s
  const result = await applyTimeoutWithReapply(
    targetUserId,
    'twitch',
    totalDurationSeconds,
    `Teste de timeout via !testto por ${ctx.username}`,
    modAccount.user_id, // Usar o ID do moderador para que a ação apareça no nome dele
    testTimeoutDuration // Override: usar blocos de 20s ao invés do limite padrão de 14 dias
  )

  if (result.success) {
    // Notificar no Discord (não depende do token do streamer)
    await sendDiscordNotification(
      '',
      '🧪 Teste de Timeout com Reaplicação',
      `**Iniciado por:** ${ctx.username}\n**Alvo:** ${targetUsername}\n**Duração total:** 5 minutos\n**Blocos de:** ${testTimeoutDuration}s\n**Reaplicações:** ${Math.ceil(totalDurationSeconds / testTimeoutDuration) - 1}\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
    )

    // Enviar mensagem via sistema de filas (não depende do token do streamer)
    queueMessage(`🧪 @${ctx.username} iniciou teste de timeout: @${targetUsername} receberá timeout de 5 minutos (reaplicação a cada ${testTimeoutDuration}s)`, 'twitch', 'high')

    console.log('[Commands] ✅ !testto executado com sucesso')
  } else {
    // Notificar falha no Discord
    await sendDiscordNotification(
      '',
      '❌ Teste de Timeout Falhou',
      `**Iniciado por:** ${ctx.username}\n**Alvo:** ${targetUsername}\n**Erro:** ${result.error}\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
    )
    console.error('[Commands] ❌ !testto falhou:', result.error)
  }
}

/**
 * Processa uma mensagem do chat e verifica se é um comando
 * Retorna true se era um comando e foi processado
 */
export async function processCommand(ctx: CommandContext): Promise<boolean> {
  const message = ctx.message.trim().toLowerCase()

  // Verificar se é um comando (começa com !)
  if (!message.startsWith('!')) {
    return false
  }

  // Verificar se é comando duplicado (debounce)
  if (isCommandDuplicate(ctx)) {
    return false
  }

  // Extrair comando e argumentos
  const parts = message.split(' ')
  const command = parts[0]

  switch (command) {
    case '!testsub':
      await handleTestSubCommand(ctx)
      return true

    case '!testrecebersub':
      await handleTestReceiveSubCommand(ctx)
      return true

    case '!testdoarsub':
      await handleTestGiftSubCommand(ctx)
      return true

    case '!testmod':
      await handleTestModCommand(ctx)
      return true

    case '!testto':
      await handleTestTimeoutCommand(ctx)
      return true

    default:
      return false
  }
}

/**
 * Verifica se o usuário tem permissão para usar comandos especiais
 */
export function canUseCommands(badges: string[]): boolean {
  // Por enquanto, qualquer usuário pode usar !testsub
  // Futuramente pode ser restrito a mods/subs
  return true
}

// ============================================
// FUNÇÕES EXPORTADAS PARA EVENTOS REAIS DE SUB
// ============================================

/**
 * Broadcast de evento de inscrição real (não teste)
 * Chamado quando alguém realmente se inscreve na plataforma
 * Usa o sistema de filas para respeitar rate limits
 */
export async function broadcastSubscriptionEvent(
  username: string,
  tierName: string,
  platform: 'twitch' | 'kick' | 'youtube'
): Promise<void> {
  const platformDisplayName = getPlatformDisplayName(platform)

  // Buscar informações do usuário para notificação rica e whisper
  const userInfo = await findLinkedUserWithProfileByUsername(platform, username)

  // Mensagem para whisper
  const whisperMessage = `Obrigado por se inscrever! Vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp`

  // Tentar enviar whisper na Twitch se for a plataforma
  if (platform === 'twitch') {
    await sendStreamerWhisper(username, whisperMessage)
  }

  // Mensagem de inscrição
  const subMessage = `🎉 @${username} se inscreveu com ${tierName} na ${platformDisplayName} - Cadastre-se no site waveigl.com para ser convidado para o grupo exclusivo do WhatsApp`

  // TEMPORARIAMENTE DESABILITADO: Notificação no chat
  // TODO: Reativar quando whisper estiver funcionando corretamente
  // queueMessage(subMessage, 'all', 'high') // Alta prioridade para subs normais
  console.log(`[Commands] ⏸️ Notificação no chat DESABILITADA temporariamente: ${subMessage.substring(0, 50)}...`)

  // Notificar no Discord (Rico) - Substitui a notificação simples
  await sendDiscordSubNotification({
    platform,
    username,
    platformUserId: userInfo?.platform_user_id || 'unknown',
    phoneNumber: userInfo?.phone_number || null,
    isRegistered: !!userInfo,
    isGift: false,
    tier: tierName
  })

  // Criar benefício automaticamente se o usuário estiver cadastrado
  await createBenefitForUser(username, platform, tierName, false)

  console.log(`[Commands] ✅ Evento de inscrição adicionado à fila: ${username} na ${platform}`)
}

/**
 * Broadcast de evento de gift sub real (não teste)
 * Chamado quando alguém realmente dá sub para outra pessoa
 * Usa o sistema de filas para respeitar rate limits
 */
export async function broadcastGiftSubEvent(
  gifterUsername: string,
  recipientUsername: string,
  tierName: string,
  platform: 'twitch' | 'kick' | 'youtube'
): Promise<void> {
  const platformDisplayName = getPlatformDisplayName(platform)

  // Buscar informações do RECEBEDOR para notificação rica e whisper
  const userInfo = await findLinkedUserWithProfileByUsername(platform, recipientUsername)

  // Mensagem para whisper (para quem recebeu)
  const whisperMessage = `Você recebeu uma inscrição de presente, vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp`

  // Tentar enviar whisper na Twitch se for a plataforma
  if (platform === 'twitch') {
    await sendStreamerWhisper(recipientUsername, whisperMessage)
  }

  // Mensagem para quem recebeu
  const receiverMessage = `🎁 @${recipientUsername} recebeu inscrição de presente com ${tierName} de @${gifterUsername} na ${platformDisplayName} - Cadastre-se no site waveigl.com para ser convidado para o grupo exclusivo do WhatsApp`

  // Mensagem para quem deu
  const gifterMessage = `🎁 @${gifterUsername} enviou uma assinatura de presente para @${recipientUsername}, portanto o @${gifterUsername} pode enviar no sussurro do @waveigl o link da steam para receber assinatura`

  // TEMPORARIAMENTE DESABILITADO: Notificação no chat
  // TODO: Reativar quando whisper estiver funcionando corretamente
  // queueMessage(receiverMessage, 'all', 'normal')
  // queueMessage(gifterMessage, 'all', 'normal')
  console.log(`[Commands] ⏸️ Notificação no chat DESABILITADA temporariamente para gift sub`)

  // Notificar no Discord (Rico)
  await sendDiscordSubNotification({
    platform,
    username: recipientUsername,
    platformUserId: userInfo?.platform_user_id || 'unknown',
    phoneNumber: userInfo?.phone_number || null,
    isRegistered: !!userInfo,
    isGift: true,
    donorUsername: gifterUsername,
    tier: tierName
  })

  // Criar benefício para quem RECEBEU (não para quem deu)
  await createBenefitForUser(recipientUsername, platform, tierName, true, gifterUsername)

  console.log(`[Commands] ✅ Evento de gift sub adicionado à fila: ${gifterUsername} -> ${recipientUsername} na ${platform}`)
}

/**
 * Cria benefício para um usuário baseado no username da plataforma
 * Usado quando detectamos um evento de sub real
 */
async function createBenefitForUser(
  username: string,
  platform: 'twitch' | 'kick' | 'youtube',
  tier: string,
  isGift: boolean,
  gifterUsername?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar o usuário pela conta vinculada
    const { data: linkedAccount } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('platform', platform)
      .ilike('platform_username', username)
      .maybeSingle()

    if (!linkedAccount) {
      console.log(`[Commands] Usuário ${username} não encontrado no sistema - benefício não criado`)
      return
    }

    // Importar dinamicamente para evitar dependência circular
    const { createOrUpdateBenefit } = await import('@/lib/benefits')

    const benefit = await createOrUpdateBenefit(
      linkedAccount.user_id,
      platform,
      tier,
      isGift,
      gifterUsername
    )

    if (benefit) {
      console.log(`[Commands] ✅ Benefício criado para ${username}: ${benefit.id}`)
    }

  } catch (error) {
    console.error(`[Commands] Erro ao criar benefício para ${username}:`, error)
  }
}

