/**
 * Sistema de filas para mensagens do chat
 * Implementa rate limiting para respeitar os limites das plataformas
 * 
 * Rate limits aproximados:
 * - Twitch: 20 mensagens por 30 segundos (mods)
 * - Kick: ~10 mensagens por 10 segundos
 * - YouTube: ~30 mensagens por minuto
 */

// Usar globalThis para persistir entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __messageQueue: MessageQueue | undefined
}

interface QueuedMessage {
  id: string
  message: string
  platform: 'twitch' | 'kick' | 'youtube' | 'all'
  priority: 'high' | 'normal' | 'low'
  addedAt: number
  retries: number
  sentTo: Set<string> // Plataformas para as quais já foi enviado
}

interface RateLimitConfig {
  messagesPerWindow: number
  windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  twitch: { messagesPerWindow: 15, windowMs: 30000 }, // 15 msgs por 30s (conservador)
  kick: { messagesPerWindow: 8, windowMs: 10000 },    // 8 msgs por 10s
  youtube: { messagesPerWindow: 25, windowMs: 60000 } // 25 msgs por minuto
}

// Intervalo mínimo entre mensagens (ms)
const MIN_INTERVAL_MS = 1500 // 1.5 segundos entre mensagens

class MessageQueue {
  private queue: QueuedMessage[] = []
  private processing = false
  private lastSentTime: Record<string, number[]> = {
    twitch: [],
    kick: [],
    youtube: []
  }
  private sendFunctions: Record<string, (message: string) => Promise<boolean>> = {}
  
  constructor() {
    console.log('[Queue] Sistema de filas inicializado')
  }
  
  /**
   * Registra funções de envio para cada plataforma
   */
  registerSendFunction(platform: string, fn: (message: string) => Promise<boolean>): void {
    this.sendFunctions[platform] = fn
    console.log(`[Queue] Função de envio registrada para ${platform}`)
  }
  
  /**
   * Adiciona mensagem à fila
   */
  enqueue(
    message: string, 
    platform: 'twitch' | 'kick' | 'youtube' | 'all' = 'all',
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    // Verificar se mensagem idêntica já está na fila (evitar duplicatas)
    const existingMessage = this.queue.find(m => 
      m.message === message && 
      m.platform === platform &&
      (Date.now() - m.addedAt) < 5000 // Nos últimos 5 segundos
    )
    
    if (existingMessage) {
      console.log(`[Queue] ⚠️ Mensagem duplicada ignorada: ${message.substring(0, 30)}...`)
      return existingMessage.id
    }
    
    const queuedMessage: QueuedMessage = {
      id,
      message,
      platform,
      priority,
      addedAt: Date.now(),
      retries: 0,
      sentTo: new Set<string>()
    }
    
    // Inserir na posição correta baseado na prioridade
    if (priority === 'high') {
      // Alta prioridade vai para o início
      const firstNonHigh = this.queue.findIndex(m => m.priority !== 'high')
      if (firstNonHigh === -1) {
        this.queue.push(queuedMessage)
      } else {
        this.queue.splice(firstNonHigh, 0, queuedMessage)
      }
    } else if (priority === 'low') {
      // Baixa prioridade vai para o final
      this.queue.push(queuedMessage)
    } else {
      // Normal vai depois das high
      const firstLow = this.queue.findIndex(m => m.priority === 'low')
      if (firstLow === -1) {
        this.queue.push(queuedMessage)
      } else {
        this.queue.splice(firstLow, 0, queuedMessage)
      }
    }
    
    console.log(`[Queue] Mensagem adicionada: ${id} (${platform}, ${priority}) - Total: ${this.queue.length}`)
    
    // Iniciar processamento se não estiver rodando
    this.startProcessing()
    
    return id
  }
  
  /**
   * Verifica se pode enviar para uma plataforma (rate limiting)
   */
  private canSendTo(platform: string): boolean {
    const config = RATE_LIMITS[platform]
    if (!config) return true
    
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Limpar timestamps antigos
    this.lastSentTime[platform] = this.lastSentTime[platform].filter(t => t > windowStart)
    
    // Verificar limite
    if (this.lastSentTime[platform].length >= config.messagesPerWindow) {
      return false
    }
    
    // Verificar intervalo mínimo
    const lastSent = this.lastSentTime[platform][this.lastSentTime[platform].length - 1]
    if (lastSent && (now - lastSent) < MIN_INTERVAL_MS) {
      return false
    }
    
    return true
  }
  
  /**
   * Registra envio para rate limiting
   */
  private recordSend(platform: string): void {
    this.lastSentTime[platform].push(Date.now())
  }
  
  /**
   * Processa a fila
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) return
    this.processing = true
    
    console.log('[Queue] Iniciando processamento da fila')
    
    while (this.queue.length > 0) {
      const message = this.queue[0]
      
      // Determinar para quais plataformas enviar (excluindo as já enviadas)
      const allPlatforms = message.platform === 'all' 
        ? ['twitch', 'kick', 'youtube'] 
        : [message.platform]
      
      // Filtrar plataformas que ainda não receberam a mensagem
      const remainingPlatforms = allPlatforms.filter(p => !message.sentTo.has(p))
      
      // Se já enviou para todas, remover da fila
      if (remainingPlatforms.length === 0) {
        console.log(`[Queue] ✅ Mensagem ${message.id} enviada para todas as plataformas`)
        this.queue.shift()
        continue
      }
      
      // Filtrar por rate limit
      const platformsToSend = remainingPlatforms.filter(p => this.canSendTo(p))
      
      if (platformsToSend.length === 0) {
        // Nenhuma plataforma disponível, aguardar
        console.log('[Queue] Rate limit atingido, aguardando...')
        await this.sleep(MIN_INTERVAL_MS)
        continue
      }
      
      // Enviar para cada plataforma disponível
      for (const platform of platformsToSend) {
        const sendFn = this.sendFunctions[platform]
        if (!sendFn) {
          console.log(`[Queue] Função de envio não registrada para ${platform}`)
          message.sentTo.add(platform) // Marcar como "enviado" para não tentar de novo
          continue
        }
        
        try {
          const success = await sendFn(message.message)
          if (success) {
            this.recordSend(platform)
            message.sentTo.add(platform) // Marcar como enviado
            console.log(`[Queue] ✅ Mensagem enviada para ${platform}: ${message.id}`)
          } else {
            console.log(`[Queue] ⚠️ Falha ao enviar para ${platform}: ${message.id}`)
            // Não marcar como enviado, tentará novamente
          }
        } catch (error) {
          console.error(`[Queue] ❌ Erro ao enviar para ${platform}:`, error)
          // Não marcar como enviado, tentará novamente
        }
        
        // Pequeno delay entre plataformas
        await this.sleep(500)
      }
      
      // Verificar se já enviou para todas ou atingiu limite de retries
      const stillRemaining = allPlatforms.filter(p => !message.sentTo.has(p))
      
      if (stillRemaining.length === 0) {
        // Enviou para todas as plataformas
        this.queue.shift()
      } else if (message.retries >= 3) {
        // Atingiu limite de retries, remover da fila
        console.log(`[Queue] ⚠️ Mensagem ${message.id} removida após ${message.retries} retries. Não enviada para: ${stillRemaining.join(', ')}`)
        this.queue.shift()
      } else {
        // Incrementar retries e mover para o final
        message.retries++
        this.queue.shift()
        this.queue.push(message)
      }
      
      // Delay entre mensagens
      await this.sleep(MIN_INTERVAL_MS)
    }
    
    this.processing = false
    console.log('[Queue] Processamento da fila concluído')
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Retorna status da fila
   */
  getStatus(): { queueLength: number; processing: boolean; rateLimits: Record<string, { remaining: number; windowMs: number }> } {
    const now = Date.now()
    const rateLimits: Record<string, { remaining: number; windowMs: number }> = {}
    
    for (const [platform, config] of Object.entries(RATE_LIMITS)) {
      const windowStart = now - config.windowMs
      const recentSends = this.lastSentTime[platform].filter(t => t > windowStart).length
      rateLimits[platform] = {
        remaining: config.messagesPerWindow - recentSends,
        windowMs: config.windowMs
      }
    }
    
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      rateLimits
    }
  }
}

// Singleton com persistência HMR
if (!globalThis.__messageQueue) {
  globalThis.__messageQueue = new MessageQueue()
}

export const messageQueue = globalThis.__messageQueue

/**
 * Função helper para adicionar mensagem à fila
 */
export function queueMessage(
  message: string, 
  platform: 'twitch' | 'kick' | 'youtube' | 'all' = 'all',
  priority: 'high' | 'normal' | 'low' = 'normal'
): string {
  return messageQueue.enqueue(message, platform, priority)
}

/**
 * Função helper para adicionar múltiplas mensagens (ex: gift subs)
 */
export function queueMultipleMessages(
  messages: string[], 
  platform: 'twitch' | 'kick' | 'youtube' | 'all' = 'all',
  priority: 'high' | 'normal' | 'low' = 'normal'
): string[] {
  return messages.map(msg => messageQueue.enqueue(msg, platform, priority))
}

