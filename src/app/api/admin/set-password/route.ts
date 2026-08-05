/**
 * POST /api/admin/set-password - Salvar senha do admin diretamente no banco
 * Apenas Gabriel Toth pode usar este endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { isGabrielToth } from '@/lib/admin/verify'
import { hashPassword, validatePasswordStrength } from '@/lib/admin/password'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é Gabriel Toth
    const isAdmin = await isGabrielToth(session.userId)
    if (!isAdmin) {
      console.warn(`[Admin] Tentativa não autorizada de definir senha por: ${session.userId}`)
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas Gabriel Toth pode definir a senha' },
        { status: 403 }
      )
    }

    // Obter senha do body
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Senha é obrigatória' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: `Senha fraca: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Gerar hash
    const passwordHash = await hashPassword(password)

    // Salvar no banco de dados
    const db = getSupabaseAdmin()

    // Verificar se já existe configuração
    const { data: existing } = await db
      .from('admin_security_config')
      .select('id')
      .eq('admin_user_id', session.userId)
      .maybeSingle()

    if (existing) {
      // Atualizar senha existente
      const { error } = await db
        .from('admin_security_config')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('admin_user_id', session.userId)

      if (error) {
        console.error('[Admin] Erro ao atualizar senha:', error)
        return NextResponse.json(
          { success: false, message: `Erro ao atualizar senha: ${error.message}` },
          { status: 500 }
        )
      }

      console.log('[Admin] ✅ Senha atualizada com sucesso para Gabriel Toth')
    } else {
      // Inserir nova configuração
      const { error } = await db
        .from('admin_security_config')
        .insert({
          admin_user_id: session.userId,
          password_hash: passwordHash,
          password_salt: 'argon2' // argon2 já inclui salt no hash
        })

      if (error) {
        console.error('[Admin] Erro ao inserir senha:', error)
        
        // Verificar se é erro de tabela não existente
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Tabela admin_security_config não existe. Execute a migração primeiro.',
              needsMigration: true
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { success: false, message: `Erro ao salvar senha: ${error.message}` },
          { status: 500 }
        )
      }

      console.log('[Admin] ✅ Senha criada com sucesso para Gabriel Toth')
    }

    return NextResponse.json({
      success: true,
      message: 'Senha configurada com sucesso!'
    })

  } catch (error) {
    console.error('[Admin] Erro ao definir senha:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno ao processar requisição' },
      { status: 500 }
    )
  }
}
