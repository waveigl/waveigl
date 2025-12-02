import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock do Supabase
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'linked_accounts') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ 
                  data: {
                    user_id: 'user-123',
                    platform_username: 'TestUser',
                    profiles: {
                      id: 'user-123',
                      phone_number: '5511999999999',
                      email: 'test@test.com',
                      username: 'testuser'
                    }
                  }
                })
              })
            })
          })
        }
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null })
          })
        })
      }
    }
  })
}))

// Mock do chatHub
vi.mock('@/lib/chat/hub', () => ({
  chatHub: {
    broadcast: vi.fn()
  }
}))

describe('Discord Sub Notification Integration', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    
    // Setup env vars
    vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test/token')
    vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
    vi.stubEnv('INTERNAL_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('POST /api/webhooks/youtube', () => {
    it('deve processar evento de membership e notificar Discord', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      const { POST } = await import('@/app/api/webhooks/youtube/route')

      const request = new NextRequest('http://localhost:3000/api/webhooks/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key'
        },
        body: JSON.stringify({
          recipientUsername: 'YouTubeMember',
          recipientChannelId: 'UC123456',
          membershipLevel: 'Membro',
          isGift: false
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      // Verifica se Discord foi notificado
      const discordCall = mockFetch.mock.calls.find(
        call => call[0]?.includes('discord.com')
      )
      expect(discordCall).toBeDefined()
    })

    it('deve rejeitar requisição sem API key', async () => {
      const { POST } = await import('@/app/api/webhooks/youtube/route')

      const request = new NextRequest('http://localhost:3000/api/webhooks/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientUsername: 'YouTubeMember',
          recipientChannelId: 'UC123456'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/webhooks/kick', () => {
    it('deve processar evento de sub Kick e notificar Discord', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      const { POST } = await import('@/app/api/webhooks/kick/route')

      const request = new NextRequest('http://localhost:3000/api/webhooks/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key'
        },
        body: JSON.stringify({
          recipientUsername: 'KickSubscriber',
          recipientUserId: 'kick-user-123',
          donorUsername: 'GiftGiver',
          donorUserId: 'kick-donor-456',
          isGift: true
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      // Verifica se Discord foi notificado com info de gift
      const discordCall = mockFetch.mock.calls.find(
        call => call[0]?.includes('discord.com')
      )
      expect(discordCall).toBeDefined()
      
      if (discordCall) {
        const body = JSON.parse(discordCall[1].body)
        expect(body.embeds[0].description).toContain('GiftGiver')
      }
    })
  })

  describe('Variável NOTIFY_UNREGISTERED_SUBS', () => {
    it('deve respeitar NOTIFY_UNREGISTERED_SUBS=false para usuários não cadastrados', async () => {
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'false')
      
      // Mock para retornar usuário não cadastrado
      vi.doMock('@/lib/supabase/server', () => ({
        getSupabaseAdmin: () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: null })
                })
              })
            })
          })
        })
      }))

      mockFetch.mockResolvedValue({ ok: true })

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      const result = await sendDiscordSubNotification({
        platform: 'twitch',
        username: 'UnregisteredUser',
        platformUserId: '99999',
        phoneNumber: null,
        isRegistered: false,
        isGift: false
      })

      expect(result).toBe(false)
      
      // Discord NÃO deve ter sido chamado
      const discordCalls = mockFetch.mock.calls.filter(
        call => call[0]?.includes('discord.com')
      )
      expect(discordCalls.length).toBe(0)
    })
  })
})

