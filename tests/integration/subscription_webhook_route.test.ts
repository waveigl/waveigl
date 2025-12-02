import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Subscription webhook', () => {
  it('200 para payload genérico', async () => {
    vi.doMock('@/lib/supabase/server', () => ({
      getSupabaseAdmin: () => ({
        from: () => ({
          update: () => ({ eq: async () => ({ error: null }) })
        })
      })
    }))
    const { POST } = await import('@/app/api/subscription/webhook/route')
    const req = new NextRequest('http://localhost:3000/api/subscription/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'ping' })
    } as any)
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})


