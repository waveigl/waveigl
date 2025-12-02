import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar se é um webhook do Mercado Pago
    if (body.type === 'payment') {
      const paymentId = body.data.id

      // Aqui você faria uma chamada para a API do Mercado Pago para verificar o status do pagamento
      // Por simplicidade, vamos assumir que o pagamento foi aprovado

      const externalReference = body.data.external_reference
      if (!externalReference) {
        return NextResponse.json({ error: 'External reference not found' }, { status: 400 })
      }

      // Atualizar status da assinatura no Supabase
      const { error } = await getSupabaseAdmin()
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_id: paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', externalReference)

      if (error) {
        console.error('Erro ao atualizar assinatura:', error)
        return NextResponse.json({ error: 'Falha ao atualizar assinatura' }, { status: 500 })
      }

      // Trigger para sincronização Discord (se necessário)
      // await syncDiscordRoles(externalReference)

      console.log(`Assinatura ativada para usuário: ${externalReference}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Falha ao processar webhook' },
      { status: 500 }
    )
  }
}
