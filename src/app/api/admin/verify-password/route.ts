/**
 * API endpoint para verificar senha do painel admin
 * POST /api/admin/verify-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { verifyAdminPassword } from '@/lib/admin/verify-password'
import { verifyAdminAccess } from '@/lib/admin/verify'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Verificar se é admin
    const adminInfo = await verifyAdminAccess(session.userId)
    if (!adminInfo.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // 3. Extrair dados da requisição
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Senha é obrigatória' },
        { status: 400 }
      )
    }

    // 4. Extrair IP e User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 5. Verificar senha
    const result = await verifyAdminPassword(
      session.userId,
      password,
      ipAddress,
      userAgent
    )

    // 6. Retornar resultado
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          isLocked: result.isLocked,
          remainingTime: result.remainingTime
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[API] Erro ao verificar senha:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
