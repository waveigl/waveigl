import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * PUT /api/user/profile
 * Atualiza dados do perfil do usuário (nome, telefone, data de nascimento)
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const session = await parseSessionCookie(cookieHeader)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Não autenticado' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone_number, birth_date } = body

    // Validações básicas
    if (full_name && (typeof full_name !== 'string' || full_name.length < 3)) {
      return NextResponse.json({ 
        error: 'Nome completo deve ter pelo menos 3 caracteres' 
      }, { status: 400 })
    }

    if (phone_number && !/^\+?\d{10,15}$/.test(phone_number.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        error: 'Número de telefone inválido' 
      }, { status: 400 })
    }

    if (birth_date) {
      const date = new Date(birth_date)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ 
          error: 'Data de nascimento inválida' 
        }, { status: 400 })
      }
      
      // Verificar se tem pelo menos 13 anos
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()
      const dayDiff = today.getDate() - date.getDate()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
      
      if (actualAge < 13) {
        return NextResponse.json({ 
          error: 'Você precisa ter pelo menos 13 anos' 
        }, { status: 400 })
      }
    }

    const supabase = getSupabaseAdmin()

    // Preparar objeto de atualização
    const updateData: Record<string, unknown> = {}
    if (full_name) updateData.full_name = full_name
    if (phone_number) updateData.phone_number = phone_number.replace(/\D/g, '') // Apenas dígitos
    if (birth_date) updateData.birth_date = birth_date

    // Atualizar perfil
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.userId)
      .select('id, full_name, phone_number, birth_date')
      .single()

    if (updateError) {
      console.error('[Profile Update] Erro:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar perfil' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('[Profile Update] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

/**
 * GET /api/user/profile
 * Retorna dados do perfil do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const session = await parseSessionCookie(cookieHeader)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Não autenticado' 
      }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, birth_date, email, username')
      .eq('id', session.userId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ 
        error: 'Perfil não encontrado' 
      }, { status: 404 })
    }

    return NextResponse.json({
      profile
    })

  } catch (error) {
    console.error('[Profile GET] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
