import { getSupabaseAdmin } from '@/lib/supabase/server'
import { canModerate, getUserRole } from '@/lib/permissions'
import { getPlatformUserIdByName, applyPlatformBan, applyPlatformUnban } from '@/lib/moderation/actions'
import { applyTimeoutWithReapply } from './commands'
import { Platform } from '@/types'

/**
 * Interface para o resultado do processmaneto de um comando de barra
 */
export interface SlashCommandResult {
    isCommand: boolean
    success?: boolean
    message?: string
}

/**
 * Processa comandos que começam com / (slash commands)
 */
export async function processSlashCommand(
    userId: string,
    platform: Platform | 'all',
    message: string
): Promise<SlashCommandResult> {
    if (!message.startsWith('/')) {
        return { isCommand: false }
    }

    const parts = message.substring(1).split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    // 1. Verificar permissões do usuário
    const db = getSupabaseAdmin()
    const { data: accounts } = await db
        .from('linked_accounts')
        .select('*')
        .eq('user_id', userId)

    const role = getUserRole(accounts || [])
    if (!canModerate(role)) {
        return {
            isCommand: true,
            success: false,
            message: 'Você não tem permissão para usar comandos de moderação.'
        }
    }

    // Comandos suportados: timeout, ban, unban, u (alias de unban)
    switch (command) {
        case 'timeout':
        case 'to':
            return handleTimeoutCommand(userId, platform, args)
        case 'ban':
            return handleBanCommand(userId, platform, args)
        case 'unban':
        case 'u':
            return handleUnbanCommand(userId, platform, args)
        default:
            // Se for um comando que não conhecemos, avisar mas não processar como mensagem
            return {
                isCommand: true,
                success: false,
                message: `Comando desconhecido: /${command}`
            }
    }
}

/**
 * Formata duração para segundos
 * Suporta formatos: 600, 10m, 1h, 1d
 */
function parseDuration(durationStr: string): number {
    if (!durationStr) return 600 // 10 minutos padrão

    const value = parseInt(durationStr)
    if (isNaN(value)) return 600

    const lastChar = durationStr.toLowerCase().slice(-1)

    if (lastChar === 's') return value
    if (lastChar === 'm') return value * 60
    if (lastChar === 'h') return value * 3600
    if (lastChar === 'd') return value * 86400

    // Se for apenas número sem letra, assume segundos
    return value
}

async function handleTimeoutCommand(
    moderatorId: string,
    platform: Platform | 'all',
    args: string[]
): Promise<SlashCommandResult> {
    const targetUsername = args[0]
    if (!targetUsername) {
        return { isCommand: true, success: false, message: 'Uso: /timeout <nick> <duração> [motivo]' }
    }

    const durationStr = args[1]
    const durationSeconds = parseDuration(durationStr)
    const reason = args.slice(2).join(' ') || 'Moderado via chat'

    // Se a plataforma for 'all', aplicar na Twitch por padrão ou em todas as vinculadas
    // O usuário pediu "faça aplicar também pra kick"
    const targetPlatforms: Platform[] = (platform === 'all') ? ['twitch', 'kick', 'youtube'] : [platform]

    let successCount = 0
    let totalCount = 0
    const errors: string[] = []

    for (const p of targetPlatforms) {
        totalCount++
        const targetPlatformUserId = await getPlatformUserIdByName(p, targetUsername)

        if (!targetPlatformUserId) {
            errors.push(`${p}: Usuário não encontrado`)
            continue
        }

        // APLICAR TIMEOUT COM REAPLICAÇÃO
        // Isso já deve internamente tentar limpar qualquer timeout ativo no cache
        const result = await applyTimeoutWithReapply(
            targetPlatformUserId,
            p,
            durationSeconds,
            reason,
            moderatorId
        )

        if (result.success) {
            successCount++
        } else {
            errors.push(`${p}: ${result.error}`)
        }
    }

    if (successCount === 0) {
        return {
            isCommand: true,
            success: false,
            message: `Erro ao aplicar timeout: ${errors.join(', ')}`
        }
    }

    return {
        isCommand: true,
        success: true,
        message: `Timeout de ${durationSeconds}s aplicado para ${targetUsername} em ${successCount} plataforma(s).`
    }
}

async function handleBanCommand(
    moderatorId: string,
    platform: Platform | 'all',
    args: string[]
): Promise<SlashCommandResult> {
    const targetUsername = args[0]
    if (!targetUsername) {
        return { isCommand: true, success: false, message: 'Uso: /ban <nick> [motivo]' }
    }

    const reason = args.slice(1).join(' ') || 'Banido via chat'
    const targetPlatforms: Platform[] = (platform === 'all') ? ['twitch', 'kick', 'youtube'] : [platform]

    let successCount = 0
    const errors: string[] = []

    for (const p of targetPlatforms) {
        const targetPlatformUserId = await getPlatformUserIdByName(p, targetUsername)
        if (!targetPlatformUserId) continue

        const result = await applyPlatformBan(p, targetPlatformUserId, reason, moderatorId)
        if (result.success) successCount++
        else errors.push(`${p}: ${result.error}`)
    }

    return {
        isCommand: true,
        success: successCount > 0,
        message: successCount > 0
            ? `Usuário ${targetUsername} banido em ${successCount} plataforma(s).`
            : `Erro ao banir: ${errors.join(', ')}`
    }
}

async function handleUnbanCommand(
    moderatorId: string,
    platform: Platform | 'all',
    args: string[]
): Promise<SlashCommandResult> {
    const targetUsername = args[0]
    if (!targetUsername) {
        return { isCommand: true, success: false, message: 'Uso: /unban <nick>' }
    }

    const targetPlatforms: Platform[] = (platform === 'all') ? ['twitch', 'kick', 'youtube'] : [platform]
    let successCount = 0

    for (const p of targetPlatforms) {
        const targetPlatformUserId = await getPlatformUserIdByName(p, targetUsername)
        if (!targetPlatformUserId) continue

        const result = await applyPlatformUnban(p, targetPlatformUserId, moderatorId)
        if (result.success) successCount++
    }

    return {
        isCommand: true,
        success: successCount > 0,
        message: successCount > 0
            ? `Usuário ${targetUsername} desbanido.`
            : `Erro ao desbanir ou usuário não encontrado.`
    }
}
