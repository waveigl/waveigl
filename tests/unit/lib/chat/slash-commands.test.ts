import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSlashCommand } from '@/lib/chat/slash-commands'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getUserRole, canModerate } from '@/lib/permissions'
import * as actions from '@/lib/moderation/actions'
import * as commands from '@/lib/chat/commands'

// Mocks
vi.mock('@/lib/supabase/server', () => ({
    getSupabaseAdmin: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn(),
                    then: (cb: any) => cb({ data: [{ platform: 'twitch', platform_user_id: '123' }], error: null })
                }))
            }))
        }))
    }))
}))

vi.mock('@/lib/permissions', () => ({
    getUserRole: vi.fn(() => 'moderator'),
    canModerate: vi.fn(() => true)
}))

vi.mock('@/lib/moderation/actions', () => ({
    getPlatformUserIdByName: vi.fn(async () => 'target123'),
    applyPlatformBan: vi.fn(async () => ({ success: true })),
    applyPlatformUnban: vi.fn(async () => ({ success: true })),
    applyPlatformTimeout: vi.fn(async () => ({ success: true }))
}))

vi.mock('@/lib/chat/commands', () => ({
    applyTimeoutWithReapply: vi.fn(async () => ({ success: true })),
    PLATFORM_MAX_TIMEOUT: { twitch: 1209600, kick: 86400, youtube: 86400 }
}))

describe('Slash Commands', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset global timeouts map
        globalThis.__activeTimeouts = new Map()
    })

    it('should identify a message as a command if it starts with /', async () => {
        const result = await processSlashCommand('user123', 'twitch', '/timeout user 10')
        expect(result.isCommand).toBe(true)
    })

    it('should not identify a message as a command if it does not start with /', async () => {
        const result = await processSlashCommand('user123', 'twitch', 'hello /timeout')
        expect(result.isCommand).toBe(false)
    })

    it('should deny permission for non-moderators', async () => {
        (canModerate as any).mockReturnValue(false)
        const result = await processSlashCommand('user123', 'twitch', '/timeout user 10')
        expect(result.success).toBe(false)
        expect(result.message).toContain('permissão')
    })

    it('should handle /timeout command correctly', async () => {
        (canModerate as any).mockReturnValue(true)
        const result = await processSlashCommand('user123', 'twitch', '/timeout target 1h test')

        expect(result.success).toBe(true)
        expect(commands.applyTimeoutWithReapply).toHaveBeenCalledWith(
            'target123',
            'twitch',
            3600, // 1h in seconds
            'test',
            'user123'
        )
    })

    it('should handle /ban command correctly', async () => {
        (canModerate as any).mockReturnValue(true)
        const result = await processSlashCommand('user123', 'twitch', '/ban target reason')

        expect(result.success).toBe(true)
        expect(actions.applyPlatformBan).toHaveBeenCalledWith(
            'twitch',
            'target123',
            'reason',
            'user123'
        )
    })

    it('should handle /unban command correctly', async () => {
        (canModerate as any).mockReturnValue(true)
        const result = await processSlashCommand('user123', 'twitch', '/unban target')

        expect(result.success).toBe(true)
        expect(actions.applyPlatformUnban).toHaveBeenCalledWith(
            'twitch',
            'target123',
            'user123'
        )
    })

    it('should handle unknown command', async () => {
        const result = await processSlashCommand('user123', 'twitch', '/unknown')
        expect(result.isCommand).toBe(true)
        expect(result.success).toBe(false)
        expect(result.message).toContain('desconhecido')
    })
})
