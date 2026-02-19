
import { NextRequest } from 'next/server'
import { parseSessionCookie } from './session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { UserRole } from '@/types'

export interface DashboardAuthContext {
    userId: string
    role: UserRole
    linkedAccounts: any[]
}

/**
 * Verifica se o usuário está autenticado e retorna seu contexto de acesso
 */
export async function verifyDashboardAccess(
    request: NextRequest
): Promise<{ success: boolean; context?: DashboardAuthContext; error?: string }> {
    try {
        const cookieHeader = request.headers.get('cookie')
        const session = await parseSessionCookie(cookieHeader)

        if (!session) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = getSupabaseAdmin()

        // Buscar contas vinculadas para determinar o role
        const { data: linkedAccounts, error: linkedError } = await supabase
            .from('linked_accounts')
            .select('id, user_id, platform, platform_user_id, platform_username, is_moderator, created_at')
            .eq('user_id', session.userId)

        if (linkedError) {
            console.error('[Access] Erro ao buscar contas vinculadas:', linkedError)
            return { success: false, error: 'Erro interno ao verificar permissões' }
        }

        // Buscar profile para pegar o role do banco (se houver override)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.userId)
            .single()

        const computedRole = getUserRole(linkedAccounts || [])

        // Prioridade: role no banco (se definido e não for 'user') > role computado
        let finalRole: UserRole = computedRole
        if (profile?.role && profile.role !== 'user' && computedRole === 'user') {
            finalRole = profile.role as UserRole
        }
        // Se for admin/owner no banco, manter
        if (profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'streamer') {
            finalRole = profile.role as UserRole
        }

        return {
            success: true,
            context: {
                userId: session.userId,
                role: finalRole,
                linkedAccounts: linkedAccounts || []
            }
        }
    } catch (error) {
        console.error('[Access] Erro inesperado:', error)
        return { success: false, error: 'Erro interno de servidor' }
    }
}
