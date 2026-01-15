/**
 * GET /api/admin/logs - Obter histórico de ações do admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { requireAdminAccess } from '@/lib/admin/verify'
import { getAdminActionLog } from '@/lib/admin/modules'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissão de admin
    const adminCheck = await requireAdminAccess(session.userId)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: 403 }
      )
    }

    // Obter limite de resultados
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)

    // Buscar logs
    const logs = await getAdminActionLog(limit)

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length
    })
  } catch (error) {
    console.error('[API] Erro ao buscar logs:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar logs' },
      { status: 500 }
    )
  }
}
