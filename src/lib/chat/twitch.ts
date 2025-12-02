import tmi, { Client as TmiClient } from 'tmi.js'
import { chatHub, moderationHub } from './hub'

let readerClient: TmiClient | null = null
let readerConnecting = false

export async function startTwitchReader(): Promise<void> {
  if (readerClient || readerConnecting) return
  readerConnecting = true
  const channel = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'
  const client = new tmi.Client({
    channels: [channel],
    connection: { reconnect: true, secure: true }
  })
  
  // Listener para mensagens do chat
  client.on('message', (_channel, userstate, message, self) => {
    if (self) return
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
    
    chatHub.publish({
      id: `${Date.now()}-${Math.random()}`,
      platform: 'twitch',
      username,
      userId,
      message,
      timestamp: Date.now(),
      badges: uniqueBadges
    })
  })
  
  // Listener para quando alguém é promovido a moderador
  client.on('mod', (_channel, username) => {
    console.log(`[Twitch] ${username} foi promovido a moderador`)
    moderationHub.publish({
      type: 'mod_added',
      platform: 'twitch',
      username,
      timestamp: Date.now()
    })
  })
  
  // Listener para quando alguém é removido de moderador
  client.on('unmod', (_channel, username) => {
    console.log(`[Twitch] ${username} foi removido de moderador`)
    moderationHub.publish({
      type: 'mod_removed',
      platform: 'twitch',
      username,
      timestamp: Date.now()
    })
  })
  
  try {
    await client.connect()
    readerClient = client
  } catch {
    // ignore failure; will retry on next subscribe
  } finally {
    readerConnecting = false
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


