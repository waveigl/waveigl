import tmi, { Client as TmiClient } from 'tmi.js'
import { chatHub, moderationHub } from './hub'
import { processCommand, broadcastSubscriptionEvent, broadcastGiftSubEvent } from './commands'
import { triggerYouTubeCheck } from './youtube'

// Tipo local para Userstate (tmi.js não exporta mais)
interface Userstate {
  badges?: Record<string, string>
  'badges-raw'?: string
  color?: string
  'display-name'?: string
  emotes?: Record<string, string[]>
  'emotes-raw'?: string
  id?: string
  mod?: boolean
  'room-id'?: string
  subscriber?: boolean
  'tmi-sent-ts'?: string
  turbo?: boolean
  'user-id'?: string
  'user-type'?: string
  username?: string
  [key: string]: unknown
}

// Usar globalThis para persistir estado entre HMR (Hot Module Replacement)
// Isso evita múltiplas conexões quando o Next.js recarrega módulos
declare global {
  // eslint-disable-next-line no-var
  var __twitchReaderClient: TmiClient | null
  // eslint-disable-next-line no-var
  var __twitchReaderStarted: boolean
  // eslint-disable-next-line no-var
  var __twitchProcessedMessageIds: Set<string>
  // eslint-disable-next-line no-var
  var __twitchFirstMessageReceived: boolean
}

// Inicializar no globalThis se não existir
globalThis.__twitchReaderClient = globalThis.__twitchReaderClient || null
globalThis.__twitchReaderStarted = globalThis.__twitchReaderStarted || false
globalThis.__twitchProcessedMessageIds = globalThis.__twitchProcessedMessageIds || new Set<string>()
globalThis.__twitchFirstMessageReceived = globalThis.__twitchFirstMessageReceived || false

/**
 * Verifica o status do YouTube quando Twitch detecta atividade
 * Isso economiza quota porque só verifica quando sabemos que o streamer está ao vivo
 */
function checkYouTubeOnTwitchActivity(): void {
  if (globalThis.__twitchFirstMessageReceived) return // Já verificou
  globalThis.__twitchFirstMessageReceived = true
  
  console.log('[Twitch] Primeira mensagem recebida - sinalizando YouTube para verificar...')
  
  // Usar setTimeout para não bloquear o processamento de mensagens
  setTimeout(() => {
    triggerYouTubeCheck().catch(err => {
      console.error('[Twitch] Erro ao sinalizar YouTube:', err)
    })
  }, 100)
}

/**
 * Mapeia o plano de sub para tier legível
 */
function getTierName(plan: string): string {
  switch (plan) {
    case 'Prime':
    case '1000': return 'Tier 1'
    case '2000': return 'Tier 2'
    case '3000': return 'Tier 3'
    default: return 'Tier 1'
  }
}

/**
 * Trata eventos de subscription (nova ou resub)
 */
async function handleSubscriptionEvent(
  type: 'new_sub' | 'resub',
  username: string,
  plan: string,
  _userstate: Userstate
): Promise<void> {
  const tierName = getTierName(plan)
  await broadcastSubscriptionEvent(username, tierName, 'twitch')
}

/**
 * Trata eventos de gift sub
 */
async function handleGiftSubEvent(
  gifterUsername: string,
  recipientUsername: string,
  plan: string,
  _userstate: Userstate
): Promise<void> {
  const tierName = getTierName(plan)
  await broadcastGiftSubEvent(gifterUsername, recipientUsername, tierName, 'twitch')
}

const MAX_PROCESSED_IDS = 1000 // Limitar tamanho do cache

export async function startTwitchReader(): Promise<void> {
  // Verificar se já está iniciado usando globalThis
  if (globalThis.__twitchReaderStarted || globalThis.__twitchReaderClient) {
    console.log('[Twitch] Reader já iniciado (globalThis), ignorando...')
    return
  }
  globalThis.__twitchReaderStarted = true
  console.log('[Twitch] Iniciando leitor de chat...')
  
  const channel = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'
  const client = new tmi.Client({
    channels: [channel],
    connection: { reconnect: true, secure: true }
  })
  
  // Listener para mensagens do chat
  client.on('message', async (_channel, userstate, message, self) => {
    console.log(`[Twitch] Mensagem recebida de ${userstate['display-name']}: ${message.substring(0, 50)}`)
    
    // Quando receber primeira mensagem, verificar YouTube (economiza quota)
    checkYouTubeOnTwitchActivity()
    
    if (self) {
      console.log('[Twitch] Mensagem própria ignorada')
      return
    }
    
    // Usar o ID único da mensagem do Twitch para deduplicar
    const messageId = userstate['id'] || `${Date.now()}-${Math.random()}`
    
    // Verificar se já processamos esta mensagem
    if (globalThis.__twitchProcessedMessageIds.has(messageId)) {
      console.log(`[Twitch] Mensagem duplicada ignorada: ${messageId}`)
      return
    }
    
    // Adicionar ao cache
    globalThis.__twitchProcessedMessageIds.add(messageId)
    
    // Limpar cache se ficar muito grande
    if (globalThis.__twitchProcessedMessageIds.size > MAX_PROCESSED_IDS) {
      const idsArray = Array.from(globalThis.__twitchProcessedMessageIds)
      const toRemove = idsArray.slice(0, 500) // Remover os 500 mais antigos
      toRemove.forEach(id => globalThis.__twitchProcessedMessageIds.delete(id))
    }
    
    const username = userstate['display-name'] || userstate['username'] || 'twitch-user'
    const userId = userstate['user-id'] || 'unknown'
    
    // Mapear badges do Twitch
    const badges: string[] = []
    const rawBadges = userstate['badges'] || {}
    
    // Verificar badges conhecidas
    if (rawBadges['broadcaster']) badges.push('broadcaster')
    if (rawBadges['moderator']) badges.push('moderator')
    if (rawBadges['vip']) badges.push('vip')
    if (rawBadges['subscriber']) badges.push('subscriber')
    if (rawBadges['staff']) badges.push('staff')
    if (rawBadges['admin']) badges.push('admin')
    if (rawBadges['global_mod']) badges.push('moderator')
    if (rawBadges['partner']) badges.push('partner')
    
    // Também verificar pelo badge-info
    if (userstate['mod']) badges.push('moderator')
    if (userstate['badges-raw']?.includes('moderator')) badges.push('moderator')
    
    // Remover duplicatas
    const uniqueBadges = [...new Set(badges)]
    
    // Publicar mensagem no hub
    chatHub.publish({
      id: `${Date.now()}-${Math.random()}`,
      platform: 'twitch',
      username,
      userId,
      message,
      timestamp: Date.now(),
      badges: uniqueBadges
    })
    
    // Processar comandos (ex: !testsub)
    if (message.startsWith('!')) {
      processCommand({
        username,
        userId,
        message,
        platform: 'twitch',
        badges: uniqueBadges
      }).catch(err => {
        console.error('[Twitch] Erro ao processar comando:', err)
      })
    }
  })
  
  // Listener para quando alguém é promovido a moderador
  ;(client as any).on('mod', (_channel: string, username: string) => {
    console.log(`[Twitch] ${username} foi promovido a moderador`)
    moderationHub.publish({
      type: 'mod_added',
      platform: 'twitch',
      username,
      timestamp: Date.now()
    })
  })
  
  // Listener para quando alguém é removido de moderador
  ;(client as any).on('unmod', (_channel: string, username: string) => {
    console.log(`[Twitch] ${username} foi removido de moderador`)
    moderationHub.publish({
      type: 'mod_removed',
      platform: 'twitch',
      username,
      timestamp: Date.now()
    })
  })
  
  // Listener para novas inscrições (subscription)
  ;(client as any).on('subscription', (_channel: string, username: string, methods: any, _message: string, userstate: Userstate) => {
    console.log(`[Twitch] 🎉 ${username} se inscreveu!`)
    handleSubscriptionEvent('new_sub', username, methods?.plan || '1000', userstate)
  })
  
  // Listener para re-inscrições
  ;(client as any).on('resub', (_channel: string, username: string, _months: number, _message: string, userstate: Userstate, methods: any) => {
    console.log(`[Twitch] 🎉 ${username} renovou a inscrição!`)
    handleSubscriptionEvent('resub', username, methods?.plan || '1000', userstate)
  })
  
  // Listener para sub gift (quando alguém dá sub para outra pessoa)
  ;(client as any).on('subgift', (_channel: string, username: string, _streakMonths: number, recipient: string, methods: any, userstate: Userstate) => {
    console.log(`[Twitch] 🎁 ${username} deu sub para ${recipient}!`)
    handleGiftSubEvent(username, recipient, methods?.plan || '1000', userstate)
  })
  
  // Listener para sub mystery gift (quando alguém dá vários subs aleatórios)
  ;(client as any).on('submysterygift', (_channel: string, username: string, _numOfSubs: number, methods: any, _userstate: Userstate) => {
    console.log(`[Twitch] 🎁 ${username} está distribuindo subs!`)
    // Não precisa fazer nada aqui, os subgift individuais serão disparados
  })
  
  try {
    await client.connect()
    globalThis.__twitchReaderClient = client
    console.log(`[Twitch] ✅ Conectado ao canal: ${channel}`)
  } catch (err) {
    console.error('[Twitch] Erro ao conectar:', err)
    globalThis.__twitchReaderStarted = false // Permitir retry
  }
}

export async function sendTwitchMessage(username: string, accessToken: string, message: string): Promise<void> {
  const channel = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'
  const client = new tmi.Client({
    identity: {
      username,
      password: `oauth:${accessToken}`
    },
    channels: [channel],
    connection: { secure: true, reconnect: false }
  })
  try {
    await client.connect()
    await client.say(channel, message)
  } finally {
    try {
      await client.disconnect()
    } catch {
      // ignore
    }
  }
}


