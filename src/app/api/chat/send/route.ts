import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendTwitchMessage, refreshTwitchToken } from '@/lib/chat/twitch'
import { sendYouTubeMessage, getCurrentLiveChatId, getActiveLiveChatId, isYouTubeLiveActive, refreshYouTubeToken } from '@/lib/chat/youtube'
import { sendKickMessage, refreshKickToken } from '@/lib/chat/kick'

export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let { platform, message, liveChatId } = await request.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }
    if (!['twitch', 'youtube', 'kick'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    const { data: linked, error } = await db
      .from('linked_accounts')
      .select('platform_username, platform_user_id, access_token, refresh_token')
      .eq('user_id', session.userId)
      .eq('platform', platform)
      .maybeSingle()

    if (error || !linked) {
      return NextResponse.json({ error: 'Conta não vinculada para esta plataforma' }, { status: 400 })
    }

    switch (platform) {
      case 'twitch':
        let twitchToken = linked.access_token!
        let twitchResult = await sendTwitchMessage(linked.platform_username, twitchToken, message)
        
        // Se o token expirou, tentar renovar e enviar novamente
        if (!twitchResult.success && twitchResult.code === 'TOKEN_EXPIRED' && linked.refresh_token) {
          console.log('[Twitch] Token expirado, tentando renovar...')
          const newToken = await refreshTwitchToken(linked.refresh_token, session.userId)
          
          if (newToken) {
            twitchToken = newToken
            twitchResult = await sendTwitchMessage(linked.platform_username, twitchToken, message)
          } else {
            return NextResponse.json({ 
              error: 'Token da Twitch expirado. Por favor, reautorize sua conta nas configurações.',
              code: 'TWITCH_TOKEN_EXPIRED'
            }, { status: 401 })
          }
        }
        
        if (!twitchResult.success) {
          return NextResponse.json({ 
            error: twitchResult.error || 'Erro ao enviar mensagem na Twitch',
            code: 'TWITCH_SEND_ERROR'
          }, { status: 400 })
        }
        break
        
      case 'youtube':
        // Verificar se há live ativa ANTES de tentar enviar
        const isLive = await isYouTubeLiveActive()
        if (!isLive) {
          return NextResponse.json({ 
            error: 'Não há transmissão ao vivo no YouTube no momento. O chat só funciona durante lives.',
            code: 'NO_LIVE_STREAM'
          }, { status: 400 })
        }
        
        // Se não tem liveChatId, tentar buscar automaticamente
        if (!liveChatId) {
          liveChatId = getCurrentLiveChatId()
          
          // Se ainda não tem, tentar buscar via API
          if (!liveChatId && linked.access_token) {
            liveChatId = await getActiveLiveChatId(linked.access_token)
          }
        }
        
        if (!liveChatId) {
          return NextResponse.json({ 
            error: 'Não foi possível encontrar o chat da live. Tente novamente.',
            code: 'NO_LIVE_CHAT'
          }, { status: 400 })
        }
        
        let youtubeToken = linked.access_token!
        let ytResult = await sendYouTubeMessage(youtubeToken, liveChatId, message, linked.platform_username)
        
        // Se o token expirou, tentar renovar e enviar novamente
        if (!ytResult.success && ytResult.code === 'TOKEN_EXPIRED' && linked.refresh_token) {
          console.log('[YouTube] Token expirado, tentando renovar...')
          const newToken = await refreshYouTubeToken(session.userId, linked.refresh_token)
          
          if (newToken) {
            youtubeToken = newToken
            ytResult = await sendYouTubeMessage(youtubeToken, liveChatId, message, linked.platform_username)
          } else {
            return NextResponse.json({ 
              error: 'Token do YouTube expirado. Por favor, reautorize sua conta nas configurações.',
              code: 'YOUTUBE_TOKEN_EXPIRED'
            }, { status: 401 })
          }
        }
        
        if (!ytResult.success) {
          return NextResponse.json({ 
            error: ytResult.error || 'Erro ao enviar mensagem no YouTube',
            code: 'YOUTUBE_SEND_ERROR'
          }, { status: 400 })
        }
        break
        
      case 'kick':
        let kickToken = linked.access_token || ''
        
        // Tentar enviar mensagem
        const kickResult = await sendKickMessage(linked.platform_username, kickToken, message, linked.platform_user_id)
        
        // Se falhou com 401, tentar renovar o token
        if (!kickResult && linked.refresh_token) {
          console.log('[Kick] Token expirado, tentando renovar...')
          const newToken = await refreshKickToken(linked.refresh_token, session.userId, db)
          
          if (newToken) {
            // Tentar novamente com o novo token
            const retryResult = await sendKickMessage(linked.platform_username, newToken, message, linked.platform_user_id)
            if (!retryResult) {
              return NextResponse.json({ 
                error: 'Erro ao enviar mensagem na Kick. Tente reautorizar sua conta.',
                code: 'KICK_SEND_ERROR'
              }, { status: 400 })
            }
          } else {
            return NextResponse.json({ 
              error: 'Token da Kick expirado. Por favor, reautorize sua conta nas configurações.',
              code: 'KICK_TOKEN_EXPIRED'
            }, { status: 401 })
          }
        } else if (!kickResult) {
          return NextResponse.json({ 
            error: 'Erro ao enviar mensagem na Kick. Verifique se sua conta está corretamente vinculada.',
            code: 'KICK_SEND_ERROR'
          }, { status: 400 })
        }
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Chat Send] Erro:', e)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}


