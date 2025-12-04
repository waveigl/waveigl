import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canModerate } from '@/lib/permissions'

/**
 * GET /api/admin/benefits
 * Lista usuários com códigos WhatsApp pendentes (para admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se é admin/owner
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', session.userId)
    
    const role = getUserRole(modLinked || [])
    if (!canModerate(role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending' // pending, joined, all
    const code = searchParams.get('code') // buscar por código específico

    let query = db
      .from('subscriber_benefits')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          username,
          display_name
        )
      `)
      .not('whatsapp_code', 'is', null)
      .gte('expires_at', new Date().toISOString())
      .order('whatsapp_claimed_at', { ascending: false })

    if (code) {
      query = query.eq('whatsapp_code', code.toUpperCase())
    } else if (status === 'pending') {
      query = query.is('whatsapp_joined_at', null)
    } else if (status === 'joined') {
      query = query.not('whatsapp_joined_at', 'is', null)
    }

    const { data: benefits, error } = await query

    if (error) {
      console.error('[Admin Benefits] Erro ao buscar:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    return NextResponse.json({
      benefits: benefits || [],
      total: benefits?.length || 0
    })

  } catch (error) {
    console.error('[Admin Benefits] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/benefits
 * Marca usuário como tendo entrado no grupo WhatsApp
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se é admin/owner
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', session.userId)
    
    const role = getUserRole(modLinked || [])
    if (!canModerate(role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { benefitId, code, action } = await request.json()
    
    if (!benefitId && !code) {
      return NextResponse.json({ error: 'ID ou código do benefício não fornecido' }, { status: 400 })
    }

    let query = db.from('subscriber_benefits').select('*')
    
    if (benefitId) {
      query = query.eq('id', benefitId)
    } else if (code) {
      query = query.eq('whatsapp_code', code.toUpperCase())
    }

    const { data: benefit } = await query.maybeSingle()
    
    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }

    if (action === 'mark_joined') {
      const { error: updateError } = await db
        .from('subscriber_benefits')
        .update({ 
          whatsapp_joined_at: new Date().toISOString(),
          onboarding_step: Math.max(benefit.onboarding_step, 1)
        })
        .eq('id', benefit.id)

      if (updateError) {
        console.error('[Admin Benefits] Erro ao atualizar:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Usuário marcado como membro do grupo WhatsApp'
      })
    }

    if (action === 'revoke') {
      const { error: updateError } = await db
        .from('subscriber_benefits')
        .update({ 
          whatsapp_joined_at: null
        })
        .eq('id', benefit.id)

      if (updateError) {
        console.error('[Admin Benefits] Erro ao revogar:', updateError)
        return NextResponse.json({ error: 'Erro ao revogar' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Acesso ao WhatsApp revogado'
      })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('[Admin Benefits] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/admin/benefits
 * Busca por código WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se é admin/owner
    const { data: modLinked } = await db
      .from('linked_accounts')
      .select('*')
      .eq('user_id', session.userId)
    
    const role = getUserRole(modLinked || [])
    if (!canModerate(role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 })
    }

    const { data: benefit, error } = await db
      .from('subscriber_benefits')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          username,
          display_name
        )
      `)
      .eq('whatsapp_code', code.toUpperCase())
      .maybeSingle()

    if (error) {
      console.error('[Admin Benefits] Erro ao buscar código:', error)
      return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
    }

    if (!benefit) {
      return NextResponse.json({ 
        found: false,
        message: 'Código não encontrado'
      })
    }

    // Verificar se expirou
    const isExpired = benefit.expires_at && new Date(benefit.expires_at) < new Date()

    return NextResponse.json({
      found: true,
      benefit: {
        ...benefit,
        isExpired,
        status: benefit.whatsapp_joined_at ? 'joined' : 'pending'
      }
    })

  } catch (error) {
    console.error('[Admin Benefits] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

