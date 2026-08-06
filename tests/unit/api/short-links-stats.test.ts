import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/short-links/stats/route'
import type { ShortLinkStats } from '@/types/short-link.types'

vi.mock('@/lib/short-links/short-link.service', () => ({
  ShortLinkService: {
    getLinkStats: vi.fn(),
  },
}))

import { ShortLinkService } from '@/lib/short-links/short-link.service'

describe('GET /api/short-links/stats', () => {
  const mockStats: ShortLinkStats = {
    totalClicks: 3,
    clicksByDevice: { mobile: 2, desktop: 1 },
    clicksByOs: { iOS: 1, Android: 1, Windows: 1 },
    clicksByBrowser: { Safari: 2, Chrome: 1 },
    clicksByCountry: { BR: 2, US: 1 },
    clicksByReferrer: { 'Direto/desconhecido': 2, 'chat.whatsapp.com': 1 },
    clicksByUtm: { whatsapp: 1, 'Sem origem': 2 },
    recentClicks: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return stats for a link', async () => {
    vi.mocked(ShortLinkService.getLinkStats).mockResolvedValue(mockStats)

    const request = new Request('http://localhost/api/short-links/stats?id=link-1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockStats)
    expect(ShortLinkService.getLinkStats).toHaveBeenCalledWith('link-1')
  })

  it('should return 400 if id is missing', async () => {
    const request = new Request('http://localhost/api/short-links/stats')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(ShortLinkService.getLinkStats).not.toHaveBeenCalled()
  })

  it('should return 500 if service throws', async () => {
    vi.mocked(ShortLinkService.getLinkStats).mockRejectedValue(new Error('DB error'))

    const request = new Request('http://localhost/api/short-links/stats?id=link-1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
