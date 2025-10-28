import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Importar discord.js dinamicamente somente em runtime Node.js
    const { Client, GatewayIntentBits } = await import('discord.js')
    const discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
    })
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Buscar usuário e contas vinculadas
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { data: linkedAccounts, error: accountsError } = await getSupabaseAdmin()
      .from('linked_accounts')
      .select('*')
      .eq('user_id', userId)

    if (accountsError) {
      console.error('Erro ao buscar contas vinculadas:', accountsError)
      return NextResponse.json({ error: 'Falha ao buscar contas' }, { status: 500 })
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      return NextResponse.json({ error: 'Usuário não possui contas vinculadas' }, { status: 404 })
    }

    // Verificar se tem as 3 contas vinculadas
    const hasTwitch = linkedAccounts.some(a => a.platform === 'twitch')
    const hasYoutube = linkedAccounts.some(a => a.platform === 'youtube')
    const hasKick = linkedAccounts.some(a => a.platform === 'kick')

    if (hasTwitch && hasYoutube && hasKick && user.subscription_status === 'active') {
      try {
        // Inicializar bot Discord se não estiver conectado
        if (!discordClient.isReady()) {
          await discordClient.login(process.env.DISCORD_BOT_TOKEN)
        }

        // Buscar guild e cargo
        const guild = await discordClient.guilds.fetch(process.env.DISCORD_GUILD_ID!)
        const role = guild.roles.cache.find(r => r.name === 'Membro Completo')

        if (!role) {
          return NextResponse.json({ error: 'Cargo não encontrado no Discord' }, { status: 404 })
        }

        // Aqui você precisaria do Discord ID do usuário
        // Por simplicidade, vamos assumir que temos uma forma de mapear
        const discordUserId = await getDiscordUserId(userId)
        
        if (discordUserId) {
          const member = await guild.members.fetch(discordUserId)
          await member.roles.add(role)

          // Atualizar flag no banco
          await getSupabaseAdmin()
            .from('users')
            .update({ discord_synced: true })
            .eq('id', userId)

          console.log(`Cargo atribuído no Discord para usuário: ${userId}`)
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Cargo atribuído com sucesso' 
        })

      } catch (error) {
        console.error('Erro ao atribuir cargo no Discord:', error)
        return NextResponse.json({ error: 'Falha ao atribuir cargo' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Usuário não atende aos critérios para cargo Discord' 
      })
    }

  } catch (error) {
    console.error('Erro no sync-roles:', error)
    return NextResponse.json(
      { error: 'Falha ao sincronizar cargos' }, 
      { status: 500 }
    )
  }
}

async function getDiscordUserId(userId: string): Promise<string | null> {
  // Implementar lógica para obter Discord ID do usuário
  // Isso pode ser feito através de:
  // 1. Armazenar Discord ID durante o processo de vinculação
  // 2. Usar OAuth do Discord para obter o ID
  // 3. Pedir para o usuário fornecer o Discord ID
  
  // Por enquanto, retornar null
  return null
}
