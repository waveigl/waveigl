import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { generateAndSaveWhatsAppCode, getUserBenefits } from '@/lib/benefits'

/**
 * GET /api/benefits/whatsapp
 * Retorna o código WhatsApp do usuário (se existir)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const benefits = await getUserBenefits(session.userId)
    
    // Encontrar benefício com código WhatsApp ou o mais recente sem código
    const benefitWithCode = benefits.find(b => b.whatsapp_code)
    const latestBenefit = benefits[0] // Já ordenado por subscribed_at desc
    
    if (benefitWithCode) {
      return NextResponse.json({
        code: benefitWithCode.whatsapp_code,
        claimedAt: benefitWithCode.whatsapp_claimed_at,
        joinedAt: benefitWithCode.whatsapp_joined_at,
        status: benefitWithCode.whatsapp_joined_at ? 'joined' : 'pending'
      })
    }
    
    if (latestBenefit) {
      return NextResponse.json({
        code: null,
        benefitId: latestBenefit.id,
        canGenerate: true,
        status: 'not_generated'
      })
    }

    return NextResponse.json({
      code: null,
      canGenerate: false,
      status: 'no_benefit',
      message: 'Você precisa ser subscriber para acessar este benefício'
    })

  } catch (error) {
    console.error('[WhatsApp API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/benefits/whatsapp
 * Gera um novo código WhatsApp para o usuário
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
    
    // Verificar se o benefício pertence ao usuário e ainda não tem código
    const { data: benefit } = await db
      .from('subscriber_benefits')
      .select('*')
      .eq('id', benefitId)
      .eq('user_id', session.userId)
      .maybeSingle()
    
    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }
    
    if (benefit.whatsapp_code) {
      return NextResponse.json({
        code: benefit.whatsapp_code,
        message: 'Código já gerado anteriormente'
      })
    }

    // Verificar se o benefício ainda está ativo
    if (benefit.expires_at && new Date(benefit.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Seu benefício expirou. Renove sua assinatura para gerar um novo código.' 
      }, { status: 400 })
    }

    const code = await generateAndSaveWhatsAppCode(benefitId)
    
    if (!code) {
      return NextResponse.json({ error: 'Erro ao gerar código' }, { status: 500 })
    }

    return NextResponse.json({
      code,
      message: 'Código gerado com sucesso! Mostre este código ao admin para receber o link do grupo.',
      instructions: [
        'Copie o código acima',
        'Envie no privado do @waveigl na Twitch ou Kick',
        'Aguarde o admin enviar o link do grupo'
      ]
    })

  } catch (error) {
    console.error('[WhatsApp API] Erro ao gerar código:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

