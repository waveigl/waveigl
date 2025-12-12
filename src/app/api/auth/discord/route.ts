import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { removeMemberFromServer } from '@/lib/discord/server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID

function getAppUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

// Scopes configurados no Discord Developer Portal
// - identify: obter informações do usuário (id, username, avatar)
// - guilds.join: adicionar ao servidor Clube do WaveIGL automaticamente
const DISCORD_SCOPES = 'identify guilds.join'

/**
 * GET /api/auth/discord
 * Inicia o fluxo OAuth do Discord para vinculação (NÃO para login)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se usuário está logado
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!DISCORD_CLIENT_ID) {
      console.error('[Discord OAuth] DISCORD_CLIENT_ID não configurado')
      return NextResponse.redirect(new URL('/dashboard?error=discord_not_configured', request.url))
    }

    // Verificar se há return_to para redirecionar após OAuth
    const returnTo = request.nextUrl.searchParams.get('return_to')

    // Gerar state para CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: session.userId,
      timestamp: Date.now(),
      returnTo: returnTo || undefined
    })).toString('base64url')

    // Construir URL de autorização do Discord
    const appUrl = getAppUrl(request)
    const redirectUri = `${appUrl}/api/auth/discord/callback`
    
    const authUrl = new URL('https://discord.com/api/oauth2/authorize')
    authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', DISCORD_SCOPES)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('[Discord OAuth] Erro:', error)
    return NextResponse.redirect(new URL('/dashboard?error=discord_error', request.url))
  }
}

/**
 * POST /api/auth/discord
 * Remove a conexão Discord do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action } = await request.json()
    
    if (action === 'disconnect') {
      const db = getSupabaseAdmin()
      
      // Buscar conexão para obter discord_id
      const { data: discordConn } = await db
        .from('discord_connections')
        .select('discord_id')
        .eq('user_id', session.userId)
        .maybeSingle()
      
      // Remover do servidor Discord primeiro
      if (discordConn?.discord_id) {
        const removeResult = await removeMemberFromServer(discordConn.discord_id)
        if (!removeResult.success) {
          console.warn('[Discord] Não foi possível remover do servidor:', removeResult.error)
        }
      }
      
      // Deletar conexão do banco
      const { error } = await db
        .from('discord_connections')
        .delete()
        .eq('user_id', session.userId)
      
      if (error) {
        console.error('[Discord] Erro ao desconectar:', error)
        return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
      }
      
      // Atualizar benefícios
      await db
        .from('subscriber_benefits')
        .update({ 
          discord_linked: false,
          discord_claimed_at: null
        })
        .eq('user_id', session.userId)
      
      return NextResponse.json({ success: true, message: 'Discord desconectado e removido do servidor' })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('[Discord] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

