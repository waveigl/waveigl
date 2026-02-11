import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleSubscriptionEvent } from '@/lib/notifications/subscription'
import { validateUUID } from '@/lib/validation/uuid'
import { logWebhookEvent, logValidationError } from '@/lib/logging/subscription-logger'
import { notifyDiscordOnError } from '@/lib/notifications/discord'

const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'
const TWITCH_MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'

const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification'
const MESSAGE_TYPE_NOTIFICATION = 'notification'
const MESSAGE_TYPE_REVOCATION = 'revocation'

// Verifica assinatura do webhook
function verifySignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const secret = process.env.TWITCH_EVENTSUB_SECRET
  if (!secret) return false

  const message = messageId + timestamp + body
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const messageId = request.headers.get(TWITCH_MESSAGE_ID) || ''
    const timestamp = request.headers.get(TWITCH_MESSAGE_TIMESTAMP) || ''
    const signature = request.headers.get(TWITCH_MESSAGE_SIGNATURE) || ''
    const messageType = request.headers.get(TWITCH_MESSAGE_TYPE)

    logWebhookEvent('info', 'Twitch EventSub webhook recebido', {
      source: 'twitch_eventsub',
      messageType,
      timestamp: new Date().toISOString()
    })

    // Verifica assinatura
    if (!verifySignature(messageId, timestamp, body, signature)) {
      logWebhookEvent('error', 'Assinatura Twitch inválida', {
        source: 'twitch_eventsub',
        error: 'Invalid signature'
      })

      await notifyDiscordOnError({
        level: 'warning',
        title: 'Twitch EventSub Signature Verification Failed',
        message: 'Invalid webhook signature received',
        context: { timestamp: new Date().toISOString() }
      })

      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const payload = JSON.parse(body)

    // Verificação de webhook (challenge)
    if (messageType === MESSAGE_TYPE_VERIFICATION) {
      logWebhookEvent('info', 'Twitch EventSub verificação recebida', {
        source: 'twitch_eventsub',
        messageType: MESSAGE_TYPE_VERIFICATION
      })
      return new NextResponse(payload.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // Revogação
    if (messageType === MESSAGE_TYPE_REVOCATION) {
      logWebhookEvent('info', 'Twitch EventSub subscription revogada', {
        source: 'twitch_eventsub',
        subscriptionType: payload.subscription.type
      })
      return NextResponse.json({ ok: true })
    }

    // Notificação
    if (messageType === MESSAGE_TYPE_NOTIFICATION) {
      const event = payload.event
      const subscriptionType = payload.subscription.type

      logWebhookEvent('info', `Twitch EventSub evento: ${subscriptionType}`, {
        source: 'twitch_eventsub',
        subscriptionType,
        userId: event.user_id,
        username: event.user_name
      })

      // Processa diferentes tipos de eventos de sub
      switch (subscriptionType) {
        // Sub normal (usuário se inscreveu)
        case 'channel.subscribe':
          try {
            // Validar UUID do usuário
            const userIdValidation = validateUUID(event.user_id)
            if (!userIdValidation.valid) {
              logValidationError('user_id', userIdValidation.error || 'Invalid UUID', {
                source: 'twitch_eventsub',
                userId: event.user_id,
                username: event.user_name
              })

              await notifyDiscordOnError({
                level: 'warning',
                title: 'Twitch EventSub Validation Error',
                message: `Invalid user ID: ${event.user_id}`,
                context: { username: event.user_name, error: userIdValidation.error }
              })

              return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
            }

            await handleSubscriptionEvent({
              platform: 'twitch',
              recipientUsername: event.user_name,
              recipientPlatformUserId: event.user_id,
              tier: event.tier,
              isGift: false
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logWebhookEvent('error', 'Erro ao processar sub Twitch', {
              source: 'twitch_eventsub',
              subscriptionType: 'channel.subscribe',
              userId: event.user_id,
              error: errorMessage
            })

            await notifyDiscordOnError({
              level: 'error',
              title: 'Twitch Subscription Processing Error',
              message: `Failed to process subscription for ${event.user_name}`,
              context: { username: event.user_name, error: errorMessage }
            })
          }
          break

        // Sub gift (alguém deu sub para outro usuário)
        case 'channel.subscription.gift':
          logWebhookEvent('info', 'Twitch gift subscription', {
            source: 'twitch_eventsub',
            donor: event.user_name,
            totalGifts: event.total
          })
          break

        // Sub recebida como gift
        case 'channel.subscription.message':
          try {
            // Validar UUID do usuário
            const userIdValidation = validateUUID(event.user_id)
            if (!userIdValidation.valid) {
              logValidationError('user_id', userIdValidation.error || 'Invalid UUID', {
                source: 'twitch_eventsub',
                userId: event.user_id,
                username: event.user_name
              })

              return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
            }

            await handleSubscriptionEvent({
              platform: 'twitch',
              recipientUsername: event.user_name,
              recipientPlatformUserId: event.user_id,
              tier: event.tier,
              isGift: event.is_gift || false,
              donorUsername: event.is_gift ? 'Anônimo' : undefined
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logWebhookEvent('error', 'Erro ao processar resub Twitch', {
              source: 'twitch_eventsub',
              subscriptionType: 'channel.subscription.message',
              userId: event.user_id,
              error: errorMessage
            })

            await notifyDiscordOnError({
              level: 'error',
              title: 'Twitch Resub Processing Error',
              message: `Failed to process resub for ${event.user_name}`,
              context: { username: event.user_name, error: errorMessage }
            })
          }
          break

        default:
          logWebhookEvent('warn', `Tipo Twitch EventSub não tratado: ${subscriptionType}`, {
            source: 'twitch_eventsub',
            subscriptionType
          })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackTrace = error instanceof Error ? error.stack : undefined

    logWebhookEvent('error', 'Erro geral Twitch EventSub', {
      source: 'twitch_eventsub',
      error: errorMessage,
      stackTrace
    })

    await notifyDiscordOnError({
      level: 'error',
      title: 'Twitch EventSub Webhook Error',
      message: `Webhook processing failed: ${errorMessage}`,
      context: { error: errorMessage, timestamp: new Date().toISOString() },
      stackTrace
    })

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET para verificação manual
export async function GET() {
  return NextResponse.json({ 
    status: 'Twitch EventSub webhook ativo',
    events: [
      'channel.subscribe',
      'channel.subscription.gift',
      'channel.subscription.message'
    ]
  })
}

