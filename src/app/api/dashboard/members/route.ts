import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()

        // Buscar membros do clube (profiles com subscription_status = 'active')
        const { data: members, error } = await supabase
            .from('profiles')
            .select('username, display_name, email, role')
            .eq('subscription_status', 'active')
            .order('username', { ascending: true })

        if (error) {
            console.error('[API Members] Erro:', error)
            return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            members: members.map(m => m.display_name || m.username || m.email)
        })
    } catch (error) {
        console.error('[API Members] Erro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
