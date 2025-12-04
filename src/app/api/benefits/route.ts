import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { 
  getUserBenefits, 
  createOrUpdateBenefit, 
  getDiscordConnection,
  SUBSCRIBER_BENEFITS_LIST 
} from '@/lib/benefits'

/**
 * GET /api/benefits
 * Retorna os benefícios do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const benefits = await getUserBenefits(session.userId)
    const discordConnection = await getDiscordConnection(session.userId)
    
    // Verificar se há benefícios pendentes de onboarding
    const pendingOnboarding = benefits.filter(b => 
      b.onboarding_step < 3 && !b.onboarding_dismissed_at
    )
    
    // Verificar se há benefícios sem código WhatsApp
    const needsWhatsAppCode = benefits.filter(b => 
      !b.whatsapp_code && !b.whatsapp_joined_at
    )
    
    // Verificar se precisa vincular Discord (subs de Kick/YouTube sem Discord vinculado)
    const needsDiscordLink = !discordConnection && benefits.some(b => 
      (b.platform === 'kick' || b.platform === 'youtube') && !b.discord_claimed_at
    )

    return NextResponse.json({
      benefits,
      discordConnection,
      hasPendingOnboarding: pendingOnboarding.length > 0,
      needsWhatsAppCode: needsWhatsAppCode.length > 0,
      needsDiscordLink,
      benefitsList: SUBSCRIBER_BENEFITS_LIST
    })

  } catch (error) {
    console.error('[Benefits API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/benefits
 * Cria um novo benefício (usado internamente pelo sistema quando detecta sub)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, platform, tier, isGift, gifterUsername } = await request.json()
    
    if (!userId || !platform || !tier) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 })
    }
    
    if (!['twitch', 'kick', 'youtube'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }

    const benefit = await createOrUpdateBenefit(
      userId,
      platform,
      tier,
      isGift || false,
      gifterUsername
    )

    if (!benefit) {
      return NextResponse.json({ error: 'Erro ao criar benefício' }, { status: 500 })
    }

    return NextResponse.json({ benefit })

  } catch (error) {
    console.error('[Benefits API] Erro ao criar benefício:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PUT /api/benefits
 * Atualiza um benefício existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { benefitId, updates } = await request.json()
    
    if (!benefitId) {
      return NextResponse.json({ error: 'ID do benefício não fornecido' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    
    // Verificar se o benefício pertence ao usuário
    const { data: benefit } = await db
      .from('subscriber_benefits')
      .select('*')
      .eq('id', benefitId)
      .eq('user_id', session.userId)
      .maybeSingle()
    
    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }

    // Atualizar apenas campos permitidos
    const allowedUpdates: Record<string, unknown> = {}
    if (updates.onboarding_step !== undefined) {
      allowedUpdates.onboarding_step = updates.onboarding_step
    }
    if (updates.discord_claimed_at !== undefined) {
      allowedUpdates.discord_claimed_at = updates.discord_claimed_at
    }

    const { data: updated, error } = await db
      .from('subscriber_benefits')
      .update(allowedUpdates)
      .eq('id', benefitId)
      .select()
      .single()

    if (error) {
      console.error('[Benefits API] Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar benefício' }, { status: 500 })
    }

    return NextResponse.json({ benefit: updated })

  } catch (error) {
    console.error('[Benefits API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

