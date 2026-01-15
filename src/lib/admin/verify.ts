/**
 * Verificação de permissões de admin
 * Apenas Gabriel Toth (ogabrieltoth) pode acessar o painel admin
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ADMIN_ACCOUNT_IDS, ADMIN_ACCOUNTS } from '@/lib/permissions'

// IDs e usernames do admin Gabriel Toth
const GABRIEL_TOTH_IDS = {
  twitch: '129980106',
  kick: '4053403',
  youtube: 'OGabrielToth'
}

const GABRIEL_TOTH_USERNAMES = {
  twitch: 'ogabrieltoth',
  kick: 'ogabrieltoth',
  youtube: 'OGabrielToth'
}

/**
 * Verifica se o usuário é Gabriel Toth (admin)
 * Usa IDs primeiro (mais seguro), depois usernames como fallback
 */
export async function isGabrielToth(userId: string): Promise<boolean> {
  try {
    const db = getSupabaseAdmin()

    // Buscar contas vinculadas do usuário
    const { data: linkedAccounts, error } = await db
      .from('linked_accounts')
      .select('platform, platform_user_id, platform_username')
      .eq('user_id', userId)

    if (error || !linkedAccounts || linkedAccounts.length === 0) {
      return false
    }

    // Verificar por ID (mais seguro)
    for (const account of linkedAccounts) {
      const expectedId = GABRIEL_TOTH_IDS[account.platform as keyof typeof GABRIEL_TOTH_IDS]
      if (expectedId && account.platform_user_id === expectedId) {
        return true
      }
    }

    // Fallback: verificar por username
    for (const account of linkedAccounts) {
      const expectedUsername = GABRIEL_TOTH_USERNAMES[account.platform as keyof typeof GABRIEL_TOTH_USERNAMES]
      if (expectedUsername && account.platform_username.toLowerCase() === expectedUsername.toLowerCase()) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[Admin] Erro ao verificar Gabriel Toth:', error)
    return false
  }
}

/**
 * Verifica se o usuário é Gabriel Toth e retorna informações detalhadas
 */
export async function verifyAdminAccess(userId: string): Promise<{
  isAdmin: boolean
  email?: string
  linkedAccounts?: Array<{ platform: string; username: string }>
}> {
  try {
    const db = getSupabaseAdmin()

    // Buscar perfil do usuário
    const { data: profile } = await db
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    // Buscar contas vinculadas
    const { data: linkedAccounts } = await db
      .from('linked_accounts')
      .select('platform, platform_username')
      .eq('user_id', userId)

    const isAdmin = await isGabrielToth(userId)

    return {
      isAdmin,
      email: profile?.email,
      linkedAccounts: linkedAccounts?.map(a => ({
        platform: a.platform,
        username: a.platform_username
      }))
    }
  } catch (error) {
    console.error('[Admin] Erro ao verificar acesso:', error)
    return { isAdmin: false }
  }
}

/**
 * Middleware para verificar acesso admin em API routes
 */
export async function requireAdminAccess(userId: string | null | undefined): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'Não autenticado' }
  }

  const isAdmin = await isGabrielToth(userId)
  if (!isAdmin) {
    console.warn(`[Admin] Tentativa de acesso não autorizado por usuário: ${userId}`)
    return { success: false, error: 'Acesso negado - apenas Gabriel Toth pode acessar' }
  }

  return { success: true }
}
