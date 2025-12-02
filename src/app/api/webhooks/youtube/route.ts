import { NextRequest, NextResponse } from 'next/server'
import { handleSubscriptionEvent } from '@/lib/notifications/subscription'

/**
 * Webhook para YouTube Memberships
 * 
 * NOTA: YouTube não tem um webhook público para memberships como a Twitch.
 * Este endpoint é para uso com:
 * 1. Polling manual via YouTube Data API (cron job)
 * 2. Integração com serviços terceiros (Streamlabs, etc.)
 * 3. Ou chamada manual quando detectamos um novo membro
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
      recipientChannelId, 
      donorUsername, 
      donorChannelId,
      membershipLevel,
      isGift 
    } = body

    if (!recipientUsername || !recipientChannelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await handleSubscriptionEvent({
      platform: 'youtube',
      recipientUsername,
      recipientPlatformUserId: recipientChannelId,
      donorUsername: isGift ? donorUsername : undefined,
      donorPlatformUserId: isGift ? donorChannelId : undefined,
      tier: membershipLevel,
      isGift: !!isGift
    })

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[YouTube Webhook] Erro:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'YouTube membership webhook ativo',
    note: 'Este endpoint requer x-api-key header para chamadas'
  })
}

