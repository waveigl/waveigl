import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { updateOnboardingStep, dismissOnboarding } from '@/lib/benefits'

/**
 * PUT /api/benefits/onboarding
 * Atualiza o passo do onboarding
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { benefitId, step } = await request.json()
    
    if (!benefitId || step === undefined) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }
    
    if (step < 0 || step > 3) {
      return NextResponse.json({ error: 'Step inválido (deve ser 0-3)' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se o benefício pertence ao usuário
    const { data: benefit } = await db
      .from('subscriber_benefits')
      .select('id, user_id')
      .eq('id', benefitId)
      .eq('user_id', session.userId)
      .maybeSingle()
    
    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }

    const success = await updateOnboardingStep(benefitId, step)
    
    if (!success) {
      return NextResponse.json({ error: 'Erro ao atualizar onboarding' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      step,
      message: step === 3 ? 'Onboarding concluído!' : `Passo ${step} completado`
    })

  } catch (error) {
    console.error('[Onboarding API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/benefits/onboarding
 * Marca o onboarding como dispensado (lembrar depois)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { benefitId } = await request.json()
    
    if (!benefitId) {
      return NextResponse.json({ error: 'ID do benefício não fornecido' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se o benefício pertence ao usuário
    const { data: benefit } = await db
      .from('subscriber_benefits')
      .select('id, user_id')
      .eq('id', benefitId)
      .eq('user_id', session.userId)
      .maybeSingle()
    
    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }

    const success = await dismissOnboarding(benefitId)
    
    if (!success) {
      return NextResponse.json({ error: 'Erro ao dispensar onboarding' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Você pode acessar seus benefícios a qualquer momento pelo indicador no topo da página'
    })

  } catch (error) {
    console.error('[Onboarding API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET /api/benefits/onboarding
 * Retorna o estado atual do onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    
    // Buscar benefícios com onboarding pendente
    const { data: benefits } = await db
      .from('subscriber_benefits')
      .select('*')
      .eq('user_id', session.userId)
      .gte('expires_at', new Date().toISOString())
      .order('subscribed_at', { ascending: false })
    
    if (!benefits || benefits.length === 0) {
      return NextResponse.json({
        hasBenefits: false,
        needsOnboarding: false
      })
    }

    // Encontrar o benefício mais recente que precisa de onboarding
    const pendingBenefit = benefits.find(b => 
      b.onboarding_step < 3 && !b.onboarding_dismissed_at
    )

    return NextResponse.json({
      hasBenefits: true,
      needsOnboarding: !!pendingBenefit,
      currentBenefit: pendingBenefit || null,
      currentStep: pendingBenefit?.onboarding_step || 0,
      allBenefits: benefits
    })

  } catch (error) {
    console.error('[Onboarding API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

