import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Discord Notifications', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('sendDiscordSubNotification', () => {
    it('deve enviar notificação para usuário CADASTRADO com número', async () => {
      // Setup
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      mockFetch.mockResolvedValueOnce({ ok: true })

      // Import após configurar env
      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      const result = await sendDiscordSubNotification({
        platform: 'twitch',
        username: 'TestUser',
        platformUserId: '12345',
        phoneNumber: '5511999999999',
        isRegistered: true,
        isGift: false,
        tier: 'tier1'
      })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://discord.com/api/webhooks/test')
      
      const body = JSON.parse(options.body)
      expect(body.embeds[0].title).toContain('CADASTRADA')
      expect(body.embeds[0].description).toContain('TestUser')
      expect(body.embeds[0].description).toContain('+55 (11) 99999-9999')
      expect(body.embeds[0].color).toBe(0x9146FF) // Cor Twitch
    })

    it('deve enviar notificação para usuário NÃO CADASTRADO quando NOTIFY_UNREGISTERED_SUBS=true', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      const result = await sendDiscordSubNotification({
        platform: 'youtube',
        username: 'UnregisteredUser',
        platformUserId: '67890',
        phoneNumber: null,
        isRegistered: false,
        isGift: true,
        donorUsername: 'GenerousDonor'
      })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.embeds[0].title).toContain('NÃO CADASTRADA')
      expect(body.embeds[0].description).toContain('UnregisteredUser')
      expect(body.embeds[0].description).toContain('Sem número vinculado')
      expect(body.embeds[0].description).toContain('GenerousDonor')
      expect(body.embeds[0].color).toBe(0xFF0000) // Cor YouTube
    })

    it('NÃO deve enviar notificação para usuário NÃO CADASTRADO quando NOTIFY_UNREGISTERED_SUBS=false', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'false')

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      const result = await sendDiscordSubNotification({
        platform: 'kick',
        username: 'UnregisteredUser',
        platformUserId: '11111',
        phoneNumber: null,
        isRegistered: false,
        isGift: false
      })

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('deve usar cor verde para Kick', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      await sendDiscordSubNotification({
        platform: 'kick',
        username: 'KickUser',
        platformUserId: '22222',
        phoneNumber: '5521988887777',
        isRegistered: true,
        isGift: false
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.embeds[0].color).toBe(0x53FC18) // Cor Kick (verde)
    })

    it('deve retornar false se webhook não estiver configurado', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', '')

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      const result = await sendDiscordSubNotification({
        platform: 'twitch',
        username: 'TestUser',
        platformUserId: '12345',
        phoneNumber: null,
        isRegistered: false,
        isGift: false
      })

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('deve formatar corretamente números de telefone com diferentes formatos', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      // Número com 13 dígitos (celular com 9)
      await sendDiscordSubNotification({
        platform: 'twitch',
        username: 'User1',
        platformUserId: '1',
        phoneNumber: '5511999998888',
        isRegistered: true,
        isGift: false
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.embeds[0].description).toContain('+55 (11) 99999-8888')
    })

    it('deve incluir informação de gift sub quando aplicável', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { sendDiscordSubNotification } = await import('@/lib/notifications/discord')

      await sendDiscordSubNotification({
        platform: 'twitch',
        username: 'LuckyRecipient',
        platformUserId: '33333',
        phoneNumber: '5511912345678',
        isRegistered: true,
        isGift: true,
        donorUsername: 'GenerousPerson',
        tier: 'tier3'
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.embeds[0].description).toContain('GenerousPerson')
      expect(body.embeds[0].description).toContain('tier3')
    })
  })

  describe('Integração com handleSubscriptionEvent', () => {
    it('deve chamar sendDiscordSubNotification ao processar evento de sub', async () => {
      vi.stubEnv('DISCORD_SUB_WEBHOOK_URL', 'https://discord.com/api/webhooks/test')
      vi.stubEnv('NOTIFY_UNREGISTERED_SUBS', 'true')
      
      // Mock do Supabase
      vi.mock('@/lib/supabase/server', () => ({
        getSupabaseAdmin: () => ({
          from: () => ({
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
          })
        })
      }))

      // Mock do chatHub
      vi.mock('@/lib/chat/hub', () => ({
        chatHub: {
          broadcast: vi.fn()
        }
      }))

      mockFetch.mockResolvedValue({ ok: true })

      const { handleSubscriptionEvent } = await import('@/lib/notifications/subscription')

      await handleSubscriptionEvent({
        platform: 'twitch',
        recipientUsername: 'TestUser',
        recipientPlatformUserId: '12345',
        isGift: false,
        tier: 'tier1'
      })

      // Verifica se o Discord webhook foi chamado
      expect(mockFetch).toHaveBeenCalled()
      const discordCall = mockFetch.mock.calls.find(
        call => call[0]?.includes('discord.com')
      )
      expect(discordCall).toBeDefined()
    })
  })
})

