/**
 * GET /api/admin/modules - Obter estado de todos os módulos
 * POST /api/admin/modules - Atualizar módulos (requer admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { requireAdminAccess } from '@/lib/admin/verify'
import { getCachedModuleState, toggleModule, toggleMessage, toggleMessageGroup } from '@/lib/admin/modules'
import { ModuleName, MessageType } from '@/types/admin.types'

/**
 * GET - Obter estado dos módulos
 * Público (qualquer um pode ler, mas o frontend só mostra para admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { modules, messages } = await getCachedModuleState()

    return NextResponse.json({
      success: true,
      modules,
      messages
    })
  } catch (error) {
    console.error('[API] Erro ao buscar módulos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar módulos' },
      { status: 500 }
    )
  }
}

/**
 * POST - Atualizar módulos (apenas admin)
 */
export async function POST(request: NextRequest) {
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

    // Parsear requisição
    const body = await request.json()
    const { action, target, value } = body

    if (!action || !target || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: action, target, value' },
        { status: 400 }
      )
    }

    // Obter IP e User-Agent para auditoria
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    let result

    // Processar ação
    switch (action) {
      case 'toggle_module':
        result = await toggleModule(
          target as ModuleName,
          value as boolean,
          session.userId,
          ipAddress,
          userAgent
        )
        break

      case 'toggle_message':
        result = await toggleMessage(
          target as MessageType,
          value as boolean,
          session.userId,
          ipAddress,
          userAgent
        )
        break

      case 'toggle_group':
        result = await toggleMessageGroup(
          value as boolean,
          session.userId,
          ipAddress,
          userAgent
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: `Ação desconhecida: ${action}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // Retornar novo estado
    const { modules, messages } = await getCachedModuleState()

    return NextResponse.json({
      success: true,
      modules,
      messages
    })
  } catch (error) {
    console.error('[API] Erro ao atualizar módulos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar módulos' },
      { status: 500 }
    )
  }
}
