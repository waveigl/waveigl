import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

        // Verificar sessão
        const cookieHeader = request.headers.get('cookie')
        const session = await parseSessionCookie(cookieHeader)

        if (!session?.userId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const userId = session.userId

        // Buscar dados do perfil
        const supabase = getSupabaseAdmin()
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_id, subscription_status')
            .eq('id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
        }

        // Se não tem ID de assinatura, não tem o que sincronizar (assumindo que não perdeu o ID)
        if (!profile.subscription_id) {
            return NextResponse.json({
                status: 'no_subscription_id',
                message: 'Nenhuma assinatura vinculada ao perfil'
            })
        }

        // Consultar Mercado Pago
        if (!accessToken) {
            return NextResponse.json({ error: 'Token MP não configurado' }, { status: 500 })
        }

        const client = new MercadoPagoConfig({ accessToken })
        const preapproval = new PreApproval(client)

        try {
            const subscription = await preapproval.get({ id: profile.subscription_id })
            const mpStatus = subscription.status // authorized, paused, cancelled

            let dbStatus = 'inactive'
            if (mpStatus === 'authorized') {
                dbStatus = 'active'
            }

            // Se o status for diferente, atualizar
            if (dbStatus !== profile.subscription_status) {
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: dbStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                console.log(`[Sync] Assinatura ${userId} sincronizada: ${profile.subscription_status} -> ${dbStatus}`)

                return NextResponse.json({
                    success: true,
                    current_status: dbStatus,
                    previous_status: profile.subscription_status,
                    updated: true
                })
            }

            return NextResponse.json({
                success: true,
                current_status: dbStatus,
                updated: false
            })

        } catch (mpError: any) {
            console.error('[Sync] Erro no Mercado Pago:', mpError)
            return NextResponse.json({ error: 'Erro ao consultar Mercado Pago' }, { status: 502 })
        }

    } catch (error) {
        console.error('[Sync] Erro geral:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
