/**
 * GET /api/admin/my-user-id - Retorna o User ID do usuário autenticado
 * Útil para setup da senha do painel admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { verifyAdminAccess } from '@/lib/admin/verify'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const adminInfo = await verifyAdminAccess(session.userId)
    if (!adminInfo.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Apenas Gabriel Toth pode acessar' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: session.userId,
      email: adminInfo.email,
      linkedAccounts: adminInfo.linkedAccounts,
      message: 'Use este userId no comando SQL para configurar a senha'
    })
  } catch (error) {
    console.error('[API] Erro ao obter User ID:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao obter User ID' },
      { status: 500 }
    )
  }
}
