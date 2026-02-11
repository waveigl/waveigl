import { NextRequest, NextResponse } from 'next/server'
import { getEventStore } from '@/lib/storage/event-store'
import { logWebhookEvent } from '@/lib/logging/subscription-logger'

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  webhooks: {
    mercadoPago: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
    discord: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
    twitch: {
      status: 'ok' | 'error'
      lastSuccess?: string
      error?: string
    }
  }
  pendingEvents: number
  failedEvents: number
}

/**
 * Health check endpoint para webhooks
 * Verifica conectividade com Mercado Pago, Discord e Twitch
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const timestamp = new Date().toISOString()
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp,
    webhooks: {
      mercadoPago: { status: 'ok' },
      discord: { status: 'ok' },
      twitch: { status: 'ok' }
    },
    pendingEvents: 0,
    failedEvents: 0
  }

  try {
    // Verificar Mercado Pago
    try {
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!mpAccessToken) {
        response.webhooks.mercadoPago = {
          status: 'error',
          error: 'MERCADOPAGO_ACCESS_TOKEN not configured'
        }
        response.status = 'degraded'
      } else {
        // Tentar fazer uma requisição simples para verificar conectividade
        const res = await fetch('https://api.mercadopago.com/v1/account/balance', {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`
          },
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok) {
          response.webhooks.mercadoPago = {
            status: 'ok',
            lastSuccess: timestamp
          }
        } else {
          response.webhooks.mercadoPago = {
            status: 'error',
            error: `HTTP ${res.status}`
          }
          response.status = 'degraded'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response.webhooks.mercadoPago = {
        status: 'error',
        error: errorMessage
      }
      response.status = 'degraded'
    }

    // Verificar Discord
    try {
      const discordWebhookUrl = process.env.DISCORD_ERROR_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL
      if (!discordWebhookUrl) {
        response.webhooks.discord = {
          status: 'error',
          error: 'Discord webhook URL not configured'
        }
        response.status = 'degraded'
      } else {
        // Tentar fazer uma requisição simples para verificar conectividade
        const res = await fetch(discordWebhookUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok || res.status === 405) { // 405 é esperado para GET em webhook
          response.webhooks.discord = {
            status: 'ok',
            lastSuccess: timestamp
          }
        } else {
          response.webhooks.discord = {
            status: 'error',
            error: `HTTP ${res.status}`
          }
          response.status = 'degraded'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response.webhooks.discord = {
        status: 'error',
        error: errorMessage
      }
      response.status = 'degraded'
    }

    // Verificar Twitch
    try {
      const twitchClientId = process.env.TWITCH_CLIENT_ID
      const twitchAccessToken = process.env.TWITCH_BOT_ACCESS_TOKEN
      
      if (!twitchClientId || !twitchAccessToken) {
        response.webhooks.twitch = {
          status: 'error',
          error: 'Twitch credentials not configured'
        }
        response.status = 'degraded'
      } else {
        // Tentar fazer uma requisição simples para verificar conectividade
        const res = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Authorization': `Bearer ${twitchAccessToken}`,
            'Client-ID': twitchClientId
          },
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok) {
          response.webhooks.twitch = {
            status: 'ok',
            lastSuccess: timestamp
          }
        } else {
          response.webhooks.twitch = {
            status: 'error',
            error: `HTTP ${res.status}`
          }
          response.status = 'degraded'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response.webhooks.twitch = {
        status: 'error',
        error: errorMessage
      }
      response.status = 'degraded'
    }

    // Contar eventos pendentes e falhados
    try {
      const eventStore = getEventStore()
      const pendingEvents = await eventStore.list('pending', 1000)
      const failedEvents = await eventStore.list('failed', 1000)
      
      response.pendingEvents = pendingEvents.length
      response.failedEvents = failedEvents.length

      if (failedEvents.length > 0) {
        response.status = 'degraded'
      }
    } catch (error) {
      console.error('[Health Check] Erro ao contar eventos:', error)
    }

    logWebhookEvent('info', 'Health check executado', {
      source: 'health_check',
      status: response.status,
      mercadoPagoStatus: response.webhooks.mercadoPago.status,
      discordStatus: response.webhooks.discord.status,
      twitchStatus: response.webhooks.twitch.status,
      pendingEvents: response.pendingEvents,
      failedEvents: response.failedEvents
    })

    // Retornar 503 se unhealthy, 200 caso contrário
    const statusCode = response.status === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logWebhookEvent('error', 'Erro no health check', {
      source: 'health_check',
      error: errorMessage
    })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        webhooks: {
          mercadoPago: { status: 'error', error: 'Health check failed' },
          discord: { status: 'error', error: 'Health check failed' },
          twitch: { status: 'error', error: 'Health check failed' }
        },
        pendingEvents: 0,
        failedEvents: 0
      },
      { status: 503 }
    )
  }
}
