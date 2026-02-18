import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/subscription/check-eligibility
 * Verifica se o usuário pode assinar o Clube
 * Retorna o que está faltando para completar o cadastro
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const session = await parseSessionCookie(cookieHeader)

    if (!session) {
      return NextResponse.json({
        eligible: false,
        reason: 'not_authenticated',
        message: 'Você precisa estar logado para assinar'
      }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, birth_date, subscription_status, subscription_id')
      .eq('id', session.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        eligible: false,
        reason: 'profile_not_found',
        message: 'Perfil não encontrado'
      }, { status: 404 })
    }

    // Verificar se já tem assinatura ativa
    if (profile.subscription_status === 'active') {
      return NextResponse.json({
        eligible: false,
        reason: 'already_subscribed',
        message: 'Você já possui uma assinatura ativa do Clube',
        user: {
          id: profile.id,
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          birth_date: profile.birth_date,
          discord_connected: true, // Se está ativo, assumimos que passou pelo onboarding
          subscription_status: profile.subscription_status
        }
      })
    }

    // Buscar conexão com Discord
    const { data: discordConnection } = await supabase
      .from('discord_connections')
      .select('discord_id, discord_username')
      .eq('user_id', session.userId)
      .single()

    // Verificar o que está faltando
    const missing: string[] = []

    if (!discordConnection) {
      missing.push('discord')
    }

    if (!profile.full_name) {
      missing.push('full_name')
    }

    if (!profile.phone_number) {
      missing.push('phone_number')
    }

    if (!profile.birth_date) {
      missing.push('birth_date')
    }

    // Verificar idade mínima de 18 anos
    let isUnderage = false
    if (profile.birth_date) {
      const birth = new Date(profile.birth_date)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      if (age < 18) {
        isUnderage = true
        missing.push('underage')
      }
    }

    // Se tudo está preenchido e maior de 18, está elegível
    const eligible = missing.length === 0

    return NextResponse.json({
      eligible,
      missing,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        birth_date: profile.birth_date,
        discord_connected: !!discordConnection,
        discord_username: discordConnection?.discord_username || null,
        subscription_status: profile.subscription_status
      }
    })

  } catch (error) {
    console.error('[Check Eligibility] Erro:', error)
    return NextResponse.json({
      eligible: false,
      reason: 'server_error',
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
