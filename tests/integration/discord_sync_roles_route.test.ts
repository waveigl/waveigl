import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as syncRoles } from '@/app/api/discord/sync-roles/route'

describe('Discord sync roles', () => {
  it('400 sem userId', async () => {
    const req = new NextRequest('http://localhost:3000/api/discord/sync-roles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    } as any)
    const res = await syncRoles(req)
    expect(res.status).toBe(400)
  })
})


