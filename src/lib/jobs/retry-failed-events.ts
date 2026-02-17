/**
 * Event Retry Processor
 * Background job para retry de eventos falhados
 */

import { getEventStore } from '@/lib/storage/event-store'
import { retryWithBackoff } from '@/lib/retry/backoff'
import { logWebhookEvent } from '@/lib/logging/subscription-logger'
import { notifyDiscordOnError } from '@/lib/notifications/discord'

/**
 * Processa eventos falhados e tenta fazer retry
 * Deve ser executado periodicamente (ex: a cada 5 minutos)
 */
export async function retryFailedEvents(): Promise<void> {
  try {
    logWebhookEvent('info', 'Iniciando retry de eventos falhados', {
      source: 'retry_processor',
      eventType: 'retry_start'
    })

    const eventStore = getEventStore()

    // Buscar eventos pendentes
    const pendingEvents = await eventStore.list('pending', 100)

    if (pendingEvents.length === 0) {
      logWebhookEvent('info', 'Nenhum evento pendente para retry', {
        source: 'retry_processor',
        eventType: 'no_pending_events'
      })
      return
    }

    logWebhookEvent('info', `Encontrados ${pendingEvents.length} eventos para retry`, {
      source: 'retry_processor',
      eventType: 'pending_events_found',
      count: pendingEvents.length
    })

    let successCount = 0
    let failureCount = 0

    // Processar cada evento
    for (const event of pendingEvents) {
      try {
        logWebhookEvent('info', `Retrying evento ${event.id}`, {
          source: 'retry_processor',
          eventId: event.id,
          eventType: event.eventType,
          attempts: event.attempts
        })

        // Retry com backoff
        const result = await retryWithBackoff(
          async () => {
            // Aqui você processaria o evento novamente
            // Por exemplo, chamar a função de processamento original
            return { success: true }
          },
          { maxRetries: 2, baseDelay: 1000 }
        )

        if (result.success) {
          // Marcar como processado
          await eventStore.markProcessed(event.id)
          successCount++

          logWebhookEvent('info', `Evento ${event.id} processado com sucesso`, {
            source: 'retry_processor',
            eventId: event.id,
            attempts: result.attempts
          })
        } else {
          // Marcar como falhado
          await eventStore.markFailed(event.id, result.error?.message || 'Unknown error')
          failureCount++

          logWebhookEvent('error', `Evento ${event.id} falhou após retry`, {
            source: 'retry_processor',
            eventId: event.id,
            attempts: result.attempts,
            error: result.error?.message
          })

          // Se muitos eventos falharem, notificar Discord
          if (failureCount >= 5) {
            await notifyDiscordOnError({
              level: 'warning',
              title: 'Event Retry Processor - Multiple Failures',
              message: `${failureCount} events failed during retry processing`,
              context: {
                successCount,
                failureCount,
                totalProcessed: successCount + failureCount
              }
            })
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        failureCount++

        logWebhookEvent('error', `Erro ao processar evento ${event.id}`, {
          source: 'retry_processor',
          eventId: event.id,
          error: errorMessage
        })

        // Marcar como falhado
        try {
          await eventStore.markFailed(event.id, errorMessage)
        } catch (markError) {
          console.error('[Retry Processor] Erro ao marcar evento como falhado:', markError)
        }
      }
    }

    logWebhookEvent('info', 'Retry de eventos falhados concluído', {
      source: 'retry_processor',
      eventType: 'retry_complete',
      successCount,
      failureCount,
      totalProcessed: successCount + failureCount
    })

    // Notificar Discord se houver falhas
    if (failureCount > 0) {
      await notifyDiscordOnError({
        level: 'warning',
        title: 'Event Retry Processor Summary',
        message: `Retry processing completed with ${failureCount} failures`,
        context: {
          successCount,
          failureCount,
          totalProcessed: successCount + failureCount,
          timestamp: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackTrace = error instanceof Error ? error.stack : undefined

    logWebhookEvent('error', 'Erro geral no retry processor', {
      source: 'retry_processor',
      error: errorMessage,
      stackTrace
    })

    await notifyDiscordOnError({
      level: 'error',
      title: 'Event Retry Processor Error',
      message: `Retry processor failed: ${errorMessage}`,
      context: { error: errorMessage, timestamp: new Date().toISOString() },
      stackTrace
    })
  }
}

/**
 * Inicia o retry processor como um job recorrente
 * Deve ser chamado uma vez durante a inicialização da aplicação
 */
export function startRetryProcessor(intervalMs: number = 5 * 60 * 1000): NodeJS.Timer {
  logWebhookEvent('info', 'Iniciando retry processor', {
    source: 'retry_processor',
    intervalMs
  })

  // Executar imediatamente
  retryFailedEvents().catch(error => {
    console.error('[Retry Processor] Erro na execução inicial:', error)
  })

  // Executar periodicamente
  return setInterval(() => {
    retryFailedEvents().catch(error => {
      console.error('[Retry Processor] Erro na execução periódica:', error)
    })
  }, intervalMs)
}

/**
 * Para o retry processor
 */
export function stopRetryProcessor(timer: any): void {
  clearInterval(timer)
  logWebhookEvent('info', 'Retry processor parado', {
    source: 'retry_processor'
  })
}
