/**
 * Verificação "Lazy" de assinaturas expiradas
 * 
 * Em vez de usar cron (que é limitado no plano grátis da Vercel),
 * verificamos assinaturas expiradas quando:
 * 1. O usuário acessa o dashboard
 * 2. O usuário tenta usar um benefício
 * 3. Periodicamente a cada X horas (via cache timestamp)
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { removeMemberFromServer } from './server'

// Usar globalThis para persistir entre chamadas
declare global {
  // eslint-disable-next-line no-var
  var __lastDiscordCleanupCheck: number
}

globalThis.__lastDiscordCleanupCheck = globalThis.__lastDiscordCleanupCheck || 0

// Intervalo mínimo entre verificações (6 horas em ms)
const MIN_CHECK_INTERVAL = 6 * 60 * 60 * 1000

/**
 * Verifica se o usuário específico tem assinatura expirada
 * e remove do Discord se necessário
 */
export async function checkUserSubscriptionAndRemove(userId: string): Promise<{
  removed: boolean
  reason?: string
}> {
  const db = getSupabaseAdmin()
  const now = new Date().toISOString()

  // Buscar benefícios expirados deste usuário
  const { data: expiredBenefits } = await db
    .from('subscriber_benefits')
    .select('id, discord_linked')
    .eq('user_id', userId)
    .eq('discord_linked', true)
    .lt('expires_at', now)

  if (!expiredBenefits || expiredBenefits.length === 0) {
    return { removed: false }
  }

  // Buscar conexão Discord
  const { data: discordConn } = await db
    .from('discord_connections')
    .select('discord_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!discordConn) {
    // Apenas atualizar o banco
    await db
      .from('subscriber_benefits')
      .update({ discord_linked: false })
      .eq('user_id', userId)
      .eq('discord_linked', true)
      .lt('expires_at', now)
    
    return { removed: false, reason: 'Sem Discord vinculado' }
  }

  // Remover do servidor
  const result = await removeMemberFromServer(discordConn.discord_id)

  // Atualizar benefícios
  await db
    .from('subscriber_benefits')
    .update({ discord_linked: false })
    .in('id', expiredBenefits.map(b => b.id))

  if (result.success) {
    console.log(`[Discord Lazy] ✅ Usuário ${userId} removido do servidor (assinatura expirada)`)
    return { removed: true }
  }

  return { removed: false, reason: result.error }
}

/**
 * Verificação global de assinaturas expiradas
 * Executada apenas se passou o intervalo mínimo desde a última verificação
 */
export async function checkExpiredSubscriptionsLazy(): Promise<{
  checked: boolean
  removed: number
  skipped?: string
}> {
  const now = Date.now()

  // Verificar se já passou o intervalo mínimo
  if (now - globalThis.__lastDiscordCleanupCheck < MIN_CHECK_INTERVAL) {
    const nextCheck = new Date(globalThis.__lastDiscordCleanupCheck + MIN_CHECK_INTERVAL)
    return { 
      checked: false, 
      removed: 0,
      skipped: `Próxima verificação em ${nextCheck.toLocaleTimeString()}`
    }
  }

  globalThis.__lastDiscordCleanupCheck = now
  console.log('[Discord Lazy] Iniciando verificação de assinaturas expiradas...')

  const db = getSupabaseAdmin()
  const nowIso = new Date().toISOString()

  // Buscar usuários com benefícios expirados e Discord vinculado
  const { data: expiredUsers, error } = await db
    .from('subscriber_benefits')
    .select('user_id')
    .eq('discord_linked', true)
    .lt('expires_at', nowIso)

  if (error || !expiredUsers || expiredUsers.length === 0) {
    console.log('[Discord Lazy] Nenhum benefício expirado encontrado')
    return { checked: true, removed: 0 }
  }

  // Pegar IDs únicos
  const uniqueUserIds = [...new Set(expiredUsers.map(u => u.user_id))]
  let removed = 0

  for (const userId of uniqueUserIds) {
    const result = await checkUserSubscriptionAndRemove(userId)
    if (result.removed) removed++
  }

  console.log(`[Discord Lazy] Verificação concluída: ${removed} removidos de ${uniqueUserIds.length} verificados`)
  return { checked: true, removed }
}

/**
 * Wrapper para ser chamado no dashboard
 * Não bloqueia a renderização - executa em background
 */
export function triggerLazyCleanupInBackground(): void {
  // Executar em background sem bloquear
  setImmediate(() => {
    checkExpiredSubscriptionsLazy().catch(err => {
      console.error('[Discord Lazy] Erro na verificação:', err)
    })
  })
}

