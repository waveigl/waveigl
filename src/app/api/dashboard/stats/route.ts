import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySubscriberManagementAccess } from '@/lib/twitch/authorization.middleware'

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autorização (Moderador, Admin ou Streamer)
        const auth = await verifySubscriberManagementAccess(request)
        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error || 'Não autorizado' },
                { status: auth.error?.includes('Forbidden') ? 403 : 401 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 2. Buscar contagem de Membros do Clube (profiles ativos)
        const { count: clubMembersCount, error: clubError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active')

        if (clubError) throw clubError

        // 3. Buscar latest streaming_sessions for viewer counts
        const { data: latestSession, error: sessionError } = await supabase
            .from('streaming_sessions')
            .select('view_count, platform_breakdown, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (sessionError) throw sessionError

        // 4. Buscar total de inscritos das plataformas (Twitch cached in subscribers table)
        const { count: platformSubsCount, error: subsError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active')

        if (subsError) throw subsError

        return NextResponse.json({
            success: true,
            stats: {
                liveViewers: latestSession?.view_count || 0,
                platformBreakdown: latestSession?.platform_breakdown || {},
                clubMembers: clubMembersCount || 0,
                platformSubscribers: platformSubsCount || 0,
                lastUpdate: latestSession?.created_at
            }
        })
    } catch (error) {
        console.error('[DashboardStats] Error:', error)
        return NextResponse.json(
            { error: 'Erro ao carregar estatísticas do dashboard' },
            { status: 500 }
        )
    }
}
