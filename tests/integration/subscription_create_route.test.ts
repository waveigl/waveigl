import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createSub } from '@/app/api/subscription/create/route'

describe('Subscription create (preapproval)', () => {
  it('400 sem userId', async () => {
    const req = new NextRequest('http://localhost:3000/api/subscription/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    } as any)
    const res = await createSub(req)
    expect(res.status).toBe(400)
  })
})


