/**
 * Sistema de quarentena para contas desvinculadas
 * Uma conta desvinculada fica em quarentena por 7 dias
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

const QUARANTINE_DAYS = 7

export interface QuarantineStatus {
  inQuarantine: boolean
  unlinkedAt?: string
  availableAt?: string
  daysRemaining?: number
  message?: string
}

/**
 * Verifica se uma conta de plataforma está em quarentena
 */
export async function checkQuarantine(
  platform: string,
  platformUserId: string
): Promise<QuarantineStatus> {
  const supabase = getSupabaseAdmin()
  const sevenDaysAgo = new Date(Date.now() - QUARANTINE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Verificar se a conta foi desvinculada nos últimos 7 dias
    const { data: quarantinedAccount } = await supabase
      .from('linked_accounts')
      .select('unlinked_at')
      .eq('platform', platform)
      .eq('platform_user_id', platformUserId)
      .not('unlinked_at', 'is', null)
      .gte('unlinked_at', sevenDaysAgo)
      .maybeSingle()

    if (quarantinedAccount) {
      const unlinkedDate = new Date(quarantinedAccount.unlinked_at)
      const availableDate = new Date(unlinkedDate.getTime() + QUARANTINE_DAYS * 24 * 60 * 60 * 1000)
      const daysRemaining = Math.ceil((availableDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      
      return {
        inQuarantine: true,
        unlinkedAt: quarantinedAccount.unlinked_at,
        availableAt: availableDate.toISOString(),
        daysRemaining,
        message: `Esta conta foi desvinculada recentemente e está em quarentena. Disponível em ${daysRemaining} dia(s).`
      }
    }

    return { inQuarantine: false }
  } catch (error) {
    console.error('[Quarantine] Erro ao verificar:', error)
    // Em caso de erro (ex: coluna não existe), permitir a vinculação
    return { inQuarantine: false }
  }
}

/**
 * Limpa registros de quarentena expirados (mais de 7 dias)
 * Pode ser chamado por um cron job
 */
export async function cleanupExpiredQuarantine(): Promise<number> {
  const supabase = getSupabaseAdmin()
  const sevenDaysAgo = new Date(Date.now() - QUARANTINE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Deletar contas que foram desvinculadas há mais de 7 dias
    const { data, error } = await supabase
      .from('linked_accounts')
      .delete()
      .not('unlinked_at', 'is', null)
      .lt('unlinked_at', sevenDaysAgo)
      .select('id')

    if (error) {
      console.error('[Quarantine] Erro ao limpar:', error)
      return 0
    }

    const count = data?.length || 0
    if (count > 0) {
      console.log(`[Quarantine] ${count} registro(s) expirado(s) removido(s)`)
    }
    return count
  } catch (error) {
    console.error('[Quarantine] Erro ao limpar:', error)
    return 0
  }
}

