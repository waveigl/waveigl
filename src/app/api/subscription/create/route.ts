import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Preapproval é o fluxo recomendado para recorrência
    const preapproval = await new PreApproval(client).create({
      // Cast para evitar que tipos da SDK bloqueiem compilação por mudanças de contrato
      body: {
        reason: 'Clube WaveIGL - Assinatura Mensal',
        external_reference: userId,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 9.9,
          currency_id: 'BRL',
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/webhook`,
      } as any,
    })

    return NextResponse.json({ 
      init_point: (preapproval as any)?.init_point || (preapproval as any)?.sandbox_init_point || null,
      preapproval_id: (preapproval as any)?.id || null,
    })

  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error)
    return NextResponse.json(
      { error: 'Falha ao criar preferência de pagamento' }, 
      { status: 500 }
    )
  }
}
