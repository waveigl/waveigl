/**
 * Script para registrar webhooks do Twitch EventSub
 * 
 * Uso: npx ts-node scripts/register-twitch-eventsub.ts
 * 
 * Requer as seguintes variáveis de ambiente:
 * - TWITCH_CLIENT_ID
 * - TWITCH_CLIENT_SECRET
 * - TWITCH_EVENTSUB_SECRET (secret para verificar assinaturas)
 * - NEXT_PUBLIC_APP_URL (URL do seu site)
 * - TWITCH_BROADCASTER_ID (ID do canal waveigl)
 */

import 'dotenv/config'

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!
const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
const BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID!

const CALLBACK_URL = `${APP_URL}/api/webhooks/twitch/eventsub`

// Tipos de eventos que queremos escutar
const EVENT_TYPES = [
  'channel.subscribe',
  'channel.subscription.gift',
  'channel.subscription.message'
]

async function getAppAccessToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  })

  const data = await res.json()
  if (!data.access_token) {
    throw new Error('Falha ao obter access token: ' + JSON.stringify(data))
  }
  return data.access_token
}

async function registerEventSub(accessToken: string, type: string) {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': TWITCH_CLIENT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      version: '1',
      condition: {
        broadcaster_user_id: BROADCASTER_ID
      },
      transport: {
        method: 'webhook',
        callback: CALLBACK_URL,
        secret: EVENTSUB_SECRET
      }
    })
  })

  const data = await res.json()
  
  if (res.ok) {
    console.log(`✅ Registrado: ${type}`)
    console.log(`   ID: ${data.data?.[0]?.id}`)
  } else {
    console.error(`❌ Erro ao registrar ${type}:`, data)
  }
}

async function listSubscriptions(accessToken: string) {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': TWITCH_CLIENT_ID
    }
  })

  const data = await res.json()
  console.log('\n📋 Subscriptions atuais:')
  
  if (data.data?.length) {
    for (const sub of data.data) {
      console.log(`   - ${sub.type} (${sub.status}) - ID: ${sub.id}`)
    }
  } else {
    console.log('   Nenhuma subscription registrada')
  }
}

async function main() {
  console.log('🔧 Registrando Twitch EventSub webhooks...\n')
  console.log(`Callback URL: ${CALLBACK_URL}`)
  console.log(`Broadcaster ID: ${BROADCASTER_ID}\n`)

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !EVENTSUB_SECRET || !APP_URL || !BROADCASTER_ID) {
    console.error('❌ Variáveis de ambiente faltando!')
    console.log('Necessário: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_EVENTSUB_SECRET, NEXT_PUBLIC_APP_URL, TWITCH_BROADCASTER_ID')
    process.exit(1)
  }

  const accessToken = await getAppAccessToken()
  console.log('✅ Access token obtido\n')

  for (const type of EVENT_TYPES) {
    await registerEventSub(accessToken, type)
  }

  await listSubscriptions(accessToken)
}

main().catch(console.error)

