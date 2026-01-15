import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isGabrielToth, verifyAdminAccess, requireAdminAccess } from '@/lib/admin/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')

describe('Admin Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isGabrielToth', () => {
    it('deve retornar true para Gabriel Toth (Twitch ID)', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  platform: 'twitch',
                  platform_user_id: '129980106',
                  platform_username: 'ogabrieltoth'
                }
              ],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await isGabrielToth('user-123')
      expect(result).toBe(true)
    })

    it('deve retornar true para Gabriel Toth (Kick ID)', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  platform: 'kick',
                  platform_user_id: '4053403',
                  platform_username: 'ogabrieltoth'
                }
              ],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await isGabrielToth('user-123')
      expect(result).toBe(true)
    })

    it('deve retornar false para usuário comum', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  platform: 'twitch',
                  platform_user_id: '999999999',
                  platform_username: 'someuser'
                }
              ],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await isGabrielToth('user-123')
      expect(result).toBe(false)
    })

    it('deve retornar false se não houver contas vinculadas', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await isGabrielToth('user-123')
      expect(result).toBe(false)
    })
  })

  describe('requireAdminAccess', () => {
    it('deve retornar erro se não autenticado', async () => {
      const result = await requireAdminAccess(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Não autenticado')
    })

    it('deve retornar erro se não é admin', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  platform: 'twitch',
                  platform_user_id: '999999999',
                  platform_username: 'someuser'
                }
              ],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await requireAdminAccess('user-123')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Acesso negado')
    })

    it('deve retornar sucesso se é admin', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  platform: 'twitch',
                  platform_user_id: '129980106',
                  platform_username: 'ogabrieltoth'
                }
              ],
              error: null
            })
          })
        })
      }

      vi.mocked(getSupabaseAdmin).mockReturnValue(mockDb as any)

      const result = await requireAdminAccess('user-123')
      expect(result.success).toBe(true)
    })
  })
})
