/**
 * Gerenciamento do servidor Discord "Clube do WaveIGL"
 * 
 * Funções para adicionar e remover membros baseado em assinatura
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

// Configurações do Discord
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID // ID do servidor "Clube do WaveIGL"
const DISCORD_SUB_ROLE_ID = process.env.DISCORD_SUB_ROLE_ID // Role para subscribers

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Adiciona um membro ao servidor Discord via invite ou adiciona role
 * Requer que o usuário tenha vinculado o Discord
 */
export async function addMemberToServer(
  discordUserId: string, 
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.error('[Discord Server] Bot token ou Guild ID não configurado')
    return { success: false, error: 'Discord não configurado' }
  }

  try {
    // Se temos um access_token, podemos adicionar o usuário diretamente ao servidor
    if (accessToken) {
      const addResponse = await fetch(
        `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: accessToken,
            roles: DISCORD_SUB_ROLE_ID ? [DISCORD_SUB_ROLE_ID] : []
          })
        }
      )

      if (addResponse.ok || addResponse.status === 201 || addResponse.status === 204) {
        console.log(`[Discord Server] ✅ Membro ${discordUserId} adicionado ao servidor`)
        return { success: true }
      }

      // 204 = já é membro, então apenas adicionar role
      if (addResponse.status === 204) {
        return addRoleToMember(discordUserId)
      }

      const errorData = await addResponse.json().catch(() => ({}))
      console.error('[Discord Server] Erro ao adicionar membro:', addResponse.status, errorData)
      return { success: false, error: errorData.message || 'Erro ao adicionar ao servidor' }
    }

    // Sem access_token, apenas verificar se já é membro e adicionar role
    return addRoleToMember(discordUserId)

  } catch (error) {
    console.error('[Discord Server] Erro:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Adiciona a role de subscriber a um membro existente
 */
export async function addRoleToMember(discordUserId: string): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_SUB_ROLE_ID) {
    return { success: false, error: 'Configurações de role não definidas' }
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_SUB_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    )

    if (response.ok || response.status === 204) {
      console.log(`[Discord Server] ✅ Role adicionada para membro ${discordUserId}`)
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    console.error('[Discord Server] Erro ao adicionar role:', response.status, errorData)
    return { success: false, error: errorData.message || 'Erro ao adicionar role' }

  } catch (error) {
    console.error('[Discord Server] Erro ao adicionar role:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Remove um membro do servidor Discord (quando assinatura expira)
 */
export async function removeMemberFromServer(discordUserId: string): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.error('[Discord Server] Bot token ou Guild ID não configurado')
    return { success: false, error: 'Discord não configurado' }
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    )

    if (response.ok || response.status === 204) {
      console.log(`[Discord Server] ✅ Membro ${discordUserId} removido do servidor`)
      return { success: true }
    }

    // 404 = membro não existe no servidor (já foi removido ou nunca entrou)
    if (response.status === 404) {
      console.log(`[Discord Server] Membro ${discordUserId} não estava no servidor`)
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    console.error('[Discord Server] Erro ao remover membro:', response.status, errorData)
    return { success: false, error: errorData.message || 'Erro ao remover do servidor' }

  } catch (error) {
    console.error('[Discord Server] Erro:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Remove apenas a role de subscriber (sem kickar do servidor)
 */
export async function removeRoleFromMember(discordUserId: string): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_SUB_ROLE_ID) {
    return { success: false, error: 'Configurações de role não definidas' }
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_SUB_ROLE_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    )

    if (response.ok || response.status === 204) {
      console.log(`[Discord Server] ✅ Role removida do membro ${discordUserId}`)
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    console.error('[Discord Server] Erro ao remover role:', response.status, errorData)
    return { success: false, error: errorData.message || 'Erro ao remover role' }

  } catch (error) {
    console.error('[Discord Server] Erro ao remover role:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Verifica e processa todos os membros com assinatura expirada
 * Deve ser chamado periodicamente (cron job)
 */
export async function processExpiredSubscriptions(): Promise<{
  processed: number
  removed: number
  errors: number
}> {
  const stats = { processed: 0, removed: 0, errors: 0 }
  
  try {
    const db = getSupabaseAdmin()
    const now = new Date().toISOString()

    // Buscar benefícios expirados que ainda têm Discord vinculado
    const { data: expiredBenefits, error } = await db
      .from('subscriber_benefits')
      .select(`
        id,
        user_id,
        expires_at,
        discord_linked
      `)
      .eq('discord_linked', true)
      .lt('expires_at', now)

    if (error) {
      console.error('[Discord Cleanup] Erro ao buscar benefícios expirados:', error)
      return stats
    }

    if (!expiredBenefits || expiredBenefits.length === 0) {
      console.log('[Discord Cleanup] Nenhum benefício expirado encontrado')
      return stats
    }

    console.log(`[Discord Cleanup] Processando ${expiredBenefits.length} benefícios expirados...`)

    for (const benefit of expiredBenefits) {
      stats.processed++

      // Buscar conexão Discord do usuário
      const { data: discordConn } = await db
        .from('discord_connections')
        .select('discord_id')
        .eq('user_id', benefit.user_id)
        .maybeSingle()

      if (!discordConn) {
        // Usuário não tem Discord vinculado, apenas atualizar benefício
        await db
          .from('subscriber_benefits')
          .update({ discord_linked: false })
          .eq('id', benefit.id)
        continue
      }

      // Remover do servidor Discord
      const result = await removeMemberFromServer(discordConn.discord_id)

      if (result.success) {
        stats.removed++
        
        // Atualizar benefício
        await db
          .from('subscriber_benefits')
          .update({ discord_linked: false })
          .eq('id', benefit.id)
          
        console.log(`[Discord Cleanup] ✅ Removido: ${discordConn.discord_id}`)
      } else {
        stats.errors++
        console.error(`[Discord Cleanup] ❌ Erro ao remover: ${discordConn.discord_id}`, result.error)
      }
    }

    console.log(`[Discord Cleanup] Finalizado: ${stats.processed} processados, ${stats.removed} removidos, ${stats.errors} erros`)
    return stats

  } catch (error) {
    console.error('[Discord Cleanup] Erro:', error)
    return stats
  }
}

/**
 * Verifica se um usuário tem assinatura ativa para o Discord
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const db = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data, error } = await db
    .from('subscriber_benefits')
    .select('id')
    .eq('user_id', userId)
    .gt('expires_at', now)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[Discord] Erro ao verificar assinatura:', error)
    return false
  }

  return !!data
}

/**
 * Processa um usuário que acabou de vincular Discord
 * Adiciona ao servidor se tiver assinatura ativa
 */
export async function processNewDiscordConnection(
  userId: string, 
  discordUserId: string,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  // Verificar se tem assinatura ativa
  const hasSubscription = await hasActiveSubscription(userId)

  if (!hasSubscription) {
    console.log(`[Discord] Usuário ${userId} não tem assinatura ativa`)
    return { success: false, error: 'Sem assinatura ativa' }
  }

  // Adicionar ao servidor
  return addMemberToServer(discordUserId, accessToken)
}

