import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada do cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar timeouts ativos que precisam ser reaplicados
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: activeTimeouts, error: timeoutsError } = await getSupabaseAdmin()
      .from('active_timeouts')
      .select('*')
      .eq('status', 'active')
      .lt('last_applied_at', fiveMinutesAgo)

    if (timeoutsError) {
      console.error('Erro ao buscar timeouts ativos:', timeoutsError)
      return NextResponse.json({ error: 'Falha ao buscar timeouts' }, { status: 500 })
    }

    if (!activeTimeouts || activeTimeouts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum timeout ativo para reaplicar' 
      })
    }

    let reapplicationCount = 0
    let completionCount = 0

    for (const timeout of activeTimeouts) {
      const now = new Date()
      const expiresAt = new Date(timeout.expires_at)

      if (expiresAt > now) {
        // Timeout ainda ativo, reaplicar
        try {
          const remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
          
          await applyPlatformTimeout(
            timeout.platform,
            timeout.platform_user_id,
            remainingSeconds
          )
          
          // Atualizar last_applied_at
          await getSupabaseAdmin()
            .from('active_timeouts')
            .update({ last_applied_at: now.toISOString() })
            .eq('id', timeout.id)

          reapplicationCount++
          console.log(`Timeout reaplicado: ${timeout.platform} - ${timeout.platform_user_id} (${remainingSeconds}s restantes)`)
        } catch (error) {
          console.error(`Erro ao reaplicar timeout ${timeout.id}:`, error)
        }
      } else {
        // Timeout expirou, marcar como completed
        try {
          await getSupabaseAdmin()
            .from('active_timeouts')
            .update({ status: 'completed' })
            .eq('id', timeout.id)

          completionCount++
          console.log(`Timeout completado: ${timeout.platform} - ${timeout.platform_user_id}`)
        } catch (error) {
          console.error(`Erro ao marcar timeout como completado ${timeout.id}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processados: ${reapplicationCount} reaplicações, ${completionCount} completados`,
      reapplicationCount,
      completionCount
    })

  } catch (error) {
    console.error('Erro no reapply-timeouts:', error)
    return NextResponse.json(
      { error: 'Falha ao processar timeouts' }, 
      { status: 500 }
    )
  }
}

async function applyPlatformTimeout(platform: string, platformUserId: string, durationSeconds: number) {
  // Implementar chamadas para APIs específicas de cada plataforma
  // Por enquanto, apenas log para demonstração
  switch (platform) {
    case 'twitch':
      console.log(`Reaplicando timeout no Twitch para ${platformUserId}: ${durationSeconds}s`)
      // Implementar chamada real para Twitch API
      break
    case 'youtube':
      console.log(`Reaplicando timeout no YouTube para ${platformUserId}: ${durationSeconds}s`)
      // Implementar chamada real para YouTube API
      break
    case 'kick':
      console.log(`Reaplicando timeout no Kick para ${platformUserId}: ${durationSeconds}s`)
      // Implementar chamada real para Kick API
      break
    default:
      throw new Error(`Plataforma não suportada: ${platform}`)
  }
}
