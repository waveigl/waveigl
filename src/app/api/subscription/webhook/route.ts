import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago'

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('[Webhook] MERCADOPAGO_ACCESS_TOKEN não configurado')
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 })
    }

    const client = new MercadoPagoConfig({ accessToken })

    // O corpo pode vir de diferentes formas dependendo da versão da API do MP
    // Geralmente { type: "...", data: { id: "..." } } ou { topic: "...", resource: "..." }
    const body = await request.json()
    console.log('[Webhook] Recebido:', JSON.stringify(body))

    const type = body.type || body.topic
    let id = body.data?.id || body.resource

    // Se resource for URL, extrair ID
    if (id && String(id).includes('/')) {
      const parts = String(id).split('/')
      id = parts[parts.length - 1]
    }

    if (!id) {
      return NextResponse.json({ header: "OK" }) // Responder OK para não travar o MP
    }

    let userId: string | null = null
    let status: string | null = null
    let subscriptionId: string | null = null

    // Cenário 1: Notificação de Assinatura (PreApproval)
    if (type === 'subscription_preapproval') {
      try {
        const preapproval = new PreApproval(client)
        const subscription = await preapproval.get({ id })

        userId = subscription.external_reference as string
        status = subscription.status as string // authorized, paused, cancelled
        subscriptionId = id

        console.log(`[Webhook] Assinatura ${id} status: ${status} para user ${userId}`)
      } catch (error) {
        console.error('[Webhook] Erro ao buscar assinatura:', error)
        return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
      }
    }
    // Cenário 2: Notificação de Pagamento (Payment)
    else if (type === 'payment') {
      try {
        const paymentClient = new Payment(client)
        const payment = await paymentClient.get({ id })

        userId = payment.external_reference as string
        // Se for pagamento de assinatura, o status do pagamento importa para ativar/desativar?
        // Geralmente confiamos no status da subscription_preapproval.
        // Mas se for o primeiro pagamento, ajuda a confirmar.
        const paymentStatus = payment.status

        // Se o pagamento tem external_reference, podemos usar.
        // Mas payments de assinatura as vezes não trazem external_reference se não foi passado no checkout de forma específica,
        // mas o create/route.ts passa external_reference na preapproval, que DEVE propagar.

        console.log(`[Webhook] Pagamento ${id} status: ${paymentStatus} para user ${userId}`)

        // Para assinaturas, melhor focar no evento subscription_preapproval para gerenciar o status 'active'
        // Mas se aprovado, podemos garantir que está ativo.
        if (paymentStatus === 'approved') {
          status = 'authorized' // Mapear para status de assinatura
          // Tentar descobrir o ID da assinatura se possível (metadata?)
        }
      } catch (error) {
        console.error('[Webhook] Erro ao buscar pagamento:', error)
        // Não retornamos erro 500 aqui para não reprocessar infinitamente se for um pagamento irrelevante
      }
    }

    // Se conseguimos identificar o usuário e o status
    if (userId && status) {
      // Mapear status do MP para nosso status no banco
      // MP: authorized, paused, cancelled
      // DB: active, inactive (ou null/outros)

      // Verifica se é um UUID válido (segurança básica)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.warn('[Webhook] External reference não é um UUID válido:', userId)
        return NextResponse.json({ success: true })
      }

      const supabase = getSupabaseAdmin()

      let dbStatus = 'inactive'
      if (status === 'authorized') {
        dbStatus = 'active'
      }

      // Atualizar perfil
      const updateData: any = {
        subscription_status: dbStatus,
        updated_at: new Date().toISOString()
      }

      // Só atualiza o ID se estivermos lidando com a assinatura direta
      if (subscriptionId) {
        updateData.subscription_id = subscriptionId
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('[Webhook] Falha ao atualizar Supabase:', error)
        return NextResponse.json({ error: 'Falha no banco de dados' }, { status: 500 })
      }

      console.log(`[Webhook] Usuário ${userId} atualizado para ${dbStatus}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Webhook] Erro geral:', error)
    return NextResponse.json(
      { error: 'Falha interna' },
      { status: 500 }
    )
  }
}
