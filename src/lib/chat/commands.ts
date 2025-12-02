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
    
    // Adicionar mais comandos aqui no futuro
    
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

