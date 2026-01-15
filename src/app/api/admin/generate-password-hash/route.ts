/**
 * POST /api/admin/generate-password-hash - Gera hash bcrypt da senha
 * Usado pelo assistente de setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, validatePasswordStrength } from '@/lib/admin/password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Senha é obrigatória' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Senha não atende aos requisitos',
          errors: validation.errors
        },
        { status: 400 }
      )
    }

    // Gerar hash
    const hash = await hashPassword(password)

    return NextResponse.json({
      success: true,
      hash,
      message: 'Hash gerado com sucesso'
    })
  } catch (error) {
    console.error('[API] Erro ao gerar hash:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao gerar hash' },
      { status: 500 }
    )
  }
}
