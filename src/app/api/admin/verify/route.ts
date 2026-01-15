/**
 * GET /api/admin/verify - Verificar se o usuário é admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { verifyAdminAccess } from '@/lib/admin/verify'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({
        isAdmin: false,
        authenticated: false
      })
    }

    // Verificar se é admin
    const adminInfo = await verifyAdminAccess(session.userId)

    return NextResponse.json({
      isAdmin: adminInfo.isAdmin,
      authenticated: true,
      email: adminInfo.email,
      linkedAccounts: adminInfo.linkedAccounts
    })
  } catch (error) {
    console.error('[API] Erro ao verificar admin:', error)
    return NextResponse.json(
      { isAdmin: false, authenticated: false, error: 'Erro ao verificar' },
      { status: 500 }
    )
  }
}
