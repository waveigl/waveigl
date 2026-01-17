import { describe, it, expect } from 'vitest'
import {
  calculateBitrate,
  calculateEncodingMultiplier,
  calculateCostForProvider,
  compareCloudCosts,
  formatUSD,
  formatBRL,
  formatBytes,
  formatBitrate,
  getPresets,
  RESOLUTION_DATA,
  FPS_DATA,
  CODEC_DATA,
  HDR_DATA,
  CLOUD_PRICING,
  type StreamingConfig,
  type StreamingProfile,
} from '@/lib/streaming/cost-calculator'

describe('Streaming Cost Calculator', () => {
  describe('calculateBitrate', () => {
    it('deve calcular bitrate para perfil básico (720p 30fps h264 SDR)', () => {
      const profile: StreamingProfile = {
        resolution: '720p',
        fps: 30,
        codec: 'h264_420',
        hdr: 'sdr',
      }
      const result = calculateBitrate(profile)
      
      // 3000 * 1.0 * 1.0 * 1.0 = 3000 Kbps
      expect(result.kbps).toBe(3000)
      expect(result.mbps).toBe(3)
    })

    it('deve calcular bitrate para perfil 4K HDR', () => {
      const profile: StreamingProfile = {
        resolution: '4K',
        fps: 60,
        codec: 'h265_420',
        hdr: 'hdr10',
      }
      const result = calculateBitrate(profile)
      
      // 25000 * 1.5 * 0.7 * 1.25 = 32812.5 Kbps
      expect(result.kbps).toBe(32813)
      expect(result.mbps).toBeCloseTo(32.81, 1)
    })

    it('deve calcular bitrate extremo (16K 240fps)', () => {
      const profile: StreamingProfile = {
        resolution: '16K',
        fps: 240,
        codec: 'h265_444',
        hdr: 'dolby_vision',
      }
      const result = calculateBitrate(profile)
      
      // 300000 * 4.0 * 1.0 * 1.5 = 1,800,000 Kbps
      expect(result.kbps).toBe(1800000)
      expect(result.mbps).toBe(1800)
    })
  })


  describe('calculateEncodingMultiplier', () => {
    it('deve retornar multiplicador 1 para perfil base', () => {
      const profile: StreamingProfile = {
        resolution: '720p',
        fps: 30,
        codec: 'h264_420',
        hdr: 'sdr',
      }
      const result = calculateEncodingMultiplier(profile)
      
      expect(result.resolution).toBe(1.0)
      expect(result.fps).toBe(1.0)
      expect(result.codec).toBe(1.0)
      expect(result.hdr).toBe(1.0)
      expect(result.combined).toBe(1.0)
    })

    it('deve calcular multiplicador combinado corretamente', () => {
      const profile: StreamingProfile = {
        resolution: '4K',
        fps: 60,
        codec: 'h265_444',
        hdr: 'hdr10',
      }
      const result = calculateEncodingMultiplier(profile)
      
      // 8 * 1.5 * 3 * 1.5 = 54
      expect(result.resolution).toBe(8.0)
      expect(result.fps).toBe(1.5)
      expect(result.codec).toBe(3.0)
      expect(result.hdr).toBe(1.5)
      expect(result.combined).toBe(54)
    })
  })

  describe('calculateCostForProvider', () => {
    const baseConfig: StreamingConfig = {
      profile: {
        resolution: '1080p',
        fps: 60,
        codec: 'h264_420',
        hdr: 'sdr',
      },
      durationMinutes: 60,
      expectedViewers: 100,
      includeVod: true,
      storageDays: 30,
      chatMessagesPerMinute: 10,
      reactionsPerMinute: 5,
    }

    it('deve calcular custos para AWS', () => {
      const result = calculateCostForProvider(baseConfig, 'aws')
      
      expect(result.total).toBeGreaterThan(0)
      expect(result.encoding.total).toBeGreaterThan(0)
      expect(result.cdn.total).toBeGreaterThan(0)
      expect(result.storage.total).toBeGreaterThan(0)
      expect(result.interactions.total).toBeGreaterThan(0)
      expect(result.costPerViewer).toBeGreaterThan(0)
    })

    it('deve calcular custos para todos os providers', () => {
      const providers = ['aws', 'azure', 'gcp', 'cloudflare'] as const
      
      for (const provider of providers) {
        const result = calculateCostForProvider(baseConfig, provider)
        expect(result.total).toBeGreaterThan(0)
      }
    })

    it('deve retornar 0 para storage quando VOD desabilitado', () => {
      const configNoVod: StreamingConfig = {
        ...baseConfig,
        includeVod: false,
      }
      const result = calculateCostForProvider(configNoVod, 'aws')
      
      expect(result.storage.total).toBe(0)
      expect(result.storage.sizeGb).toBe(0)
    })

    it('deve calcular custo por viewer corretamente', () => {
      const result = calculateCostForProvider(baseConfig, 'aws')
      
      expect(result.costPerViewer).toBeCloseTo(result.total / 100, 6)
    })
  })


  describe('compareCloudCosts', () => {
    const config: StreamingConfig = {
      profile: {
        resolution: '1080p',
        fps: 60,
        codec: 'h264_420',
        hdr: 'sdr',
      },
      durationMinutes: 120,
      expectedViewers: 500,
      includeVod: true,
      storageDays: 30,
      chatMessagesPerMinute: 20,
      reactionsPerMinute: 10,
    }

    it('deve comparar todos os providers', () => {
      const result = compareCloudCosts(config)
      
      expect(result.aws).toBeDefined()
      expect(result.azure).toBeDefined()
      expect(result.gcp).toBeDefined()
      expect(result.cloudflare).toBeDefined()
    })

    it('deve identificar o mais barato e mais caro', () => {
      const result = compareCloudCosts(config)
      
      expect(['aws', 'azure', 'gcp', 'cloudflare']).toContain(result.cheapest)
      expect(['aws', 'azure', 'gcp', 'cloudflare']).toContain(result.mostExpensive)
      expect(result.cheapest).not.toBe(result.mostExpensive)
    })

    it('deve calcular economia corretamente', () => {
      const result = compareCloudCosts(config)
      
      const cheapestCost = result[result.cheapest].total
      const mostExpensiveCost = result[result.mostExpensive].total
      
      expect(result.savings).toBeCloseTo(mostExpensiveCost - cheapestCost, 6)
    })

    it('Cloudflare deve ser mais barato para CDN', () => {
      const result = compareCloudCosts(config)
      
      // Cloudflare tem CDN mais barato ($0.01/GB vs $0.08+)
      expect(result.cloudflare.cdn.total).toBeLessThan(result.aws.cdn.total)
      expect(result.cloudflare.cdn.total).toBeLessThan(result.azure.cdn.total)
      expect(result.cloudflare.cdn.total).toBeLessThan(result.gcp.cdn.total)
    })
  })

  describe('formatUSD', () => {
    it('deve formatar valores normais', () => {
      expect(formatUSD(10.5)).toBe('$10.50')
      expect(formatUSD(0.99)).toBe('$0.99')
      expect(formatUSD(1000)).toBe('$1000.00')
    })

    it('deve formatar valores muito pequenos com mais casas decimais', () => {
      expect(formatUSD(0.001)).toBe('$0.001000')
      expect(formatUSD(0.0001)).toBe('$0.000100')
    })
  })

  describe('formatBRL', () => {
    it('deve converter USD para BRL', () => {
      expect(formatBRL(10, 5)).toBe('R$ 50.00')
      expect(formatBRL(1, 5.5)).toBe('R$ 5.50')
    })
  })

  describe('formatBytes', () => {
    it('deve formatar GB', () => {
      expect(formatBytes(100)).toBe('100.00 GB')
      expect(formatBytes(0.5)).toBe('0.50 GB')
    })

    it('deve converter para TB quando >= 1000 GB', () => {
      expect(formatBytes(1000)).toBe('1.00 TB')
      expect(formatBytes(2500)).toBe('2.50 TB')
    })
  })

  describe('formatBitrate', () => {
    it('deve formatar Kbps', () => {
      expect(formatBitrate(500)).toBe('500 Kbps')
    })

    it('deve converter para Mbps', () => {
      expect(formatBitrate(3000)).toBe('3.0 Mbps')
      expect(formatBitrate(25000)).toBe('25.0 Mbps')
    })

    it('deve converter para Gbps', () => {
      expect(formatBitrate(1000000)).toBe('1.00 Gbps')
      expect(formatBitrate(1800000)).toBe('1.80 Gbps')
    })
  })

  describe('getPresets', () => {
    it('deve retornar presets válidos', () => {
      const presets = getPresets()
      
      expect(Object.keys(presets).length).toBeGreaterThan(0)
      
      for (const [key, preset] of Object.entries(presets)) {
        expect(preset.label).toBeDefined()
        expect(preset.config).toBeDefined()
        expect(preset.config.profile).toBeDefined()
      }
    })

    it('deve ter preset casual com configuração básica', () => {
      const presets = getPresets()
      
      expect(presets.casual).toBeDefined()
      expect(presets.casual.config.profile?.resolution).toBe('720p')
      expect(presets.casual.config.profile?.fps).toBe(30)
    })

    it('deve ter preset extreme com configuração avançada', () => {
      const presets = getPresets()
      
      expect(presets.extreme).toBeDefined()
      expect(presets.extreme.config.profile?.resolution).toBe('4K')
      expect(presets.extreme.config.profile?.fps).toBe(240)
    })
  })

  describe('Constants', () => {
    it('RESOLUTION_DATA deve ter todas as resoluções', () => {
      const resolutions = ['360p', '480p', '720p', '1080p', '1440p', '4K', '8K', '16K']
      
      for (const res of resolutions) {
        expect(RESOLUTION_DATA[res as keyof typeof RESOLUTION_DATA]).toBeDefined()
      }
    })

    it('FPS_DATA deve ter todos os FPS', () => {
      const fpsValues = [24, 30, 60, 120, 240, 500, 1000]
      
      for (const fps of fpsValues) {
        expect(FPS_DATA[fps as keyof typeof FPS_DATA]).toBeDefined()
      }
    })

    it('CLOUD_PRICING deve ter todos os providers', () => {
      const providers = ['aws', 'azure', 'gcp', 'cloudflare']
      
      for (const provider of providers) {
        expect(CLOUD_PRICING[provider as keyof typeof CLOUD_PRICING]).toBeDefined()
        expect(CLOUD_PRICING[provider as keyof typeof CLOUD_PRICING].name).toBeDefined()
        expect(CLOUD_PRICING[provider as keyof typeof CLOUD_PRICING].encodingBasePerMinute).toBeGreaterThan(0)
      }
    })
  })
})
