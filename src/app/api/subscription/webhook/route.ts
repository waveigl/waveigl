import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago'
import { validateUUID } from '@/lib/validation/uuid'
import { validateSubscriptionEvent } from '@/lib/validation/subscription-event'
import { retryWithBackoff } from '@/lib/retry/backoff'
import { logWebhookEvent, logValidationError, logSubscriptionCreated, logSubscriptionCreationFailed } from '@/lib/logging/subscription-logger'
import { notifyDiscordOnError } from '@/lib/notifications/discord'

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      logWebhookEvent('error', 'MERCADOPAGO_ACCESS_TOKEN não configurado', {
        source: 'mercadopago_webhook',
        eventType: 'configuration_error'
      })
      
      await notifyDiscordOnError({
        level: 'critical',
        title: 'Mercado Pago Webhook Configuration Error',
        message: 'MERCADOPAGO_ACCESS_TOKEN is not configured',
        context: { timestamp: new Date().toISOString() }
      })

      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 })
    }

    const client = new MercadoPagoConfig({ accessToken })

    // O corpo pode vir de diferentes formas dependendo da versão da API do MP
    // Geralmente { type: "...", data: { id: "..." } } ou { topic: "...", resource: "..." }
    const body = await request.json()
    
    logWebhookEvent('info', 'Webhook recebido', {
      source: 'mercadopago_webhook',
      eventType: body.type || body.topic,
      timestamp: new Date().toISOString()
    })

    const type = body.type || body.topic
    let id = body.data?.id || body.resource

    // Se resource for URL, extrair ID
    if (id && String(id).includes('/')) {
      const parts = String(id).split('/')
      id = parts[parts.length - 1]
    }

    if (!id) {
      logWebhookEvent('warn', 'Webhook sem ID', {
        source: 'mercadopago_webhook',
        eventType: type
      })
      return NextResponse.json({ header: "OK" })
    }

    let userId: string | null = null
    let status: string | null = null
    let subscriptionId: string | null = null

    // Cenário 1: Notificação de Assinatura (PreApproval)
    if (type === 'subscription_preapproval') {
      try {
        const preapproval = new PreApproval(client)
        const subscription = await preapproval.get({ id })

        userId = subscription.external_reference as string
        status = subscription.status as string // authorized, paused, cancelled
        subscriptionId = id

        logWebhookEvent('info', 'Assinatura recebida', {
          source: 'mercadopago_webhook',
          eventType: 'subscription_preapproval',
          subscriptionId: id,
          userId,
          status
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logWebhookEvent('error', 'Erro ao buscar assinatura do MP', {
          source: 'mercadopago_webhook',
          eventType: 'subscription_preapproval',
          error: errorMessage,
          subscriptionId: id
        })

        await notifyDiscordOnError({
          level: 'error',
          title: 'Mercado Pago Subscription Fetch Error',
          message: `Failed to fetch subscription ${id}`,
          context: { error: errorMessage, subscriptionId: id }
        })

        return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
      }
    }
    // Cenário 2: Notificação de Pagamento (Payment)
    else if (type === 'payment') {
      try {
        const paymentClient = new Payment(client)
        const payment = await paymentClient.get({ id })

        userId = payment.external_reference as string
        const paymentStatus = payment.status

        logWebhookEvent('info', 'Pagamento recebido', {
          source: 'mercadopago_webhook',
          eventType: 'payment',
          paymentId: id,
          userId,
          paymentStatus
        })

        if (paymentStatus === 'approved') {
          status = 'authorized'
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logWebhookEvent('warn', 'Erro ao buscar pagamento do MP', {
          source: 'mercadopago_webhook',
          eventType: 'payment',
          error: errorMessage,
          paymentId: id
        })
      }
    }

    // Se conseguimos identificar o usuário e o status
    if (userId && status) {
      // Validar UUID
      const uuidValidation = validateUUID(userId)
      if (!uuidValidation.valid) {
        logValidationError('userId', uuidValidation.error || 'Invalid UUID', {
          source: 'mercadopago_webhook',
          userId,
          eventType: type
        })

        await notifyDiscordOnError({
          level: 'error',
          title: 'Mercado Pago Webhook Validation Error',
          message: `Invalid UUID: ${userId}`,
          context: { userId, error: uuidValidation.error }
        })

        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
      }

      // Validar evento de subscrição
      const eventValidation = validateSubscriptionEvent({
        userId,
        subscriptionId: subscriptionId || id,
        status,
        amount: 0 // Não temos amount no webhook
      })

      if (!eventValidation.valid) {
        logValidationError('subscription_event', eventValidation.errors.join(', '), {
          source: 'mercadopago_webhook',
          userId,
          subscriptionId: subscriptionId || id,
          status
        })

        await notifyDiscordOnError({
          level: 'error',
          title: 'Mercado Pago Webhook Validation Error',
          message: `Invalid subscription event: ${eventValidation.errors.join(', ')}`,
          context: { userId, errors: eventValidation.errors }
        })

        return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
      }

      // Mapear status do MP para nosso status no banco
      let dbStatus = 'inactive'
      if (status === 'authorized') {
        dbStatus = 'active'
      }

      // Atualizar perfil com retry
      const result = await retryWithBackoff(
        async () => {
          const supabase = getSupabaseAdmin()

          const updateData: any = {
            subscription_status: dbStatus,
            updated_at: new Date().toISOString()
          }

          if (subscriptionId) {
            updateData.subscription_id = subscriptionId
          }

          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)

          if (error) {
            throw new Error(`Database error: ${error.message}`)
          }

          return { success: true }
        },
        { maxRetries: 3, baseDelay: 1000 }
      )

      if (result.success) {
        logSubscriptionCreated(userId, subscriptionId || id, {
          source: 'mercadopago_webhook',
          status: dbStatus,
          attempts: result.attempts
        })

        await notifyDiscordOnError({
          level: 'info',
          title: 'Subscription Updated',
          message: `User ${userId} subscription status updated to ${dbStatus}`,
          context: { userId, subscriptionId: subscriptionId || id, status: dbStatus }
        })
      } else {
        logSubscriptionCreationFailed(userId, result.error?.message || 'Unknown error', {
          source: 'mercadopago_webhook',
          subscriptionId: subscriptionId || id,
          attempts: result.attempts
        })

        await notifyDiscordOnError({
          level: 'critical',
          title: 'Subscription Update Failed',
          message: `Failed to update subscription for user ${userId} after ${result.attempts} attempts`,
          context: { userId, subscriptionId: subscriptionId || id, error: result.error?.message }
        })

        return NextResponse.json({ error: 'Falha no banco de dados' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackTrace = error instanceof Error ? error.stack : undefined

    logWebhookEvent('error', 'Erro geral no webhook', {
      source: 'mercadopago_webhook',
      error: errorMessage,
      stackTrace
    })

    await notifyDiscordOnError({
      level: 'error',
      title: 'Mercado Pago Webhook Error',
      message: `Webhook processing failed: ${errorMessage}`,
      context: { error: errorMessage, timestamp: new Date().toISOString() },
      stackTrace
    })

    return NextResponse.json(
      { error: 'Falha interna' },
      { status: 500 }
    )
  }
}
