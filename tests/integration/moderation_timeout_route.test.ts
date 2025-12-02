import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Moderation timeout route', () => {
  it('400 quando faltam parâmetros', async () => {
    const { POST } = await import('@/app/api/moderation/timeout/route')
    const req = new NextRequest('http://localhost:3000/api/moderation/timeout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    } as any)
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('403 ao tentar punir usuário protegido', async () => {
    vi.resetModules()
    vi.doMock('@/lib/supabase/server', () => {
      const moderatorId = 'mod1'
      const targetId = 'target1'
      return {
        getSupabaseAdmin: () => ({
          from: (table: string) => {
            return {
              select: () => ({
                eq: (col: string, val: string) => {
                  if (table === 'linked_accounts' && col === 'user_id') {
                    if (val === moderatorId) {
                      return Promise.resolve({ data: [], error: null })
                    }
                    if (val === targetId) {
                      return Promise.resolve({
                        data: [
                          { platform: 'twitch', platform_username: 'waveigl', platform_user_id: '1', user_id: targetId, id: 'la', is_moderator: false }
                        ],
                        error: null
                      })
                    }
                  }
                  return Promise.resolve({ data: [], error: null })
                }
              }),
              insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'act1' }, error: null }) }) }),
              update: () => ({ eq: async () => ({}) })
            }
          }
        })
      }
    })
    const { POST } = await import('@/app/api/moderation/timeout/route')
    const req = new NextRequest('http://localhost:3000/api/moderation/timeout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'target1', durationSeconds: 60, moderatorId: 'mod1' })
    } as any)
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})


