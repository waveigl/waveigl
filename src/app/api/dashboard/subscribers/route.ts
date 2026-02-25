import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()

        // Buscar inscritos da Twitch (tabela subscribers com subscription_status = 'active')
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('twitch_username, subscription_tier, subscription_date')
            .eq('subscription_status', 'active')
            .order('twitch_username', { ascending: true })

        if (error) {
            console.error('[API Subscribers] Erro:', error)
            return NextResponse.json({ error: 'Erro ao buscar inscritos' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            subscribers: subscribers.map(s => s.twitch_username)
        })
    } catch (error) {
        console.error('[API Subscribers] Erro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
