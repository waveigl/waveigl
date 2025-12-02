import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as youtubeAuthGet } from '@/app/api/auth/youtube/route'

describe('YouTube OAuth route', () => {
  it('sem code -> redireciona para accounts.google.com', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    const req = new NextRequest('http://localhost:3000/api/auth/youtube')
    const res = await youtubeAuthGet(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || res.headers.get('Location')
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth?')
    expect(location).toContain('https://www.googleapis.com/auth/youtube')
  })
})


