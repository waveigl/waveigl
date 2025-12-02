import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as reapplyGet } from '@/app/api/moderation/reapply-timeouts/route'

describe('Moderation reapply route', () => {
  it('401 sem header de autorização', async () => {
    const req = new NextRequest('http://localhost:3000/api/moderation/reapply-timeouts')
    const res = await reapplyGet(req)
    expect(res.status).toBe(401)
  })
})


