import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
        if (!accessToken) {
            return NextResponse.json({ error: 'Configuração do Mercado Pago ausente' }, { status: 500 })
        }

        // Verificar sessão
        const cookieHeader = request.headers.get('cookie')
        const session = await parseSessionCookie(cookieHeader)

        if (!session?.userId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const userId = session.userId

        // Buscar subscription_id do perfil
        const supabase = getSupabaseAdmin()
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_id, subscription_status')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
        }

        if (!profile.subscription_id) {
            return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada para este usuário' }, { status: 400 })
        }

        // Cancelar no Mercado Pago
        const client = new MercadoPagoConfig({ accessToken })
        const preapproval = new PreApproval(client)

        try {
            // No Mercado Pago, cancelar uma assinatura (PreApproval) é feito atualizando o status para 'cancelled'
            await preapproval.update({
                id: profile.subscription_id,
                body: {
                    status: 'cancelled'
                }
            })

            // Atualizar status no banco de dados
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) {
                console.error('[Subscription Cancel] Erro ao atualizar banco:', updateError)
                // O cancelamento no MP funcionou, então o erro no banco é crítico mas a sub está cancelada
            }

            return NextResponse.json({
                success: true,
                message: 'Assinatura cancelada com sucesso'
            })

        } catch (mpError: any) {
            console.error('[Subscription Cancel] Erro Mercado Pago:', mpError)

            // Se o erro indicar que a sub já está cancelada, tratamos como sucesso
            if (mpError?.message?.includes('status is already cancelled')) {
                await supabase
                    .from('profiles')
                    .update({ subscription_status: 'cancelled' })
                    .eq('id', userId)

                return NextResponse.json({
                    success: true,
                    message: 'Assinatura já estava cancelada'
                })
            }

            return NextResponse.json({
                error: 'Erro ao cancelar no Mercado Pago',
                details: mpError?.message
            }, { status: 502 })
        }

    } catch (error) {
        console.error('[Subscription Cancel] Erro geral:', error)
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
    }
}
