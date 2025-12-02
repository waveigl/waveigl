import { NextRequest, NextResponse } from 'next/server'
import { handleSubscriptionEvent } from '@/lib/notifications/subscription'

/**
 * Webhook para Kick Subscriptions
 * 
 * NOTA: Kick não tem uma API pública oficial de webhooks.
 * Este endpoint é para uso com:
 * 1. Integração via WebSocket listener do chat (detecta eventos de sub)
 * 2. Serviços terceiros
 * 3. Chamada manual
 */

export async function POST(request: NextRequest) {
  try {
    // Verificação de API key simples para chamadas internas
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const { 
      recipientUsername, 
      recipientUserId, 
      donorUsername, 
      donorUserId,
      isGift 
    } = body

    if (!recipientUsername || !recipientUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await handleSubscriptionEvent({
      platform: 'kick',
      recipientUsername,
      recipientPlatformUserId: recipientUserId,
      donorUsername: isGift ? donorUsername : undefined,
      donorPlatformUserId: isGift ? donorUserId : undefined,
      isGift: !!isGift
    })

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[Kick Webhook] Erro:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Kick subscription webhook ativo',
    note: 'Este endpoint requer x-api-key header para chamadas'
  })
}

