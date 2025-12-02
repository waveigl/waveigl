import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleSubscriptionEvent } from '@/lib/notifications/subscription'

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

    // Verifica assinatura
    if (!verifySignature(messageId, timestamp, body, signature)) {
      console.error('[Twitch EventSub] Assinatura inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const payload = JSON.parse(body)

    // Verificação de webhook (challenge)
    if (messageType === MESSAGE_TYPE_VERIFICATION) {
      console.log('[Twitch EventSub] Verificação recebida')
      return new NextResponse(payload.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // Revogação
    if (messageType === MESSAGE_TYPE_REVOCATION) {
      console.log('[Twitch EventSub] Subscription revogada:', payload.subscription.type)
      return NextResponse.json({ ok: true })
    }

    // Notificação
    if (messageType === MESSAGE_TYPE_NOTIFICATION) {
      const event = payload.event
      const subscriptionType = payload.subscription.type

      console.log(`[Twitch EventSub] Evento: ${subscriptionType}`, event)

      // Processa diferentes tipos de eventos de sub
      switch (subscriptionType) {
        // Sub normal (usuário se inscreveu)
        case 'channel.subscribe':
          await handleSubscriptionEvent({
            platform: 'twitch',
            recipientUsername: event.user_name,
            recipientPlatformUserId: event.user_id,
            tier: event.tier,
            isGift: false
          })
          break

        // Sub gift (alguém deu sub para outro usuário)
        case 'channel.subscription.gift':
          // Este evento é para quem DOOU as subs
          // Não precisamos processar aqui, pois o evento 'channel.subscribe' 
          // já é disparado para cada recipiente
          console.log(`[Twitch] ${event.user_name} doou ${event.total} subs`)
          break

        // Sub recebida como gift
        case 'channel.subscription.message':
          // Mensagem de resub
          await handleSubscriptionEvent({
            platform: 'twitch',
            recipientUsername: event.user_name,
            recipientPlatformUserId: event.user_id,
            tier: event.tier,
            isGift: event.is_gift || false,
            donorUsername: event.is_gift ? 'Anônimo' : undefined
          })
          break

        default:
          console.log(`[Twitch EventSub] Tipo não tratado: ${subscriptionType}`)
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[Twitch EventSub] Erro:', error)
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

