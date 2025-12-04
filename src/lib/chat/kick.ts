/**
 * Kick Chat Adapter
 * Leitura via WebSocket público e envio via API oficial
 */

import { chatHub } from './hub'
import { processCommand } from './commands'
import { triggerYouTubeCheck } from './youtube'
import WebSocket from 'ws'

const KICK_CHANNEL = 'waveigloficial'

// Usar globalThis para persistir estado entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __kickReaderStarted: boolean
  // eslint-disable-next-line no-var
  var __kickWs: WebSocket | null
  // eslint-disable-next-line no-var
  var __kickCachedChatroomId: number | null
  // eslint-disable-next-line no-var
  var __kickFirstMessageReceived: boolean
}

globalThis.__kickReaderStarted = globalThis.__kickReaderStarted || false
globalThis.__kickWs = globalThis.__kickWs || null
globalThis.__kickCachedChatroomId = globalThis.__kickCachedChatroomId || null
globalThis.__kickFirstMessageReceived = globalThis.__kickFirstMessageReceived || false

/**
 * Verifica o status do YouTube quando Kick detecta atividade
 */
function checkYouTubeOnKickActivity(): void {
  if (globalThis.__kickFirstMessageReceived) return
  globalThis.__kickFirstMessageReceived = true
  
  console.log('[Kick] Primeira mensagem recebida - sinalizando YouTube para verificar...')
  
  setTimeout(() => {
    triggerYouTubeCheck().catch(err => {
      console.error('[Kick] Erro ao sinalizar YouTube:', err)
    })
  }, 100)
}

interface KickChatMessage {
  id: string
  chatroom_id: number
  content: string
  type: string
  created_at: string
  sender: {
    id: number
    username: string
    slug: string
    identity: {
      color: string
      badges: Array<{ type: string; text: string }>
    }
  }
}

/**
 * Inicia o leitor de chat da Kick via WebSocket
 */
export async function startKickReader(): Promise<void> {
  if (globalThis.__kickReaderStarted || globalThis.__kickWs) {
    console.log('[Kick] Reader já iniciado (globalThis), ignorando...')
    return
  }
  globalThis.__kickReaderStarted = true

  console.log('[Kick] Iniciando leitor de chat...')

  try {
    // Primeiro, buscar o chatroom_id do canal
    const chatroomId = await getChatroomId(KICK_CHANNEL)
    
    if (!chatroomId) {
      console.error('[Kick] Não foi possível obter o chatroom_id')
      console.error('[Kick] Configure KICK_CHATROOM_ID no .env.local')
      globalThis.__kickReaderStarted = false
      return
    }

    console.log('[Kick] Chatroom ID obtido:', chatroomId)

    // Conectar ao WebSocket da Kick
    connectWebSocket(chatroomId)

  } catch (error) {
    console.error('[Kick] Erro ao iniciar leitor:', error)
    globalThis.__kickReaderStarted = false
  }
}

/**
 * Busca o chatroom_id do canal
 * Tenta múltiplas fontes: env, API pública
 */
async function getChatroomId(channelSlug: string): Promise<number | null> {
  // Usar cache se disponível
  if (globalThis.__kickCachedChatroomId) {
    return globalThis.__kickCachedChatroomId
  }

  // Se tiver configurado via env, usar diretamente
  if (process.env.KICK_CHATROOM_ID) {
    globalThis.__kickCachedChatroomId = parseInt(process.env.KICK_CHATROOM_ID, 10)
    console.log('[Kick] Usando KICK_CHATROOM_ID do env:', globalThis.__kickCachedChatroomId)
    return globalThis.__kickCachedChatroomId
  }

  try {
    // Tentar buscar via API pública com headers de browser
    console.log('[Kick] Buscando chatroom_id via API pública...')
    const res = await fetch(`https://kick.com/api/v2/channels/${channelSlug}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://kick.com/',
        'Origin': 'https://kick.com'
      }
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Kick] Erro ao buscar canal:', res.status, errorText.substring(0, 200))
      return null
    }

    const data = await res.json()
    console.log('[Kick] Dados do canal recebidos, chatroom:', data?.chatroom?.id)
    
    if (data?.chatroom?.id) {
      globalThis.__kickCachedChatroomId = data.chatroom.id
      return globalThis.__kickCachedChatroomId
    }

    console.error('[Kick] chatroom.id não encontrado na resposta')
    return null
  } catch (error) {
    console.error('[Kick] Erro ao buscar chatroom_id:', error)
    return null
  }
}

/**
 * Conecta ao WebSocket da Kick usando Pusher
 */
function connectWebSocket(chatroomId: number): void {
  // Kick usa Pusher para WebSocket
  // Chave atualizada: 32cbd69e4b950bf97679
  const pusherKey = '32cbd69e4b950bf97679'
  const wsUrl = `wss://ws-us2.pusher.com/app/${pusherKey}?protocol=7&client=js&version=7.6.0&flash=false`

  console.log('[Kick] Conectando ao WebSocket...', wsUrl)

  globalThis.__kickWs = new WebSocket(wsUrl)

  globalThis.__kickWs.on('open', () => {
    console.log('[Kick] WebSocket conectado!')
    
    // Subscrever ao canal de chat
    const subscribeMessage = JSON.stringify({
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: `chatrooms.${chatroomId}.v2`
      }
    })
    console.log('[Kick] Subscrevendo ao canal:', `chatrooms.${chatroomId}.v2`)
    globalThis.__kickWs?.send(subscribeMessage)
  })

  globalThis.__kickWs.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString())
      
      // Log de TODOS os eventos para debug (incluindo pusher internos)
      console.log('[Kick] Evento raw:', data.event, data.channel ? `canal: ${data.channel}` : '')
      
      // Confirmação de subscription
      if (data.event === 'pusher_internal:subscription_succeeded') {
        console.log('[Kick] Subscription confirmada para:', data.channel)
      }
      
      // Ignorar eventos de sistema do Pusher
      if (data.event?.startsWith('pusher:') || data.event?.startsWith('pusher_internal:')) {
        return
      }
      
      // Log detalhado de qualquer evento não-pusher
      if (data.event) {
        console.log('[Kick] Evento de aplicação:', data.event)
        console.log('[Kick] Data:', typeof data.data === 'string' ? data.data.substring(0, 200) : JSON.stringify(data.data).substring(0, 200))
      }
      
      // Mensagens de chat - tentar múltiplos formatos de evento
      if (data.event === 'App\\Events\\ChatMessageEvent' || 
          data.event === 'ChatMessageEvent' ||
          data.event === 'chat-message' ||
          data.event === 'ChatMessage' ||
          data.event === 'message') {
        console.log('[Kick] Mensagem de chat recebida!')
        
        // Quando receber primeira mensagem, verificar YouTube (economiza quota)
        checkYouTubeOnKickActivity()
        
        const messageData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
        handleChatMessage(messageData)
      }
    } catch (error) {
      console.error('[Kick] Erro ao processar mensagem:', error)
    }
  })

  globalThis.__kickWs.on('error', (error) => {
    console.error('[Kick] WebSocket erro:', error.message)
  })

  globalThis.__kickWs.on('close', (code, reason) => {
    console.log('[Kick] WebSocket desconectado, código:', code, 'razão:', reason.toString())
    console.log('[Kick] Reconectando em 5s...')
    globalThis.__kickWs = null
    setTimeout(() => {
      globalThis.__kickReaderStarted = false
      startKickReader()
    }, 5000)
  })
}

/**
 * Processa mensagem recebida do chat
 */
function handleChatMessage(message: KickChatMessage): void {
  console.log('[Kick] Processando mensagem:', message.content?.substring(0, 50))
  
  // Mapear badges da Kick
  const rawBadges = message.sender?.identity?.badges || []
  const badges: string[] = []
  
  rawBadges.forEach(badge => {
    const badgeType = badge.type?.toLowerCase() || ''
    // Mapear tipos de badges da Kick para nomes padrão
    if (badgeType.includes('broadcaster') || badgeType.includes('owner')) {
      badges.push('broadcaster')
    } else if (badgeType.includes('moderator') || badgeType.includes('mod')) {
      badges.push('moderator')
    } else if (badgeType.includes('vip')) {
      badges.push('vip')
    } else if (badgeType.includes('subscriber') || badgeType.includes('sub')) {
      badges.push('subscriber')
    } else if (badgeType.includes('staff')) {
      badges.push('staff')
    } else if (badgeType.includes('verified')) {
      badges.push('verified')
    } else if (badgeType) {
      badges.push(badgeType)
    }
  })
  
  // Log para debug
  if (badges.length > 0) {
    console.log('[Kick] Badges do usuário', message.sender?.username, ':', badges)
  }
  
  const username = message.sender?.username || 'Anônimo'
  const userId = String(message.sender?.id || 'unknown')
  const content = message.content
  
  chatHub.broadcast({
    id: message.id,
    platform: 'kick',
    username,
    userId,
    message: content,
    timestamp: new Date(message.created_at).getTime(),
    badges
  })
  
  // Processar comandos (ex: !testmod)
  if (content.startsWith('!')) {
    processCommand({
      username,
      userId,
      message: content,
      platform: 'kick',
      badges
    }).catch(err => {
      console.error('[Kick] Erro ao processar comando:', err)
    })
  }
}

/**
 * Envia mensagem no chat da Kick usando a API oficial
 * Requer access_token do usuário com scope chat:write
 * 
 * @param username - Nome do usuário que está enviando
 * @param accessToken - Token de acesso OAuth da Kick
 * @param message - Mensagem a ser enviada
 * @param userKickId - ID do usuário na Kick (opcional, usado como fallback para broadcaster_user_id)
 */
export async function sendKickMessage(
  username: string, 
  accessToken: string, 
  message: string,
  userKickId?: string
): Promise<boolean> {
  if (!accessToken) {
    console.error('[Kick] Access token não disponível')
    return false
  }

  try {
    // Buscar o broadcaster_user_id do canal usando a API autenticada
    let broadcasterId = await getBroadcasterUserIdWithAuth(accessToken)
    
    // Se não conseguir, tentar usar o ID do usuário (caso seja o próprio canal do usuário)
    if (!broadcasterId && userKickId) {
      console.log('[Kick] Usando userKickId como broadcaster_user_id:', userKickId)
      broadcasterId = parseInt(userKickId, 10)
    }
    
    if (!broadcasterId) {
      console.error('[Kick] Não foi possível obter o broadcaster_user_id')
      console.error('[Kick] Configure KICK_BROADCASTER_USER_ID no .env.local com o ID do canal waveigloficial')
      return false
    }

    console.log('[Kick] Enviando mensagem para broadcaster_user_id:', broadcasterId)

    // API oficial da Kick para enviar mensagens
    // Endpoint: POST https://api.kick.com/public/v1/chat
    const requestBody = {
      broadcaster_user_id: broadcasterId, // ID numérico do broadcaster
      content: message, // Campo correto é "content", não "message"
      type: 'user' // Tipo de mensagem: 'user' ou 'bot'
    }

    console.log('[Kick] Request body:', JSON.stringify(requestBody))

    const res = await fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await res.text()
    console.log('[Kick] Response status:', res.status, 'body:', responseText)

    if (!res.ok) {
      console.error('[Kick] Erro ao enviar mensagem:', res.status, responseText)
      return false
    }

    console.log('[Kick] Mensagem enviada com sucesso por:', username)
    return true

  } catch (error) {
    console.error('[Kick] Erro ao enviar mensagem:', error)
    return false
  }
}

/**
 * Busca o broadcaster_user_id usando a API autenticada da Kick
 * Primeiro verifica se está configurado via env, depois tenta via API
 */
async function getBroadcasterUserIdWithAuth(accessToken: string): Promise<number | null> {
  // Usar cache se disponível
  if (cachedBroadcasterId) {
    return cachedBroadcasterId
  }

  // Se tiver configurado via env KICK_BROADCASTER_USER_ID, usar diretamente
  if (process.env.KICK_BROADCASTER_USER_ID) {
    cachedBroadcasterId = parseInt(process.env.KICK_BROADCASTER_USER_ID, 10)
    console.log('[Kick] Usando KICK_BROADCASTER_USER_ID do env:', cachedBroadcasterId)
    return cachedBroadcasterId
  }

  // Se tiver KICK_CHANNEL_ID configurado, usar como broadcaster_user_id
  if (process.env.KICK_CHANNEL_ID) {
    cachedBroadcasterId = parseInt(process.env.KICK_CHANNEL_ID, 10)
    console.log('[Kick] Usando KICK_CHANNEL_ID como broadcaster_user_id:', cachedBroadcasterId)
    return cachedBroadcasterId
  }

  try {
    // Tentar buscar via API autenticada de channels
    // A API da Kick pode ter um endpoint para buscar canais
    const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${KICK_CHANNEL}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (res.ok) {
      const data = await res.json()
      console.log('[Kick] Channel data:', JSON.stringify(data))
      
      // Tentar extrair o broadcaster_user_id
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        cachedBroadcasterId = data.data[0].broadcaster_user_id
        console.log('[Kick] Broadcaster user_id encontrado via API:', cachedBroadcasterId)
        return cachedBroadcasterId
      }
    } else {
      console.log('[Kick] API de channels não disponível:', res.status)
    }

    // Fallback: tentar a API pública v2
    const fallbackId = await getBroadcasterUserId()
    if (fallbackId) {
      return fallbackId
    }

    // Último fallback: usar o ID do canal waveigloficial se conhecido
    // Você pode descobrir o ID acessando: https://kick.com/api/v1/channels/waveigloficial
    // e procurando pelo campo "user_id" ou "id"
    console.error('[Kick] IMPORTANTE: Configure KICK_BROADCASTER_USER_ID ou KICK_CHANNEL_ID no .env.local')
    console.error('[Kick] Para encontrar o ID, acesse o painel de desenvolvedor da Kick')
    return null

  } catch (error) {
    console.error('[Kick] Erro ao buscar broadcaster_user_id via API:', error)
    return getBroadcasterUserId()
  }
}

/**
 * Cache para o broadcaster_user_id
 */
let cachedBroadcasterId: number | null = null

/**
 * Busca o user_id do broadcaster (canal)
 * Primeiro tenta via env, depois via API pública com headers de browser
 */
async function getBroadcasterUserId(): Promise<number | null> {
  // Usar cache se disponível
  if (cachedBroadcasterId) {
    return cachedBroadcasterId
  }

  // Se tiver configurado via env, usar diretamente
  if (process.env.KICK_BROADCASTER_USER_ID) {
    cachedBroadcasterId = parseInt(process.env.KICK_BROADCASTER_USER_ID, 10)
    console.log('[Kick] Usando KICK_BROADCASTER_USER_ID do env:', cachedBroadcasterId)
    return cachedBroadcasterId
  }

  try {
    // Buscar o user_id do canal via API pública com headers de browser
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_CHANNEL}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://kick.com/',
        'Origin': 'https://kick.com'
      }
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Kick] Erro ao buscar canal:', res.status, errorText)
      return null
    }

    const data = await res.json()
    
    // O user_id está no campo user.id
    if (data?.user?.id) {
      cachedBroadcasterId = data.user.id
      console.log('[Kick] Broadcaster user_id encontrado:', cachedBroadcasterId)
      return cachedBroadcasterId
    }

    console.error('[Kick] user.id não encontrado na resposta:', JSON.stringify(data).substring(0, 500))
    return null

  } catch (error) {
    console.error('[Kick] Erro ao buscar broadcaster_user_id:', error)
    return null
  }
}

/**
 * Para o leitor de chat
 */
export function stopKickReader(): void {
  if (globalThis.__kickWs) {
    globalThis.__kickWs.close()
    globalThis.__kickWs = null
  }
  globalThis.__kickReaderStarted = false
}

/**
 * Renova o token de acesso da Kick usando o refresh token
 * 
 * @param refreshToken - Refresh token da Kick
 * @param userId - ID do usuário no sistema
 * @param db - Instância do Supabase
 * @returns Novo access token ou null se falhar
 */
export async function refreshKickToken(
  refreshToken: string,
  userId: string,
  db: ReturnType<typeof import('@/lib/supabase/server').getSupabaseAdmin>
): Promise<string | null> {
  try {
    const clientId = process.env.KICK_CLIENT_ID
    const clientSecret = process.env.KICK_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('[Kick] Client ID ou Secret não configurados')
      return null
    }
    
    const tokenResponse = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Kick] Erro ao renovar token:', tokenResponse.status, errorText)
      return null
    }
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('[Kick] Resposta de token inválida:', tokenData)
      return null
    }
    
    // Atualizar o token no banco de dados
    const { error: updateError } = await db
      .from('linked_accounts')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Manter o antigo se não vier novo
      })
      .eq('user_id', userId)
      .eq('platform', 'kick')
    
    if (updateError) {
      console.error('[Kick] Erro ao salvar novo token:', updateError)
    } else {
      console.log('[Kick] Token renovado com sucesso')
    }
    
    return tokenData.access_token
    
  } catch (error) {
    console.error('[Kick] Erro ao renovar token:', error)
    return null
  }
}
