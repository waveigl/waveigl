import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { processNewDiscordConnection, hasActiveSubscription, removeMemberFromServer } from '@/lib/discord/server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback'

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
}

/**
 * GET /api/auth/discord/callback
 * Callback do OAuth do Discord - salva a conexão
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Se usuário negou acesso
    if (error) {
      console.log('[Discord Callback] Usuário negou acesso:', error)
      return NextResponse.redirect(new URL('/dashboard?error=discord_denied', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?error=discord_invalid', request.url))
    }

    // Decodificar state para obter userId
    let stateData: { userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(new URL('/dashboard?error=discord_invalid_state', request.url))
    }

    // Verificar se state não expirou (5 minutos)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(new URL('/dashboard?error=discord_expired', request.url))
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('[Discord Callback] Credenciais não configuradas')
      return NextResponse.redirect(new URL('/dashboard?error=discord_not_configured', request.url))
    }

    // Trocar code por access_token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('[Discord Callback] Erro ao trocar code:', tokenResponse.status, errorData)
      return NextResponse.redirect(new URL('/dashboard?error=discord_token_error', request.url))
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Buscar dados do usuário no Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!userResponse.ok) {
      console.error('[Discord Callback] Erro ao buscar usuário:', userResponse.status)
      return NextResponse.redirect(new URL('/dashboard?error=discord_user_error', request.url))
    }

    const discordUser: DiscordUser = await userResponse.json()

    // Salvar conexão no banco
    const db = getSupabaseAdmin()
    
    // Verificar se este Discord já está conectado a outra conta
    const { data: existingConnection } = await db
      .from('discord_connections')
      .select('user_id')
      .eq('discord_id', discordUser.id)
      .neq('user_id', stateData.userId)
      .maybeSingle()
    
    if (existingConnection) {
      return NextResponse.redirect(new URL('/dashboard?error=discord_already_linked', request.url))
    }

    // Upsert da conexão
    const { error: upsertError } = await db
      .from('discord_connections')
      .upsert({
        user_id: stateData.userId,
        discord_id: discordUser.id,
        discord_username: discordUser.global_name || discordUser.username,
        discord_discriminator: discordUser.discriminator !== '0' ? discordUser.discriminator : null,
        discord_avatar: discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('[Discord Callback] Erro ao salvar conexão:', upsertError)
      return NextResponse.redirect(new URL('/dashboard?error=discord_save_error', request.url))
    }

    // Atualizar benefícios para marcar Discord como vinculado
    await db
      .from('subscriber_benefits')
      .update({ 
        discord_linked: true,
        discord_claimed_at: new Date().toISOString()
      })
      .eq('user_id', stateData.userId)
      .is('discord_claimed_at', null)

    console.log(`[Discord Callback] ✅ Discord conectado: ${discordUser.username} para user ${stateData.userId}`)
    
    // Verificar se tem assinatura ativa e adicionar ao servidor
    const hasSubscription = await hasActiveSubscription(stateData.userId)
    
    if (hasSubscription) {
      console.log(`[Discord Callback] Usuário tem assinatura ativa, adicionando ao servidor...`)
      const addResult = await processNewDiscordConnection(
        stateData.userId,
        discordUser.id,
        accessToken // Usar o token para adicionar diretamente
      )
      
      if (addResult.success) {
        console.log(`[Discord Callback] ✅ Usuário adicionado ao servidor Clube do WaveIGL`)
        return NextResponse.redirect(new URL('/dashboard?success=discord_connected_server', request.url))
      } else {
        console.error(`[Discord Callback] ⚠️ Não foi possível adicionar ao servidor:`, addResult.error)
        // Ainda consideramos sucesso pois o Discord foi vinculado
        return NextResponse.redirect(new URL('/dashboard?success=discord_connected&warning=server_add_failed', request.url))
      }
    } else {
      console.log(`[Discord Callback] Usuário sem assinatura ativa, Discord vinculado apenas`)
      return NextResponse.redirect(new URL('/dashboard?success=discord_connected&info=no_subscription', request.url))
    }

  } catch (error) {
    console.error('[Discord Callback] Erro:', error)
    return NextResponse.redirect(new URL('/dashboard?error=discord_error', request.url))
  }
}

