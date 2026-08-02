/**
 * GET /api/admin/password-configured - Verificar se a senha está configurada
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { verifyAdminAccess } from '@/lib/admin/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({
        isConfigured: false,
        authenticated: false
      })
    }

    // Verificar se é admin
    const adminInfo = await verifyAdminAccess(session.userId)
    if (!adminInfo.isAdmin) {
      return NextResponse.json({
        isConfigured: false,
        authenticated: true,
        isAdmin: false
      })
    }

    // Verificar se a senha está configurada
    const { data: securityConfig, error } = await getSupabaseAdmin()
      .from('admin_security_config')
      .select('id')
      .eq('admin_user_id', session.userId)
      .single()

    const isConfigured = !error && !!securityConfig

    return NextResponse.json({
      isConfigured,
      authenticated: true,
      isAdmin: true
    })
  } catch (error) {
    console.error('[API] Erro ao verificar configuração de senha:', error)
    return NextResponse.json(
      { isConfigured: false, authenticated: false, error: 'Erro ao verificar' },
      { status: 500 }
    )
  }
}
