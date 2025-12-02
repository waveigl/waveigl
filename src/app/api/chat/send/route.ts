import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendTwitchMessage } from '@/lib/chat/twitch'
import { sendYouTubeMessage } from '@/lib/chat/youtube'
import { sendKickMessage } from '@/lib/chat/kick'

export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { platform, message, liveChatId } = await request.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }
    if (!['twitch', 'youtube', 'kick'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    const { data: linked, error } = await db
      .from('linked_accounts')
      .select('platform_username, platform_user_id, access_token')
      .eq('user_id', session.userId)
      .eq('platform', platform)
      .maybeSingle()

    if (error || !linked) {
      return NextResponse.json({ error: 'Conta não vinculada para esta plataforma' }, { status: 400 })
    }

    switch (platform) {
      case 'twitch':
        await sendTwitchMessage(linked.platform_username, linked.access_token!, message)
        break
      case 'youtube':
        if (!liveChatId) {
          return NextResponse.json({ error: 'liveChatId ausente para YouTube' }, { status: 400 })
        }
        await sendYouTubeMessage(linked.access_token!, liveChatId, message)
        break
      case 'kick':
        // Passar o platform_user_id para usar como broadcaster_user_id se necessário
        await sendKickMessage(linked.platform_username, linked.access_token || '', message, linked.platform_user_id)
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}


