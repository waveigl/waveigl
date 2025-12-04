import { NextRequest, NextResponse } from 'next/server'
import { processExpiredSubscriptions } from '@/lib/discord/server'

// Secret para proteger o endpoint
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/discord-cleanup
 * 
 * Endpoint para limpeza de assinaturas expiradas do Discord
 * 
 * Pode ser chamado de 3 formas:
 * 1. Vercel Cron (se usar plano Pro) - configura no vercel.json
 * 2. Serviço externo gratuito (cron-job.org, EasyCron, etc.)
 * 3. Manualmente via navegador/curl (apenas em dev ou com CRON_SECRET)
 * 
 * Headers opcionais:
 * - Authorization: Bearer CRON_SECRET
 * 
 * Query params opcionais:
 * - key=CRON_SECRET (alternativa ao header)
 */
export async function GET(request: NextRequest) {
  // Verificar autorização via header ou query param
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.replace('Bearer ', '')
  const queryToken = request.nextUrl.searchParams.get('key')
  const token = headerToken || queryToken

  // Permitir acesso sem secret em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!isDev && CRON_SECRET && token !== CRON_SECRET) {
    console.error('[Cron Discord Cleanup] Acesso não autorizado')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron Discord Cleanup] Iniciando limpeza de assinaturas expiradas...')

  try {
    const stats = await processExpiredSubscriptions()

    return NextResponse.json({
      success: true,
      message: 'Limpeza concluída',
      stats: {
        processed: stats.processed,
        removed: stats.removed,
        errors: stats.errors
      },
      timestamp: new Date().toISOString(),
      tip: 'Este endpoint pode ser chamado por serviços gratuitos como cron-job.org'
    })

  } catch (error) {
    console.error('[Cron Discord Cleanup] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar limpeza' 
    }, { status: 500 })
  }
}

