import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Adiciona um role a um membro do Discord via REST API
 */
async function addRoleToMember(guildId: string, memberId: string, roleId: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.error('[Discord Sync] DISCORD_BOT_TOKEN não configurado')
    return false
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${memberId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.ok || response.status === 204) {
      return true
    }

    const error = await response.json().catch(() => ({}))
    console.error('[Discord Sync] Erro ao adicionar role:', response.status, error)
    return false
  } catch (error) {
    console.error('[Discord Sync] Erro na requisição:', error)
    return false
  }
}

/**
 * Busca o Discord ID do usuário na tabela discord_connections
 */
async function getDiscordUserId(userId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('discord_connections')
    .select('discord_id')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data.discord_id
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const guildId = process.env.DISCORD_GUILD_ID
    const roleId = process.env.DISCORD_SUB_ROLE_ID

    if (!guildId || !roleId) {
      console.error('[Discord Sync] DISCORD_GUILD_ID ou DISCORD_SUB_ROLE_ID não configurado')
      return NextResponse.json({ error: 'Discord não configurado' }, { status: 503 })
    }

    // Buscar usuário
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id, subscription_status')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar contas vinculadas
    const { data: linkedAccounts, error: accountsError } = await getSupabaseAdmin()
      .from('linked_accounts')
      .select('platform')
      .eq('user_id', userId)

    if (accountsError) {
      console.error('[Discord Sync] Erro ao buscar contas:', accountsError)
      return NextResponse.json({ error: 'Falha ao buscar contas' }, { status: 500 })
    }

    // Verificar critérios
    const hasTwitch = linkedAccounts?.some(a => a.platform === 'twitch')
    const hasYoutube = linkedAccounts?.some(a => a.platform === 'youtube')
    const hasKick = linkedAccounts?.some(a => a.platform === 'kick')
    const hasActiveSubscription = user.subscription_status === 'active'

    if (hasTwitch && hasYoutube && hasKick && hasActiveSubscription) {
      // Buscar Discord ID do usuário
      const discordUserId = await getDiscordUserId(userId)

      if (!discordUserId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Usuário não tem Discord vinculado' 
        })
      }

      // Adicionar role via REST API
      const success = await addRoleToMember(guildId, discordUserId, roleId)

      if (success) {
        // Atualizar flag no banco
        await getSupabaseAdmin()
          .from('profiles')
          .update({ discord_synced: true })
          .eq('id', userId)

        console.log(`[Discord Sync] ✅ Role atribuído para usuário: ${userId}`)

        return NextResponse.json({
          success: true,
          message: 'Cargo atribuído com sucesso'
        })
      } else {
        return NextResponse.json({ 
          error: 'Falha ao atribuir cargo no Discord' 
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({
        success: true,
        message: 'Usuário não atende aos critérios para cargo Discord',
        criteria: {
          hasTwitch,
          hasYoutube,
          hasKick,
          hasActiveSubscription
        }
      })
    }

  } catch (error) {
    console.error('[Discord Sync] Erro:', error)
    return NextResponse.json(
      { error: 'Falha ao sincronizar cargos' },
      { status: 500 }
    )
  }
}
