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
            .select('subscription_id, subscription_status, email')
            .eq('id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
        }

        // Determinar ID a buscar
        // PRIORIDADE: profile.subscription_id
        // FALLBACK: Se o usuário pede busca por email (ex: gabriel toth), tentamos search
        let subIdToVerify = profile.subscription_id
        let searchResult = null

        const client = new MercadoPagoConfig({ accessToken: accessToken || '' })
        const preapproval = new PreApproval(client)

        // Se não tem ID, tentar buscar por email (caso específico de recuperação)
        if (!subIdToVerify) {
            try {
                const search = await preapproval.search({
                    options: {
                        payer_email: profile.email,
                        limit: 1,
                        sort: 'date_created:desc'
                    }
                })
                if (search.results && search.results.length > 0) {
                    const found = search.results[0]
                    if (found.status === 'authorized' || found.status === 'pending') {
                        subIdToVerify = found.id
                        searchResult = {
                            found: true,
                            id: found.id,
                            status: found.status,
                            email: profile.email
                        }
                    }
                }
            } catch (e) {
                console.error('[Sync] Erro ao buscar por email:', e)
            }
        }

        if (!subIdToVerify) {
            return NextResponse.json({
                status: 'no_subscription_id',
                message: 'Nenhuma assinatura vinculada ao perfil e nenhuma encontrada por email',
                searched_email: profile.email
            })
        }

        // Consultar Status Atual no MP
        try {
            const subscription = await preapproval.get({ id: subIdToVerify })
            const mpStatus = subscription.status // authorized, paused, cancelled

            let dbStatus = 'inactive'
            if (mpStatus === 'authorized') {
                dbStatus = 'active'
            }

            const updates: any = {
                subscription_status: dbStatus,
                updated_at: new Date().toISOString()
            }

            // Se descobrimos o ID agora, salvar
            if (profile.subscription_id !== subIdToVerify) {
                updates.subscription_id = subIdToVerify
            }

            // Atualizar banco
            let updated = false
            if (dbStatus !== profile.subscription_status || profile.subscription_id !== subIdToVerify) {
                await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', userId)

                updated = true
                console.log(`[Sync] Assinatura ${userId} sincronizada: ${profile.subscription_status} -> ${dbStatus}`)
            }

            return NextResponse.json({
                success: true,
                mp_status: mpStatus,
                mp_id: subIdToVerify,
                db_status_before: profile.subscription_status,
                db_status_after: dbStatus,
                updated: updated,
                recovered_via_search: !!searchResult
            })

        } catch (mpError: any) {
            console.error('[Sync] Erro no Mercado Pago:', mpError)
            return NextResponse.json({ error: 'Erro ao consultar Mercado Pago', details: mpError?.message }, { status: 502 })
        }

    } catch (error) {
        console.error('[Sync] Erro geral:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
