/**
 * Processador de comandos do chat
 * Gerencia comandos como !testsub
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
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
  try {
    const supabase = getSupabaseAdmin()
    
    // Buscar token do streamer waveigl
    const { data: streamerAccount } = await supabase
      .from('linked_accounts')
      .select('platform_username, access_token, platform_user_id, authorized_scopes')
      .eq('platform', 'twitch')
      .ilike('platform_username', TWITCH_CHANNEL)
      .maybeSingle()
    
    if (!streamerAccount?.access_token) {
      console.log('[Commands] Token do streamer não encontrado para whisper')
      return false
    }
    
    // Verificar se o streamer tem o scope necessário
    const scopes = streamerAccount.authorized_scopes as string[] | null
    if (!scopes?.includes('user:manage:whispers')) {
      console.log('[Commands] ⚠️ Streamer precisa reautenticar para obter scope user:manage:whispers')
      console.log('[Commands] Scopes atuais:', scopes)
      
      // Marcar que precisa reautenticação
      await supabase
        .from('linked_accounts')
        .update({ needs_reauth: true })
        .eq('platform', 'twitch')
        .ilike('platform_username', TWITCH_CHANNEL)
      
      return false
    }
    
    // Buscar ID do usuário alvo
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
      console.error('[Commands] Erro ao buscar usuário para whisper:', userResponse.status)
      return false
    }
    
    const userData = await userResponse.json()
    const targetUserId = userData.data?.[0]?.id
    
    if (!targetUserId) {
      console.error('[Commands] Usuário não encontrado:', targetUsername)
      return false
    }
    
    // Enviar whisper via API
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
      console.log('[Commands] ✅ Whisper enviado para', targetUsername)
      return true
    }
    
    const errorData = await whisperResponse.json().catch(() => ({}))
    const errorMessage = errorData.message || `Erro ${whisperResponse.status}`
    
    // Tratar erros específicos
    if (whisperResponse.status === 401 && errorMessage.includes('Missing scope')) {
      console.log('[Commands] ⚠️ Scope ausente - streamer precisa reautenticar')
      await supabase
        .from('linked_accounts')
        .update({ needs_reauth: true })
        .eq('platform', 'twitch')
        .ilike('platform_username', TWITCH_CHANNEL)
    } else if (whisperResponse.status === 400) {
      console.log('[Commands] ⚠️ Erro 400 - possíveis causas:')
      console.log('  - Usuário não segue o canal')
      console.log('  - Usuário bloqueou whispers')
      console.log('  - Rate limit excedido')
    } else if (whisperResponse.status === 403) {
      console.log('[Commands] ⚠️ Erro 403 - conta do streamer pode precisar de verificação de telefone')
    }
    
    console.error('[Commands] Erro ao enviar whisper:', whisperResponse.status, errorData)
    return false
    
  } catch (error) {
    console.error('[Commands] Erro ao enviar whisper:', error)
    return false
  }
}

/**
 * Processa o comando !testsub
 */
async function handleTestSubCommand(ctx: CommandContext): Promise<void> {
  console.log(`[Commands] Processando !testsub de ${ctx.username}`)
  
  // 1. Enviar notificação no Discord
  await sendDiscordNotification(
    '',
    '🧪 Comando !testsub executado',
    `**Usuário:** ${ctx.username}\n**Plataforma:** ${ctx.platform}\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
  )
  
  // 2. Enviar mensagem no chat como streamer
  await sendStreamerMessage(
    `@${ctx.username} digitou !testsub e testou que o sub TEST recebeu sub tier 1`
  )
  
  // 3. Enviar whisper para o usuário
  await sendStreamerWhisper(ctx.username, '!testsub foi usado')
}

/**
 * Processa o comando !testmod (apenas Kick)
 * Verifica se o usuário está cadastrado e é moderador, então concede mod na Kick
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
  
  // 3. Usuário é moderador! Conceder mod na Kick
  console.log(`[Commands] !testmod: Usuário ${ctx.username} é moderador! Concedendo mod na Kick...`)
  
  // Buscar token do broadcaster da Kick
  const { data: broadcasterAccount } = await supabase
    .from('linked_accounts')
    .select('access_token, platform_user_id')
    .eq('platform', 'kick')
    .ilike('platform_username', 'waveigloficial')
    .maybeSingle()
  
  if (!broadcasterAccount?.access_token) {
    console.error('[Commands] !testmod: Token do broadcaster Kick não encontrado')
    await sendKickMessage(`@${ctx.username} erro interno: não foi possível conceder moderação. Entre em contato com o streamer.`)
    return
  }
  
  // Tentar adicionar como moderador na Kick
  // Nota: A API pública da Kick pode não suportar adicionar moderadores
  // Vamos verificar se há endpoint disponível
  try {
    // Kick não tem endpoint público para adicionar moderadores via API
    // Então vamos apenas confirmar o status e notificar
    console.log(`[Commands] !testmod: Kick não suporta adicionar moderadores via API pública`)
    
    // Enviar mensagem no chat da Kick
    await sendKickMessage(`@${ctx.username} você usou !testmod e foi identificado como moderador no sistema WaveIGL! 🎉 (Nota: A Kick não permite adicionar mods via API, o streamer precisa usar /mod manualmente)`)
    
    // Enviar notificação no Discord
    await sendDiscordNotification(
      '',
      '🛡️ Comando !testmod executado na Kick',
      `**Usuário:** ${ctx.username}\n**Status:** ✅ Identificado como moderador no sistema\n**Ação:** Notificado no chat (Kick não suporta /mod via API)\n**Horário:** ${new Date().toLocaleString('pt-BR')}`
    )
    
  } catch (error) {
    console.error('[Commands] !testmod: Erro ao processar:', error)
    await sendKickMessage(`@${ctx.username} erro ao processar !testmod. Tente novamente mais tarde.`)
  }
}

/**
 * Envia mensagem no chat da Kick como broadcaster
 */
async function sendKickMessage(message: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  
  // Buscar token do broadcaster da Kick
  const { data: broadcasterAccount } = await supabase
    .from('linked_accounts')
    .select('access_token, platform_user_id')
    .eq('platform', 'kick')
    .ilike('platform_username', 'waveigloficial')
    .maybeSingle()
  
  if (!broadcasterAccount?.access_token) {
    console.error('[Commands] sendKickMessage: Token do broadcaster Kick não encontrado')
    return false
  }
  
  try {
    const response = await fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${broadcasterAccount.access_token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        broadcaster_user_id: parseInt(broadcasterAccount.platform_user_id),
        content: message,
        type: 'user'
      })
    })
    
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
    
    case '!testmod':
      await handleTestModCommand(ctx)
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

